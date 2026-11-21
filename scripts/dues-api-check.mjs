// API checks for dues follow-ups (notes and promises to pay), against a RUNNING dev server on a SCRATCH database.
// node scripts/dues-api-check.mjs <base> <secretFile> <tokenFile> <usersJson>
//   usersJson: { AGENT:{uid,name,phone}, AGENT2:{...}, CHAIRMAN:{...}, ACCOUNTS:{...} }  (AGENT is assigned at least one client)
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
const F = '/api/admin/erp/dues/followups';
const agent = { user: users.AGENT, role: 'AGENT' };
const agent2 = { user: users.AGENT2, role: 'AGENT' };
const chair = { user: users.CHAIRMAN, role: 'CHAIRMAN' };
const accts = { user: users.ACCOUNTS, role: 'ACCOUNTS' };
const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
const yesterday = new Date(Date.now() + 6 * 3600000 - 86400000).toISOString().slice(0, 10);

const accounts = (await call('GET', '/api/admin/erp/accounts')).json.accounts;
const mine = accounts.find((a) => a.assignedAgentId === users.AGENT.uid);
const theirs = accounts.find((a) => a.assignedAgentId && a.assignedAgentId !== users.AGENT.uid);

// ---- create
let r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'NOTE', note: 'Called, will pay next week' } });
check('Super Admin adds a note → 201, stored as DONE', r.status === 201 && r.json.followUp.status === 'DONE' && r.json.followUp.createdByName, JSON.stringify(r.json));
r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'PROMISE', note: 'bKash', promiseAmount: 2000, promiseDate: `${yesterday}T12:00:00+06:00` } });
check('promise → 201, OPEN', r.status === 201 && r.json.followUp.status === 'OPEN' && r.json.followUp.promiseAmount === 2000);
const overdue = r.json.followUp;
r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'PROMISE', note: 'no amount' } });
check('promise without amount/date → 400', r.status === 400, String(r.status));
r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'NOTE', note: 'x' } });
check('one-letter note → 400', r.status === 400);
r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'CALL', note: 'hello there' } });
check('unknown kind → 400', r.status === 400);
r = await call('POST', F, { body: { clientAccountId: 'nope', kind: 'NOTE', note: 'hello there' } });
check('unknown client → 404', r.status === 404);

// ---- agent scope
r = await call('POST', F, { body: { clientAccountId: mine.id, kind: 'PROMISE', note: 'Cash on Sunday', promiseAmount: 500, promiseDate: `${today}T12:00:00+06:00` }, as: agent });
check('agent adds a promise for their own client → 201', r.status === 201, String(r.status));
const agentPromise = r.json?.followUp;
r = await call('POST', F, { body: { clientAccountId: theirs.id, kind: 'NOTE', note: 'not mine' }, as: agent });
check("agent cannot add to another agent's client → 404", r.status === 404, String(r.status));
r = await call('GET', `${F}?account=${theirs.id}`, { as: agent });
check("agent cannot read another agent's client follow-ups → 404", r.status === 404);
r = await call('GET', `${F}?account=${mine.id}`, { as: agent });
check('agent reads their own client follow-ups (newest first)', r.status === 200 && r.json.followUps.length >= 3 && r.json.followUps[0].id === agentPromise.id);
await call('POST', F, { body: { clientAccountId: theirs.id, kind: 'PROMISE', note: 'other', promiseAmount: 900, promiseDate: `${today}T12:00:00+06:00` } });
r = await call('GET', `${F}?open=1`, { as: agent });
check("agent's open promises list holds only their clients", r.status === 200 && r.json.promises.length >= 2 && r.json.promises.every((p) => p.clientAccountId === mine.id));
r = await call('GET', `${F}?open=1`);
check('Super Admin open list holds everyone, oldest promise first', r.json.promises.some((p) => p.clientAccountId === theirs.id) && r.json.promises[0].id === overdue.id);
check('last contact per client is returned', !!r.json.lastContact[mine.id]);
r = await call('GET', F);
check('neither ?account nor ?open → 400', r.status === 400);

// ---- status
r = await call('PATCH', `${F}/${overdue.id}`, { body: { status: 'KEPT' }, as: agent });
check('agent marks their client promise kept', r.status === 200 && r.json.followUp.status === 'KEPT');
r = await call('PATCH', `${F}/${overdue.id}`, { body: { status: 'LOST' } });
check('bad status → 400', r.status === 400);
const other = (await call('GET', `${F}?account=${theirs.id}`)).json.followUps[0];
r = await call('PATCH', `${F}/${other.id}`, { body: { status: 'BROKEN' }, as: agent });
check("agent cannot change another agent's client promise → 404", r.status === 404);
r = await call('PATCH', `${F}/nope`, { body: { status: 'KEPT' } });
check('unknown follow-up → 404', r.status === 404);
r = await call('GET', `${F}?open=1`);
check('kept promises leave the open list', !r.json.promises.some((p) => p.id === overdue.id));

// ---- other roles
r = await call('GET', `${F}?account=${theirs.id}`, { as: chair });
check('Chairman (ledger.view) can read any client', r.status === 200);
r = await call('POST', F, { body: { clientAccountId: theirs.id, kind: 'NOTE', note: 'from accounts' }, as: accts });
check('Accounts can add notes', r.status === 201);
const prod = await (async () => {
  const made = await call('POST', '/api/admin/erp/users', { body: { name: 'Prod Tester', phone: '01790000099', roleKey: 'PRODUCTION', password: 'testpass123' } });
  let id = made.json?.id ?? made.json?.user?.id;
  if (!id) id = ((await call('GET', '/api/admin/erp/users')).json?.users ?? []).find((u) => u.phone === '01790000099')?.id;
  return { user: { uid: id, name: 'Prod Tester', phone: '01790000099' }, role: 'PRODUCTION' };
})();
r = await call('GET', `${F}?open=1`, { as: prod });
check('Production (no ledger access) → 403', r.status === 403, String(r.status));
r = await call('GET', `${F}?open=1`, { as: 'none' });
check('anonymous → 401', r.status === 401);
r = await call('GET', `${F}?open=1`, { as: agent2 });
check('the other agent sees only their own client promises', r.status === 200 && r.json.promises.every((p) => p.clientAccountId !== mine.id));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
