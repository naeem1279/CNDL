'use client';
import { useEffect, useMemo, useState } from 'react';
import { Layers, Pencil, PieChart, Plus, Receipt, Trash2, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { EMPTY_DIVIDEND_FORM, EMPTY_SHAREHOLDER_FORM, TOTAL_SHARES } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpDividend, ErpLedgerEntry, ErpShareholder } from '../_lib/types';
import { apiError, formatBDT, formatDate } from '../_lib/utils';

export default function ShareholdersPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [erpDividends, setErpDividends] = useState<ErpDividend[]>([]);
  const [erpLedger, setErpLedger] = useState<ErpLedgerEntry[]>([]);
  const [erpShareholders, setErpShareholders] = useState<ErpShareholder[]>([]);
  const [dividendModal, setDividendModal] = useState(false);
  const [shareholderModal, setShareholderModal] = useState(false);
  const [dividendForm, setDividendForm] = useState(EMPTY_DIVIDEND_FORM);
  const [shareholderForm, setShareholderForm] = useState(EMPTY_SHAREHOLDER_FORM);
  const [editingShareholder, setEditingShareholder] = useState<ErpShareholder | null>(null);
  const [profitInput, setProfitInput] = useState('');
  const [savingErp, setSavingErp] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: dividends, ledger, shareholders. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['dividends', 'ledger', 'shareholders'], me.role);
      if (!r) return;
      if (r.dividends) setErpDividends(r.dividends);
      if (r.ledger) setErpLedger(r.ledger);
      if (r.shareholders) setErpShareholders(r.shareholders);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------- ERP: Shareholder Equity Registry ---------- */
  const openNewShareholder = () => {
    setEditingShareholder(null);
    setShareholderForm(EMPTY_SHAREHOLDER_FORM);
    setShareholderModal(true);
  };

  const openEditShareholder = (s: ErpShareholder) => {
    setEditingShareholder(s);
    setShareholderForm({
      name: s.name,
      phone: s.phone || '',
      address: s.address || '',
      sharesCount: String(s.sharesCount),
      paymentDetails: s.paymentDetails || '',
      notes: s.notes || '',
    });
    setShareholderModal(true);
  };

  const submitShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    const shares = parseInt(shareholderForm.sharesCount);
    if (!shareholderForm.name.trim()) {
      toast.error('Shareholder name is required');
      return;
    }
    if (!shares || shares < 1 || shares > TOTAL_SHARES) {
      toast.error(`Shares must be between 1 and ${TOTAL_SHARES}`);
      return;
    }
    setSavingErp(true);
    try {
      const payload = {
        name: shareholderForm.name,
        phone: shareholderForm.phone.trim() || null,
        address: shareholderForm.address.trim() || null,
        sharesCount: shares,
        paymentDetails: shareholderForm.paymentDetails.trim() || null,
        notes: shareholderForm.notes.trim() || null,
      };
      const res = await adminFetch(
        editingShareholder ? `/api/admin/erp/shareholders/${editingShareholder.id}` : '/api/admin/erp/shareholders',
        {
          method: editingShareholder ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingShareholder ? 'Shareholder updated' : 'Shareholder registered');
        setShareholderModal(false);
        setEditingShareholder(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save shareholder'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const deleteShareholder = async (s: ErpShareholder) => {
    if (!(await askConfirm(`Remove "${s.name}" from the equity registry? This cannot be undone.`))) return;
    setDeletingId(`shareholder-${s.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/shareholders/${s.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Shareholder removed');
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to remove shareholder'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const submitDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dividendForm.amountPaid);
    const shares = parseInt(dividendForm.sharesCount);
    if (!dividendForm.shareholderName.trim()) {
      toast.error('Shareholder name is required');
      return;
    }
    if (!shares || shares < 1 || shares > TOTAL_SHARES) {
      toast.error(`Shares must be between 1 and ${TOTAL_SHARES}`);
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount paid');
      return;
    }
    if (!dividendForm.payoutMonth.trim()) {
      toast.error('Payout month is required');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/dividends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareholderName: dividendForm.shareholderName,
          sharesCount: shares,
          amountPaid: amount,
          payoutMonth: dividendForm.payoutMonth,
          paymentMethod: dividendForm.paymentMethod.trim() || null,
          notes: dividendForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Dividend distributed');
        setDividendModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record dividend'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const { totalDividendsPaid, allocatedShares, unallocatedShares, dividendsByName, shareholderHoldings } =
    useMemo(() => {
      const byName: Record<string, number> = {};
      let paid = 0;
      for (const d of erpDividends) {
        paid += d.amountPaid || 0;
        byName[d.shareholderName] = (byName[d.shareholderName] || 0) + (d.amountPaid || 0);
      }
      const allocated = erpShareholders.reduce((sum, s) => sum + (s.sharesCount || 0), 0);
      const holdings: { name: string; shares: number }[] = erpShareholders.length
        ? erpShareholders.map((s) => ({ name: s.name, shares: s.sharesCount }))
        : (() => {
            const out: { name: string; shares: number }[] = [];
            for (const d of erpDividends) {
              if (!out.some((s) => s.name === d.shareholderName)) out.push({ name: d.shareholderName, shares: d.sharesCount });
            }
            return out;
          })();
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const realized = erpLedger
        .filter((e) => {
          if (e.transactionType !== 'PAYMENT') return false;
          const d = new Date(e.paymentDate || e.createdAt);
          return !isNaN(d.getTime()) && d >= start && d < end;
        })
        .reduce((sum, e) => sum + (e.netAmount || 0), 0);
      return {
        totalDividendsPaid: paid,
        allocatedShares: allocated,
        unallocatedShares: Math.max(0, TOTAL_SHARES - allocated),
        dividendsByName: byName,
        monthRealizedRevenue: realized,
        shareholderHoldings: holdings,
      };
    }, [erpDividends, erpShareholders, erpLedger]);
  const earnedByName = (name: string) => dividendsByName[name] || 0;
  const profitNum = parseFloat(profitInput) || 0;
  const perShareValue = profitNum / TOTAL_SHARES;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overview quick actions link here with ?new=1 to open the create form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    openNewShareholder();
  }, []);

  const kpiCards: Kpi[] = [
      { label: 'Shares Allocated', value: `${allocatedShares} / ${TOTAL_SHARES}`, icon: PieChart, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Unallocated Shares', value: unallocatedShares, icon: Layers, bg: unallocatedShares > 0 ? 'bg-amber-50' : 'bg-emerald-50', fg: unallocatedShares > 0 ? 'text-amber-600' : 'text-emerald-600' },
      { label: 'Cumulative Payouts', value: formatBDT(totalDividendsPaid), icon: Wallet, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      { label: 'Dividend per Share', value: formatBDT(perShareValue), icon: Receipt, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
  ];

  /* Distributable net profit calculator (drives the per-share KPI) */
  const kpiExtra = (
            <div className="col-span-2 bg-white border border-teal-700/20 rounded-xl p-4 sm:p-5 shadow-sm">
              <span className="block text-xs font-medium text-teal-700/70 mb-2">
                This Month&apos;s Distributable Net — Calculator
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={profitInput}
                onChange={(e) => setProfitInput(e.target.value)}
                placeholder="Net profit to distribute (BDT)"
                className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
              />
              {profitNum > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-bold text-teal-700">
                    Distributable net: {formatBDT(profitNum)} · per share (1/{TOTAL_SHARES}): {formatBDT(perShareValue)}
                  </p>
                  {shareholderHoldings.length > 0 ? (
                    <div className="space-y-0.5 max-h-28 overflow-y-auto">
                      {shareholderHoldings.map((s) => (
                        <p key={s.name} className="text-xs text-gray-600 flex justify-between gap-2">
                          <span className="truncate">{s.name} <span className="text-slate-500">({s.shares} shares)</span></span>
                          <span className="font-bold whitespace-nowrap">{formatBDT(perShareValue * s.shares)}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No shareholders registered yet.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Enter this month&apos;s net profit to preview per-share dividends.</p>
              )}
            </div>
  );

  return (
    <>
      <SectionFrame
        tab="shareholders"
        kpis={kpiCards}
        kpiExtra={kpiExtra}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
              /* ---------- SHAREHOLDERS & DIVIDENDS (100 SHARES) ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                {/* ===== Shareholder Equity Registry ===== */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Shareholder Equity Registry</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Ownership register — the lab is capitalized in {TOTAL_SHARES} shares</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-700/10 text-teal-700 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap">
                      <PieChart size={13} /> {allocatedShares}/{TOTAL_SHARES} Allocated
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${unallocatedShares > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {unallocatedShares} Unallocated
                    </span>
                    <button
                      onClick={openNewShareholder}
                      className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus size={16} /> Add Shareholder
                    </button>
                  </div>
                </div>

                {/* 100-share allocation bar */}
                <div className="mb-6">
                  <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                    {erpShareholders.filter((s) => s.sharesCount > 0).map((s, i) => (
                      <div
                        key={s.id}
                        title={`${s.name}: ${s.sharesCount} shares (${s.sharesCount}%)`}
                        style={{ width: `${Math.min(100, s.sharesCount)}%` }}
                        className={`h-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {erpShareholders.map((s, i) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`} />
                        {s.name} · {s.sharesCount}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Registry: desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Shareholder Name</th>
                        <th className="pb-4 pr-4">Phone</th>
                        <th className="pb-4 pr-4">Shares Held</th>
                        <th className="pb-4 pr-4">Ownership %</th>
                        <th className="pb-4 pr-4">Total Dividends Earned</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpShareholders.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                {s.name.charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-sm">{s.name}</div>
                                {s.paymentDetails && <div className="text-[11px] text-slate-500 max-w-[200px] truncate" title={s.paymentDetails}>{s.paymentDetails}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-sm text-gray-600">{s.phone || '—'}</td>
                          <td className="py-3.5 pr-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                              {s.sharesCount} / {TOTAL_SHARES}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`} style={{ width: `${Math.min(100, s.sharesCount)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-teal-700">{s.sharesCount}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">{formatBDT(earnedByName(s.name))}</td>
                          <td className="py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openEditShareholder(s)}
                                aria-label={`Edit ${s.name}`}
                                title="Edit shareholder"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => deleteShareholder(s)}
                                disabled={deletingId === `shareholder-${s.id}`}
                                aria-label={`Delete ${s.name}`}
                                title="Remove shareholder"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpShareholders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <PieChart size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No shareholders registered yet</p>
                      <p className="text-xs text-slate-500 mt-1">Register equity holders to allocate the {TOTAL_SHARES} shares.</p>
                    </div>
                  )}
                </div>

                {/* Registry: mobile cards */}
                <div className="md:hidden space-y-3">
                  {erpShareholders.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{s.name}</div>
                          <div className="text-xs text-gray-500 truncate">{s.phone || 'No phone'}</div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0">
                          {s.sharesCount} sh · {s.sharesCount}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-500">Dividends Earned</span>
                        <span className="font-semibold text-emerald-600 text-sm">{formatBDT(earnedByName(s.name))}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openEditShareholder(s)}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => deleteShareholder(s)}
                          disabled={deletingId === `shareholder-${s.id}`}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {erpShareholders.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No shareholders registered yet.</p>
                  )}
                </div>

                {/* ===== Dividend Payout History ===== */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Dividend Payout History</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">100-share dividend register and distribution engine</p>
                  </div>
                  <button
                    onClick={() => {
                      setDividendForm(EMPTY_DIVIDEND_FORM);
                      setDividendModal(true);
                    }}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Distribute Dividend
                  </button>
                </div>

                {/* Desktop: dividends table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Shareholder</th>
                        <th className="pb-4 pr-4">Shares</th>
                        <th className="pb-4 pr-4">Amount Paid</th>
                        <th className="pb-4 pr-4">Payout Month</th>
                        <th className="pb-4 pr-4">Method</th>
                        <th className="pb-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpDividends.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-sm">{d.shareholderName}</td>
                          <td className="py-3.5 pr-4 text-sm">{d.sharesCount}</td>
                          <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">{formatBDT(d.amountPaid)}</td>
                          <td className="py-3.5 pr-4 text-sm">{d.payoutMonth}</td>
                          <td className="py-3.5 pr-4 text-sm text-gray-500">{d.paymentMethod || '—'}</td>
                          <td className="py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpDividends.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <PieChart size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No dividends distributed yet</p>
                      <p className="text-xs text-slate-500 mt-1">Record payouts against the 100-share structure.</p>
                    </div>
                  )}
                </div>

                {/* Mobile: dividend rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {erpDividends.map((d) => (
                    <div key={d.id} className="py-3.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{d.shareholderName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {d.sharesCount} shares · {d.payoutMonth}{d.paymentMethod ? ` · ${d.paymentMethod}` : ''}
                        </div>
                      </div>
                      <span className="font-semibold text-emerald-600 whitespace-nowrap text-sm">{formatBDT(d.amountPaid)}</span>
                    </div>
                  ))}
                  {erpDividends.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No dividends distributed yet.</p>
                  )}
                </div>
              </div>
        )}
      </SectionFrame>

      {dividendModal && (
        <ModalShell onClose={() => setDividendModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitDividend}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">Distribute Dividend</h3>
                <p className="text-xs text-slate-500">Against the 100-share structure</p>
              </div>
              <button
                type="button"
                onClick={() => setDividendModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Shareholder Name *</label>
                <input
                  required
                  value={dividendForm.shareholderName}
                  onChange={(e) => setDividendForm({ ...dividendForm, shareholderName: e.target.value })}
                  placeholder="Full name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Shares Held (of {TOTAL_SHARES}) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={TOTAL_SHARES}
                    value={dividendForm.sharesCount}
                    onChange={(e) => setDividendForm({ ...dividendForm, sharesCount: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount Paid (BDT) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={dividendForm.amountPaid}
                    onChange={(e) => setDividendForm({ ...dividendForm, amountPaid: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payout Month *</label>
                  <input
                    required
                    type="month"
                    value={dividendForm.payoutMonth}
                    onChange={(e) => setDividendForm({ ...dividendForm, payoutMonth: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={dividendForm.paymentMethod}
                    onChange={(e) => setDividendForm({ ...dividendForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="">— Select —</option>
                    <option value="bKash">bKash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={dividendForm.notes}
                  onChange={(e) => setDividendForm({ ...dividendForm, notes: e.target.value })}
                  placeholder="Reference, TrxID, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setDividendModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Recording...' : 'Distribute Dividend'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add / Edit Shareholder Modal */}
      {shareholderModal && (
        <ModalShell onClose={() => setShareholderModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitShareholder}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                  {editingShareholder ? 'Edit Shareholder' : '+ Add Shareholder'}
                </h3>
                <p className="text-xs text-slate-500">
                  {unallocatedShares > 0
                    ? `${unallocatedShares} of ${TOTAL_SHARES} shares currently unallocated`
                    : `All ${TOTAL_SHARES} shares allocated`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareholderModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                <input
                  required
                  value={shareholderForm.name}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, name: e.target.value })}
                  placeholder="Shareholder's full name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                  <input
                    value={shareholderForm.phone}
                    onChange={(e) => setShareholderForm({ ...shareholderForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Shares Count (1–{editingShareholder ? TOTAL_SHARES - (allocatedShares - editingShareholder.sharesCount) : unallocatedShares || 1} available) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={TOTAL_SHARES}
                    value={shareholderForm.sharesCount}
                    onChange={(e) => setShareholderForm({ ...shareholderForm, sharesCount: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                <input
                  value={shareholderForm.address}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, address: e.target.value })}
                  placeholder="House / Road / Area, City"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Info</label>
                <input
                  value={shareholderForm.paymentDetails}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, paymentDetails: e.target.value })}
                  placeholder="bKash / bank account / cheque details"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={shareholderForm.notes}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, notes: e.target.value })}
                  placeholder="Agreement reference, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShareholderModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingShareholder ? 'Save Changes' : 'Add Shareholder'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add Offline / Manual Order Modal */}
      {/* Agent Commission Payout Modal */}
    </>
  );
}
