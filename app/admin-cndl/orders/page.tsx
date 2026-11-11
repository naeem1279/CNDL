'use client';
import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, CheckCheck, ChevronRight, FlaskConical, Layers, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, Select } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent, ErpLedgerEntry, Order, ServiceRow } from '../_lib/types';
import { apiError, bdMonthKey, formatBDT, formatDay, parseClinical } from '../_lib/utils';
import { CasePanel } from './CasePanel';
import { LINE, STAGES, casePermissions, dispatchBills, dueThisWeek, isLate, isOpen, stageOf } from './cases';
import { NewCaseDialog } from './NewCaseDialog';

type StageFilter = 'open' | 'late' | 'all' | string;
type Sort = 'newest' | 'due';
const PER_PAGE = 20;
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

export default function OrdersPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const perm = casePermissions(me.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);

  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('open');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['data', 'accounts', 'services', 'ledger'], me.role);
      if (!r) return;
      if (r.orders) setOrders(r.orders);
      if (r.accounts) setAccounts(r.accounts);
      if (r.agents) setAgents(r.agents);
      if (r.services) setServices(r.services);
      if (r.ledger) setLedger(r.ledger);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load lab cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep links: ?new=1 (Overview "Submit a case"), ?stage=late|open|<stage>, ?case=<caseId>.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    if (p.get('new') === '1' && perm.canCreate) setNewOpen(true);
    const st = p.get('stage');
    if (st) setStageFilter(st);
    const cs = p.get('case');
    if (cs) setQuery(cs);
    window.history.replaceState(null, '', window.location.pathname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [query, stageFilter, sort]);

  /* --------------------------------------------------------- derived */

  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const agentName = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    const qDigits = q.replace(/\D/g, '');
    return orders.filter((o) => {
      const c = parseClinical(o.productType);
      const text = [o.caseId, o.customerName, o.clinicName, c.patient, c.work, c.teeth].some((v) => (v || '').toLowerCase().includes(q));
      return text || (qDigits.length >= 3 && o.phone.replace(/\D/g, '').includes(qDigits));
    });
  }, [orders, query]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { open: 0, late: 0, all: searched.length };
    for (const o of searched) {
      const s = stageOf(o.status).value;
      m[s] = (m[s] || 0) + 1;
      if (isOpen(o)) m.open++;
      if (isLate(o)) m.late++;
    }
    return m;
  }, [searched]);

  const filtered = useMemo(() => {
    const list = searched.filter((o) =>
      stageFilter === 'all' ? true : stageFilter === 'open' ? isOpen(o) : stageFilter === 'late' ? isLate(o) : stageOf(o.status).value === stageFilter
    );
    if (sort === 'due') {
      const t = (o: Order) => (o.deliveryDate ? new Date(o.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER);
      return [...list].sort((a, b) => t(a) - t(b));
    }
    return list; // the API returns newest first
  }, [searched, stageFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const curPage = Math.min(page, pages);
  const pageRows = filtered.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  const open = orders.filter(isOpen);
  const late = orders.filter(isLate);
  const thisWeek = orders.filter(dueThisWeek);
  const inQc = orders.filter((o) => stageOf(o.status).value === 'Quality Control');
  const month = bdMonthKey(new Date().toISOString());
  const dispatchedThisMonth = orders.filter((o) => ['Dispatched', 'Delivered'].includes(stageOf(o.status).value) && bdMonthKey(o.updatedAt) === month);

  const kpis: Kpi[] = [
    { label: 'In the lab', value: String(open.length), icon: Layers, sub: `${thisWeek.length} due this week` },
    { label: 'Late', value: String(late.length), icon: AlarmClock, sub: 'Past due date', subTone: late.length ? 'down' : 'neutral' },
    { label: 'In quality control', value: String(inQc.length), icon: FlaskConical, sub: 'Next to dispatch' },
    { label: 'Dispatched', value: String(dispatchedThisMonth.length), icon: CheckCheck, sub: 'This month' },
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
      const ok = await askConfirm(`Mark ${o.caseId} as cancelled? It leaves the production line.`, {
        title: 'Cancel this case?',
        confirmLabel: 'Cancel case',
      });
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
      if (bill > 0) void fetchData(true); // pick up the new invoice
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
      setOrders((prev) => prev.filter((x) => x.id !== o.id));
      setOpenId(null);
      toast.success(`Case ${o.caseId} deleted`);
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

  /* ------------------------------------------------------------ bits */

  const chips: { key: StageFilter; label: string; dot?: string }[] = [
    { key: 'open', label: 'In the lab' },
    { key: 'late', label: 'Late' },
    ...LINE.map((s) => ({ key: s.value, label: s.label, dot: s.dot })),
    { key: 'Delivered', label: 'Delivered' },
    { key: 'all', label: 'All' },
  ];
  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');

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
  const filtersOn = query.trim() !== '' || stageFilter !== 'open';

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="orders"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        perm.canCreate ? (
          <Button variant="primary" icon={Plus} onClick={() => setNewOpen(true)}>
            <span className="hidden sm:inline">New case</span>
            <span className="sm:hidden">New</span>
          </Button>
        ) : undefined
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="space-y-2 border-b border-zinc-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case ID, doctor, patient or phone" aria-label="Search cases" className="pl-9" />
            </div>
            <div className="w-full sm:ml-auto sm:w-48">
              <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="newest">Newest first</option>
                <option value="due">Delivery date first</option>
              </Select>
            </div>
          </div>
          <div role="radiogroup" aria-label="Filter by stage" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {chips.map((c) => (
              <button key={c.key} type="button" role="radio" aria-checked={stageFilter === c.key} onClick={() => setStageFilter(c.key)} className={chip(stageFilter === c.key)}>
                {c.dot && <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />}
                {c.label}
                <span className={cx('tabular-nums', stageFilter === c.key ? 'text-zinc-300' : 'text-zinc-400')}>{counts[c.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {pageRows.length === 0 ? (
          <EmptyState icon={Layers} title={orders.length ? 'No cases match' : 'No cases yet'}>
            {orders.length && filtersOn ? (
              <button
                type="button"
                className="font-medium text-brand-700 hover:underline"
                onClick={() => {
                  setQuery('');
                  setStageFilter('all');
                }}
              >
                Show all cases
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
                  <th className="w-[150px] px-4 py-2.5 font-medium">Case</th>
                  <th className="px-3 py-2.5 font-medium">Doctor · work</th>
                  <th className="w-[110px] px-3 py-2.5 font-medium">Delivery</th>
                  <th className="w-[160px] px-3 py-2.5 font-medium">Stage</th>
                  <th className="w-10 py-2.5" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pageRows.map((o) => (
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
                    <td className="py-2.5 pr-3 text-right">
                      <ChevronRight size={16} className="inline text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-zinc-100 md:hidden">
              {pageRows.map((o) => {
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
          <Pager page={curPage} total={filtered.length} perPage={PER_PAGE} onPage={setPage} noun={filtered.length === 1 ? 'case' : 'cases'} />
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
          agents={agents}
          services={services}
          onAccountCreated={(a) => setAccounts((prev) => [a, ...prev])}
          onClose={() => setNewOpen(false)}
          onSaved={(caseId) => {
            setStageFilter('open');
            setQuery(caseId);
            void fetchData(true);
          }}
        />
      )}
    </SectionFrame>
  );
}
