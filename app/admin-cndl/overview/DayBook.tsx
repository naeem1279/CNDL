'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bdToday, dayLabel, delta, shiftDay } from '@/lib/daybook';
import { CATEGORY_LABEL } from '@/lib/orders-filters';
import { IconButton, Panel, Skeleton } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import { apiError, formatBDT, formatDay } from '../_lib/utils';

type Day = {
  date: string;
  money: { collected: number; collections: number; unverified: number; expenses: number; expenseCount: number; netCash: number; invoiced: number; invoices: number; discount: number; duesChange: number };
  cases: { received: number; dispatched: number; delivered: number; cancelled: number; stageMoves: number };
  categories: { key: string; received: number; invoiced: number }[];
};
type Book = { today: string; day: Day; previous: Day; stageHistorySince: string | null };

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

/** One figure with its change against the day before. `goodWhenUp` decides the colour of the change. */
function Figure({ label, value, before, money = false, goodWhenUp = true, sub }: { label: string; value: number; before: number; money?: boolean; goodWhenUp?: boolean; sub?: string }) {
  const d = delta(value, before);
  const fmt = (n: number) => (money ? formatBDT(n) : String(n));
  const tone = d.diff === 0 ? 'text-zinc-500' : (d.diff > 0) === goodWhenUp ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 p-3">
      <p className="truncate text-meta text-zinc-500">{label}</p>
      <p className="truncate text-title font-semibold tabular-nums text-zinc-900">{fmt(value)}</p>
      <p className={cx('truncate text-meta tabular-nums', tone)} title={`Day before: ${fmt(before)}`}>
        {d.diff === 0 ? 'No change' : `${d.diff > 0 ? '▲' : '▼'} ${fmt(Math.abs(d.diff))}${d.pct !== null ? ` · ${Math.abs(d.pct)}%` : ''}`}
      </p>
      {sub && <p className="text-meta text-zinc-500 [overflow-wrap:anywhere]">{sub}</p>}
    </div>
  );
}

/**
 * The day book: money in and out, invoices, the change in what clients owe and the cases that came in
 * or left the lab on one Bangladesh day, each against the day before. The chosen day is kept in ?day=.
 */
export function DayBook() {
  const { adminFetch } = useAdmin();
  const [date, setDate] = useState<string>(() => {
    if (typeof window === 'undefined') return bdToday();
    const d = new URLSearchParams(window.location.search).get('day');
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= bdToday() ? d : bdToday();
  });
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/erp/daybook?date=${date}`);
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) return void setError(apiError(body, 'Could not load the day book'));
        setError(null);
        setBook(body);
      } catch {
        if (live) setError('Network error — could not load the day book');
      } finally {
        if (live) setLoading(false);
      }
    })();
    const url = new URL(window.location.href);
    if (date === bdToday()) url.searchParams.delete('day');
    else url.searchParams.set('day', date);
    window.history.replaceState(null, '', url.pathname + url.search);
    return () => {
      live = false;
    };
  }, [adminFetch, date]);

  const today = book?.today ?? bdToday();
  const d = book?.day;
  const p = book?.previous;
  const historyFrom = book?.stageHistorySince ? new Date(new Date(book.stageHistorySince).getTime() + 6 * 3600000).toISOString().slice(0, 10) : null;
  const noHistory = !historyFrom || date < historyFrom;

  return (
    <Panel
      title="Day book"
      description={`${dayLabel(date, today)} · ${formatDay(`${date}T06:00:00Z`)} · ▲▼ = change against the day before (Bangladesh time)`}
      action={
        <div className="flex items-center gap-1">
          <IconButton label="Previous day" icon={ChevronLeft} onClick={() => setDate((x) => shiftDay(x, -1))} />
          <input
            type="date"
            aria-label="Day"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-table text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <IconButton label="Next day" icon={ChevronRight} onClick={() => setDate((x) => (x < today ? shiftDay(x, 1) : x))} disabled={date >= today} />
        </div>
      }
      bodyClassName="space-y-4 py-4"
    >
      {error ? (
        <p className="text-body text-rose-700">{error}</p>
      ) : !d || !p ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className={cx('space-y-4', loading && 'opacity-60')}>
          <section aria-label="Money">
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">Money</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
              <Figure label="Collected" value={d.money.collected} before={p.money.collected} money sub={`${d.money.collections} ${d.money.collections === 1 ? 'collection' : 'collections'}${d.money.unverified ? ` · ${formatBDT(d.money.unverified)} unverified` : ''}`} />
              <Figure label="Expenses" value={d.money.expenses} before={p.money.expenses} money goodWhenUp={false} sub={`${d.money.expenseCount} ${d.money.expenseCount === 1 ? 'entry' : 'entries'}`} />
              <Figure label="Net cash" value={d.money.netCash} before={p.money.netCash} money sub="Collected − expenses" />
              <Figure label="Invoiced" value={d.money.invoiced} before={p.money.invoiced} money sub={`${d.money.invoices} ${d.money.invoices === 1 ? 'invoice' : 'invoices'}`} />
              <Figure label="Change in dues" value={d.money.duesChange} before={p.money.duesChange} money goodWhenUp={false} sub="Invoiced − collected" />
            </div>
          </section>

          <section aria-label="Cases">
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">Cases</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Figure label="Received" value={d.cases.received} before={p.cases.received} />
              <Figure label="Dispatched" value={d.cases.dispatched} before={p.cases.dispatched} />
              <Figure label="Delivered" value={d.cases.delivered} before={p.cases.delivered} />
              <Figure label="Cancelled" value={d.cases.cancelled} before={p.cases.cancelled} goodWhenUp={false} />
            </div>
            {noHistory && (
              <p className="mt-2 text-meta text-amber-800">
                Dispatched, delivered and cancelled are counted from the stage history, which {historyFrom ? `starts on ${formatDay(`${historyFrom}T06:00:00Z`)}` : 'starts with the next stage change'}. Earlier days show 0.
              </p>
            )}
          </section>

          <section aria-label="By type of work">
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">By type of work</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-table">
                <thead>
                  <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                    <th scope="col" className="py-2 pr-3 font-medium">Type of work</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Cases received</th>
                    <th scope="col" className="py-2 pl-3 text-right font-medium">Invoiced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {d.categories.map((c) => {
                    const before = p.categories.find((x) => x.key === c.key);
                    return (
                      <tr key={c.key}>
                        <td className="py-2 pr-3 text-zinc-900">{CATEGORY_LABEL[c.key] ?? c.key}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
                          {c.received}
                          <span className="ml-1.5 text-meta text-zinc-400">({before?.received ?? 0})</span>
                        </td>
                        <td className="py-2 pl-3 text-right tabular-nums text-zinc-700">
                          {formatBDT(c.invoiced)}
                          <span className="ml-1.5 text-meta text-zinc-400">({formatBDT(before?.invoiced ?? 0)})</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-meta text-zinc-500">The day before in brackets. Type of work is read from each case&apos;s work description.</p>
          </section>
        </div>
      )}
    </Panel>
  );
}
