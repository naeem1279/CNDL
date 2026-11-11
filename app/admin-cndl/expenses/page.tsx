'use client';
import { useEffect, useMemo, useState } from 'react';
import { History, MoreHorizontal, Package, Pencil, Plus, Receipt, Search, Trash2, Truck, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import { SidePanel } from '../_components/SidePanel';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, MenuButton, Panel, Select } from '../_components/ui';
import { EXPENSES_PER_PAGE, EXPENSE_CATEGORY_META } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAgent, ErpExpense, ErpUser } from '../_lib/types';
import { apiError, bdMonthKey, formatBDT, formatDate, formatDay, monthLabel } from '../_lib/utils';
import { ExpenseDialog } from './ExpenseDialog';

type AuditEntry = { id: string; expenseId: string; action: string; originalData: string; performedBy: string; createdAt: string };
const catLabel = (k: string) => EXPENSE_CATEGORY_META[k]?.label ?? k;

export default function ExpensesPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const canAdd = me.role === 'SUPERADMIN' || me.role === 'ACCOUNTS';
  const canChange = me.role === 'SUPERADMIN';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [users, setUsers] = useState<ErpUser[]>([]);

  const thisMonth = bdMonthKey(new Date().toISOString());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [month, setMonth] = useState(thisMonth);
  const [page, setPage] = useState(1);
  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ErpExpense | null | undefined>(undefined);
  const [history, setHistory] = useState<AuditEntry[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['expenses', 'accounts', 'users'], me.role);
      if (!r) return;
      if (r.expenses) setExpenses(r.expenses);
      if (r.agents) setAgents(r.agents);
      if (r.users) setUsers(r.users);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overview's "Log an expense" links here with ?new=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    if (canAdd) setDialog(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [query, category, month]);

  /* --------------------------------------------------------- derived */

  const monthOf = (x: ErpExpense) => bdMonthKey(x.expenseDate);
  const months = useMemo(() => {
    const s = new Set(expenses.map(monthOf).filter(Boolean));
    s.add(thisMonth);
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [expenses, thisMonth]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((x) => {
      if (month !== 'ALL' && monthOf(x) !== month) return false;
      if (category !== 'ALL' && x.category !== category) return false;
      if (q && ![x.title, x.notes, x.voucherNo].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [expenses, query, category, month]);
  const filteredTotal = filtered.reduce((s, x) => s + x.amount, 0);
  const pages = Math.max(1, Math.ceil(filtered.length / EXPENSES_PER_PAGE));
  const curPage = Math.min(page, pages);
  const pageRows = filtered.slice((curPage - 1) * EXPENSES_PER_PAGE, curPage * EXPENSES_PER_PAGE);

  const sumWhere = (pred: (x: ErpExpense) => boolean) => expenses.filter(pred).reduce((s, x) => s + x.amount, 0);
  const lastMonthKey = (() => {
    const [y, m] = thisMonth.split('-').map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  })();
  const inMonth = (x: ErpExpense) => monthOf(x) === thisMonth;
  const monthTotal = sumWhere(inMonth);
  const lastMonthTotal = sumWhere((x) => monthOf(x) === lastMonthKey);

  /** Category split for the month being viewed (or all time). */
  const breakdown = useMemo(() => {
    const scope = expenses.filter((x) => month === 'ALL' || monthOf(x) === month);
    const total = scope.reduce((s, x) => s + x.amount, 0);
    return {
      total,
      rows: Object.keys(EXPENSE_CATEGORY_META)
        .map((k) => ({ key: k, amount: scope.filter((x) => x.category === k).reduce((s, x) => s + x.amount, 0) }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [expenses, month]);

  const kpis: Kpi[] = [
    { label: 'Spent this month', value: formatBDT(monthTotal), icon: Receipt, sub: `${formatBDT(lastMonthTotal)} last month` },
    { label: 'Raw material', value: formatBDT(sumWhere((x) => inMonth(x) && x.category === 'RAW_MATERIAL')), icon: Package, sub: 'This month' },
    { label: 'Logistics', value: formatBDT(sumWhere((x) => inMonth(x) && x.category === 'LOGISTICS')), icon: Truck, sub: 'This month' },
    {
      label: 'Utility & upkeep',
      value: formatBDT(sumWhere((x) => inMonth(x) && (x.category === 'LAB_UTILITY' || x.category === 'MAINTENANCE'))),
      icon: Wrench,
      sub: 'This month',
    },
  ];

  const names = useMemo(() => {
    const m: Record<string, string> = { master: 'Administrator' };
    for (const a of agents) m[a.id] = a.name;
    for (const u of users) m[u.id] = u.name;
    return m;
  }, [agents, users]);

  /* ---------------------------------------------------------- writes */

  const remove = async (x: ErpExpense) => {
    if (!(await askConfirm(`Delete "${x.title}" (${formatBDT(x.amount)})? A copy is kept in change history.`))) return;
    try {
      const res = await adminFetch(`/api/admin/erp/expenses?id=${encodeURIComponent(x.id)}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the expense'));
      setExpenses((prev) => prev.filter((e) => e.id !== x.id));
      setHistory(null);
      toast.success('Expense deleted · a copy is in change history');
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    if (history) return;
    try {
      const res = await adminFetch('/api/admin/erp/expenses/audit');
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not load change history'));
      setHistory(Array.isArray(body.entries) ? body.entries : []);
    } catch {
      toast.error('Network error — change history not loaded');
    }
  };

  /* ------------------------------------------------------------ bits */

  const rowMenu = (x: ErpExpense) =>
    canChange ? (
      <MenuButton
        label={`Actions for ${x.title}`}
        icon={MoreHorizontal}
        iconOnly
        variant="ghost"
        items={[
          { label: 'Edit', icon: Pencil, onSelect: () => setDialog(x) },
          { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(x) },
        ]}
      />
    ) : null;

  const filtersOn = query.trim() !== '' || category !== 'ALL' || month !== thisMonth;

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="expenses"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <>
          {canChange && (
            <Button icon={History} onClick={() => void openHistory()} title="Every edit and delete, with the version before it">
              <span className="hidden sm:inline">Change history</span>
              <span className="sr-only sm:hidden">Change history</span>
            </Button>
          )}
          {canAdd && (
            <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
              <span className="hidden sm:inline">Add expense</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="min-w-0 rounded-lg border border-zinc-200 bg-white xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
            <div className="relative w-full sm:w-60">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description or voucher" aria-label="Search expenses" className="pl-9" />
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <div className="min-w-0 sm:w-44">
                <Select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                  <option value="ALL">All months</option>
                </Select>
              </div>
              <div className="min-w-0 sm:w-44">
                <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="ALL">All categories</option>
                  {Object.entries(EXPENSE_CATEGORY_META).map(([k, m]) => (
                    <option key={k} value={k}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {filtered.length > 0 && (
              <span className="w-full text-meta text-zinc-500 tabular-nums sm:ml-auto sm:w-auto">
                {filtered.length} · <span className="font-semibold text-zinc-900">{formatBDT(filteredTotal)}</span>
              </span>
            )}
          </div>

          {pageRows.length === 0 ? (
            <EmptyState icon={Receipt} title={expenses.length ? 'No expenses match' : 'No expenses yet'}>
              {expenses.length && filtersOn ? (
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:underline"
                  onClick={() => {
                    setQuery('');
                    setCategory('ALL');
                    setMonth('ALL');
                  }}
                >
                  Show all expenses
                </button>
              ) : (
                'Spending on materials, courier, bills and repairs appears here.'
              )}
            </EmptyState>
          ) : (
            <>
              <table className="hidden w-full table-fixed text-left md:table">
                <thead>
                  <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                    <th className="w-[110px] px-4 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">What for</th>
                    <th className="hidden w-[130px] px-3 py-2.5 font-medium lg:table-cell">Category</th>
                    <th className="w-[120px] px-3 py-2.5 text-right font-medium">Amount</th>
                    {canChange && <th className="w-12 px-2 py-2.5" aria-label="Actions" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-table">
                  {pageRows.map((x) => (
                    <tr key={x.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-2.5 text-zinc-700 tabular-nums">{formatDay(x.expenseDate)}</td>
                      <td className="px-3 py-2.5">
                        <p className="truncate font-medium text-zinc-900" title={x.title}>
                          {x.title}
                        </p>
                        <p className="truncate text-meta text-zinc-500">
                          <span className="lg:hidden">{catLabel(x.category)}</span>
                          {[x.voucherNo && `Voucher ${x.voucherNo}`, x.notes].filter(Boolean).length > 0 && <span className="lg:hidden"> · </span>}
                          {[x.voucherNo && `Voucher ${x.voucherNo}`, x.notes].filter(Boolean).join(' · ')}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2.5 lg:table-cell">
                        <Badge>{catLabel(x.category)}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-zinc-900 tabular-nums">{formatBDT(x.amount)}</td>
                      {canChange && <td className="px-2 py-1.5 text-right">{rowMenu(x)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-zinc-100 md:hidden">
                {pageRows.map((x) => (
                  <li key={x.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{x.title}</p>
                      <p className="text-meta text-zinc-500">
                        {formatDay(x.expenseDate)} · {catLabel(x.category)}
                        {x.voucherNo ? ` · ${x.voucherNo}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-body font-medium text-zinc-900 tabular-nums">{formatBDT(x.amount)}</span>
                    {canChange && <div className="-my-1 shrink-0">{rowMenu(x)}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="px-4 pb-4">
            <Pager page={curPage} total={filtered.length} perPage={EXPENSES_PER_PAGE} onPage={setPage} noun={filtered.length === 1 ? 'expense' : 'expenses'} />
          </div>
        </div>

        <Panel title="By category" description={month === 'ALL' ? 'All months' : monthLabel(month)}>
          {breakdown.total === 0 ? (
            <p className="py-2 text-table text-zinc-400">Nothing spent{month === 'ALL' ? '' : ` in ${monthLabel(month)}`}.</p>
          ) : (
            <ul className="space-y-3 py-1">
              {breakdown.rows.map((r) => {
                const pct = breakdown.total ? Math.round((r.amount / breakdown.total) * 100) : 0;
                return (
                  <li key={r.key}>
                    <button
                      type="button"
                      onClick={() => setCategory(category === r.key ? 'ALL' : r.key)}
                      aria-pressed={category === r.key}
                      className="block w-full text-left"
                    >
                      <span className="flex items-baseline justify-between gap-2 text-table">
                        <span className={category === r.key ? 'font-medium text-zinc-900' : 'text-zinc-700'}>{catLabel(r.key)}</span>
                        <span className="tabular-nums text-zinc-900">
                          {formatBDT(r.amount)} <span className="text-meta text-zinc-400">{pct}%</span>
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <span className={`block h-full rounded-full ${category === r.key ? 'bg-brand-600' : 'bg-brand-300'}`} style={{ width: `${pct}%` }} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 border-t border-zinc-100 pt-3 text-meta text-zinc-500">Tap a category to filter the list.</p>
        </Panel>
      </div>

      {dialog !== undefined && (
        <ExpenseDialog
          editing={dialog}
          onClose={() => setDialog(undefined)}
          onSaved={() => {
            setHistory(null);
            void fetchData(true);
          }}
        />
      )}

      {historyOpen && (
        <SidePanel title="Change history" subtitle="Last 50 edits and deletes, with the version before each change" onClose={() => setHistoryOpen(false)}>
          {history === null ? (
            <p className="text-table text-zinc-400">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-table text-zinc-400">No expense has been edited or deleted yet.</p>
          ) : (
            <ol className="divide-y divide-zinc-100">
              {history.map((h) => {
                let before: Partial<ErpExpense> | null = null;
                try {
                  before = JSON.parse(h.originalData);
                } catch {
                  before = null;
                }
                const now = expenses.find((x) => x.id === h.expenseId);
                return (
                  <li key={h.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={h.action === 'DELETE' ? 'danger' : 'neutral'}>{h.action === 'DELETE' ? 'Deleted' : 'Edited'}</Badge>
                      <span className="text-meta text-zinc-400">{formatDate(h.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-meta text-zinc-500">By {names[h.performedBy] || h.performedBy}</p>
                    {before ? (
                      <dl className="mt-2 grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md bg-zinc-50 px-3 py-2 text-table">
                        <dt className="text-zinc-500">Before</dt>
                        <dd className="text-zinc-800 [overflow-wrap:anywhere]">{before.title}</dd>
                        <dt className="text-zinc-500">Amount</dt>
                        <dd className="text-zinc-800 tabular-nums">
                          {formatBDT(before.amount ?? 0)}
                          {now && now.amount !== before.amount && <span className="text-zinc-500"> → now {formatBDT(now.amount)}</span>}
                        </dd>
                        <dt className="text-zinc-500">Category</dt>
                        <dd className="text-zinc-800">{catLabel(before.category || '')}</dd>
                        <dt className="text-zinc-500">Date</dt>
                        <dd className="text-zinc-800">{before.expenseDate ? formatDay(before.expenseDate) : '—'}</dd>
                        {before.voucherNo && (
                          <>
                            <dt className="text-zinc-500">Voucher</dt>
                            <dd className="text-zinc-800">{before.voucherNo}</dd>
                          </>
                        )}
                      </dl>
                    ) : (
                      <pre className="mt-2 whitespace-pre-wrap break-all rounded-md bg-zinc-50 p-2 text-meta text-zinc-600">{h.originalData}</pre>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </SidePanel>
      )}
    </SectionFrame>
  );
}
