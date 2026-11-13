// Behavioural RBAC checks against a RUNNING dev server on a SCRATCH database (it creates roles and users and demotes Super Admins).
// node scripts/rbac-api-check.mjs <base> <secretFile> <tokenFile> <extraJson>  (extraJson: {MODERATOR:{uid,name,phone},PRODUCTION:{...}})
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
const [base, secretFile, tokenFile, extraFile] = process.argv.slice(2);
const SECRET = readFileSync(secretFile, 'utf8').trim();
const TOKEN = readFileSync(tokenFile, 'utf8').trim();
const extra = JSON.parse(readFileSync(extraFile, 'utf8'));
const cookie = (u, role) => {
  const payload = Buffer.from(JSON.stringify({ uid: u.uid, name: u.name, phone: u.phone, role, iat: Date.now(), exp: Date.now() + 3600_000 })).toString('base64url');
  return `cndl_admin=${payload}.${createHmac('sha256', SECRET).update(payload).digest('base64url')}`;
};
const call = async (method, path, { body, as } = {}) => {
  const headers = { 'content-type': 'application/json' };
  if (as) headers.cookie = cookie(as.user, as.role);
  else headers.authorization = `Bearer ${TOKEN}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
};
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`); };

const run = Date.now().toString().slice(-6);
// 1. locked keys cannot be granted
let r = await call('POST', '/api/admin/erp/roles', { body: { name: `Locked ${run}`, permissions: ['blogs.view', 'exports.run'] } });
check('create role with locked key (exports.run) → 400', r.status === 400, JSON.stringify(r));
r = await call('POST', '/api/admin/erp/roles', { body: { name: `Unknown ${run}`, permissions: ['nope.nothing'] } });
check('create role with unknown key → 400', r.status === 400, JSON.stringify(r));
for (const k of ['roles.manage', 'users.manage', 'shareholders.payout', 'blogs.delete', 'audit.view', 'cases.delete']) {
  r = await call('POST', '/api/admin/erp/roles', { body: { name: `L ${k} ${run}`, permissions: [k] } });
  check(`locked ${k} rejected`, r.status === 400, String(r.status));
}

// 2. custom role: create, assign, change without re-login
r = await call('POST', '/api/admin/erp/roles', { body: { name: `Blog reader ${run}`, description: 't', permissions: ['blogs.view'] } });
check('create custom role → 201', r.status === 201 && r.json?.role?.key?.startsWith('custom_'), JSON.stringify(r));
const roleKey = r.json?.role?.key;
r = await call('POST', '/api/admin/erp/roles', { body: { name: `blog READER ${run}`, permissions: [] } });
check('duplicate role name (case-insensitive) → 409', r.status === 409, String(r.status));
r = await call('POST', '/api/admin/erp/users', { body: { name: 'Role Tester', phone: `0179${run}9`, roleKey, password: 'testpass123' } });
check('create user with custom role → 201', r.status === 201 || r.status === 200, JSON.stringify(r));
const uid = r.json?.user?.id ?? r.json?.id;
const tester = { uid, name: 'Role Tester', phone: `0179${run}9` };
const asT = { user: tester, role: roleKey };
r = await call('GET', '/api/admin/blogs', { as: asT });
check('custom role: blogs GET 200', r.status === 200, String(r.status));
r = await call('POST', '/api/admin/blogs', { as: asT, body: {} });
check('custom role: blogs POST 403 (no manage)', r.status === 403, String(r.status));
r = await call('GET', '/api/admin/verify', { as: asT });
check('verify exposes permissions + roleName', r.status === 200 && r.json?.user?.permissions?.includes('blogs.view') && /Blog reader/.test(r.json?.user?.roleName ?? ''), JSON.stringify(r.json));
r = await call('PUT', `/api/admin/erp/roles/${roleKey}`, { body: { permissions: ['blogs.view', 'blogs.manage'] } });
check('edit role → 200', r.status === 200, JSON.stringify(r));
r = await call('POST', '/api/admin/blogs', { as: asT, body: {} });
check('role change applies WITHOUT re-login (POST now reaches validation 400)', r.status === 400, String(r.status));
r = await call('PUT', `/api/admin/erp/roles/${roleKey}`, { body: { permissions: ['blogs.view', 'blogs.delete'] } });
check('edit role granting locked blogs.delete → 400', r.status === 400, String(r.status));
r = await call('GET', '/api/admin/erp/users', { as: asT });
check('custom role cannot list users → 403', r.status === 403, String(r.status));
r = await call('GET', '/api/admin/erp/roles', { as: asT });
check('custom role cannot read roles → 403', r.status === 403, String(r.status));
r = await call('GET', '/api/admin/erp/access-log', { as: asT });
check('custom role cannot read access log → 403', r.status === 403, String(r.status));

