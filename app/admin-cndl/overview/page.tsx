'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, Clock, FileText, Inbox, Layers, Plus, Receipt, ShieldCheck, TrendingDown, UserPlus, Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, EmptyState, ListRow, MenuButton, Panel, type MenuItem } from '../_components/ui';
import { EXPENSE_CATEGORY_META, ROLE_TABS } from '../_lib/constants';
import { adminPath } from '../_lib/nav';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpExpense, ErpLedgerEntry, Order, OverviewMetrics, TabKey } from '../_lib/types';
import { formatBDT, formatDate } from '../_lib/utils';

const DAY = 86_400_000;
const OVERDUE_DAYS = 30;
const CLOSED_CASE = new Set(['Dispatched', 'Delivered', 'Cancelled']);

const EMPTY_METRICS: OverviewMetrics = {
  todayInvoicedSales: 0,
  monthInvoicedSales: 0,
  todayCashCollected: 0,
  monthCashCollected: 0,
  todayNewDuesAdded: 0,
  monthNewDuesAdded: 0,
  todayExpenses: 0,
  monthExpenses: 0,
  totalMarketDues: 0,
};

/** "+৳4,200 today" / "-৳14,760 today" / "No change today". */
function signedToday(n: number) {
  if (!n) return 'No change today';
  return `${n > 0 ? '+' : ''}${formatBDT(n)} today`;
}

type FeedItem = {
  id: string;
  at: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  sub: string;
  amount: string | null;
  tone: 'in' | 'out' | 'neutral';
};

