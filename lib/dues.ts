/**
 * Client dues: which invoices are still unpaid (payments settle the oldest invoices first), how old
 * the unpaid money is, monthly statements and the soft "be careful" warning.
 * Pure (no imports) so the console, the API and the tests share one definition.
 */

export type LedgerRow = {
  id: string;
  transactionType: string; // INVOICE | PAYMENT | DISCOUNT_OVERRIDE
  netAmount: number;
  orderId?: string | null;
  createdAt: string | Date;
  paymentDate?: string | Date | null;
  notes?: string | null;
};

const DAY = 86400000;
const BD = 6 * 3600000;
const ms = (d: string | Date) => (typeof d === 'string' ? Date.parse(d) : d.getTime());
/** When a row happened: collections use the date the money was received. */
export const rowTime = (r: LedgerRow) => ms(r.paymentDate || r.createdAt);
const lowers = (r: LedgerRow) => r.transactionType === 'PAYMENT' || r.transactionType === 'DISCOUNT_OVERRIDE';

export type OpenInvoice = { id: string; orderId: string | null; at: number; amount: number; unpaid: number };

/**
 * Settles payments against invoices oldest first (FIFO) and returns what is still unpaid.
 * `balance` is the account's stored balance; if it is higher than the ledger explains (older
 * balances entered before the ledger existed), the difference is shown as one "earlier balance"
 * item dated `since`, so the ageing always adds up to the balance.
 */
export function openInvoices(rows: LedgerRow[], balance: number, since: string | Date): OpenInvoice[] {
  const invoices = rows
    .filter((r) => r.transactionType === 'INVOICE')
    .map((r) => ({ id: r.id, orderId: r.orderId ?? null, at: rowTime(r), amount: r.netAmount, unpaid: r.netAmount }))
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  let credit = rows.filter(lowers).reduce((s, r) => s + r.netAmount, 0);
  for (const inv of invoices) {
    if (credit <= 0) break;
    const used = Math.min(inv.unpaid, credit);
    inv.unpaid -= used;
    credit -= used;
  }
  const open = invoices.filter((i) => i.unpaid > 0.005);
  const explained = open.reduce((s, i) => s + i.unpaid, 0);
  const extra = Math.round((balance - explained) * 100) / 100;
  if (extra > 0.5) open.unshift({ id: 'earlier-balance', orderId: null, at: ms(since), amount: extra, unpaid: extra });
  // A balance lower than the ledger explains (manual corrections): trim the newest invoices.
  if (extra < -0.5) {
    let over = -extra;
    for (let i = open.length - 1; i >= 0 && over > 0; i--) {
      const cut = Math.min(open[i].unpaid, over);
      open[i].unpaid -= cut;
      over -= cut;
    }
    return open.filter((i) => i.unpaid > 0.005);
  }
  return open;
}

export const AGE_BUCKETS = [
  { key: 'd0', label: '0–30 days', max: 30 },
  { key: 'd31', label: '31–60 days', max: 60 },
  { key: 'd61', label: '61–90 days', max: 90 },
  { key: 'd90', label: 'Over 90 days', max: Infinity },
] as const;
export type AgeKey = (typeof AGE_BUCKETS)[number]['key'];
export type Ageing = Record<AgeKey, number> & { total: number; oldestDays: number | null };

const ageOf = (at: number, now: number) => Math.max(0, Math.floor((now - at) / DAY));

export function ageing(open: OpenInvoice[], now = Date.now()): Ageing {
  const out: Ageing = { d0: 0, d31: 0, d61: 0, d90: 0, total: 0, oldestDays: null };
  for (const i of open) {
    const days = ageOf(i.at, now);
    const b = AGE_BUCKETS.find((x) => days <= x.max)!;
    out[b.key] += i.unpaid;
    out.total += i.unpaid;
    out.oldestDays = out.oldestDays === null ? days : Math.max(out.oldestDays, days);
  }
  return out;
}

