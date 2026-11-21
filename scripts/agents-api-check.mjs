// API checks for field agents: cases submitted for approval, cash handovers and "My day", against a RUNNING dev
// server on a SCRATCH database (it creates cases, collections and handovers).
// node scripts/agents-api-check.mjs <base> <secretFile> <tokenFile> <usersJson>
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
const agent = { user: users.AGENT, role: 'AGENT' };
const agent2 = { user: users.AGENT2, role: 'AGENT' };
const chair = { user: users.CHAIRMAN, role: 'CHAIRMAN' };
const accts = { user: users.ACCOUNTS, role: 'ACCOUNTS' };

// ---- the AGENT role holds the new permission
let r = await call('GET', '/api/admin/erp/roles');
const agentRole = r.json.roles.find((x) => x.key === 'AGENT');
check('Field agent role includes "cases.submit"', agentRole.permissions.includes('cases.submit'), JSON.stringify(agentRole.permissions));
r = await call('GET', '/api/admin/verify', { as: agent });
check("agent's session lists cases.submit", r.json?.user?.permissions?.includes('cases.submit'));

const accounts = (await call('GET', '/api/admin/erp/accounts')).json.accounts;
const mine = accounts.find((a) => a.assignedAgentId === users.AGENT.uid);
const theirs = accounts.find((a) => a.assignedAgentId && a.assignedAgentId !== users.AGENT.uid);
const openBefore = (await call('GET', '/api/admin/erp/orders?stage=open&size=20')).json.total;

// ---- submit
const S = '/api/admin/erp/submissions';
r = await call('POST', S, { body: { clientAccountId: mine.id, productName: 'Zirconia crown', units: 2, patientName: 'Rina', toothNo: '11', shade: 'A2', quotedAmount: 4000, notes: 'urgent' }, as: agent });
check('agent submits a case for their own client → 201, Awaiting approval', r.status === 201 && r.json.order.status === 'Awaiting approval' && r.json.order.agentId === users.AGENT.uid && r.json.order.commissionAmount === 0, JSON.stringify(r.json));
const sub1 = r.json.order;
check('quoted price is kept, nothing is invoiced', sub1.billedAmount === 4000);
r = await call('POST', S, { body: { clientAccountId: mine.id, productName: 'PFM bridge' }, as: agent });
const sub2 = r.json.order;
r = await call('POST', S, { body: { clientAccountId: theirs.id, productName: 'Crown' }, as: agent });
check("agent cannot submit for another agent's client → 404", r.status === 404, String(r.status));
r = await call('POST', S, { body: { clientAccountId: mine.id, productName: 'x' }, as: agent });
check('missing work description → 400', r.status === 400);
r = await call('POST', S, { body: { clientAccountId: mine.id, productName: 'Crown' }, as: chair });
check('Chairman (no cases.submit) cannot submit → 403', r.status === 403, String(r.status));
r = await call('GET', '/api/admin/erp/orders?stage=open&size=20');
check('cases awaiting approval are not "in the lab"', r.json.total === openBefore, `${r.json.total} vs ${openBefore}`);
r = await call('GET', '/api/admin/erp/orders?stage=Awaiting%20approval&size=20');
check('stage filter "Awaiting approval" finds them', r.json.total >= 2);
r = await call('GET', '/api/admin/erp/orders?stage=all&size=100', { as: agent });
check('agent sees their submissions in their own case list', r.json.orders.some((o) => o.id === sub1.id));

// ---- approvals
r = await call('GET', S, { as: accts });
check('Accounts sees the approval queue, oldest first', r.status === 200 && r.json.submissions[0].id === sub1.id && r.json.submissions[0].agentName === users.AGENT.name);
r = await call('GET', S, { as: agent });
check('agent cannot see the approval queue → 403', r.status === 403);
r = await call('PATCH', `${S}/${sub1.id}`, { body: { action: 'approve', billedAmount: 3800, commissionAmount: 200 }, as: agent });
check('agent cannot approve → 403', r.status === 403);
r = await call('PATCH', `${S}/${sub1.id}`, { body: { action: 'approve', billedAmount: 3800, commissionAmount: 200 }, as: accts });
check('Accounts approves → Received, amount and commission set', r.status === 200 && r.json.order.status === 'Received' && r.json.order.billedAmount === 3800 && r.json.order.commissionAmount === 200, JSON.stringify(r.json));
r = await call('PATCH', `${S}/${sub1.id}`, { body: { action: 'reject', reason: 'too late now' }, as: accts });
check('deciding twice → 409', r.status === 409, String(r.status));
r = await call('PATCH', `${S}/${sub2.id}`, { body: { action: 'reject', reason: 'no' }, as: accts });
check('reject needs a real reason → 400', r.status === 400);
r = await call('PATCH', `${S}/${sub2.id}`, { body: { action: 'reject', reason: 'Collect old dues first' }, as: accts });
check('reject → Cancelled with the reason in the notes', r.status === 200 && r.json.order.status === 'Cancelled' && /Not approved by .* Collect old dues first/.test(r.json.order.productType), JSON.stringify(r.json));
r = await call('PATCH', `${S}/nope`, { body: { action: 'approve' }, as: accts });
check('unknown case → 404', r.status === 404);
r = await call('GET', '/api/admin/erp/orders?stage=open&size=20');
check('the approved case is now in the lab', r.json.total === openBefore + 1);

