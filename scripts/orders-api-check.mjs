// API checks for the lab-cases list and the Super Admin-only CSV export, against a RUNNING dev server on a SCRATCH
// database seeded with ~130 cases (it creates two users and exports files in memory only).
// node scripts/orders-api-check.mjs <base> <secretFile> <tokenFile> <usersJson>
//   usersJson: { AGENT:{uid,name,phone}, CHAIRMAN:{...}, ACCOUNTS:{...} }  (AGENT must be assigned ~1/3 of the cases)
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [base, secretFile, tokenFile, usersFile] = process.argv.slice(2);
const SECRET = readFileSync(secretFile, 'utf8').trim();
const TOKEN = readFileSync(tokenFile, 'utf8').trim();
const users = JSON.parse(readFileSync(usersFile, 'utf8'));

const cookie = (u, role) => {
  const payload = Buffer.from(JSON.stringify({ uid: u.uid, name: u.name, phone: u.phone, role, iat: Date.now(), exp: Date.now() + 3600_000 })).toString('base64url');
  return `cndl_admin=${payload}.${createHmac('sha256', SECRET).update(payload).digest('base64url')}`;
};
const call = async (method, path, { body, as } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (as === 'none') {
    /* anonymous */
  } else if (as) headers.cookie = cookie(as.user, as.role);
  else headers.authorization = `Bearer ${TOKEN}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const buf = Buffer.from(await res.arrayBuffer());
  const text = buf.toString('utf8');
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* csv */
  }
  return { status: res.status, json, text, buf, headers: res.headers };
};
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
};
const list = (qs, as) => call('GET', `/api/admin/erp/orders?${qs}`, { as });

// ---- basics
let r = await list('stage=all&size=100');
const ALL = r.json?.total;
check('list works for Super Admin; stage=all has every case', r.status === 200 && ALL >= 100, JSON.stringify(r.json)?.slice(0, 120));
check('size=100 returns up to 100 rows', r.json?.orders?.length === Math.min(100, ALL));
r = await list('stage=all&size=7');
check('invalid page size falls back to 20', r.json?.size === 20 && r.json?.orders?.length === 20);
r = await list('stage=all&size=50');
check('size=50', r.json?.size === 50 && r.json?.orders?.length === 50);

// ---- paging: no overlap, nothing missing
const seen = new Set();
let pages = 1;
for (let p = 1; p <= pages; p++) {
  const x = await list(`stage=all&size=20&page=${p}&sort=case&dir=asc`);
  pages = x.json.pages;
  for (const o of x.json.orders) seen.add(o.caseId);
}
check('walking every page yields every case once', seen.size === ALL, `${seen.size} vs ${ALL}`);
r = await list('stage=all&size=20&page=9999');
check('page beyond the end clamps to the last page', r.json?.page === r.json?.pages && r.json.orders.length > 0);

// ---- stages
const count = async (qs, as) => (await list(qs, as)).json?.total;
const open = await count('stage=open');
const late = await count('stage=late');
const parts = {};
for (const s of ['Received', 'Designing', 'Milling', 'Quality Control', 'Dispatched', 'Delivered', 'Cancelled']) parts[s] = await count(`stage=${encodeURIComponent(s)}`);
check('stage counts add up to all', Object.values(parts).reduce((a, b) => a + b, 0) === ALL, JSON.stringify(parts));
check('open + dispatched + delivered + cancelled = all', open + parts.Dispatched + parts.Delivered + parts.Cancelled === ALL);
check('late is a subset of open', late > 0 && late <= open, `${late}/${open}`);
r = await list('stage=late&size=100');
check('every late case is open and past its delivery date', r.json.orders.every((o) => o.deliveryDate && new Date(o.deliveryDate) < new Date() && !['Dispatched', 'Delivered', 'Cancelled'].includes(o.status)));
r = await list('stage=Milling&size=100');
check('Milling includes the legacy "Production" status', r.json.orders.some((o) => o.status === 'Production') && r.json.orders.some((o) => o.status === 'Milling'));
r = await list('stage=Quality%20Control&size=100');
check('Quality Control includes legacy "QC"', r.json.orders.some((o) => o.status === 'QC'));

// ---- search / filters
r = await list('stage=all&q=CNDL-T1007');
check('search by case id', r.json.total === 1 && r.json.orders[0].caseId === 'CNDL-T1007');
r = await list('stage=all&q=beta%20clinic&size=100');
check('search by clinic name', r.json.total > 20 && r.json.orders.every((o) => o.clinicName === 'Beta Clinic'));
r = await list('stage=all&q=01711000002&size=100');
check('search by phone digits', r.json.total > 20 && r.json.orders.every((o) => o.phone === '01711000002'));
r = await list('stage=all&q=%25%27%3B--');
check('odd characters in search are harmless', r.status === 200 && r.json.total === 0);
const sample = (await list('stage=all&size=100')).json.orders;
const cid = sample.find((o) => o.clientAccountId).clientAccountId;
r = await list(`stage=all&client=${cid}&size=100`);
check('client filter', r.json.total > 0 && r.json.orders.every((o) => o.clientAccountId === cid));
r = await list(`stage=all&agent=${users.AGENT.uid}&size=100`);
check('agent filter', r.json.total > 0 && r.json.orders.every((o) => o.agentId === users.AGENT.uid));
r = await list('stage=all&source=PHONE&size=100');
check('source filter', r.json.total > 0 && r.json.orders.every((o) => o.orderSource === 'PHONE'));
const day = (d) => new Date(Date.now() - d * 86400000 + 6 * 3600000).toISOString().slice(0, 10);
r = await list(`stage=all&from=${day(10)}&to=${day(5)}&size=100`);
const lo = Date.parse(`${day(10)}T00:00:00+06:00`), hi = Date.parse(`${day(5)}T00:00:00+06:00`) + 86400000;
check('date range filter (Bangladesh days, inclusive)', r.json.total > 0 && r.json.orders.every((o) => Date.parse(o.createdAt) >= lo && Date.parse(o.createdAt) < hi), `${r.json.total}`);
const cats = {};
for (const c of ['zirconia', 'pfm', 'denture', 'other']) cats[c] = await count(`stage=all&category=${c}`);
check('categories partition the cases', Object.values(cats).reduce((a, b) => a + b, 0) === ALL, JSON.stringify(cats));
r = await list('stage=all&category=pfm&size=100');
check('PFM category holds only PFM/porcelain work', r.json.orders.length > 0 && r.json.orders.every((o) => /pfm|porcelain/i.test(o.productType) && !/zircon|e\.max|veneer/i.test(o.productType)));
const bills = {};
for (const b of ['unbilled', 'billed', 'invoiced']) bills[b] = await count(`stage=all&billing=${b}`);
check('billing filters partition the cases', Object.values(bills).reduce((a, b) => a + b, 0) === ALL, JSON.stringify(bills));
r = await list('stage=all&billing=unbilled&size=100');
check('unbilled cases have no amount', r.json.orders.every((o) => !o.billedAmount));
r = await list('stage=bogus&sort=bogus&dir=sideways&size=abc&page=-3&category=zzz');
check('bad parameters fall back to defaults', r.status === 200 && r.json.size === 20 && r.json.page === 1);

// ---- sorting
r = await list('stage=all&size=100&sort=due&dir=asc');
const dues = r.json.orders.map((o) => (o.deliveryDate ? Date.parse(o.deliveryDate) : -Infinity));
check('sort by delivery date ascending', dues.every((v, i) => i === 0 || dues[i - 1] <= v));
r = await list('stage=all&size=100&sort=amount&dir=desc');
const amts = r.json.orders.map((o) => o.billedAmount ?? -1);
check('sort by amount descending', amts.every((v, i) => i === 0 || amts[i - 1] >= v));
r = await list('stage=all&size=100&sort=case&dir=asc');
const ids = r.json.orders.map((o) => o.caseId);
check('sort by case id ascending', ids.every((v, i) => i === 0 || ids[i - 1] <= v));
r = await list('stage=all&size=100&sort=created&dir=desc');
const cr = r.json.orders.map((o) => Date.parse(o.createdAt));
check('default sort is newest first', cr.every((v, i) => i === 0 || cr[i - 1] >= v));

// ---- summary
r = await list('stage=open');
check('summary matches the list', r.json.summary.count === r.json.total && r.json.summary.open === r.json.total && r.json.summary.billed > 0);

// ---- who sees what
const agent = { user: users.AGENT, role: 'AGENT' };
const chair = { user: users.CHAIRMAN, role: 'CHAIRMAN' };
const accts = { user: users.ACCOUNTS, role: 'ACCOUNTS' };
/** Creates a user with a role (or finds them again when the script is re-run) and returns the session to act as. */
const ensureUser = async (name, phone, roleKey) => {
  const made = await call('POST', '/api/admin/erp/users', { body: { name, phone, roleKey, password: 'testpass123' } });
  let id = made.json?.id ?? made.json?.user?.id;
  if (!id) id = ((await call('GET', '/api/admin/erp/users')).json?.users ?? []).find((u) => u.phone === phone)?.id;
  if (!id) throw new Error(`could not create or find the ${roleKey} test user`);
  return { user: { uid: id, name, phone }, role: roleKey };
};
const prod = await ensureUser('Prod Tester', '01790000099', 'PRODUCTION');
const moderator = await ensureUser('Mod Tester', '01790000098', 'MODERATOR');

r = await list('stage=all&size=100', agent);
check('agent sees only their own cases', r.status === 200 && r.json.total > 0 && r.json.total < ALL && r.json.orders.every((o) => o.agentId === users.AGENT.uid), `${r.json?.total}`);
r = await list(`stage=all&agent=${users.AGENT2.uid}`, agent);
check('agent cannot widen the view with the agent filter', r.json.total === 0);
r = await list('stage=all&size=100', prod);
check('role without money permission: amounts removed', r.status === 200 && r.json.orders.length > 0 && r.json.orders.every((o) => o.billedAmount === null && o.commissionAmount === 0) && r.json.summary.billed === null);
const unb = await list('stage=all&billing=invoiced', prod);
check('role without money permission: billing filter is ignored (cannot probe amounts)', unb.json.total === ALL);
r = await list('stage=all&sort=amount&dir=desc&size=100', prod);
check('role without money permission: amount sort is ignored', r.json.orders.every((o) => o.billedAmount === null));
for (const [label, who] of [['Chairman', chair], ['Accounts', accts]]) {
  r = await list('stage=all', who);
  check(`${label} can list cases`, r.status === 200 && r.json.total === ALL);
}
r = await list('stage=all', moderator);
check('moderator (no case access) → 403', r.status === 403, String(r.status));
r = await list('stage=all', 'none');
check('anonymous → 401', r.status === 401, String(r.status));

// ---- export: Super Admin only
const exp = (qs, as) => call('GET', `/api/admin/erp/orders/export${qs ? `?${qs}` : ''}`, { as });
for (const [label, who] of [['Chairman', chair], ['Accounts', accts], ['Agent', agent], ['Production', prod], ['Moderator', moderator]]) {
  r = await exp('stage=all', who);
  check(`export refused for ${label} → 403`, r.status === 403 && !/CNDL-T/.test(r.text), String(r.status));
}
r = await exp('stage=all', 'none');
check('export refused when anonymous → 401', r.status === 401, String(r.status));

r = await exp('stage=all');
const lines = r.text.replace(/^﻿/, '').trim().split('\r\n');
check('Super Admin export → 200 text/csv attachment', r.status === 200 && /text\/csv/.test(r.headers.get('content-type')) && /attachment; filename="cndl-cases-\d{4}-\d{2}-\d{2}\.csv"/.test(r.headers.get('content-disposition')), `${r.status} ${r.headers.get('content-type')}`);
check('CSV starts with a UTF-8 byte-order mark and uses CRLF', r.text.charCodeAt(0) === 0xfeff && r.text.includes('\r\n'));
check('CSV has a header and one row per case (all filters off)', lines.length === ALL + 1 && lines[0].startsWith('Case ID,'), `${lines.length} vs ${ALL + 1}`);
check('CSV is not cached', /no-store/.test(r.headers.get('cache-control') ?? ''));
r = await exp('stage=Delivered&client=' + cid);
const body = r.text.replace(/^﻿/, '').trim().split('\r\n');
const expectN = (await list(`stage=Delivered&client=${cid}`)).json.total;
check('export honours the filters', body.length - 1 === expectN && expectN > 0 && body.slice(1).every((l) => l.includes('Delivered')), `${body.length - 1} vs ${expectN}`);
r = await exp('stage=all&sort=case&dir=asc');
const first = r.text.replace(/^﻿/, '').split('\r\n')[1].split(',')[0];
const firstViaList = (await list('stage=all&sort=case&dir=asc&size=20')).json.orders[0].caseId;
check('export honours the sort', first === firstViaList, `${first} vs ${firstViaList}`);
check('export includes money and invoice columns', /Billed \(BDT\),Commission \(BDT\),Invoiced/.test(r.text));

// formula injection guard + quoting: make a case with a nasty name through the DB-free path (the order create API)
const nasty = await call('POST', '/api/admin/orders', { body: { orderDate: new Date().toISOString().slice(0, 10), doctorName: '=HYPERLINK("http://x","y")', phone: '01799999999', clinicName: 'Quote, "Clinic"', productName: 'Zirconia crown', units: 1 } });
if (nasty.status === 200 || nasty.status === 201) {
  r = await exp('stage=all&q=01799999999');
  check('formula cells are neutralised and quotes escaped', /'=HYPERLINK/.test(r.text) && /"Quote, ""Clinic"""/.test(r.text), r.text.slice(0, 300));
} else {
  console.log(`SKIP  formula-guard check (order create answered ${nasty.status})`);
}

// ---- audit
r = await call('GET', '/api/admin/erp/access-log');
const exports = (r.json?.entries ?? []).filter((e) => e.action === 'EXPORT_ORDERS');
check('every export wrote an audit record (who, filters, row count)', exports.length >= 3 && exports.every((e) => e.performedBy && e.after && typeof e.after.rows === 'number'), String(exports.length));
check('audit record keeps the filters used', exports.some((e) => String(e.after.filters).includes('client=')));
r = await call('GET', '/api/admin/erp/access-log', { as: chair });
check('Chairman cannot read the audit log → 403', r.status === 403);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
