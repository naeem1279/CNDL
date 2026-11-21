'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlarmClock, ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Download, FlaskConical, Layers, Plus, Search, SlidersHorizontal, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  BILLING_LABEL, BILLING_VALUES, CATEGORIES, DEFAULT_FILTERS, PAGE_SIZES, SOURCE_VALUES, filtersToQuery, parseOrderFilters,
  type OrderFilters, type SortKey,
} from '@/lib/orders-filters';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Field, Input, Select } from '../_components/ui';
import { ORDER_SOURCE_META } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent, ErpLedgerEntry, Order, ServiceRow } from '../_lib/types';
import { apiError, formatBDT, formatDay, parseClinical } from '../_lib/utils';
import { CasePanel } from './CasePanel';
import { LINE, STAGES, casePermissions, dispatchBills, isLate, stageOf } from './cases';
import { NewCaseDialog } from './NewCaseDialog';
import { Approvals } from './Approvals';

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
type Summary = { count: number; open: number; late: number; billed: number | null; commission: number | null };

/** Filters that are not the default (the "Clear" button and the active-filter count use this). */
const activeCount = (f: OrderFilters) =>
  [f.q, f.stage !== DEFAULT_FILTERS.stage, f.from, f.to, f.client, f.agent, f.category, f.billing, f.source].filter(Boolean).length;