// 3. role in use cannot be deleted; unused can
r = await call('DELETE', `/api/admin/erp/roles/${roleKey}`);
check('delete role in use → 409', r.status === 409, JSON.stringify(r));
r = await call('DELETE', '/api/admin/erp/roles/CHAIRMAN');
check('delete built-in role → 403', r.status === 403, String(r.status));
r = await call('PUT', '/api/admin/erp/roles/SUPERADMIN', { body: { permissions: [] } });
check('edit SUPERADMIN role → 403', r.status === 403, String(r.status));
r = await call('PUT', `/api/admin/erp/users/${uid}`, { body: { roleKey: 'CHAIRMAN' } });
check('move user to CHAIRMAN → 200', r.status === 200, JSON.stringify(r));
r = await call('GET', '/api/admin/blogs', { as: asT });
check('old cookie (custom role) now follows DB role: CHAIRMAN has blogs.view → 200', r.status === 200, String(r.status));
r = await call('DELETE', `/api/admin/erp/roles/${roleKey}`);
check('delete unused custom role → 200', r.status === 200, JSON.stringify(r));
r = await call('PUT', `/api/admin/erp/users/${uid}`, { body: { roleKey } });
check('assign deleted/unknown role → 4xx', r.status >= 400 && r.status < 500, String(r.status));

// 4. suspended user is cut off at once
r = await call('PUT', `/api/admin/erp/users/${uid}`, { body: { status: 'SUSPENDED' } });
r = await call('GET', '/api/admin/blogs', { as: asT });
check('suspended user → 401 with a still-valid cookie', r.status === 401, String(r.status));

// 5. PRODUCTION / MODERATOR scoping
const prod = { user: extra.PRODUCTION, role: 'PRODUCTION' }, mod = { user: extra.MODERATOR, role: 'MODERATOR' };
r = await call('GET', '/api/admin/data', { as: prod });
const o = r.json?.orders ?? [];
check('PRODUCTION sees cases', o.length > 0, `orders=${o.length}`);
check('PRODUCTION: no money fields (billedAmount null, commission 0)', o.every((x) => x.billedAmount == null && !x.commissionAmount), JSON.stringify(o[0]));
check('PRODUCTION: no inquiries', (r.json?.messages ?? []).length === 0);
r = await call('GET', '/api/admin/data', { as: mod });
check('MODERATOR: inquiries yes, cases none', (r.json?.messages ?? []).length > 0 && (r.json?.orders ?? []).length === 0, `${r.json?.messages?.length}/${r.json?.orders?.length}`);
r = await call('GET', '/api/admin/erp/ledger', { as: prod });
check('PRODUCTION: ledger 403', r.status === 403, String(r.status));

// 6. audit trail
r = await call('GET', '/api/admin/erp/access-log');
const acts = new Set((r.json?.entries ?? []).map((e) => e.action));
check('audit log has ROLE_CREATE/ROLE_UPDATE/ROLE_DELETE/USER_ROLE_CHANGE', ['ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'USER_ROLE_CHANGE'].every((a) => acts.has(a)), [...acts].join(','));

// 7. last Super Admin guard (make two Super Admin accounts first)
for (const n of [1, 2]) await call('POST', '/api/admin/erp/users', { body: { name: `Super ${n}`, phone: `0178${run}${n}`, roleKey: 'SUPERADMIN', password: 'testpass123' } });
r = await call('GET', '/api/admin/erp/users');
const supers = (r.json?.users ?? []).filter((u) => (u.roleKey ?? u.role) === 'SUPERADMIN' && u.status === 'ACTIVE');
console.log(`   active super admins: ${supers.length}`);
let lastGuard = null;
for (const s of supers) {
  const d = await call('PUT', `/api/admin/erp/users/${s.id}`, { body: { roleKey: 'CHAIRMAN' } });
  if (d.status >= 400) { lastGuard = { s, d }; break; }
}
check('demoting the last active Super Admin is refused', !!lastGuard && /last Super Admin/i.test(lastGuard.d.json?.error ?? ''), JSON.stringify(lastGuard?.d));
if (lastGuard) {
  const d = await call('DELETE', `/api/admin/erp/users/${lastGuard.s.id}`);
  check('deleting the last Super Admin is refused', d.status >= 400, String(d.status));
  const s2 = await call('PUT', `/api/admin/erp/users/${lastGuard.s.id}`, { body: { status: 'SUSPENDED' } });
  check('suspending the last Super Admin is refused', s2.status >= 400, String(s2.status));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
