'use client';
import { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, EmptyState, Field, Input, Panel, Select } from '../_components/ui';
import { TOTAL_SHARES } from '../_lib/constants';
import { formatShares, shareFraction, sharesLabel, sumShares, toHundredths, unallocatedShares } from '@/lib/shares';
import { useAdmin } from '../_lib/session';
import type { ErpDividend, ErpExpense, ErpLedgerEntry, ErpShareholder } from '../_lib/types';
import { apiError, bdMonthKey, formatBDT, monthLabel } from '../_lib/utils';

const METHODS = ['Bank Transfer', 'bKash', 'Cash', 'Cheque'];
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

type RowState = { include: boolean; amount: string | null };

/**
 * One payout run: pick the month, check the distributable profit (pre-filled
 * from that month's collections minus daily expenses), and record one payout
 * per selected shareholder at their share of it. Shareholders already paid for
 * that month start unticked so a run is never recorded twice by accident.
 */
export function PayoutRun({
  shareholders,
  dividends,
  ledger,
  expenses,
  onRecorded,
}: {
  shareholders: ErpShareholder[];
  dividends: ErpDividend[];
  ledger: ErpLedgerEntry[];
  expenses: ErpExpense[];
  onRecorded: () => Promise<void> | void;
}) {
  const { adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const thisMonth = bdMonthKey(new Date().toISOString());
  const [month, setMonth] = useState(thisMonth);
  /** null = follow the calculated figure; a string = typed by the operator. */
  const [profitText, setProfitText] = useState<string | null>(null);
  const [method, setMethod] = useState(METHODS[0]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [recording, setRecording] = useState(false);

  const { collected, spent } = useMemo(() => {
    let c = 0;
    for (const e of ledger) {
      if (e.transactionType === 'PAYMENT' && bdMonthKey(e.paymentDate || e.createdAt) === month) c += e.netAmount || 0;
    }
    let s = 0;
    for (const x of expenses) if (bdMonthKey(x.expenseDate) === month) s += x.amount || 0;
    return { collected: c, spent: s };
  }, [ledger, expenses, month]);
  const calculated = Math.round(collected - spent);
  const profit = profitText === null ? Math.max(0, calculated) : Math.max(0, Math.round(parseFloat(profitText) || 0));

  const paidThisMonth = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of dividends) if (d.payoutMonth === month) m[d.shareholderName] = (m[d.shareholderName] || 0) + d.amountPaid;
    return m;
  }, [dividends, month]);

  // A new month or profit figure starts the selection over.
  useEffect(() => setRows({}), [month, profit]);

  const lines = shareholders.map((s) => {
    const due = Math.round(profit * shareFraction(s.sharesCount));
    const already = paidThisMonth[s.name] || 0;
    const st = rows[s.id];
    const include = st ? st.include : already === 0 && due > 0;
    const amountText = st?.amount ?? String(due);
    const amount = Math.round(parseFloat(amountText) || 0);
    return { s, due, already, include, amountText, amount };
  });
  const selected = lines.filter((l) => l.include && l.amount > 0);
  const total = selected.reduce((sum, l) => sum + l.amount, 0);
  const allocated = sumShares(shareholders.map((s) => s.sharesCount));
  const retained = profit - lines.reduce((sum, l) => sum + l.due, 0);

  const setRow = (id: string, patch: Partial<RowState>, current: { include: boolean; amountText: string }) =>
    setRows((r) => {
      const prev: RowState = r[id] ?? { include: current.include, amount: current.amountText };
      return { ...r, [id]: { ...prev, ...patch } };
    });

  const record = async () => {
    if (!selected.length) return;
    const ok = await askConfirm(
      `${selected.length} payout${selected.length === 1 ? '' : 's'} for ${monthLabel(month)}, ${formatBDT(total)} in total, paid by ${method}. Recorded payouts can't be edited or removed from this page.`,
      { title: 'Record payouts?', confirmLabel: 'Record payouts', tone: 'primary' }
    );
    if (!ok) return;
    setRecording(true);
    let done = 0;
    try {
      for (const l of selected) {
        const res = await adminFetch('/api/admin/erp/dividends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareholderName: l.s.name,
            sharesCount: l.s.sharesCount,
            amountPaid: l.amount,
            payoutMonth: month,
            paymentMethod: method,
            notes: `Profit distribution for ${monthLabel(month)}: ${formatBDT(profit)} distributable`,
          }),
        });
        if (res.status === 401) {
          handleAuthLoss();
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(`Recorded ${done} of ${selected.length}. ${l.s.name}: ${apiError(body, 'failed')}`);
          return;
        }
        done++;
      }
      toast.success(`${done} payout${done === 1 ? '' : 's'} recorded for ${monthLabel(month)}`);
    } catch {
      toast.error(`Network error after ${done} of ${selected.length} payouts. Check the history before retrying.`);
    } finally {
      setRecording(false);
      if (done > 0) {
        setRows({});
        await onRecorded();
      }
    }
  };

  return (
    <Panel
      title="Distribute profit"
      description={`Pays each shareholder their share of the month's profit (1 share = 1/${TOTAL_SHARES}).`}
      bodyClassName="p-0"
    >
      <div className="grid gap-4 border-b border-zinc-100 px-4 py-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_minmax(0,180px)] sm:px-5">
        <Field label="Month" htmlFor="payout-month">
          <Input
            id="payout-month"
            type="month"
            value={month}
            max={thisMonth}
            onChange={(e) => {
              setMonth(e.target.value || thisMonth);
              setProfitText(null);
            }}
          />
        </Field>
        <div className="space-y-1.5">
          <label htmlFor="payout-profit" className="block text-table font-medium text-zinc-700">
            Distributable profit
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body text-zinc-400">৳</span>
            <Input
              id="payout-profit"
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={profitText ?? String(Math.max(0, calculated))}
              onChange={(e) => setProfitText(e.target.value)}
              className="pl-7 tabular-nums"
            />
          </div>
          <p className="text-meta text-zinc-500 tabular-nums">
            Collected {formatBDT(collected)} − expenses {formatBDT(spent)} ={' '}
            <span className={calculated < 0 ? 'text-rose-700' : 'text-zinc-700'}>{formatBDT(calculated)}</span>
            {profitText !== null && Math.round(parseFloat(profitText) || 0) !== Math.max(0, calculated) && (
              <>
                {' · '}
                <button type="button" onClick={() => setProfitText(null)} className="font-medium text-brand-700 hover:underline">
                  Use calculated
                </button>
              </>
            )}
          </p>
        </div>
        <Field label="Paid by" htmlFor="payout-method">
          <Select id="payout-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex items-start gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-meta text-zinc-500 sm:px-5">
        <Info size={14} className="mt-px shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          {calculated < 0
            ? `Expenses exceeded collections by ${formatBDT(-calculated)} in ${monthLabel(month)}, so nothing is pre-filled. `
            : ''}
          Machinery purchases (CapEx) aren&apos;t deducted. Check the figure before recording.
        </span>
      </div>

      {shareholders.length === 0 ? (
        <EmptyState title="No shareholders yet">Add shareholders above before distributing profit.</EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-zinc-100">
            {lines.map((l) => {
              const id = `pay-${l.s.id}`;
              return (
                <li key={l.s.id} className={cx('flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:flex-nowrap sm:px-5', !l.include && 'bg-zinc-50/40')}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={l.include}
                    onChange={(e) => setRow(l.s.id, { include: e.target.checked }, l)}
                    className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-brand-600"
                  />
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{l.s.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-zinc-500 tabular-nums">
                      {sharesLabel(l.s.sharesCount)} · share {formatBDT(l.due)}
                      {l.already > 0 && (
                        <Badge tone="warning">
                          Already paid {formatBDT(l.already)} for {monthLabel(month, true)}
                        </Badge>
                      )}
                    </span>
                  </label>
                  <div className="relative ml-7 w-[calc(100%-1.75rem)] shrink-0 sm:ml-0 sm:w-36">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-table text-zinc-400">৳</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      aria-label={`Amount for ${l.s.name}`}
                      value={l.amountText}
                      disabled={!l.include}
                      onChange={(e) => setRow(l.s.id, { amount: e.target.value }, l)}
                      className="h-8 pl-6 text-right text-table tabular-nums"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="text-meta text-zinc-500 tabular-nums">
              <span className="text-body font-semibold text-zinc-900">{formatBDT(total)}</span> to {selected.length} of{' '}
              {shareholders.length}
              {toHundredths(allocated) < toHundredths(TOTAL_SHARES) && retained > 0 && (
                <> · {formatBDT(retained)} stays with the lab ({formatShares(unallocatedShares(allocated))} unallocated shares)</>
              )}
            </div>
            <Button variant="primary" onClick={record} disabled={recording || selected.length === 0} className="w-full sm:w-auto">
              {recording ? 'Recording…' : `Record ${selected.length || ''} payout${selected.length === 1 ? '' : 's'}`.replace('  ', ' ')}
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
