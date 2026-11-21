// Pure-logic tests for client types and the clients list rules: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { CLIENT_TYPES, clientTypeOf, columnsForType, isChairmanChannel } from '../lib/client-types.ts';
import {
  CLIENT_TYPE_KEYS, DEFAULT_CLIENT_FILTERS, DORMANT_DAYS, bdMonthStart, clientFiltersToQuery, compareClients, isDormant, isNewThisMonth, matchesClient, parseClientFilters,
  type ClientRowFacts,
// @ts-expect-error -- see above
} from '../lib/clients-filters.ts';

const DAY = 86400000;
const NOW = new Date('2026-11-21T06:00:00Z'); // 12:00 in Dhaka

test('one user-facing type from the two stored columns', () => {
  assert.equal(clientTypeOf({ accountType: 'CHAMBER', institutionType: 'CHAMBER' }), 'CLINIC');
  assert.equal(clientTypeOf({ accountType: 'CHAMBER', institutionType: 'HOSPITAL' }), 'HOSPITAL');
  assert.equal(clientTypeOf({ accountType: 'PARTNER_LAB', institutionType: 'CHAMBER' }), 'LAB');
  assert.equal(clientTypeOf({ accountType: 'CHAMBER', institutionType: 'PARTNER_LAB' }), 'LAB');
  assert.equal(clientTypeOf({ accountType: 'CHAMBER', institutionType: 'LAB' }), 'LAB');
  assert.equal(clientTypeOf({ accountType: 'CHAMBER', institutionType: 'FREELANCE' }), 'PERSONAL');
  // The Chairman channel is a separate flag, not a type.
  assert.equal(clientTypeOf({ accountType: 'CHAIRMAN_PERSONAL', institutionType: 'HOSPITAL' }), 'HOSPITAL');
  assert.equal(isChairmanChannel({ accountType: 'CHAIRMAN_PERSONAL' }), true);
  assert.equal(clientTypeOf({}), 'CLINIC');
});

test('writing a type gives both columns, and reading them back gives the same type', () => {
  for (const t of CLIENT_TYPES) {
    for (const ch of [false, true]) {
      const cols = columnsForType(t, ch);
      assert.equal(clientTypeOf(cols), t, `${t}/${ch}`);
      assert.equal(isChairmanChannel(cols), ch, `${t}/${ch}`);
    }
  }
  assert.deepEqual(columnsForType('LAB', false), { accountType: 'PARTNER_LAB', institutionType: 'PARTNER_LAB' });
  assert.deepEqual(columnsForType('CLINIC', true), { accountType: 'CHAIRMAN_PERSONAL', institutionType: 'CHAMBER' });
});

test('the filters module lists the same types', () => {
  assert.deepEqual([...CLIENT_TYPE_KEYS], [...CLIENT_TYPES]);
});

test('filter parsing: defaults, bounds and round trip', () => {
  assert.deepEqual(parseClientFilters(new URLSearchParams('')), DEFAULT_CLIENT_FILTERS);
  assert.deepEqual(parseClientFilters(new URLSearchParams('type=SHOP&division=dh4ka!&agent=a%20b&activity=x&sort=y&size=7&page=0')), DEFAULT_CLIENT_FILTERS);
  const f = parseClientFilters(new URLSearchParams('q=smile&type=HOSPITAL&division=dhaka&agent=none&activity=dormant&sort=recent&page=2&size=50'));
  assert.equal(f.division, 'DHAKA');
  assert.equal(f.dir, 'desc'); // non-name sorts default to descending
  assert.deepEqual(parseClientFilters(new URLSearchParams(clientFiltersToQuery(f))), f);
  assert.equal(clientFiltersToQuery(DEFAULT_CLIENT_FILTERS), '');
});

test('Bangladesh month start', () => {
  assert.equal(bdMonthStart(new Date('2026-11-21T06:00:00Z')).toISOString(), '2026-10-31T18:00:00.000Z');
  // 23:30 UTC on 30 Nov is already 1 Dec in Dhaka
  assert.equal(bdMonthStart(new Date('2026-11-30T23:30:00Z')).toISOString(), '2026-11-30T18:00:00.000Z');
});

