'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, ClipboardList, Cog, Package, Pencil, Plus, Receipt, Search, Trash2, Wallet, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { EMPTY_EXPENSE_FORM, EXPENSES_PER_PAGE, EXPENSE_CATEGORY_META } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAgent, ErpExpense, ErpUser } from '../_lib/types';
import { apiError, formatBDT, formatDate, formatDay, todayInput } from '../_lib/utils';

export default function ExpensesPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [erpAgents, setErpAgents] = useState<ErpAgent[]>([]);
  const [erpUsers, setErpUsers] = useState<ErpUser[]>([]);
  const [erpExpenses, setErpExpenses] = useState<ErpExpense[]>([]);
  const [expenseModal, setExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ErpExpense | null>(null);
  const [auditModal, setAuditModal] = useState(false);
  const [auditEntries, setAuditEntries] = useState<{
    id: string; expenseId: string; action: string; originalData: string; performedBy: string; createdAt: string;
  }[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [savingErp, setSavingErp] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [expPage, setExpPage] = useState(1);
  // Phase 2: Daily Expenses audit filters
  const [expSearch, setExpSearch] = useState('');
  const [expCat, setExpCat] = useState('ALL');
  const [expMonth, setExpMonth] = useState('ALL');

  /** Loads only this section's feeds: accounts, expenses, users. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'expenses', 'users'], me.role);
      if (!r) return;
      if (r.agents) setErpAgents(r.agents);
      if (r.expenses) setErpExpenses(r.expenses);
      if (r.users) setErpUsers(r.users);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ ...EMPTY_EXPENSE_FORM, expenseDate: todayInput() });
    setExpenseModal(true);
  };

  const openEditExpense = (x: ErpExpense) => {
    setEditingExpense(x);
    setExpenseForm({
      category: x.category,
      title: x.title,
      voucherNo: x.voucherNo || '',
      amount: String(x.amount),
      notes: x.notes || '',
      expenseDate: x.expenseDate ? x.expenseDate.slice(0, 10) : todayInput(),
    });
    setExpenseModal(true);
  };

  const deleteExpense = async (x: ErpExpense) => {
    if (!(await askConfirm(`Delete expense "${x.title}" (${formatBDT(x.amount)})? The pre-change state is preserved in the audit log.`))) return;
    setDeletingId(`expense-${x.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/expenses?id=${encodeURIComponent(x.id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted — old state kept in audit log');
        await fetchData(true);
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(apiError(b, 'Failed to delete expense'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const openAuditHistory = async () => {
    setAuditModal(true);
    setAuditLoading(true);
    try {
      const res = await adminFetch('/api/admin/erp/expenses/audit');
      const body = await res.json().catch(() => ({}));
      if (res.ok) setAuditEntries(Array.isArray(body.entries) ? body.entries : []);
      else toast.error(apiError(body, 'Failed to load audit log'));
    } catch {
      toast.error('Network error');
    } finally {
      setAuditLoading(false);
    }
  };

  /* ---------- ERP Phase 3: Expenses, CapEx & Dividends ---------- */
  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch(
        editingExpense ? `/api/admin/erp/expenses?id=${encodeURIComponent(editingExpense.id)}` : '/api/admin/erp/expenses',
        {
          method: editingExpense ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: expenseForm.category,
            title: expenseForm.title,
            amount,
            voucherNo: expenseForm.voucherNo.trim() || null,
            notes: expenseForm.notes.trim() || null,
            expenseDate: expenseForm.expenseDate
              ? new Date(expenseForm.expenseDate + 'T12:00:00').toISOString()
              : undefined,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingExpense ? 'Expense updated — old state audited' : 'Expense logged');
        setExpenseModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save expense'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const collectedByMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of erpAgents) m[a.id] = a.name;
    for (const u of erpUsers) m[u.id] = u.name;
    return m;
  }, [erpAgents, erpUsers]);

  const expenseStats = useMemo(() => {
    const ms = new Date();
    ms.setDate(1);
    ms.setHours(0, 0, 0, 0);
    const me2 = new Date(ms);
    me2.setMonth(me2.getMonth() + 1);
    const inMonth = (iso: string | null | undefined) => {
      if (!iso) return false;
      const d = new Date(iso);
      return !isNaN(d.getTime()) && d >= ms && d < me2;
    };
    const rows = erpExpenses.filter((x) => inMonth(x.expenseDate));
    return {
      inMonth,
      monthTotal: rows.reduce((sum, x) => sum + (x.amount || 0), 0),
      raw: rows.filter((x) => x.category === 'RAW_MATERIAL').reduce((s, x) => s + (x.amount || 0), 0),
      logistics: rows.filter((x) => x.category === 'LOGISTICS').reduce((s, x) => s + (x.amount || 0), 0),
      maintenance: rows.filter((x) => x.category === 'MAINTENANCE').reduce((s, x) => s + (x.amount || 0), 0),
    };
  }, [erpExpenses]);

  // Phase 2: Daily Expenses audit filters — text + category + month.
  const expenseMonthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const x of erpExpenses) {
      if (x.expenseDate) set.add(x.expenseDate.slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [erpExpenses]);

  const filteredExpenses = useMemo(() => {
    const sq = expSearch.trim().toLowerCase();
    return erpExpenses.filter((x) => {
      if (expCat !== 'ALL' && x.category !== expCat) return false;
      if (expMonth !== 'ALL' && (x.expenseDate || '').slice(0, 7) !== expMonth) return false;
      if (sq && ![x.title, x.notes, x.voucherNo].some((v) => (v || '').toLowerCase().includes(sq))) return false;
      return true;
    });
  }, [erpExpenses, expSearch, expCat, expMonth]);
  useEffect(() => {
    setExpPage(1);
  }, [expSearch, expCat, expMonth]);
  const pagedExpenses = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE));
    const p = Math.min(expPage, pages);
    return filteredExpenses.slice((p - 1) * EXPENSES_PER_PAGE, p * EXPENSES_PER_PAGE);
  }, [filteredExpenses, expPage]);

  // ERP Phase 3 metrics — render-facing aliases.
  const monthExpenseTotal = expenseStats.monthTotal;
  const monthRawMaterialSpend = expenseStats.raw;
  const monthLogisticsSpend = expenseStats.logistics;
  const monthMaintenanceSpend = expenseStats.maintenance;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overview quick actions link here with ?new=1 to open the create form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    openNewExpense();
  }, []);

  const kpiCards: Kpi[] = [
      { label: "This Month's Expenses", value: formatBDT(monthExpenseTotal), icon: Receipt, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
      { label: 'Raw Materials Spend', value: formatBDT(monthRawMaterialSpend), icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
      { label: 'Logistics / Fuel Spend', value: formatBDT(monthLogisticsSpend), icon: Wallet, bg: 'bg-amber-50', fg: 'text-amber-600' },
      { label: 'Maintenance', value: formatBDT(monthMaintenanceSpend), icon: Cog, bg: 'bg-slate-100', fg: 'text-slate-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="expenses"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
              /* ---------- DAILY EXPENSES ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Daily Expenses</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Track raw materials, logistics, utilities &amp; maintenance spending</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {me?.role === 'SUPERADMIN' && (
                      <button
                        onClick={openAuditHistory}
                        className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                      >
                        <ClipboardList size={15} /> Audit History
                      </button>
                    )}
                    <button
                      onClick={openNewExpense}
                      className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus size={16} /> Log Expense
                    </button>
                  </div>
                </div>

                {/* Phase 2: audit filters — text search + category + month */}
                <div className="flex flex-wrap items-end gap-2.5 mb-4">
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={expSearch}
                      onChange={(e) => setExpSearch(e.target.value)}
                      placeholder="Search title, notes, voucher…"
                      className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                    <select
                      value={expCat}
                      onChange={(e) => setExpCat(e.target.value)}
                      className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="ALL">All Categories</option>
                      {Object.entries(EXPENSE_CATEGORY_META).map(([k, m]) => (
                        <option key={k} value={k}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Month</label>
                    <select
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="ALL">All Months</option>
                      {expenseMonthOptions.map((ym) => (
                        <option key={ym} value={ym}>
                          {new Date(`${ym}-01T00:00:00`).toLocaleString('en-GB', { month: 'short', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(expSearch || expCat !== 'ALL' || expMonth !== 'ALL') && (
                    <button
                      onClick={() => { setExpSearch(''); setExpCat('ALL'); setExpMonth('ALL'); }}
                      className="min-h-[36px] px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                {/* Desktop: expenses table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Date</th>
                        <th className="pb-4 pr-4">Voucher No</th>
                        <th className="pb-4 pr-4">Category</th>
                        <th className="pb-4 pr-4">Title</th>
                        <th className="pb-4 pr-4">Amount (BDT)</th>
                        <th className="pb-4 pr-4">Notes</th>
                        {me?.role === 'SUPERADMIN' && <th className="pb-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedExpenses.map((x) => {
                        const catMeta = EXPENSE_CATEGORY_META[x.category] || EXPENSE_CATEGORY_META.OTHER;
                        return (
                          <tr key={x.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pr-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-teal-700" /> {formatDate(x.expenseDate)}</span>
                            </td>
                            <td className="py-3.5 pr-4 text-sm font-mono text-xs">{x.voucherNo || '—'}</td>
                            <td className="py-3.5 pr-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap ${catMeta.cls}`}>
                                {catMeta.label}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 font-bold text-sm">{x.title}</td>
                            <td className="py-3.5 pr-4 font-semibold text-rose-600 whitespace-nowrap">{formatBDT(x.amount)}</td>
                            <td className="py-3.5 pr-4 text-xs text-gray-500 max-w-[240px] truncate" title={x.notes || ''}>{x.notes || '—'}</td>
                            {me?.role === 'SUPERADMIN' && (
                              <td className="py-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditExpense(x)}
                                    aria-label={`Edit ${x.title}`}
                                    title="Edit expense"
                                    className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => deleteExpense(x)}
                                    disabled={deletingId === `expense-${x.id}`}
                                    aria-label={`Delete ${x.title}`}
                                    title="Delete expense"
                                    className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredExpenses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Receipt size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">{erpExpenses.length > 0 ? 'No expenses match these filters' : 'No expenses logged yet'}</p>
                      <p className="text-xs text-slate-500 mt-1">{erpExpenses.length > 0 ? 'Try another keyword, category or month.' : 'Log daily spending to keep the ledger clean.'}</p>
                    </div>
                  )}
                </div>

                {/* Mobile: expense rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {pagedExpenses.map((x) => {
                    const catMeta = EXPENSE_CATEGORY_META[x.category] || EXPENSE_CATEGORY_META.OTHER;
                    return (
                      <div key={x.id} className="py-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm truncate">{x.title}</span>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${catMeta.cls}`}>{catMeta.label}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-600 mt-0.5">
                            <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {formatDate(x.expenseDate)}</span>
                            {x.voucherNo ? ` · Voucher ${x.voucherNo}` : ''}
                          </div>
                          {x.notes && <div className="text-xs text-gray-500 truncate mt-0.5">{x.notes}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-semibold text-rose-600 whitespace-nowrap text-sm">{formatBDT(x.amount)}</span>
                          {me?.role === 'SUPERADMIN' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditExpense(x)}
                                aria-label={`Edit ${x.title}`}
                                className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => deleteExpense(x)}
                                disabled={deletingId === `expense-${x.id}`}
                                aria-label={`Delete ${x.title}`}
                                className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {erpExpenses.length > 0 ? 'No expenses match these filters.' : 'No expenses logged yet.'}
                    </p>
                  )}
                </div>
                <Pager
                  page={expPage}
                  total={filteredExpenses.length}
                  perPage={EXPENSES_PER_PAGE}
                  onPage={setExpPage}
                  noun={filteredExpenses.length === 1 ? 'expense' : 'expenses'}
                />
              </div>
        )}
      </SectionFrame>

      {auditModal && (
        <ModalShell onClose={() => setAuditModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          onClick={() => setAuditModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">Expense Audit History</h3>
                <p className="text-xs text-slate-500">Latest 50 changes — pre-edit &amp; pre-delete snapshots</p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {auditLoading && (
                <p className="text-center text-sm text-slate-500 py-10">Loading audit trail…</p>
              )}
              {!auditLoading && auditEntries.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList size={28} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-500">No audit entries yet</p>
                  <p className="text-xs text-slate-500 mt-1">Every SuperAdmin expense edit or delete is recorded here.</p>
                </div>
              )}
              {!auditLoading && auditEntries.map((entry) => {
                let snap: { title?: string; amount?: number; category?: string; expenseDate?: string; voucherNo?: string | null } | null = null;
                try { snap = JSON.parse(entry.originalData); } catch { snap = null; }
                const isDelete = entry.action === 'DELETE';
                return (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
                        isDelete ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isDelete ? 'Deleted' : 'Edited'}
                      </span>
                      {snap?.title && <span className="font-bold text-sm truncate">{snap.title}</span>}
                      {typeof snap?.amount === 'number' && (
                        <span className="font-semibold text-rose-600 text-sm">{formatBDT(snap.amount)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {snap?.category && <span>Category: <span className="font-semibold">{snap.category.replace(/_/g, ' ')}</span></span>}
                      {snap?.expenseDate && <span>Date: <span className="font-semibold">{formatDay(snap.expenseDate)}</span></span>}
                      <span>By: <span className="font-semibold">{collectedByMap[entry.performedBy] || entry.performedBy}</span></span>
                      <span>At: <span className="font-semibold">{formatDate(entry.createdAt)}</span></span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 select-none">Original snapshot (JSON)</summary>
                      <pre className="mt-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] leading-relaxed overflow-x-auto text-slate-600 whitespace-pre-wrap break-all">{entry.originalData}</pre>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>
        </ModalShell>
      )}

      {expenseModal && (
        <ModalShell onClose={() => setExpenseModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitExpense}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingExpense ? 'Edit Expense' : 'Log Daily Expense'}</h3>
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editingExpense && (
                <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800 font-semibold">
                  Editing is SuperAdmin-only — the pre-change state is snapshotted to the audit log.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="LOGISTICS">Logistics / Fuel</option>
                    <option value="LAB_UTILITY">Lab Utility</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Voucher No</label>
                  <input
                    value={expenseForm.voucherNo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, voucherNo: e.target.value })}
                    placeholder="e.g. V-2026-014"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title / Description *</label>
                <input
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Zirconia pucks restock (Aidite 5 pcs)"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Expense Date * <span className="normal-case font-medium text-slate-400">(backdating allowed)</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (BDT) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="e.g. 4500"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Supplier, payment mode, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingExpense ? 'Save Changes' : 'Log Expense'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add Machine Asset (CapEx) Modal */}
    </>
  );
}
