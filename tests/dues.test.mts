// Pure-logic tests for dues: FIFO settlement, ageing, risk and monthly statements: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
// @ts-expect-error -- node's test runner needs the .ts extension; tsc does not allow it
import { ageing, bdMonthRange, monthStatement, openInvoices, riskOf, statementText, type LedgerRow } from '../lib/dues.ts';

const DAY = 86400000;
const NOW = Date.parse('2026-11-21T06:00:00Z');
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
let n = 0;
const inv = (amount: number, daysAgo: number, orderId = `C${++n}`): LedgerRow => ({ id: `i${n}`, transactionType: 'INVOICE', netAmount: amount, orderId, createdAt: ago(daysAgo) });
const pay = (amount: number, daysAgo: number): LedgerRow => ({ id: `p${++n}`, transactionType: 'PAYMENT', netAmount: amount, createdAt: ago(0), paymentDate: ago(daysAgo) });

test('payments settle the oldest invoices first', () => {
  const rows = [inv(1000, 100), inv(500, 40), inv(300, 5), pay(1200, 3)];
  const open = openInvoices(rows, 600, ago(200));
  assert.deepEqual(open.map((o) => [o.amount, o.unpaid]), [[500, 300], [300, 300]]);
});

test('a partial payment leaves the rest of that invoice open', () => {
  const open = openInvoices([inv(1000, 10), pay(400, 1)], 600, ago(30));
  assert.equal(open.length, 1);
  assert.equal(open[0].unpaid, 600);
});

test('balance the ledger cannot explain shows as one "earlier balance" item', () => {
  const open = openInvoices([inv(300, 10)], 1000, ago(400));
  assert.equal(open[0].id, 'earlier-balance');
  assert.equal(open[0].unpaid, 700);
  assert.equal(open.reduce((s, o) => s + o.unpaid, 0), 1000);
});

test('balance lower than the ledger says trims the newest invoices, so ageing still adds up', () => {
  const open = openInvoices([inv(500, 50), inv(500, 5)], 600, ago(100));
  assert.equal(open.reduce((s, o) => s + o.unpaid, 0), 600);
  assert.equal(open[0].unpaid, 500); // the old one stays whole
});

test('nothing open when fully paid', () => {
  assert.deepEqual(openInvoices([inv(500, 10), pay(500, 2)], 0, ago(30)), []);
});

test('ageing buckets: 0–30, 31–60, 61–90, over 90', () => {
  const open = openInvoices([inv(100, 0), inv(200, 30), inv(300, 31), inv(400, 75), inv(500, 91)], 1500, ago(200));
  const a = ageing(open, NOW);
  assert.equal(a.d0, 300);
  assert.equal(a.d31, 300);
  assert.equal(a.d61, 400);
  assert.equal(a.d90, 500);
  assert.equal(a.total, 1500);
  assert.equal(a.oldestDays, 91);
});

test('risk is a soft flag from amount and age', () => {
  assert.equal(riskOf(0, 200), 'none');
  assert.equal(riskOf(10000, 10), 'none');
  assert.equal(riskOf(50000, 10), 'watch');
  assert.equal(riskOf(10000, 60), 'watch');
  assert.equal(riskOf(100000, 1), 'high');
  assert.equal(riskOf(5000, 95), 'high');
});

test('Bangladesh month boundaries', () => {
  const { start, end } = bdMonthRange('2026-11');
  assert.equal(new Date(start).toISOString(), '2026-10-31T18:00:00.000Z');
  assert.equal(new Date(end).toISOString(), '2026-11-30T18:00:00.000Z');
});

test('monthly statement: brought forward + bills − payments = balance, and it agrees with today\'s balance', () => {
  const rows: LedgerRow[] = [
    { id: 'a', transactionType: 'INVOICE', netAmount: 1000, createdAt: '2026-10-10T06:00:00Z' },
    { id: 'b', transactionType: 'INVOICE', netAmount: 2000, createdAt: '2026-11-05T06:00:00Z', orderId: 'CNDL-1' },
    { id: 'c', transactionType: 'PAYMENT', netAmount: 1500, createdAt: '2026-11-20T06:00:00Z', paymentDate: '2026-11-12T06:00:00Z' },
    // 23:30 on 30 Nov in Dhaka is still November
    { id: 'd', transactionType: 'INVOICE', netAmount: 400, createdAt: '2026-11-30T17:30:00Z' },
    { id: 'e', transactionType: 'PAYMENT', netAmount: 100, createdAt: '2026-12-02T06:00:00Z' },
  ];
  const balanceNow = 1000 + 2000 - 1500 + 400 - 100;
  const s = monthStatement(rows, balanceNow, '2026-11');
  assert.equal(s.opening, 1000);
  assert.equal(s.invoiced, 2400);
  assert.equal(s.paid, 1500);
  assert.equal(s.closing, 1900);
  assert.equal(s.opening + s.invoiced - s.paid, s.closing);
  assert.equal(s.lines.at(-1)!.balance, s.closing);
  assert.deepEqual(s.lines.map((l) => l.kind), ['Invoice', 'Payment', 'Invoice']);
  const oct = monthStatement(rows, balanceNow, '2026-10');
  assert.equal(oct.closing, s.opening);
});

test('statement text has the four figures in Bengali', () => {
  const s = { month: '2026-11', opening: 1000, lines: [], invoiced: 2400, paid: 1500, closing: 1900 };
  const t = statementText('Smile Care', 'Dr Rahman', s, 'November 2026');
  assert.match(t, /আগের বকেয়া: ৳1,000/);
  assert.match(t, /মোট বকেয়া: ৳1,900/);
});
