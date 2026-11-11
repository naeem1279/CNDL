'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ChevronRight, Landmark, Layers, Plus, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { EXPENSE_CATEGORY_META } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, ErpAccount, ErpExpense, ErpLedgerEntry, Message, Order, OverviewMetrics, ReviewRow, ServiceRow, TabKey } from '../_lib/types';
import { formatBDT, formatDate } from '../_lib/utils';

export default function OverviewPage() {
  const { me, adminFetch } = useAdmin();
  const router = useRouter();
  /** Opens another section; `create` opens its "new" form on arrival. */
  const go = (t: TabKey, create = false) => router.push(`/admin-cndl/${t}${create ? '?new=1' : ''}`);

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ERP & Accounts state
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);
  const [erpExpenses, setErpExpenses] = useState<ErpExpense[]>([]);
  const [erpLedger, setErpLedger] = useState<ErpLedgerEntry[]>([]);

  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics>({
    todayInvoicedSales: 0,
    monthInvoicedSales: 0,
    todayCashCollected: 0,
    monthCashCollected: 0,
    todayNewDuesAdded: 0,
    monthNewDuesAdded: 0,
    todayExpenses: 0,
    monthExpenses: 0,
    totalMarketDues: 0,
  });

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: accounts, data, expenses, ledger, metrics. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'data', 'expenses', 'ledger', 'metrics'], me.role);
      if (!r) return;
      setData((prev) => ({
        orders: r.orders ?? prev.orders,
        messages: r.messages ?? prev.messages,
        blogs: r.blogs ?? prev.blogs,
        reviews: r.reviews ?? prev.reviews,
        services: r.services ?? prev.services,
      }));
      if (r.accounts) setErpAccounts(r.accounts);
      if (r.expenses) setErpExpenses(r.expenses);
      if (r.ledger) setErpLedger(r.ledger);
      if (r.metrics) setOverviewMetrics(r.metrics);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Total Market Dues', value: formatBDT(overviewMetrics.totalMarketDues), icon: Landmark, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
      { label: "This Month's Invoiced Sales", value: formatBDT(overviewMetrics.monthInvoicedSales), icon: TrendingUp, bg: 'bg-teal-50', fg: 'text-teal-700', valueCls: 'text-teal-700' },
      { label: "This Month's Cash In", value: formatBDT(overviewMetrics.monthCashCollected), icon: Wallet, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      { label: "This Month's OpEx", value: formatBDT(overviewMetrics.monthExpenses), icon: Receipt, bg: 'bg-amber-50', fg: 'text-amber-600', valueCls: 'text-amber-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="overview"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= EXECUTIVE OVERVIEW — 360° COMMAND CENTER ================= */
          <div className="space-y-5">
            {/* Quick Action Bar */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => window.open('/order-create', '_blank')}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors shadow-sm"
                >
                  <Plus size={15} /> Submit Case
                </button>
                <button
                  onClick={() => go('dues')}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-teal-700/30 text-teal-700 text-xs font-bold hover:bg-teal-700/5 transition-colors"
                >
                  <Plus size={15} /> Record Due / Invoice
                </button>
                <button
                  onClick={() => {
                    go('expenses', true);
                    
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-50 transition-colors"
                >
                  <Plus size={15} /> Log Expense
                </button>
                <button
                  onClick={() => {
                    go('shareholders', true);
                    
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  <Plus size={15} /> Add Shareholder
                </button>
                <button
                  onClick={() => {
                    go('users', true);
                    
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <Plus size={15} /> Add User
                </button>
              </div>
            </div>

            {/* ===== GROUP C: MACRO OUTSTANDING (মাঠের মোট বকেয়া) ===== */}
            <div className="rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/30 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Landmark size={18} />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                      Macro Outstanding • মাঠের মোট বকেয়া
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-semibold text-rose-600 tracking-tight tabular-nums">
                    {formatBDT(overviewMetrics.totalMarketDues)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Total uncollected balance across all registered client accounts &amp; partner chambers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => go('dues')}
                    className="min-h-[44px] px-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    View Due Ledger <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* ===== GROUP A: TODAY'S REGISTER (আজকের খাতা) ===== */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                    Today&apos;s Register • আজকের খাতা
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  Live Asia/Dhaka (UTC+6)
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Today's Invoiced Sales */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-2 leading-tight mb-1">
                      Today&apos;s Invoiced Sales (বিক্রি)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-slate-900 tracking-tight">
                      {formatBDT(overviewMetrics.todayInvoicedSales)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-teal-700 font-bold mt-2">
                    Invoices dated today
                  </span>
                </div>
                {/* 2. Today's Cash Collected */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s Cash Collected (নগদ আদায়)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-emerald-700 tracking-tight">
                      {formatBDT(overviewMetrics.todayCashCollected)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-emerald-700 font-bold mt-2">
                    Collections received today
                  </span>
                </div>
                {/* 3. Today's New Dues Added */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s New Dues (বকেয়া বৃদ্ধি)
                    </span>
                    <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums ${
                      overviewMetrics.todayNewDuesAdded > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {overviewMetrics.todayNewDuesAdded > 0 ? `+${formatBDT(overviewMetrics.todayNewDuesAdded)}` : formatBDT(overviewMetrics.todayNewDuesAdded)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-amber-700 font-bold mt-2">
                    Invoiced Sales − Cash In
                  </span>
                </div>
                {/* 4. Today's Expenses */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s OpEx (আজকের খরচ)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-rose-600 tracking-tight">
                      {formatBDT(overviewMetrics.todayExpenses)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-rose-700 font-bold mt-2">
                    Logged daily expenses
                  </span>
                </div>
              </div>
            </div>

            {/* ===== GROUP B: THIS MONTH'S SUMMARY (চলতি মাসের হিসাব) ===== */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                    This Month&apos;s Summary • চলতি মাসের হিসাব
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  Calendar Month MTD
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Month's Sales */}
                <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-800 line-clamp-2 leading-tight mb-1">
                      This Month&apos;s Sales (মোট বিক্রি)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-teal-900 tracking-tight">
                      {formatBDT(overviewMetrics.monthInvoicedSales)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-teal-700 font-bold mt-2">
                    Gross invoiced volume
                  </span>
                </div>
                {/* 2. Total Cash In */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 line-clamp-2 leading-tight mb-1">
                      Total Cash In (মোট নগদ আদায়)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-emerald-700 tracking-tight">
                      {formatBDT(overviewMetrics.monthCashCollected)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-emerald-700 font-bold mt-2">
                    Realized payments this month
                  </span>
                </div>
                {/* 3. Net Dues Added */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800 line-clamp-2 leading-tight mb-1">
                      Net Dues Added (নেট বকেয়া বৃদ্ধি)
                    </span>
                    <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums ${
                      overviewMetrics.monthNewDuesAdded > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {overviewMetrics.monthNewDuesAdded > 0 ? `+${formatBDT(overviewMetrics.monthNewDuesAdded)}` : formatBDT(overviewMetrics.monthNewDuesAdded)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-amber-700 font-bold mt-2">
                    Month Sales − Cash In
                  </span>
                </div>
                {/* 4. Month's Total OpEx */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 line-clamp-2 leading-tight mb-1">
                      Month&apos;s Total OpEx (মোট খরচ)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-rose-600 tracking-tight">
                      {formatBDT(overviewMetrics.monthExpenses)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-rose-700 font-bold mt-2">
                    Cumulative monthly spend
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed + Split Ledger Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Activity feed */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-teal-700" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Recent Activity</h3>
                </div>
                {(() => {
                  const accName = (id: string) => erpAccounts.find((a) => a.id === id)?.name || 'Client account';
                  type FeedItem = { id: string; at: number; icon: React.ComponentType<{ size?: number; className?: string }>; iconCls: string; title: string; sub: string; amount: string | null; amountCls: string };
                  const feed: FeedItem[] = [];
                  for (const e of erpLedger.slice(0, 40)) {
                    if (feed.length >= 24) break;
                    const payment = e.transactionType === 'PAYMENT';
                    feed.push({
                      id: `lg-${e.id}`,
                      at: new Date(e.createdAt).getTime(),
                      icon: payment ? Wallet : Receipt,
                      iconCls: payment ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500',
                      title: payment ? 'Collection received' : 'Invoice recorded',
                      sub: `${accName(e.clientAccountId)}${e.orderId ? ` · Case ${e.orderId}` : ''}${e.notes ? ` · ${e.notes}` : ''}`,
                      amount: formatBDT(e.netAmount),
                      amountCls: payment ? 'text-emerald-600' : 'text-rose-500',
                    });
                  }
                  for (const x of erpExpenses.slice(0, 12)) {
                    feed.push({
                      id: `ex-${x.id}`,
                      at: new Date(x.expenseDate).getTime(),
                      icon: TrendingDown,
                      iconCls: 'bg-amber-50 text-amber-600',
                      title: x.title,
                      sub: `Expense · ${EXPENSE_CATEGORY_META[x.category]?.label || 'Other'}`,
                      amount: `-${formatBDT(x.amount)}`,
                      amountCls: 'text-amber-600',
                    });
                  }
                  for (const o of data.orders.slice(0, 12)) {
                    feed.push({
                      id: `or-${o.id}`,
                      at: new Date(o.createdAt).getTime(),
                      icon: Layers,
                      iconCls: 'bg-teal-700/10 text-teal-700',
                      title: `New case ${o.caseId}`,
                      sub: `From ${o.customerName}${o.productType ? ` · ${o.productType.split(' | ')[0]}` : ''}`,
                      amount: null,
                      amountCls: '',
                    });
                  }
                  feed.sort((a, b) => b.at - a.at);
                  const topFeed = feed.slice(0, 10);
                  if (topFeed.length === 0) {
                    return (
                      <p className="text-center text-sm text-slate-500 py-14">No activity yet — record an invoice, log an expense or receive a case to see it here.</p>
                    );
                  }
                  return (
                    <div className="divide-y divide-slate-100">
                      {topFeed.map((item) => (
                        <div key={item.id} className="py-3 flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconCls}`}>
                            <item.icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.amount && <p className={`text-sm font-semibold whitespace-nowrap ${item.amountCls}`}>{item.amount}</p>}
                            <p className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(new Date(item.at).toISOString())}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Split Ledger Preview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Ledger Preview</h3>
                  <button onClick={() => go('dues')} className="text-xs font-bold text-teal-700 hover:underline">
                    Open ledger →
                  </button>
                </div>
                {erpLedger.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-14">No ledger entries yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {erpLedger.slice(0, 8).map((e) => {
                      const payment = e.transactionType === 'PAYMENT';
                      const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                      return (
                        <div key={e.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider whitespace-nowrap ${payment ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                              {payment ? 'Payment' : 'Invoice'}
                            </span>
                            <span className={`text-sm font-semibold whitespace-nowrap ${payment ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {payment ? '+' : ''}{formatBDT(e.netAmount)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 truncate mt-1">{acc?.name || 'Client account'}</p>
                          <p className="text-[11px] text-slate-500">{formatDate(e.createdAt)}{e.orderId ? ` · Case ${e.orderId}` : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SectionFrame>

    </>
  );
}
