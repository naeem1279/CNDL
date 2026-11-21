// Field agents: the new permission and the "Awaiting approval" stage: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { BUILTIN_ROLES, LOCKED_PERMISSION_KEYS, visibleTabs } from '../lib/permissions.ts';
// @ts-expect-error -- see above
import { AWAITING_APPROVAL, NOT_IN_LAB, STAGE_VALUES, parseOrderFilters } from '../lib/orders-filters.ts';

test('field agents may submit cases for approval by default; it is grantable to other roles', () => {
  assert.ok(BUILTIN_ROLES.find((r) => r.key === 'AGENT')!.permissions.includes('cases.submit'));
  assert.ok(!LOCKED_PERMISSION_KEYS.has('cases.submit'));
});

test('a field agent lands on My day; people with Overview still land on Overview', () => {
  const agent = BUILTIN_ROLES.find((r) => r.key === 'AGENT')!.permissions;
  assert.equal(visibleTabs(agent)[0], 'myday');
  const accounts = BUILTIN_ROLES.find((r) => r.key === 'ACCOUNTS')!.permissions;
  assert.equal(visibleTabs(accounts)[0], 'overview');
});

test('cases awaiting approval are not in the lab, and the stage can be filtered on', () => {
  assert.ok(NOT_IN_LAB.includes(AWAITING_APPROVAL));
  assert.ok((STAGE_VALUES as readonly string[]).includes(AWAITING_APPROVAL));
  assert.equal(parseOrderFilters(new URLSearchParams('stage=Awaiting%20approval')).stage, AWAITING_APPROVAL);
});