const row = (p: Partial<ClientRowFacts>): ClientRowFacts => ({
  type: 'CLINIC', name: 'Smile Care', ownerName: 'Dr Rahman', phone: '01711000001', email: null, district: 'Dhanmondi', address: null,
  division: 'DHAKA', assignedAgentId: null, currentBalance: 0, createdAt: new Date(NOW.getTime() - 200 * DAY), lastCaseAt: new Date(NOW.getTime() - 3 * DAY), caseCount: 4,
  ...p,
});

test('new this month and gone quiet', () => {
  assert.equal(isNewThisMonth(row({ createdAt: new Date('2026-11-01T00:00:00+06:00') }), NOW), true);
  assert.equal(isNewThisMonth(row({ createdAt: new Date('2026-10-31T23:59:00+06:00') }), NOW), false);
  assert.equal(isDormant(row({ lastCaseAt: new Date(NOW.getTime() - (DORMANT_DAYS + 1) * DAY) }), NOW), true);
  assert.equal(isDormant(row({ lastCaseAt: new Date(NOW.getTime() - (DORMANT_DAYS - 1) * DAY) }), NOW), false);
  // never sent a case: quiet only once the account itself is old enough
  assert.equal(isDormant(row({ lastCaseAt: null, caseCount: 0, createdAt: new Date(NOW.getTime() - 10 * DAY) }), NOW), false);
  assert.equal(isDormant(row({ lastCaseAt: null, caseCount: 0 }), NOW), true);
});

test('matching: search (incl. phone in any format), type, division, agent, activity', () => {
  const f = (p: string) => parseClientFilters(new URLSearchParams(p));
  const r = row({ assignedAgentId: 'ag1', currentBalance: 500 });
  assert.ok(matchesClient(r, f('q=smile'), NOW));
  assert.ok(matchesClient(r, f('q=rahman'), NOW));
  assert.ok(matchesClient(r, f('q=dhanmondi'), NOW));
  assert.ok(matchesClient(r, f('q=%2B8801711000001'), NOW));
  assert.ok(matchesClient(r, f('q=1711000'), NOW));
  assert.ok(!matchesClient(r, f('q=nothing'), NOW));
  assert.ok(!matchesClient(r, f('type=LAB'), NOW));
  assert.ok(!matchesClient(r, f('division=SYLHET'), NOW));
  assert.ok(matchesClient(r, f('agent=ag1'), NOW));
  assert.ok(!matchesClient(r, f('agent=none'), NOW));
  assert.ok(matchesClient(row({}), f('agent=none'), NOW));
  assert.ok(matchesClient(r, f('activity=owing'), NOW));
  assert.ok(!matchesClient(row({}), f('activity=owing'), NOW));
  assert.ok(!matchesClient(r, f('activity=never'), NOW));
  assert.ok(matchesClient(row({ caseCount: 0, lastCaseAt: null }), f('activity=never'), NOW));
});

test('sorting, with name as the tie-breaker', () => {
  const a = row({ name: 'Alpha', currentBalance: 10, caseCount: 1, lastCaseAt: new Date(NOW.getTime() - 9 * DAY) });
  const b = row({ name: 'beta', currentBalance: 30, caseCount: 5, lastCaseAt: null });
  const c = row({ name: 'Gamma', currentBalance: 30, caseCount: 2, lastCaseAt: new Date(NOW.getTime() - 1 * DAY) });
  const by = (qs: string) => [a, b, c].sort(compareClients(parseClientFilters(new URLSearchParams(qs)))).map((x) => x.name);
  assert.deepEqual(by(''), ['Alpha', 'beta', 'Gamma']);
  assert.deepEqual(by('sort=balance'), ['beta', 'Gamma', 'Alpha']);
  assert.deepEqual(by('sort=cases'), ['beta', 'Gamma', 'Alpha']);
  assert.deepEqual(by('sort=recent'), ['Gamma', 'Alpha', 'beta']); // never = oldest
  assert.deepEqual(by('sort=recent&dir=asc'), ['beta', 'Alpha', 'Gamma']);
});