/** Soft warning before taking more work from a client (never a block). */
export const RISK_RULES = { highAmount: 100000, highDays: 90, watchAmount: 50000, watchDays: 60 };
export type Risk = 'none' | 'watch' | 'high';
export function riskOf(balance: number, oldestDays: number | null): Risk {
  if (balance <= 0) return 'none';
  const d = oldestDays ?? 0;
  if (balance >= RISK_RULES.highAmount || d >= RISK_RULES.highDays) return 'high';
  if (balance >= RISK_RULES.watchAmount || d >= RISK_RULES.watchDays) return 'watch';
  return 'none';
}

/* ------------------------------------------------------------------ statements */

/** "YYYY-MM" of a moment in Bangladesh time. */
export const bdMonthOf = (t: number) => new Date(t + BD).toISOString().slice(0, 7);
/** [start, end) of a Bangladesh calendar month as UTC instants. */
export function bdMonthRange(month: string): { start: number; end: number } {
  const [y, m] = month.split('-').map(Number);
  return { start: Date.UTC(y, m - 1, 1) - BD, end: Date.UTC(y, m, 1) - BD };
}

export type StatementLine = { at: number; kind: 'Invoice' | 'Payment' | 'Adjustment'; ref: string; debit: number; credit: number; balance: number };
export type Statement = { month: string; opening: number; lines: StatementLine[]; invoiced: number; paid: number; closing: number };

/**
 * A month's statement: balance brought forward, every invoice and payment in the month with the
 * running balance, and the closing balance. The balance is anchored on the account's stored balance
 * now and walked back through later rows, so it always agrees with what the console shows.
 */
export function monthStatement(rows: LedgerRow[], balanceNow: number, month: string): Statement {
  const { start, end } = bdMonthRange(month);
  const sign = (r: LedgerRow) => (r.transactionType === 'INVOICE' ? r.netAmount : -r.netAmount);
  const after = rows.filter((r) => rowTime(r) >= end).reduce((s, r) => s + sign(r), 0);
  const closing = balanceNow - after;
  const inMonth = rows.filter((r) => rowTime(r) >= start && rowTime(r) < end).sort((a, b) => rowTime(a) - rowTime(b) || a.id.localeCompare(b.id));
  const opening = closing - inMonth.reduce((s, r) => s + sign(r), 0);
  let bal = opening;
  const lines = inMonth.map((r) => {
    bal += sign(r);
    const kind: StatementLine['kind'] = r.transactionType === 'INVOICE' ? 'Invoice' : r.transactionType === 'PAYMENT' ? 'Payment' : 'Adjustment';
    return { at: rowTime(r), kind, ref: r.orderId || r.notes || '', debit: kind === 'Invoice' ? r.netAmount : 0, credit: kind === 'Invoice' ? 0 : r.netAmount, balance: bal };
  });
  return {
    month,
    opening,
    lines,
    invoiced: lines.reduce((s, l) => s + l.debit, 0),
    paid: lines.reduce((s, l) => s + l.credit, 0),
    closing,
  };
}

const tk = (n: number) => `৳${Math.round(n).toLocaleString('en-IN')}`;

/** The statement as a short Bengali WhatsApp message. */
export function statementText(name: string, ownerName: string, s: Statement, monthLabel: string): string {
  return [
    `শ্রদ্ধেয় ${ownerName} (${name}),`,
    `CNDL ল্যাব — ${monthLabel} মাসের হিসাব:`,
    `আগের বকেয়া: ${tk(s.opening)}`,
    `এই মাসের বিল: ${tk(s.invoiced)}`,
    `এই মাসে পরিশোধ: ${tk(s.paid)}`,
    `মোট বকেয়া: ${tk(s.closing)}`,
    'বিকাশ/মার্চেন্ট: 01743-167963। ধন্যবাদ!',
  ].join('\n');
}
