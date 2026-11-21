'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, ChevronRight, Moon, Plus, Search, SlidersHorizontal, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  ACTIVITY_LABEL, ACTIVITY_VALUES, CLIENT_PAGE_SIZES, DEFAULT_CLIENT_FILTERS, DORMANT_DAYS, clientFiltersToQuery, parseClientFilters,
  type ClientFilters, type ClientSort,
} from '@/lib/clients-filters';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Field, Input, Select } from '../_components/ui';
import { CLIENT_TYPES, CLIENT_TYPE_LABEL, type ClientType } from '../_lib/clients';
import { DIVISIONS, DIVISION_LABEL } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent } from '../_lib/types';
import { apiError, formatBDT, formatDay } from '../_lib/utils';
import { AccountDialog } from '../dues/forms';
import { ClientProfile } from './ClientProfile';

type Row = ErpAccount & { type: ClientType; chairmanChannel: boolean; caseCount: number; lastCaseAt: string | null };
type Summary = { total: number; newThisMonth: number; dormant: number; owing: number; totalDue: number };

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
const activeCount = (f: ClientFilters) => [f.q, f.type, f.division, f.agent, f.activity].filter(Boolean).length;
const daysAgo = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : null);

export default function ClientsPage() {
  const { me, adminFetch } = useAdmin();
  const seeAll = me.permissions.includes('clients.view');
  const canCreate = me.permissions.includes('clients.create');
  const canEdit = me.permissions.includes('clients.edit');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ total: 0, newThisMonth: 0, dormant: 0, owing: 0, totalDue: 0 });
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS);
  const [ready, setReady] = useState(false);
  const [qInput, setQInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  /** undefined = closed, null = adding, an account = editing */
  const [dialog, setDialog] = useState<ErpAccount | null | undefined>(undefined);
  const [profileKey, setProfileKey] = useState(0);
  const seq = useRef(0);

  const patch = useCallback((p: Partial<ClientFilters>) => setFilters((f) => ({ ...f, page: 1, ...p })), []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const f = parseClientFilters(p);
    setFilters(f);
    setQInput(f.q);
    if (f.division || f.agent || f.activity) setShowFilters(true);
    const open = p.get('client');
    if (open) setOpenId(open);
    if (p.get('new') === '1' && canCreate) setDialog(null);
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    const qs = clientFiltersToQuery(filters);
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [filters, ready]);

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
        const res = await adminFetch(`/api/admin/erp/clients?${clientFiltersToQuery(filters)}`);
        if (res.status === 401 || mine !== seq.current) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return void toast.error(apiError(body, 'Failed to load clients'));
        setRows(body.clients ?? []);
        setTotal(body.total ?? 0);
        setSummary(body.summary);
        if (Array.isArray(body.agents) && body.agents.length) setAgents(body.agents);
        if (body.page && body.page !== filters.page) setFilters((f) => ({ ...f, page: body.page }));
        setLastSyncedAt(Date.now());
      } catch {
        if (mine === seq.current) toast.error('Failed to load clients');
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

  const kpis: Kpi[] = [
    { label: 'Clients', value: String(summary.total), icon: Building2, sub: seeAll ? 'In the account book' : 'Assigned to you' },
    { label: 'New this month', value: String(summary.newThisMonth), icon: Sparkles, sub: 'Accounts added' },
    { label: `No case ${DORMANT_DAYS}+ days`, value: String(summary.dormant), icon: Moon, sub: 'Worth a call', subTone: summary.dormant ? 'down' : 'neutral' },
    { label: 'Owe money', value: String(summary.owing), icon: Wallet, sub: `${formatBDT(summary.totalDue)} in total` },
  ];

  const setSort = (key: ClientSort) =>
    patch(filters.sort === key ? { dir: filters.dir === 'asc' ? 'desc' : 'asc' } : { sort: key, dir: key === 'name' ? 'asc' : 'desc' });
  const sortHead = (key: ClientSort, label: string, cls: string) => {
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

  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');
  const nActive = activeCount(filters);
  const clearAll = () => {
    setQInput('');
    setFilters({ ...DEFAULT_CLIENT_FILTERS, sort: filters.sort, dir: filters.dir, size: filters.size });
  };
  const lastCase = (r: Row) => {
    const d = daysAgo(r.lastCaseAt);
    if (d === null) return <span className="text-zinc-400">Never</span>;
    return (
      <span className={d >= DORMANT_DAYS ? 'text-amber-700' : 'text-zinc-700'} title={formatDay(r.lastCaseAt)}>
        {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`}
      </span>
    );
  };
  const area = (r: Row) => [r.district, DIVISION_LABEL[r.division] ?? r.division].filter(Boolean).join(', ');

  return (
    <SectionFrame
      tab="clients"
      kpis={kpis}
      loading={loading && rows.length === 0}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => void fetchList(true)}
      actions={
        canCreate ? (
          <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
            <span className="hidden sm:inline">Add client</span>
            <span className="sm:hidden">Add</span>
          </Button>
        ) : undefined
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="space-y-2 border-b border-zinc-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search name, owner, phone or area" aria-label="Search clients" className="pl-9" />
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
                    patch({ sort: sort as ClientSort, dir: dir as 'asc' | 'desc' });
                  }}
                >
                  <option value="name:asc">Name A–Z</option>
                  <option value="recent:desc">Latest case first</option>
                  <option value="recent:asc">Longest without a case</option>
                  <option value="balance:desc">Owes the most</option>
                  <option value="cases:desc">Most cases</option>
                  <option value="created:desc">Newest client</option>
                </Select>
              </div>
              <div className="w-[9.5rem] shrink-0">
                <Select aria-label="Clients per page" value={String(filters.size)} onChange={(e) => patch({ size: Number(e.target.value) })}>
                  {CLIENT_PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div role="radiogroup" aria-label="Filter by type" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            <button type="button" role="radio" aria-checked={!filters.type} onClick={() => patch({ type: '' })} className={chip(!filters.type)}>
              All types
            </button>
            {CLIENT_TYPES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={filters.type === t} onClick={() => patch({ type: t })} className={chip(filters.type === t)}>
                {CLIENT_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-lg bg-zinc-50 p-3 sm:grid-cols-3">
              <Field label="Division" htmlFor="cf-division">
                <Select id="cf-division" value={filters.division} onChange={(e) => patch({ division: e.target.value })}>
                  <option value="">All divisions</option>
                  {DIVISIONS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {seeAll && (
                <Field label="Field agent" htmlFor="cf-agent">
                  <Select id="cf-agent" value={filters.agent} onChange={(e) => patch({ agent: e.target.value })}>
                    <option value="">All agents</option>
                    <option value="none">Not assigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Activity" htmlFor="cf-activity">
                <Select id="cf-activity" value={filters.activity} onChange={(e) => patch({ activity: e.target.value as ClientFilters['activity'] })}>
                  <option value="">Any</option>
                  {ACTIVITY_VALUES.map((a) => (
                    <option key={a} value={a}>
                      {ACTIVITY_LABEL[a]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Building2} title={loading ? 'Loading clients…' : nActive ? 'No clients match' : 'No clients yet'}>
            {loading ? null : nActive ? (
              <button type="button" className="font-medium text-brand-700 hover:underline" onClick={clearAll}>
                Clear the filters
              </button>
            ) : canCreate ? (
              'Add your first client with the Add client button.'
            ) : null}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  {sortHead('name', 'Client', 'px-4')}
                  <th scope="col" className="hidden w-[170px] px-3 py-2.5 font-medium lg:table-cell">
                    Area · agent
                  </th>
                  {sortHead('recent', 'Last case', 'w-[120px] px-3')}
                  {sortHead('cases', 'Cases', 'w-[90px] px-3')}
                  {sortHead('balance', 'Owes', 'w-[120px] px-3 text-right')}
                  <th className="w-10 py-2.5" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setOpenId(r.id)} className="group cursor-pointer hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(r.id);
                        }}
                        className="block max-w-full truncate text-left text-body font-medium text-zinc-900 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {r.name}
                      </button>
                      <p className="truncate text-meta text-zinc-500">
                        {r.ownerName} · {CLIENT_TYPE_LABEL[r.type]} · <span className="font-mono">{r.phone}</span>
                        {r.chairmanChannel && ' · Chairman channel'}
                      </p>
                    </td>
                    <td className="hidden px-3 py-2.5 text-table lg:table-cell">
                      <p className="truncate text-zinc-700">{area(r) || '—'}</p>
                      <p className="truncate text-meta text-zinc-500">{r.assignedAgentName ?? 'Not assigned'}</p>
                    </td>
                    <td className="px-3 py-2.5 text-table tabular-nums">{lastCase(r)}</td>
                    <td className="px-3 py-2.5 text-table tabular-nums text-zinc-700">{r.caseCount}</td>
                    <td className={cx('px-3 py-2.5 text-right text-table tabular-nums', r.currentBalance > 0 ? 'font-medium text-rose-700' : 'text-zinc-500')}>{formatBDT(r.currentBalance)}</td>
                    <td className="py-2.5 pr-3 text-right">
                      <ChevronRight size={16} className="inline text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-zinc-100 md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setOpenId(r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{r.name}</p>
                      <p className="truncate text-meta text-zinc-500">
                        {r.ownerName} · {CLIENT_TYPE_LABEL[r.type]}
                        {area(r) ? ` · ${area(r)}` : ''}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-meta text-zinc-600">
                        {r.caseCount} {r.caseCount === 1 ? 'case' : 'cases'} · last {lastCase(r)}
                        {r.currentBalance > 0 && <Badge tone="danger">Owes {formatBDT(r.currentBalance)}</Badge>}
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-zinc-300" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="px-4 pb-4">
          <Pager page={filters.page} total={total} perPage={filters.size} onPage={(p) => setFilters((f) => ({ ...f, page: p }))} noun={total === 1 ? 'client' : 'clients'} />
        </div>
      </div>

      {openId && (
        <ClientProfile
          key={`${openId}:${profileKey}`}
          id={openId}
          canEdit={canEdit}
          onEdit={(a) => setDialog(a)}
          onClose={() => setOpenId(null)}
        />
      )}

      {dialog !== undefined && (
        <AccountDialog
          editing={dialog}
          agents={agents}
          defaultDivision={filters.division || 'DHAKA'}
          onClose={() => setDialog(undefined)}
          onSaved={() => {
            void fetchList(true);
            setProfileKey((k) => k + 1);
          }}
        />
      )}
    </SectionFrame>
  );
}