export default function OrdersPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const perm = casePermissions(me.permissions);
  const canMoney = me.permissions.includes('cases.view_money');
  const canExport = me.permissions.includes('exports.run'); // locked: Super Admin only

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ count: 0, open: 0, late: 0, billed: null, commission: null });
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);

  // The filters live in the URL, so a filtered view can be bookmarked or shared.
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [ready, setReady] = useState(false);
  const [qInput, setQInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const seq = useRef(0);

  const patch = useCallback((p: Partial<OrderFilters>) => setFilters((f) => ({ ...f, page: 1, ...p })), []);

  // Read the URL once. Older deep links still work: ?stage=late, ?case=<id>, ?new=1.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const f = parseOrderFilters(p);
    const cs = p.get('case');
    if (cs) f.q = cs.slice(0, 100);
    setFilters(f);
    setQInput(f.q);
    if (activeCount(f) > (f.q ? 1 : 0) + (f.stage !== DEFAULT_FILTERS.stage ? 1 : 0)) setShowFilters(true);
    if (p.get('new') === '1' && perm.canCreate) setNewOpen(true);
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the URL in step with the filters (no navigation, no history entry per keystroke).
  useEffect(() => {
    if (!ready) return;
    const qs = filtersToQuery(filters);
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [filters, ready]);

  // Search box: wait for a pause in typing before asking the server.
  useEffect(() => {
    if (!ready || qInput.trim() === filters.q) return;
    const t = setTimeout(() => patch({ q: qInput.trim() }), 300);
    return () => clearTimeout(t);
  }, [qInput, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchList = useCallback(
    async (isRefresh = false) => {
      const mine = ++seq.current;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await adminFetch(`/api/admin/erp/orders?${filtersToQuery(filters)}`);
        if (res.status === 401 || mine !== seq.current) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return void toast.error(apiError(body, 'Failed to load lab cases'));
        setOrders(body.orders ?? []);
        setTotal(body.total ?? 0);
        setSummary(body.summary);
        if (body.page && body.page !== filters.page) setFilters((f) => ({ ...f, page: body.page }));
        setLastSyncedAt(Date.now());
      } catch {
        if (mine === seq.current) toast.error('Failed to load lab cases');
      } finally {
        if (mine === seq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [adminFetch, filters]
  );

  useEffect(() => {
    if (ready) void fetchList();
  }, [ready, fetchList]);

  // Reference data for names, the new-case form and the dispatch-bill check (loaded once).
  const loadRefs = useCallback(async () => {
    try {
      const r = await loadResources(adminFetch, ['accounts', 'services', 'ledger'], me);
      if (!r) return;
      if (r.accounts) setAccounts(r.accounts);
      if (r.agents) setAgents(r.agents);
      if (r.services) setServices(r.services);
      if (r.ledger) setLedger(r.ledger);
    } catch {
      /* names fall back to what the case itself stores */
    }
  }, [adminFetch, me]);
  useEffect(() => {
    void loadRefs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------------------------------------- derived */

  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const agentName = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);
  const sortedAccounts = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name)), [accounts]);

  const kpis: Kpi[] = [
    { label: 'Matching cases', value: String(summary.count), icon: Layers, sub: activeCount(filters) ? 'With the filters below' : 'In the lab' },
    { label: 'In the lab', value: String(summary.open), icon: FlaskConical, sub: 'Not yet dispatched' },
    { label: 'Late', value: String(summary.late), icon: AlarmClock, sub: 'Past due date', subTone: summary.late ? 'down' : 'neutral' },
    ...(summary.billed !== null ? [{ label: 'Billed amount', value: formatBDT(summary.billed), icon: Wallet, sub: 'Of the matching cases' } as Kpi] : []),
  ];

  /* ---------------------------------------------------------- writes */

  const moveStage = async (o: Order, value: string) => {
    const from = stageOf(o.status);
    const to = STAGES.find((s) => s.value === value);
    if (!to || from.value === value) return;
    const bill = value === 'Dispatched' ? dispatchBills(o, ledger) : 0;
    if (bill > 0) {
      const ok = await askConfirm(
        `Dispatching ${o.caseId} adds its bill of ${formatBDT(bill)} to ${accountName.get(o.clientAccountId || '') || 'the client'}'s dues.`,
        { title: 'Dispatch and bill?', confirmLabel: `Dispatch and bill ${formatBDT(bill)}`, tone: 'primary' }
      );
      if (!ok) return;
    }
    if (value === 'Cancelled') {
      const ok = await askConfirm(`Mark ${o.caseId} as cancelled? It leaves the production line.`, { title: 'Cancel this case?', confirmLabel: 'Cancel case' });
      if (!ok) return;
    }
    setSavingId(o.id);
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: to.value, progress: to.progress } : x)));
    try {
      const res = await adminFetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, status: to.value, progress: to.progress }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)));
        toast.error(apiError(body, 'Could not change the stage'));
        return;
      }
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, ...body } : x)));
      toast.success(`${o.caseId} moved to ${to.value === 'Quality Control' ? 'quality control' : to.label}${bill > 0 ? ` · ${formatBDT(bill)} billed` : ''}`);
      void fetchList(true); // the case may now belong to a different filter, and the counts changed
      if (bill > 0) void loadRefs(); // pick up the new invoice
    } catch {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)));
      toast.error('Network error — the stage was not changed');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (o: Order) => {
    if (!(await askConfirm(`Delete case ${o.caseId}? This cannot be undone. Any invoice already in Client Dues stays there.`))) return;
    try {
      const res = await adminFetch(`/api/admin/data?id=${encodeURIComponent(o.id)}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the case'));
      setOpenId(null);
      toast.success(`Case ${o.caseId} deleted`);
      void fetchList(true);
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const copy = async (o: Order) => {
    try {
      await navigator.clipboard.writeText(o.caseId);
      setCopiedId(o.id);
      setTimeout(() => setCopiedId((id) => (id === o.id ? null : id)), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  /** Super Admin only (the server enforces it; the button is just not shown to anyone else). */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminFetch(`/api/admin/erp/orders/export?${filtersToQuery(filters, { withPaging: false })}`);
      if (res.status === 401) return handleAuthLoss();
      if (!res.ok) return void toast.error(apiError(await res.json().catch(() => ({})), 'Could not export the cases'));
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] ?? 'cndl-cases.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${total} ${total === 1 ? 'case' : 'cases'} · ${name}`);
    } catch {
      toast.error('Network error — nothing was exported');
    } finally {
      setExporting(false);
    }
  };

  /* ------------------------------------------------------------ bits */

  const chips: { key: string; label: string; dot?: string }[] = [
    { key: 'open', label: 'In the lab' },
    { key: 'late', label: 'Late' },
    ...LINE.map((s) => ({ key: s.value, label: s.label, dot: s.dot })),
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Cancelled', label: 'Cancelled' },
    { key: 'all', label: 'All' },
  ];
  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');

  const setSort = (key: SortKey) =>
    patch(filters.sort === key ? { dir: filters.dir === 'asc' ? 'desc' : 'asc' } : { sort: key, dir: key === 'case' || key === 'client' || key === 'due' ? 'asc' : 'desc' });
  const sortHead = (key: SortKey, label: string, cls: string) => {
    const on = filters.sort === key;
    const Icon = !on ? ArrowUpDown : filters.dir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th scope="col" aria-sort={on ? (filters.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cx('py-1 font-medium', cls)}>
        <button
          type="button"
          onClick={() => setSort(key)}
          className={cx('-ml-2 inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40', on && 'text-zinc-900')}
        >
          {label}
          <Icon size={13} aria-hidden="true" className={on ? 'text-zinc-700' : 'text-zinc-300'} />
        </button>
      </th>
    );
  };

  const stageCell = (o: Order) => {
    const s = stageOf(o.status);
    if (!perm.canMove) {
      return (
        <span className="inline-flex items-center gap-1.5 text-table text-zinc-700">
          <span aria-hidden="true" className={cx('h-2 w-2 rounded-full', s.dot)} />
          {s.label}
        </span>
      );
    }
    return (
      <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
        <span aria-hidden="true" className={cx('pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full', s.dot)} />
        <select
          aria-label={`Stage for ${o.caseId}`}
          value={s.value}
          disabled={savingId === o.id}
          onChange={(e) => void moveStage(o, e.target.value)}
          className="h-8 w-[8.5rem] appearance-none rounded-md border border-zinc-200 bg-white pl-6 pr-6 text-table font-medium text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
        >
          {!STAGES.some((x) => x.value === s.value) && <option value={s.value}>{s.label}</option>}
          {STAGES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
      </span>
    );
  };

  const work = (o: Order) => {
    const c = parseClinical(o.productType);
    return [c.work, c.teeth && `Teeth ${c.teeth}`, c.shade && `Shade ${c.shade}`].filter(Boolean).join(' · ');
  };
  const who = (o: Order) => o.clinicName || o.customerName;
  const patient = (o: Order) => parseClinical(o.productType).patient || o.patientName;
  const dueCell = (o: Order) =>
    o.deliveryDate ? (
      <span className={cx('tabular-nums', isLate(o) ? 'font-medium text-rose-700' : 'text-zinc-700')}>{formatDay(o.deliveryDate)}</span>
    ) : (
      <span className="text-zinc-400">—</span>
    );

  const openOrder = openId ? orders.find((o) => o.id === openId) : undefined;
  const nActive = activeCount(filters);
  const clearAll = () => {
    setQInput('');
    setFilters({ ...DEFAULT_FILTERS, sort: filters.sort, dir: filters.dir, size: filters.size });
  };
  const pageSizeSelect = (
    <div className="w-[8.5rem] shrink-0">
    <Select aria-label="Cases per page" value={String(filters.size)} onChange={(e) => patch({ size: Number(e.target.value) })}>
      {PAGE_SIZES.map((n) => (
        <option key={n} value={n}>
          {n} per page
        </option>
      ))}
    </Select>
    </div>
  );

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="orders"
      kpis={kpis}
      loading={loading && orders.length === 0}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => {
        void fetchList(true);
        void loadRefs();
      }}
      actions={
        <>
          {canExport && (
            <Button variant="secondary" icon={Download} onClick={() => void exportCsv()} disabled={exporting || total === 0}>
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export CSV'}</span>
              <span className="sm:hidden">{exporting ? '…' : 'CSV'}</span>
            </Button>
          )}
          {perm.canCreate && (
            <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
              <span className="hidden sm:inline">New case</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </>
      }
    >
      {perm.canCreate && (
        <Approvals
          onDecided={() => {
            void fetchList(true);
            void loadRefs();
          }}
        />
      )}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="space-y-2 border-b border-zinc-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search case ID, doctor, patient or phone" aria-label="Search cases" className="pl-9" />
            </div>
            <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              Filters{nActive ? ` · ${nActive}` : ''}
            </Button>
            {nActive > 0 && (
              <Button variant="ghost" onClick={clearAll}>
                Clear
              </Button>
            )}
            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <div className="min-w-0 flex-1 sm:w-48 sm:flex-none md:hidden">
              <Select
                aria-label="Sort"
                value={`${filters.sort}:${filters.dir}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split(':');
                  patch({ sort: sort as SortKey, dir: dir as 'asc' | 'desc' });
                }}
              >
                <option value="created:desc">Newest first</option>
                <option value="created:asc">Oldest first</option>
                <option value="due:asc">Delivery date first</option>
                <option value="client:asc">Doctor A–Z</option>
                {canMoney && <option value="amount:desc">Highest amount</option>}
              </Select>
              </div>
              {pageSizeSelect}
            </div>
          </div>

          <div role="radiogroup" aria-label="Filter by stage" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {chips.map((c) => (
              <button key={c.key} type="button" role="radio" aria-checked={filters.stage === c.key} onClick={() => patch({ stage: c.key })} className={chip(filters.stage === c.key)}>
                {c.dot && <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />}
                {c.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-lg bg-zinc-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Received from" htmlFor="of-from">
                <Input id="of-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => patch({ from: e.target.value })} />
              </Field>
              <Field label="Received to" htmlFor="of-to">
                <Input id="of-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => patch({ to: e.target.value })} />
              </Field>
              <Field label="Client" htmlFor="of-client">
                <Select id="of-client" value={filters.client} onChange={(e) => patch({ client: e.target.value })}>
                  <option value="">All clients</option>
                  {sortedAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {me.permissions.includes('cases.view') ? (
                <Field label="Agent" htmlFor="of-agent">
                  <Select id="of-agent" value={filters.agent} onChange={(e) => patch({ agent: e.target.value })}>
                    <option value="">All agents</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              <Field label="Type of work" htmlFor="of-category" hint="Worked out from the work description">
                <Select id="of-category" value={filters.category} onChange={(e) => patch({ category: e.target.value })}>
                  <option value="">All work</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                  <option value="other">Other work</option>
                </Select>
              </Field>
              {canMoney && (
                <Field label="Billing" htmlFor="of-billing">
                  <Select id="of-billing" value={filters.billing} onChange={(e) => patch({ billing: e.target.value as OrderFilters['billing'] })}>
                    <option value="">Any</option>
                    {BILLING_VALUES.map((b) => (
                      <option key={b} value={b}>
                        {BILLING_LABEL[b]}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="How it arrived" htmlFor="of-source">
                <Select id="of-source" value={filters.source} onChange={(e) => patch({ source: e.target.value })}>
                  <option value="">Any source</option>
                  {SOURCE_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_SOURCE_META[s]?.label ?? s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState icon={Layers} title={loading ? 'Loading cases…' : nActive ? 'No cases match' : 'No cases yet'}>
            {loading ? null : nActive ? (
              <button type="button" className="font-medium text-brand-700 hover:underline" onClick={clearAll}>
                Clear the filters
              </button>
            ) : (
              'Cases from the website and the New case form appear here.'
            )}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  {sortHead('created', 'Case', 'w-[150px] px-4')}
                  {sortHead('client', 'Doctor · work', 'px-3')}
                  {sortHead('due', 'Delivery', 'w-[110px] px-3')}
                  {sortHead('stage', 'Stage', 'w-[160px] px-3')}
                  {canMoney && sortHead('amount', 'Amount', 'hidden w-[110px] px-3 text-right lg:table-cell')}
                  <th className="w-10 py-2.5" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className="group cursor-pointer hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(o.id);
                        }}
                        className="font-mono text-table font-medium text-zinc-900 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {o.caseId}
                      </button>
                      <p className="text-meta text-zinc-500 tabular-nums">{formatDay(o.orderDate || o.createdAt)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="truncate text-body font-medium text-zinc-900">{who(o)}</p>
                      <p className="truncate text-meta text-zinc-500" title={[patient(o), work(o)].filter(Boolean).join(' · ')}>
                        {[patient(o), work(o)].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-table">
                      {dueCell(o)}
                      {isLate(o) && <span className="block text-meta text-rose-700">Late</span>}
                    </td>
                    <td className="px-3 py-2.5">{stageCell(o)}</td>
                    {canMoney && <td className="hidden px-3 py-2.5 text-right text-table lg:table-cell tabular-nums text-zinc-700">{o.billedAmount ? formatBDT(o.billedAmount) : <span className="text-zinc-400">—</span>}</td>}
                    <td className="py-2.5 pr-3 text-right">
                      <ChevronRight size={16} className="inline text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-zinc-100 md:hidden">
              {orders.map((o) => {
                const s = stageOf(o.status);
                return (
                  <li key={o.id}>
                    <button type="button" onClick={() => setOpenId(o.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{who(o)}</p>
                        <p className="truncate text-meta text-zinc-500">
                          <span className="font-mono">{o.caseId}</span>
                          {work(o) ? ` · ${work(o)}` : ''}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-meta text-zinc-600">
                          <span aria-hidden="true" className={cx('h-2 w-2 rounded-full', s.dot)} />
                          {s.label}
                          {o.deliveryDate && <span className={isLate(o) ? 'text-rose-700' : 'text-zinc-400'}>· due {formatDay(o.deliveryDate)}</span>}
                          {isLate(o) && <Badge tone="danger">Late</Badge>}
                          {canMoney && o.billedAmount ? <span className="text-zinc-500">· {formatBDT(o.billedAmount)}</span> : null}
                        </p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-zinc-300" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <div className="px-4 pb-4">
          <Pager page={filters.page} total={total} perPage={filters.size} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} noun={total === 1 ? 'case' : 'cases'} />
        </div>
      </div>

      {openOrder && (
        <CasePanel
          key={openOrder.id}
          order={openOrder}
          accountName={openOrder.clientAccountId ? accountName.get(openOrder.clientAccountId) ?? null : null}
          agentName={openOrder.agentId ? agentName.get(openOrder.agentId) ?? null : null}
          canMove={perm.canMove}
          canDelete={perm.canDelete}
          saving={savingId === openOrder.id}
          copied={copiedId === openOrder.id}
          onStage={(v) => void moveStage(openOrder, v)}
          onCopy={() => void copy(openOrder)}
          onDelete={() => void remove(openOrder)}
          onClose={() => setOpenId(null)}
        />
      )}

      {newOpen && (
        <NewCaseDialog
          accounts={accounts}
          ledger={ledger}
          agents={agents}
          services={services}
          onAccountCreated={(a) => setAccounts((prev) => [a, ...prev])}
          onClose={() => setNewOpen(false)}
          onSaved={(caseId) => {
            setQInput(caseId);
            setFilters({ ...DEFAULT_FILTERS, q: caseId, stage: 'all', size: filters.size });
          }}
        />
      )}
    </SectionFrame>
  );
}
