'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Coins, MoreHorizontal, Pencil, PieChart, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Button, EmptyState, MenuButton, Panel, Select } from '../_components/ui';
import { TOTAL_SHARES } from '../_lib/constants';
import { formatShares, roundShares, sharesLabel, sumShares, unallocatedShares } from '@/lib/shares';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpDividend, ErpExpense, ErpLedgerEntry, ErpShareholder } from '../_lib/types';
import { apiError, bdMonthKey, formatBDT, formatDay, monthLabel } from '../_lib/utils';
import { PayoutRun } from './PayoutRun';
import { ShareholderDialog } from './ShareholderDialog';

/** Brand shades for ownership segments; unallocated shares are zinc. */
const SEGMENT = ['bg-brand-700', 'bg-brand-400', 'bg-brand-900', 'bg-brand-200', 'bg-brand-600', 'bg-brand-300', 'bg-brand-800', 'bg-brand-500'];
const HISTORY_LIMIT = 30;

export default function ShareholdersPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [shareholders, setShareholders] = useState<ErpShareholder[]>([]);
  const [dividends, setDividends] = useState<ErpDividend[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);

  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ErpShareholder | null | undefined>(undefined);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [historyMonth, setHistoryMonth] = useState('all');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['shareholders', 'dividends', 'ledger', 'expenses'], me.role);
      if (!r) return;
      if (r.shareholders) setShareholders(r.shareholders);
      if (r.dividends) setDividends(r.dividends);
      if (r.ledger) setLedger(r.ledger);
      if (r.expenses) setExpenses(r.expenses);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load shareholders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overview's "New" menu links here with ?new=1 to open the add form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    setDialog(null);
  }, []);

  /* --------------------------------------------------------- derived */

  const allocated = sumShares(shareholders.map((s) => s.sharesCount));
  const unallocated = unallocatedShares(allocated);
  const sorted = useMemo(() => [...shareholders].sort((a, b) => b.sharesCount - a.sharesCount || a.name.localeCompare(b.name)), [shareholders]);
  const colour = (id: string) => SEGMENT[Math.max(0, sorted.findIndex((s) => s.id === id)) % SEGMENT.length];

  const thisMonth = bdMonthKey(new Date().toISOString());
  const { paidByName, paidTotal, paidThisMonth, lastMonth } = useMemo(() => {
    const byName: Record<string, number> = {};
    let total = 0;
    let month = 0;
    let last = '';
    for (const d of dividends) {
      byName[d.shareholderName] = (byName[d.shareholderName] || 0) + d.amountPaid;
      total += d.amountPaid;
      if (d.payoutMonth === thisMonth) month += d.amountPaid;
      if (/^\d{4}-\d{2}$/.test(d.payoutMonth) && d.payoutMonth > last) last = d.payoutMonth;
    }
    return { paidByName: byName, paidTotal: total, paidThisMonth: month, lastMonth: last };
  }, [dividends, thisMonth]);

  const historyMonths = useMemo(
    () => [...new Set(dividends.map((d) => d.payoutMonth))].sort((a, b) => b.localeCompare(a)),
    [dividends]
  );
  const historyRows = historyMonth === 'all' ? dividends : dividends.filter((d) => d.payoutMonth === historyMonth);
  const historyShown = showAllHistory ? historyRows : historyRows.slice(0, HISTORY_LIMIT);
  const historyTotal = historyRows.reduce((sum, d) => sum + d.amountPaid, 0);

  const kpis: Kpi[] = [
    {
      label: 'Shares allocated',
      value: `${formatShares(allocated)} / ${TOTAL_SHARES}`,
      icon: PieChart,
      sub: unallocated > 0 ? `${formatShares(unallocated)} unallocated` : 'Fully allocated',
    },
    { label: 'Shareholders', value: String(shareholders.length), icon: Coins, sub: sorted[0] ? `Largest: ${formatShares(sorted[0].sharesCount)}%` : 'None yet' },
    { label: 'Paid this month', value: formatBDT(paidThisMonth), icon: CalendarCheck, sub: monthLabel(thisMonth) },
    {
      label: 'Paid all time',
      value: formatBDT(paidTotal),
      icon: Wallet,
      sub: lastMonth ? `Last run: ${monthLabel(lastMonth, true)}` : 'No payouts yet',
    },
  ];

  /* ---------------------------------------------------------- writes */

  const remove = async (s: ErpShareholder) => {
    const ok = await askConfirm(
      `Remove ${s.name} and their ${sharesLabel(s.sharesCount)} from the register? Their past payouts stay in the history.`
    );
    if (!ok) return;
    setRemovingId(s.id);
    try {
      const res = await adminFetch(`/api/admin/erp/shareholders/${s.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(apiError(body, 'Could not remove the shareholder'));
        return;
      }
      toast.success(`${s.name} removed`);
      await fetchData(true);
    } catch {
      toast.error('Network error — nothing was removed');
    } finally {
      setRemovingId(null);
    }
  };

  /* ------------------------------------------------------------ render */

  return (
    <SectionFrame
      tab="shareholders"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDialog(null)}
          disabled={unallocated === 0}
          title={unallocated === 0 ? `All ${TOTAL_SHARES} shares are allocated` : undefined}
        >
          <span className="hidden sm:inline">Add shareholder</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      <div className="space-y-4 lg:space-y-6">
        {/* ------------------------------------------------ ownership + grid */}
        <Panel
          title="Ownership"
          description={`The lab is divided into ${TOTAL_SHARES} shares; 1 share is 1%.`}
          bodyClassName="px-4 py-4 sm:px-5"
        >
          <div
            className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white"
            role="img"
            aria-label={`${sorted.map((s) => `${s.name} ${formatShares(s.sharesCount)}%`).join(', ')}${unallocated ? `, unallocated ${formatShares(unallocated)}%` : ''}`}
          >
            {sorted.map((s) => (
              <div key={s.id} title={`${s.name}: ${formatShares(s.sharesCount)}%`} style={{ width: `${s.sharesCount}%` }} className={`h-full ${colour(s.id)}`} />
            ))}
            {unallocated > 0 && <div title={`Unallocated: ${formatShares(unallocated)}%`} style={{ width: `${unallocated}%` }} className="h-full bg-zinc-200" />}
          </div>

          {sorted.length === 0 ? (
            <EmptyState icon={PieChart} title="No shareholders yet">
              Add the people who own the lab to allocate its {TOTAL_SHARES} shares.
            </EmptyState>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((s) => (
                <li key={s.id} className="min-w-0 rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${colour(s.id)}`} />
                      <div className="min-w-0">
                        <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{s.name}</p>
                        <p className="text-meta text-zinc-500">{s.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <MenuButton
                      label={`Actions for ${s.name}`}
                      icon={MoreHorizontal}
                      iconOnly
                      variant="ghost"
                      items={[
                        { label: 'Edit', icon: Pencil, onSelect: () => setDialog(s) },
                        ...(removingId === s.id ? [] : [{ label: 'Remove', icon: Trash2, danger: true, onSelect: () => void remove(s) }]),
                      ]}
                    />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3">
                    <div>
                      <dt className="text-meta text-zinc-500">Shares</dt>
                      <dd className="text-title font-semibold text-zinc-900 tabular-nums">
                        {formatShares(s.sharesCount)} <span className="text-table font-normal text-zinc-500">· {formatShares(s.sharesCount)}%</span>
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-meta text-zinc-500">Paid all time</dt>
                      <dd className="truncate text-title font-semibold text-zinc-900 tabular-nums">{formatBDT(paidByName[s.name] || 0)}</dd>
                    </div>
                  </dl>
                  {s.paymentDetails && (
                    <p className="mt-2 truncate text-meta text-zinc-500" title={s.paymentDetails}>
                      Pays to: {s.paymentDetails}
                    </p>
                  )}
                </li>
              ))}
              {unallocated > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="flex h-full min-h-[132px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 p-4 text-center text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"
                  >
                    <Plus size={18} aria-hidden="true" />
                    <span className="text-body font-medium">Add shareholder</span>
                    <span className="text-meta tabular-nums">{formatShares(unallocated)} shares unallocated</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </Panel>

        {/* ---------------------------------------------------- payout run */}
        <PayoutRun shareholders={sorted} dividends={dividends} ledger={ledger} expenses={expenses} onRecorded={() => fetchData(true)} />

        {/* ------------------------------------------------------- history */}
        <Panel
          title="Payout history"
          description={
            historyRows.length
              ? `${historyRows.length} payout${historyRows.length === 1 ? '' : 's'} · ${formatBDT(historyTotal)}`
              : undefined
          }
          action={
            historyMonths.length > 1 ? (
              <Select aria-label="Filter by month" value={historyMonth} onChange={(e) => setHistoryMonth(e.target.value)} className="h-8 w-40 text-table">
                <option value="all">All months</option>
                {historyMonths.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </Select>
            ) : undefined
          }
          bodyClassName="p-0"
        >
          {historyRows.length === 0 ? (
            <EmptyState icon={Wallet} title="No payouts yet">Payouts recorded above appear here.</EmptyState>
          ) : (
            <>
              <table className="hidden w-full table-fixed text-left md:table">
                <thead>
                  <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                    <th className="px-5 py-2.5 font-medium">Shareholder</th>
                    <th className="w-[130px] px-3 py-2.5 font-medium">Month</th>
                    <th className="w-[80px] px-3 py-2.5 text-right font-medium">Shares</th>
                    <th className="w-[120px] px-3 py-2.5 text-right font-medium">Amount</th>
                    <th className="hidden w-[130px] px-3 py-2.5 font-medium xl:table-cell">Paid by</th>
                    <th className="w-[130px] px-5 py-2.5 font-medium">Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-table">
                  {historyShown.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50">
                      <td className="truncate px-5 py-2.5 font-medium text-zinc-900" title={d.notes || undefined}>
                        {d.shareholderName}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-700">{monthLabel(d.payoutMonth)}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-700 tabular-nums">{formatShares(d.sharesCount)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-zinc-900 tabular-nums">{formatBDT(d.amountPaid)}</td>
                      <td className="hidden truncate px-3 py-2.5 text-zinc-600 xl:table-cell">{d.paymentMethod || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-zinc-500 tabular-nums">{formatDay(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-zinc-100 md:hidden">
                {historyShown.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{d.shareholderName}</p>
                      <p className="text-meta text-zinc-500">
                        {monthLabel(d.payoutMonth, true)} · {sharesLabel(d.sharesCount)}
                        {d.paymentMethod ? ` · ${d.paymentMethod}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-body font-medium text-zinc-900 tabular-nums">{formatBDT(d.amountPaid)}</span>
                  </li>
                ))}
              </ul>
              {historyRows.length > HISTORY_LIMIT && (
                <div className="border-t border-zinc-100 px-4 py-2 sm:px-5">
                  <Button size="sm" variant="ghost" onClick={() => setShowAllHistory((v) => !v)}>
                    {showAllHistory ? 'Show fewer' : `Show all ${historyRows.length}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>

      {dialog !== undefined && (
        <ShareholderDialog
          editing={dialog}
          available={dialog ? roundShares(unallocated + dialog.sharesCount) : unallocated}
          onClose={() => setDialog(undefined)}
          onSaved={() => fetchData(true)}
        />
      )}
    </SectionFrame>
  );
}