export default function OverviewPage() {
  const { me, adminFetch } = useAdmin();
  const router = useRouter();
  const allowedTabs = ROLE_TABS[me.role] ?? [];
  const can = (t: TabKey) => allowedTabs.includes(t);
  /** Opens another section; `create` opens its "new" form on arrival. */
  const go = (t: TabKey, create = false) => router.push(`${adminPath(t)}${create ? '?new=1' : ''}`);

  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);
  const [metrics, setMetrics] = useState<OverviewMetrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: accounts, cases, expenses, ledger, metrics. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'data', 'expenses', 'ledger', 'metrics'], me.role);
      if (!r) return;
      if (r.orders) setOrders(r.orders);
      if (r.accounts) setAccounts(r.accounts);
      if (r.expenses) setExpenses(r.expenses);
      if (r.ledger) setLedger(r.ledger);
      if (r.metrics) setMetrics(r.metrics);
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

  /* ---------- Four headline figures; today's movement sits under each ---------- */
  const kpis: Kpi[] = [
    {
      label: 'Outstanding dues',
      value: formatBDT(metrics.totalMarketDues),
      sub: signedToday(metrics.todayNewDuesAdded),
      // Dues going down is good news.
      subTone: metrics.todayNewDuesAdded < 0 ? 'up' : metrics.todayNewDuesAdded > 0 ? 'down' : 'neutral',
      icon: Wallet,
      href: can('dues') ? adminPath('dues') : undefined,
    },
    {
      label: 'Collected this month',
      value: formatBDT(metrics.monthCashCollected),
      sub: `${formatBDT(metrics.todayCashCollected)} today`,
      icon: CheckCircle2,
      href: can('dues') ? adminPath('dues') : undefined,
    },
    {
      label: 'Invoiced this month',
      value: formatBDT(metrics.monthInvoicedSales),
      sub: `${formatBDT(metrics.todayInvoicedSales)} today`,
      icon: Receipt,
      href: can('dues') ? adminPath('dues') : undefined,
    },
    {
      label: 'Expenses this month',
      value: formatBDT(metrics.monthExpenses),
      sub: `${formatBDT(metrics.todayExpenses)} today`,
      icon: TrendingDown,
      href: can('expenses') ? adminPath('expenses') : undefined,
    },
  ];

  /* ---------- "New" menu: only actions this role can complete ---------- */
  const newItems: MenuItem[] = [
    { label: 'Submit a case', icon: Layers, onSelect: () => window.open('/order-create', '_blank', 'noopener') },
    ...(can('dues') && (me.role === 'SUPERADMIN' || me.role === 'ACCOUNTS')
      ? [{ label: 'Record invoice or collection', icon: Receipt, onSelect: () => go('dues') }]
      : []),
    ...(can('expenses') ? [{ label: 'Log an expense', icon: TrendingDown, onSelect: () => go('expenses', true) }] : []),
    ...(can('shareholders') ? [{ label: 'Add a shareholder', icon: Users, onSelect: () => go('shareholders', true) }] : []),
    ...(can('users') ? [{ label: 'Add a team member', icon: UserPlus, onSelect: () => go('users', true) }] : []),
  ];

  /* ---------- Needs attention ---------- */
  const attention = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Days since each account last paid (or, if never, since its oldest invoice / creation).
    const lastPaid = new Map<string, number>();
    const firstInvoice = new Map<string, number>();
    for (const e of ledger) {
      const t = new Date(e.paymentDate || e.createdAt).getTime();
      if (e.transactionType === 'PAYMENT') {
        lastPaid.set(e.clientAccountId, Math.max(lastPaid.get(e.clientAccountId) ?? 0, t));
      } else {
        firstInvoice.set(e.clientAccountId, Math.min(firstInvoice.get(e.clientAccountId) ?? Infinity, t));
      }
    }
    const overdue = accounts
      .filter((a) => a.currentBalance > 0)
      .map((a) => {
        const anchor = lastPaid.get(a.id) ?? firstInvoice.get(a.id) ?? new Date(a.createdAt).getTime();
        return { account: a, days: Math.max(0, Math.floor((now - anchor) / DAY)) };
      })
      .filter((x) => x.days >= OVERDUE_DAYS)
      .sort((a, b) => b.account.currentBalance - a.account.currentBalance);

    const unverified = ledger.filter((e) => e.transactionType === 'PAYMENT' && e.isVerified === false);
    const inQc = orders.filter((o) => o.status === 'Quality Control' || o.status === 'QC');
    const late = orders.filter(
      (o) => o.deliveryDate && !CLOSED_CASE.has(o.status) && new Date(o.deliveryDate).getTime() < startOfToday.getTime()
    );

    return {
      overdue,
      overdueTotal: overdue.reduce((s, x) => s + x.account.currentBalance, 0),
      unverifiedCount: unverified.length,
      unverifiedTotal: unverified.reduce((s, e) => s + (e.netAmount || 0), 0),
      inQc: inQc.length,
      late: late.length,
    };
  }, [accounts, ledger, orders]);

  /* ---------- Recent activity: ledger, expenses and new cases, newest first ---------- */
  const feed = useMemo(() => {
    const accName = new Map(accounts.map((a) => [a.id, a.name]));
    const items: FeedItem[] = [];
    for (const e of ledger.slice(0, 30)) {
      const payment = e.transactionType === 'PAYMENT';
      items.push({
        id: `lg-${e.id}`,
        at: new Date(e.createdAt).getTime(),
        icon: payment ? CheckCircle2 : FileText,
        title: payment ? 'Collection received' : 'Invoice recorded',
        sub: [accName.get(e.clientAccountId) ?? 'Client account', e.orderId ? `Case ${e.orderId}` : null].filter(Boolean).join(' · '),
        amount: `${payment ? '+' : ''}${formatBDT(e.netAmount)}`,
        tone: payment ? 'in' : 'neutral',
      });
    }
    for (const x of expenses.slice(0, 10)) {
      items.push({
        id: `ex-${x.id}`,
        at: new Date(x.expenseDate).getTime(),
        icon: TrendingDown,
        title: x.title,
        sub: `Expense · ${EXPENSE_CATEGORY_META[x.category]?.label ?? 'Other'}`,
        amount: `-${formatBDT(x.amount)}`,
        tone: 'out',
      });
    }
    for (const o of orders.slice(0, 10)) {
      items.push({
        id: `or-${o.id}`,
        at: new Date(o.createdAt).getTime(),
        icon: Layers,
        title: `New case ${o.caseId}`,
        sub: o.customerName,
        amount: null,
        tone: 'neutral',
      });
    }
    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  }, [accounts, ledger, expenses, orders]);

  const attentionRows = [
    attention.overdue.length > 0 && {
      key: 'overdue',
      icon: Clock,
      title: `${attention.overdue.length} account${attention.overdue.length === 1 ? '' : 's'} unpaid for ${OVERDUE_DAYS}+ days`,
      sub: attention.overdue
        .slice(0, 2)
        .map((x) => `${x.account.name} (${x.days}d)`)
        .join(', '),
      value: formatBDT(attention.overdueTotal),
      href: can('dues') ? `${adminPath('dues')}?due=overdue` : undefined,
    },
    attention.unverifiedCount > 0 && {
      key: 'unverified',
      icon: ShieldCheck,
      title: `${attention.unverifiedCount} collection${attention.unverifiedCount === 1 ? '' : 's'} not yet verified`,
      sub: 'Recorded by collectors, waiting for accounts sign-off',
      value: formatBDT(attention.unverifiedTotal),
      href: can('dues') ? `${adminPath('dues')}?view=collections&status=unverified` : undefined,
    },
    attention.late > 0 && {
      key: 'late',
      icon: AlertCircle,
      title: `${attention.late} case${attention.late === 1 ? '' : 's'} past promised delivery`,
      sub: 'Not yet dispatched',
      value: null,
      href: can('orders') ? `${adminPath('orders')}?stage=late` : undefined,
    },
    attention.inQc > 0 && {
      key: 'qc',
      icon: Layers,
      title: `${attention.inQc} case${attention.inQc === 1 ? '' : 's'} in quality control`,
      sub: 'Ready to dispatch once checked',
      value: null,
      href: can('orders') ? `${adminPath('orders')}?stage=Quality%20Control` : undefined,
    },
  ].filter(Boolean) as {
    key: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    sub: string;
    value: string | null;
    href?: string;
  }[];

  return (
    <SectionFrame
      tab="overview"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={<MenuButton label="New" icon={Plus} items={newItems} />}
    >
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5 xl:gap-6">
        {/* Needs attention first on phones; right column on desktop */}
        <Panel
          className="xl:order-2 xl:col-span-2"
          title="Needs attention"
          action={attentionRows.length > 0 ? <Badge tone="warning">{attentionRows.length}</Badge> : undefined}
          bodyClassName="px-4 py-2 sm:px-5"
        >
          {attentionRows.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing needs attention">
              No overdue accounts, unverified collections or late cases.
            </EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {attentionRows.map((r) => (
                <ListRow
                  key={r.key}
                  leading={<r.icon size={16} className="shrink-0 text-amber-600" />}
                  title={r.title}
                  sub={r.sub}
                  value={r.value}
                  href={r.href}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          className="xl:order-1 xl:col-span-3"
          title="Recent activity"
          action={
            can('dues') ? (
              <a href={adminPath('dues')} className="text-table font-medium text-brand-600 hover:text-brand-700">
                Open ledger
              </a>
            ) : undefined
          }
          bodyClassName="px-4 py-1 sm:px-5"
        >
          {feed.length === 0 ? (
            <EmptyState icon={Inbox} title="No activity yet">
              Invoices, collections, expenses and new cases will appear here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {feed.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                    <item.icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-zinc-900">{item.title}</p>
                    <p className="truncate text-meta text-zinc-500">{item.sub}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.amount && (
                      <p
                        className={`text-body font-medium tabular-nums ${
                          item.tone === 'in' ? 'text-emerald-700' : item.tone === 'out' ? 'text-zinc-500' : 'text-zinc-900'
                        }`}
                      >
                        {item.amount}
                      </p>
                    )}
                    <p className="text-meta text-zinc-400 tabular-nums">
                      <span className="sm:hidden">
                        {new Date(item.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="hidden sm:inline">{formatDate(new Date(item.at).toISOString())}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </SectionFrame>
  );
}
