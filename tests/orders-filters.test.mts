// Pure-logic tests for the lab-case list filters and CSV encoding: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { DEFAULT_FILTERS, bdDayStart, bdTodayStart, categoryOf, csvCell, filtersToQuery, parseOrderFilters, toCsv } from '../lib/orders-filters.ts';

const parse = (qs: string) => parseOrderFilters(new URLSearchParams(qs));

test('empty query gives the defaults', () => {
  assert.deepEqual(parse(''), DEFAULT_FILTERS);
});

test('unknown or malformed values fall back to defaults', () => {
  const f = parse('stage=bogus&sort=bogus&dir=up&size=7&page=-2&category=zzz&billing=x&source=FAX&from=yesterday&client=a%20b');
  assert.deepEqual(f, DEFAULT_FILTERS);
});

test('valid values are kept', () => {
  const f = parse('q=%20Dr%20Rahman%20&stage=late&from=2026-11-01&to=2026-11-13&client=c1&agent=a_2&category=pfm&billing=invoiced&source=PHONE&sort=due&dir=asc&page=3&size=50');
  assert.equal(f.q, 'Dr Rahman');
  assert.equal(f.stage, 'late');
  assert.equal(f.page, 3);
  assert.equal(f.size, 50);
  assert.equal(f.sort, 'due');
  assert.equal(f.dir, 'asc');
  assert.equal(f.billing, 'invoiced');
});

test('filters survive a round trip through the URL and defaults stay out of it', () => {
  assert.equal(filtersToQuery(DEFAULT_FILTERS), '');
  const f = parse('stage=Milling&category=denture&from=2026-11-01&page=2&size=100&sort=amount');
  assert.deepEqual(parse(filtersToQuery(f)), f);
  assert.ok(!filtersToQuery(f, { withPaging: false }).includes('page='));
  assert.ok(!filtersToQuery(f, { withPaging: false }).includes('size='));
});

test('search text and page are bounded', () => {
  assert.equal(parse(`q=${'x'.repeat(500)}`).q.length, 100);
  assert.equal(parse('page=99999999').page, 100000);
});

test('work category: first match wins, everything else is "other"', () => {
  assert.equal(categoryOf('Zirconia crown | Patient: x'), 'zirconia');
  assert.equal(categoryOf('E.max veneer'), 'zirconia');
  assert.equal(categoryOf('PFM bridge'), 'pfm');
  assert.equal(categoryOf('Porcelain crown'), 'pfm');
  assert.equal(categoryOf('Complete denture'), 'denture');
  assert.equal(categoryOf('Night guard'), 'denture');
  assert.equal(categoryOf('Implant abutment'), 'other');
  assert.equal(categoryOf(null), 'other');
  assert.equal(categoryOf('Zirconia over PFM'), 'zirconia');
});

test('Bangladesh day boundaries', () => {
  assert.equal(bdDayStart('2026-11-13')!.toISOString(), '2026-11-12T18:00:00.000Z');
  assert.equal(bdDayStart('13/11/2026'), null);
  assert.equal(bdTodayStart(new Date('2026-11-13T20:00:00Z')).toISOString(), '2026-11-13T18:00:00.000Z'); // 02:00 on the 14th in Dhaka
  assert.equal(bdTodayStart(new Date('2026-11-13T17:59:00Z')).toISOString(), '2026-11-12T18:00:00.000Z');
});

test('CSV cells: quoting and spreadsheet-formula protection', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('two\nlines'), '"two\nlines"');
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell('+8801712345678'), "'+8801712345678");
  assert.equal(csvCell('-1'), "'-1");
  assert.equal(csvCell('@cmd'), "'@cmd");
  assert.equal(csvCell(-5), '-5'); // real numbers are not text
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
  assert.equal(csvCell('ঢাকা ক্লিনিক'), 'ঢাকা ক্লিনিক');
});

test('CSV file: byte-order mark, header, CRLF', () => {
  const csv = toCsv(['A', 'B'], [[1, 'x,y'], ['=1', null]]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.slice(1), 'A,B\r\n1,"x,y"\r\n\'=1,\r\n');
});
