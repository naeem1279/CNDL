// Pure-logic tests for the permission catalog: node --test tests/*.test.mts
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { BUILTIN_ROLES, LOCKED_PERMISSION_KEYS, PERMISSIONS, SUPERADMIN_KEY, TAB_PERMISSIONS, hasAnyPermission, sanitizePermissions, visibleTabs } from '../lib/permissions.ts';

const EXPECTED_LOCKED = ['exports.run', 'roles.manage', 'users.manage', 'shareholders.payout', 'audit.view'];

test('locked set covers exports, roles, team, payouts and every permanent delete', () => {
  for (const k of EXPECTED_LOCKED) assert.ok(LOCKED_PERMISSION_KEYS.has(k), k);
  for (const p of PERMISSIONS.filter((p) => p.key.endsWith('.delete'))) assert.ok(p.locked, p.key);
});

test('permission keys are unique', () => {
  const keys = PERMISSIONS.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('no built-in role except Super Admin holds a locked permission', () => {
  for (const r of BUILTIN_ROLES.filter((r) => r.key !== SUPERADMIN_KEY)) {
    assert.deepEqual(r.permissions.filter((k) => LOCKED_PERMISSION_KEYS.has(k)), [], r.key);
  }
  const sa = BUILTIN_ROLES.find((r) => r.key === SUPERADMIN_KEY)!;
  assert.equal(sa.permissions.length, PERMISSIONS.length);
});

test('sanitizePermissions drops unknown and locked keys', () => {
  assert.deepEqual(sanitizePermissions(['blogs.view', 'nope', 'exports.run', 'blogs.view']), ['blogs.view']);
  assert.deepEqual(sanitizePermissions('x'), []);
  assert.ok(sanitizePermissions(['exports.run'], { keepLocked: true }).includes('exports.run'));
});

test('sections follow permissions and fail closed', () => {
  assert.deepEqual(visibleTabs([]), []);
  assert.deepEqual(visibleTabs(['blogs.view']), []); // view alone does not open the Blogs editor
  assert.ok(visibleTabs(['blogs.manage']).includes('blogs'));
  assert.ok(visibleTabs(['ledger.view_own']).includes('dues'));
  assert.ok(hasAnyPermission(['a'], ['b', 'a']));
  const all = BUILTIN_ROLES.find((r) => r.key === SUPERADMIN_KEY)!.permissions;
  assert.equal(visibleTabs(all).length, TAB_PERMISSIONS.length);
});

test('defaults match the agreed roles', () => {
  const by = (k: string) => BUILTIN_ROLES.find((r) => r.key === k)!.permissions;
  assert.deepEqual(by('PARTNER_LAB'), []);
  assert.deepEqual(by('DOCTOR'), []);
  assert.ok(!by('PRODUCTION').some((k) => k.includes('money') || k.startsWith('ledger') || k.startsWith('expenses')));
  assert.deepEqual([...by('PRODUCTION')].sort(), ['cases.move_stage', 'cases.view']);
  assert.ok(by('MODERATOR').includes('messages.view') && !by('MODERATOR').some((k) => k.startsWith('cases')));
});
