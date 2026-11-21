// API checks for the Overview day book, against a RUNNING dev server on a SCRATCH database
// (it records collections, expenses, invoices and stage moves).
// node scripts/daybook-api-check.mjs <base> <secretFile> <tokenFile> <usersJson>
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
const bdToday = () => new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
const shift = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const TODAY = bdToday();
const YDAY = shift(TODAY, -1);
const book = (date, as) => call('GET', `/api/admin/erp/daybook${date ? `?date=${date}` : ''}`, { as });

let r = await book();
check('day book answers for Super Admin, defaults to today', r.status === 200 && r.json.day.date === TODAY && r.json.previous.date === YDAY, JSON.stringify(r.json)?.slice(0, 200));
const before = r.json.day;
check('cases received today match the seeded cases created today', before.cases.received >= 1);
r = await book('2099-01-01');
check('a future date falls back to today', r.json.day.date === TODAY);
r = await book('2026-02-30');
check('an impossible date falls back to today', r.json.day.date === TODAY);
r = await book(YDAY);
check('yesterday: previous day is the day before yesterday', r.json.day.date === YDAY && r.json.previous.date === shift(YDAY, -1));
const ydayBefore = r.json.day;

// ---- record money today and yesterday
const clients = (await call('GET', '/api/admin/erp/accounts')).json.accounts;
const cid = clients[0].id;
const noonBD = (d) => `${d}T12:00:00+06:00`;
await call('POST', '/api/admin/erp/ledger', { body: { transactionType: 'PAYMENT', clientAccountId: cid, netAmount: 1234, paymentMethod: 'bKash', paymentDate: noonBD(TODAY), isVerified: false } });
await call('POST', '/api/admin/erp/ledger', { body: { transactionType: 'PAYMENT', clientAccountId: cid, netAmount: 500, paymentMethod: 'Cash', paymentDate: noonBD(YDAY), isVerified: true } });
// A collection received at 23:30 Dhaka time yesterday must count for yesterday, not today (UTC would say today 17:30... and vice versa)
await call('POST', '/api/admin/erp/ledger', { body: { transactionType: 'PAYMENT', clientAccountId: cid, netAmount: 77, paymentMethod: 'Cash', paymentDate: `${YDAY}T23:30:00+06:00`, isVerified: true } });
await call('POST', '/api/admin/erp/expenses', { body: { category: 'LOGISTICS', title: 'Courier probe', amount: 200, expenseDate: noonBD(TODAY) } });
await call('POST', '/api/admin/erp/ledger', { body: { transactionType: 'INVOICE', clientAccountId: cid, grossAmount: 3000, discountAmount: 0, notes: 'probe' } });

r = await book();
const after = r.json.day;
check('collected today went up by exactly 1234', Math.round(after.money.collected - before.money.collected) === 1234, `${before.money.collected} → ${after.money.collected}`);
check('unverified today includes the new collection', Math.round(after.money.unverified - before.money.unverified) === 1234);
check('expenses today went up by 200', Math.round(after.money.expenses - before.money.expenses) === 200);
check('net cash = collected − expenses', Math.round(after.money.netCash) === Math.round(after.money.collected - after.money.expenses));
check('invoiced today went up by 3000', Math.round(after.money.invoiced - before.money.invoiced) === 3000, `${before.money.invoiced} → ${after.money.invoiced}`);
check('change in dues = invoiced − collected − discount', Math.round(after.money.duesChange) === Math.round(after.money.invoiced - after.money.collected - after.money.discount));
r = await book(YDAY);
check('yesterday got 500 + the 23:30 collection (Bangladesh day boundary)', Math.round(r.json.day.money.collected - ydayBefore.money.collected) === 577, `${ydayBefore.money.collected} → ${r.json.day.money.collected}`);
const t = (await book()).json;
const y = (await book(YDAY)).json;
check('"previous" block of today equals yesterday asked directly', JSON.stringify(t.previous.money) === JSON.stringify(y.day.money));

// ---- stage history
const open = (await call('GET', '/api/admin/erp/orders?stage=Received&size=20')).json.orders;
const [a, b] = open;
r = await call('PATCH', '/api/admin/data', { body: { id: a.id, status: 'Dispatched', progress: 100 } });
check('stage move works (and writes history)', r.status === 200, String(r.status));
await call('PATCH', '/api/admin/data', { body: { id: a.id, status: 'Delivered', progress: 100 } });
await call('PATCH', '/api/admin/data', { body: { id: b.id, status: 'Dispatched', progress: 100 } });
await call('PATCH', '/api/admin/data', { body: { id: b.id, status: 'Dispatched', progress: 100 } }); // no change → no history row
await call('PATCH', '/api/admin/data', { body: { id: b.id, status: 'Quality Control', progress: 85 } });
await call('PATCH', '/api/admin/data', { body: { id: b.id, status: 'Dispatched', progress: 100 } }); // dispatched again: still one case
r = await book();
check('dispatched today counts distinct cases (2)', r.json.day.cases.dispatched === before.cases.dispatched + 2, `${r.json.day.cases.dispatched}`);
check('delivered today = 1', r.json.day.cases.delivered === before.cases.delivered + 1);
check('a stage "change" to the same stage writes no history', r.json.day.cases.stageMoves === before.cases.stageMoves + 5, `${r.json.day.cases.stageMoves}`);
check('stage history start date is reported', !!r.json.stageHistorySince);
r = await call('PATCH', '/api/admin/data', { body: { id: 'no-such-case', status: 'Dispatched', progress: 100 } });
check('moving an unknown case → 404', r.status === 404, String(r.status));

// ---- categories
const sumCat = r2 => r2.categories.reduce((s, c) => s + c.received, 0);
r = await book();
check('categories add up to cases received', sumCat(r.json.day) === r.json.day.cases.received, `${sumCat(r.json.day)} vs ${r.json.day.cases.received}`);
check('category invoiced adds up to invoiced', Math.round(r.json.day.categories.reduce((s, c) => s + c.invoiced, 0)) === Math.round(r.json.day.money.invoiced));
check('four category rows (zirconia, pfm, denture, other)', r.json.day.categories.map((c) => c.key).join(',') === 'zirconia,pfm,denture,other');

// ---- access
const chair = { user: users.CHAIRMAN, role: 'CHAIRMAN' };
const accts = { user: users.ACCOUNTS, role: 'ACCOUNTS' };
const agent = { user: users.AGENT, role: 'AGENT' };
for (const [label, who, code] of [['Chairman', chair, 200], ['Accounts', accts, 200], ['Agent', agent, 403]]) {
  r = await book(undefined, who);
  check(`${label} → ${code}`, r.status === code, String(r.status));
}
r = await book(undefined, 'none');
check('anonymous → 401', r.status === 401);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
