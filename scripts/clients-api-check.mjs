// API checks for the Clients list, the client profile and the unified client type, against a RUNNING dev server on a
// SCRATCH database (it creates and edits client accounts).
// node scripts/clients-api-check.mjs <base> <secretFile> <tokenFile> <usersJson>
//   usersJson: { AGENT:{uid,name,phone}, AGENT2:{...}, CHAIRMAN:{...}, ACCOUNTS:{...} }  (AGENT owns at least one client)
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
  return { status: res.status, json: await res.json().catch(() => null) };
};
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
};
const list = (qs, as) => call('GET', `/api/admin/erp/clients?${qs}`, { as });
const ensureUser = async (name, phone, roleKey) => {
  const made = await call('POST', '/api/admin/erp/users', { body: { name, phone, roleKey, password: 'testpass123' } });
  let id = made.json?.id ?? made.json?.user?.id;
  if (!id) id = ((await call('GET', '/api/admin/erp/users')).json?.users ?? []).find((u) => u.phone === phone)?.id;
  if (!id) throw new Error(`could not create or find the ${roleKey} test user`);
  return { user: { uid: id, name, phone }, role: roleKey };
};
const run = Date.now().toString().slice(-6);

// ---- unified type on create / edit
const mk = (body) => call('POST', '/api/admin/erp/accounts', { body: { name: `Probe ${run} ${body.clientType ?? 'old'}`, ownerName: 'Dr Probe', phone: `0188${run}${Math.floor(Math.random() * 90 + 10)}`, division: 'SYLHET', ...body } });
let r = await mk({ clientType: 'HOSPITAL', chairmanChannel: true });
check('create with clientType HOSPITAL + Chairman channel → 201', r.status === 201 && r.json.institutionType === 'HOSPITAL' && r.json.accountType === 'CHAIRMAN_PERSONAL', JSON.stringify(r.json));
const hosp = r.json;
r = await mk({ clientType: 'LAB' });
check('create LAB → accountType and institutionType both PARTNER_LAB', r.json?.accountType === 'PARTNER_LAB' && r.json?.institutionType === 'PARTNER_LAB', JSON.stringify(r.json));
const lab = r.json;
r = await mk({ accountType: 'CHAMBER', institutionType: 'FREELANCE' });
check('old-style create (two columns) still works', r.status === 201 && r.json.institutionType === 'FREELANCE');
r = await mk({ clientType: 'SHOP' });
check('unknown clientType → 400', r.status === 400);
r = await call('PUT', `/api/admin/erp/accounts/${hosp.id}`, { body: { clientType: 'PERSONAL' } });
check('edit type only: keeps the Chairman channel', r.status === 200 && r.json.institutionType === 'FREELANCE' && r.json.accountType === 'CHAIRMAN_PERSONAL', JSON.stringify(r.json));
r = await call('PUT', `/api/admin/erp/accounts/${hosp.id}`, { body: { chairmanChannel: false } });
check('edit channel only: keeps the type', r.status === 200 && r.json.institutionType === 'FREELANCE' && r.json.accountType === 'CHAMBER', JSON.stringify(r.json));
r = await call('PUT', `/api/admin/erp/accounts/${lab.id}`, { body: { clientType: 'CLINIC' } });
check('lab → clinic clears PARTNER_LAB from both columns', r.json?.accountType === 'CHAMBER' && r.json?.institutionType === 'CHAMBER', JSON.stringify(r.json));
r = await call('PUT', '/api/admin/erp/accounts/nope-nope', { body: { name: 'Xx' } });
check('edit unknown client → 404', r.status === 404, String(r.status));