// ---- my day: cases
r = await call('GET', '/api/admin/erp/my-day', { as: agent });
check('My day answers for the agent', r.status === 200 && r.json.clients.count >= 1, JSON.stringify(r.json)?.slice(0, 200));
check('My day lists the rejected submission with its reason', r.json.cases.recentSubmissions.some((o) => o.id === sub2.id && /Collect old dues first/.test(o.productType)));
check('commission pending includes the approved case', r.json.commission.pending >= 200);
r = await call('GET', '/api/admin/erp/my-day', { as: 'none' });
check('My day: anonymous → 401', r.status === 401);
r = await call('GET', '/api/admin/erp/my-day');
check('My day needs a real account (API token) → 400', r.status === 400);

// ---- handovers
const H = '/api/admin/erp/handovers';
const pay = (amount, as, clientAccountId = mine.id) => call('POST', '/api/admin/erp/ledger', { body: { transactionType: 'PAYMENT', clientAccountId, netAmount: amount, paymentMethod: 'Cash', collectedById: as?.user?.uid }, as });
r = await pay(700, agent);
check('agent records a collection', r.status === 201 || r.status === 200, `${r.status} ${JSON.stringify(r.json)}`);
await pay(300, agent);
r = await call('GET', '/api/admin/erp/my-day', { as: agent });
const inHand = r.json.cash.inHand;
check('cash in hand = unverified collections not handed over (≥ 1000)', inHand >= 1000 && r.json.collections.today >= 1000, `${inHand}`);
r = await call('POST', H, { body: {}, as: agent });
check('hand over all cash in hand → 201', r.status === 201 && r.json.handover.amount === inHand && r.json.handover.status === 'SUBMITTED', JSON.stringify(r.json));
const h1 = r.json.handover;
r = await call('POST', H, { body: {}, as: agent });
check('nothing left in hand → 400', r.status === 400);
r = await call('GET', '/api/admin/erp/my-day', { as: agent });
check('cash in hand is 0 while the handover waits', r.json.cash.inHand === 0);
r = await call('GET', H, { as: agent2 });
check("another agent does not see this agent's handover", r.status === 200 && !r.json.handovers.some((h) => h.id === h1.id));
r = await call('GET', `${H}?status=SUBMITTED`, { as: accts });
check('Accounts sees waiting handovers', r.json.handovers.some((h) => h.id === h1.id));
r = await call('PATCH', `${H}/${h1.id}`, { body: { action: 'receive' }, as: agent });
check('agent cannot receive (no ledger.verify) → 403', r.status === 403);
r = await call('PATCH', `${H}/${h1.id}`, { body: { action: 'receive', note: 'counted' }, as: accts });
check('Accounts receives → RECEIVED', r.status === 200 && r.json.handover.status === 'RECEIVED' && r.json.handover.receivedByName);
const ledger = (await call('GET', '/api/admin/erp/ledger')).json.entries;
check('every collection in it is now verified', h1.collectionIds.every((id) => ledger.find((e) => e.id === id)?.isVerified === true));
r = await call('PATCH', `${H}/${h1.id}`, { body: { action: 'dispute', note: 'again?' }, as: accts });
check('deciding twice → 409', r.status === 409);

await pay(450, agent);
r = await call('POST', H, { body: { note: 'evening' }, as: agent });
const h2 = r.json.handover;
r = await call('PATCH', `${H}/${h2.id}`, { body: { action: 'dispute', note: 'x' }, as: accts });
check('dispute needs a reason → 400', r.status === 400);
r = await call('PATCH', `${H}/${h2.id}`, { body: { action: 'dispute', note: 'Short by 50' }, as: accts });
check('dispute → DISPUTED, nothing verified', r.status === 200 && r.json.handover.status === 'DISPUTED');
r = await call('GET', '/api/admin/erp/my-day', { as: agent });
check('disputed cash counts as in hand again', r.json.cash.inHand === 450, `${r.json.cash.inHand}`);

// Someone who verifies cannot receive their own handover.
await pay(100, accts, theirs.id);
r = await call('POST', H, { body: {}, as: accts });
check('Accounts can hand over their own collections', r.status === 201, String(r.status));
r = await call('PATCH', `${H}/${r.json.handover.id}`, { body: { action: 'receive' }, as: accts });
check('…but cannot receive their own handover → 403', r.status === 403, String(r.status));
r = await call('POST', H, { body: {}, as: chair });
check('Chairman has collected nothing → 400', r.status === 400, String(r.status));

// ---- access log records the one-time default
r = await call('GET', '/api/admin/erp/access-log');
check('access log shows the new default given to Field agent', r.json.entries.some((e) => e.action === 'DEFAULT_ADDED' && e.roleKey === 'AGENT'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