// ---- list
r = await list('size=100');
const ALL = r.json?.total;
check('list works; summary.total = everything visible', r.status === 200 && ALL >= 3 && r.json.summary.total === ALL, JSON.stringify(r.json?.summary));
check('rows carry type, case count and last case', r.json.clients.every((c) => c.type && typeof c.caseCount === 'number' && 'lastCaseAt' in c));
const withCases = r.json.clients.filter((c) => c.caseCount > 0);
check('case activity is counted from the cases', withCases.length >= 3);
const typeSum = (await Promise.all(['CLINIC', 'HOSPITAL', 'LAB', 'PERSONAL'].map((t) => list(`type=${t}`)))).reduce((s, x) => s + x.json.total, 0);
check('types partition the clients', typeSum === ALL, `${typeSum} vs ${ALL}`);
r = await list('type=LAB&size=100');
check('type filter', r.json.clients.every((c) => c.type === 'LAB'));
r = await list('division=SYLHET&size=100');
check('division filter', r.json.total >= 3 && r.json.clients.every((c) => c.division === 'SYLHET'));
r = await list(`agent=${users.AGENT.uid}&size=100`);
check('agent filter', r.json.total >= 1 && r.json.clients.every((c) => c.assignedAgentId === users.AGENT.uid));
r = await list('agent=none&size=100');
check('"not assigned" filter', r.json.total >= 3 && r.json.clients.every((c) => !c.assignedAgentId));
r = await list('activity=new&size=100');
check('"added this month" = summary count', r.json.total === r.json.summary.newThisMonth && r.json.total >= 3);
r = await list('activity=dormant&size=100');
check('"no case for 60+ days" = summary count', r.json.total === r.json.summary.dormant);
r = await list('activity=never&size=100');
check('"never sent a case" rows have 0 cases', r.json.total >= 3 && r.json.clients.every((c) => c.caseCount === 0));
r = await list('activity=owing&size=100');
check('"owes money" rows have a balance', r.json.total === r.json.summary.owing && r.json.clients.every((c) => c.currentBalance > 0));
r = await list(`q=Probe%20${run}&size=100`);
check('search by name', r.json.total >= 3);
const someone = (await list('size=1')).json.clients[0];
r = await list(`q=${encodeURIComponent('+880' + someone.phone.replace(/^0/, ''))}`);
check('search by phone in +880 form', r.json.clients.some((c) => c.id === someone.id));
r = await list('sort=recent&dir=desc&size=100');
const t = r.json.clients.map((c) => (c.lastCaseAt ? Date.parse(c.lastCaseAt) : -Infinity));
check('sort by latest case', t.every((v, i) => i === 0 || t[i - 1] >= v));
r = await list('sort=balance&dir=desc&size=100');
const b = r.json.clients.map((c) => c.currentBalance);
check('sort by balance', b.every((v, i) => i === 0 || b[i - 1] >= v));
const seen = new Set();
let pages = 1;
for (let p = 1; p <= pages; p++) {
  const x = await list(`size=20&page=${p}`);
  pages = x.json.pages;
  x.json.clients.forEach((c) => seen.add(c.id));
}
check('pages cover every client once', seen.size === ALL);
r = await list('size=7&page=-1&type=X&sort=zz');
check('bad parameters fall back to defaults', r.status === 200 && r.json.size === 20 && r.json.page === 1);

// ---- profile
const busy = withCases[0];
r = await call('GET', `/api/admin/erp/clients/${busy.id}`);
check('profile: stats, recent cases, ledger for Super Admin', r.status === 200 && r.json.stats.cases === busy.caseCount && r.json.recentCases.length > 0 && Array.isArray(r.json.ledger) && r.json.stats.billed !== null, JSON.stringify(r.json?.stats));
r = await call('GET', '/api/admin/erp/clients/does-not-exist');
check('profile of unknown id → 404', r.status === 404);

// ---- who sees what
const agent = { user: users.AGENT, role: 'AGENT' };
const agent2 = { user: users.AGENT2, role: 'AGENT' };
const chair = { user: users.CHAIRMAN, role: 'CHAIRMAN' };
const accts = { user: users.ACCOUNTS, role: 'ACCOUNTS' };
const prod = await ensureUser('Prod Tester', '01790000099', 'PRODUCTION');
r = await list('size=100', agent);
check('agent sees only their assigned clients', r.status === 200 && r.json.total >= 1 && r.json.total < ALL && r.json.clients.every((c) => c.assignedAgentId === users.AGENT.uid) && r.json.summary.total === r.json.total, `${r.json?.total}`);
check('agent does not get the agent list', Array.isArray(r.json.agents) && r.json.agents.length === 0);
const agentsClient = r.json.clients[0];
r = await call('GET', `/api/admin/erp/clients/${agentsClient.id}`, { as: agent });
check('agent can open their own client', r.status === 200);
r = await call('GET', `/api/admin/erp/clients/${agentsClient.id}`, { as: agent2 });
check('another agent gets 404 for it (no probing)', r.status === 404, String(r.status));
r = await list(`agent=${users.AGENT2.uid}`, agent);
check('agent cannot widen the view with the agent filter', r.json.total === 0);
for (const [label, who] of [['Chairman', chair], ['Accounts', accts]]) {
  r = await list('size=1', who);
  check(`${label} sees the whole book`, r.status === 200 && r.json.total === ALL);
}
r = await list('', prod);
check('Production (no client access) → 403', r.status === 403, String(r.status));
r = await call('GET', `/api/admin/erp/clients/${busy.id}`, { as: prod });
check('Production cannot open a profile → 403', r.status === 403, String(r.status));
r = await list('', 'none');
check('anonymous → 401', r.status === 401);
r = await call('PUT', `/api/admin/erp/accounts/${lab.id}`, { body: { clientType: 'HOSPITAL' }, as: chair });
check('Chairman cannot edit a client (no clients.edit) → 403', r.status === 403, String(r.status));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
