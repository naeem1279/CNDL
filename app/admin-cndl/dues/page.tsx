'use client';
import { useEffect, useMemo, useState } from 'react';
import { AlarmClock, BadgeCheck, ChevronRight, Landmark, MessageSquare, Plus, Search, Users, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, Segmented, Select } from '../_components/ui';
import { ACCOUNTS_PER_PAGE, DIVISIONS, PAYMENT_METHODS } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent, ErpLedgerEntry, ErpUser } from '../_lib/types';
import { apiError, formatBDT, formatDay, readPref } from '../_lib/utils';
import { AccountPanel, AgingBadge, agingDays, entryTime, reminderHref } from './AccountPanel';
import { AccountDialog, CollectionDialog, InvoiceDialog, duesPermissions } from './forms';

type View = 'accounts' | 'collections';
type DueFilter = 'all' | 'owes' | 'overdue' | 'settled';
type Sort = 'due' | 'age' | 'name';
type Dialog = { kind: 'invoice' | 'collect'; account: ErpAccount } | { kind: 'account'; account: ErpAccount | null } | null;
const OVERDUE_DAYS = 30;
const COLLECTION_PAGE = 25;
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

export default function DuesPage() {
  const { me, adminFetch, handleAuthLoss } = useAdmin();
  const perm = duesPermissions(me.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);

  const [view, setView] = useState<View>(() => (readPref('cndl-admin-dues-view') === 'collections' ? 'collections' : 'accounts'));
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [sort, setSort] = useState<Sort>('due');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [method, setMethod] = useState('ALL');
  const [status, setStatus] = useState<'all' | 'unverified' | 'verified'>('all');
  const [collPage, setCollPage] = useState(1);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'ledger', 'users'], me.role);
      if (!r) return;
      if (r.accounts) setAccounts(r.accounts);
      if (r.agents) setAgents(r.agents);
      if (r.ledger) setLedger(r.ledger);
      if (r.users) setUsers(r.users);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load client dues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep links from Overview: ?view=collections&status=unverified, ?due=overdue, ?new=1.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    if (p.get('view') === 'collections') setView('collections');
    if (p.get('view') === 'accounts' || p.get('due')) setView('accounts');
    const st = p.get('status');
    if (st === 'unverified' || st === 'verified') setStatus(st);
    const due = p.get('due');
    if (due === 'owes' || due === 'overdue' || due === 'settled') {
      setDueFilter(due);
      setSort(due === 'overdue' ? 'age' : 'due');
    }
    if (p.get('new') === '1') setDialog({ kind: 'account', account: null });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-dues-view', view);
    } catch {
      /* private mode */
    }
  }, [view]);

  useEffect(() => setPage(1), [query, division, agentFilter, dueFilter, sort]);
  useEffect(() => setCollPage(1), [from, to, method, status]);

  /* --------------------------------------------------------- derived */

  const visible = useMemo(
    () => (perm.isAgent && me.uid ? accounts.filter((a) => a.assignedAgentId === me.uid) : accounts),
    [accounts, perm.isAgent, me.uid]
  );
  const visibleIds = useMemo(() => new Set(visible.map((a) => a.id)), [visible]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  /** Ledger rows per account, newest first. */
  const rowsByAccount = useMemo(() => {
    const m = new Map<string, ErpLedgerEntry[]>();
    for (const e of ledger) {
      const list = m.get(e.clientAccountId);
      if (list) list.push(e);
      else m.set(e.clientAccountId, [e]);
    }
    for (const list of m.values()) list.sort((a, b) => entryTime(b) - entryTime(a));
    return m;
  }, [ledger]);
  const rowsFor = (id: string) => rowsByAccount.get(id) ?? [];

  const daysById = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of visible) m.set(a.id, agingDays(a, rowsByAccount.get(a.id) ?? []));
    return m;
  }, [visible, rowsByAccount]);
  const daysOf = (a: ErpAccount) => daysById.get(a.id) ?? 0;
  const isOverdue = (a: ErpAccount) => a.currentBalance > 0 && daysOf(a) > OVERDUE_DAYS;

  const collectorNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of agents) m[a.id] = a.name;
    for (const u of users) m[u.id] = u.name;
    return m;
  }, [agents, users]);
  const collectorName = (id: string | null | undefined) => (id ? collectorNames[id] ?? null : null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const list = visible.filter((a) => {
      if (division !== 'ALL' && (a.division || 'DHAKA') !== division) return false;
      if (agentFilter === 'UNASSIGNED' && a.assignedAgentId) return false;
      if (agentFilter !== 'ALL' && agentFilter !== 'UNASSIGNED' && a.assignedAgentId !== agentFilter) return false;
      if (dueFilter === 'owes' && !(a.currentBalance > 0)) return false;
      if (dueFilter === 'overdue' && !isOverdue(a)) return false;
      if (dueFilter === 'settled' && a.currentBalance > 0) return false;
      if (q) {
        const text = [a.name, a.ownerName, a.district || ''].some((v) => (v || '').toLowerCase().includes(q));
        const phone = qDigits.length >= 3 && a.phone.replace(/\D/g, '').includes(qDigits);
        if (!text && !phone) return false;
      }
      return true;
    });
    const by: Record<Sort, (a: ErpAccount, b: ErpAccount) => number> = {
      due: (a, b) => b.currentBalance - a.currentBalance,
      age: (a, b) => (b.currentBalance > 0 ? daysOf(b) : -1) - (a.currentBalance > 0 ? daysOf(a) : -1) || b.currentBalance - a.currentBalance,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(by[sort]);
  }, [visible, query, division, agentFilter, dueFilter, sort, daysById]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(filtered.length / ACCOUNTS_PER_PAGE));
  const curPage = Math.min(page, pages);
  const pageRows = filtered.slice((curPage - 1) * ACCOUNTS_PER_PAGE, curPage * ACCOUNTS_PER_PAGE);

  const collections = useMemo(
    () =>
      ledger
        .filter((e) => e.transactionType === 'PAYMENT' && (!perm.isAgent || visibleIds.has(e.clientAccountId)))
        .sort((a, b) => entryTime(b) - entryTime(a)),
    [ledger, perm.isAgent, visibleIds]
  );
  const filteredCollections = useMemo(() => {
    const f = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const t = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
    return collections.filter((e) => {
      const at = entryTime(e);
      if (f !== null && at < f) return false;
      if (t !== null && at > t) return false;
      if (method !== 'ALL' && (e.paymentMethod || '') !== method) return false;
      if (status === 'unverified' && e.isVerified) return false;
      if (status === 'verified' && !e.isVerified) return false;
      return true;
    });
  }, [collections, from, to, method, status]);
  const collPages = Math.max(1, Math.ceil(filteredCollections.length / COLLECTION_PAGE));
  const curCollPage = Math.min(collPage, collPages);
  const collRows = filteredCollections.slice((curCollPage - 1) * COLLECTION_PAGE, curCollPage * COLLECTION_PAGE);
  const collTotal = filteredCollections.reduce((s, e) => s + (e.netAmount || 0), 0);

  const owing = visible.filter((a) => a.currentBalance > 0);
  const totalDue = owing.reduce((s, a) => s + a.currentBalance, 0);
  const overdue = visible.filter(isOverdue);
  const overdueTotal = overdue.reduce((s, a) => s + a.currentBalance, 0);
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const today = collections.filter((e) => entryTime(e) >= todayStart);
  const todayTotal = today.reduce((s, e) => s + e.netAmount, 0);
  const unverified = collections.filter((e) => !e.isVerified);
  const chairmanDue = visible.filter((a) => a.accountType === 'CHAIRMAN_PERSONAL').reduce((s, a) => s + Math.max(0, a.currentBalance), 0);
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const kpis: Kpi[] = [
    { label: perm.isAgent ? 'Your accounts owe' : 'Outstanding dues', value: formatBDT(totalDue), icon: Landmark, sub: `${plural(owing.length, 'account')} of ${visible.length}` },
    { label: `Overdue ${OVERDUE_DAYS}+ days`, value: formatBDT(overdueTotal), icon: AlarmClock, sub: plural(overdue.length, 'account'), subTone: overdue.length ? 'down' : 'neutral' },
    {
      label: 'Collected today',
      value: formatBDT(todayTotal),
      icon: Wallet,
      sub: unverified.length ? `${unverified.length} to verify` : plural(today.length, 'collection'),
    },
    perm.isAgent
      ? { label: 'Assigned accounts', value: String(visible.length), icon: Users, sub: `${owing.length} with a balance due` }
      : { label: 'Chairman channel', value: formatBDT(chairmanDue), icon: Users, sub: 'Outstanding' },
  ];

  /* ---------------------------------------------------------- writes */

  const verify = async (e: ErpLedgerEntry) => {
    setVerifyingId(e.id);
    try {
      const res = await adminFetch(`/api/admin/erp/ledger/${e.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not verify the collection'));
      setLedger((prev) => prev.map((x) => (x.id === e.id ? { ...x, isVerified: true } : x)));
      toast.success(`${formatBDT(e.netAmount)} from ${accountById.get(e.clientAccountId)?.name || 'client'} verified`);
    } catch {
      toast.error('Network error — not verified');
    } finally {
      setVerifyingId(null);
    }
  };

  /* ------------------------------------------------------------ bits */

  const subline = (a: ErpAccount) => [a.ownerName, a.district].filter(Boolean).join(' · ');
  const openAccount = openId ? accountById.get(openId) : undefined;
  const accFiltersOn = query || division !== 'ALL' || agentFilter !== 'ALL' || dueFilter !== 'all';
  const collFiltersOn = from || to || method !== 'ALL' || status !== 'all';

  const dueChips: { key: DueFilter; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: visible.length },
    { key: 'owes', label: 'Owes', n: owing.length },
    { key: 'overdue', label: `Overdue ${OVERDUE_DAYS}+`, n: overdue.length },
    { key: 'settled', label: 'Settled', n: visible.length - owing.length },
  ];

  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');

  const accountsView = (
    <>
      <div className="space-y-2 border-b border-zinc-100 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, area or phone" aria-label="Search accounts" className="pl-9" />
          </div>
          {/* Phones: two dropdowns per row; sm and up: one line. */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:items-center">
            <div className="min-w-0 sm:w-40">
              <Select aria-label="Division" value={division} onChange={(e) => setDivision(e.target.value)}>
                <option value="ALL">All divisions</option>
                {DIVISIONS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>
            {!perm.isAgent && (
              <div className="min-w-0 sm:w-44">
                <Select aria-label="Field agent" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                  <option value="ALL">All agents</option>
                  <option value="UNASSIGNED">No agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className={cx('min-w-0 sm:ml-auto sm:w-48', !perm.isAgent && 'col-span-2')}>
              <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="due">Highest due first</option>
                <option value="age">Longest unpaid first</option>
                <option value="name">Name A–Z</option>
              </Select>
            </div>
          </div>
        </div>
        <div role="radiogroup" aria-label="Filter by balance" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {dueChips.map((c) => (
            <button key={c.key} type="button" role="radio" aria-checked={dueFilter === c.key} onClick={() => setDueFilter(c.key)} className={chip(dueFilter === c.key)}>
              {c.label}
              <span className={cx('tabular-nums', dueFilter === c.key ? 'text-zinc-300' : 'text-zinc-400')}>{c.n}</span>
            </button>
          ))}
        </div>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState icon={Landmark} title={visible.length ? 'No accounts match' : perm.isAgent ? 'No accounts assigned to you yet' : 'No client accounts yet'}>
          {visible.length && accFiltersOn ? (
            <button
              type="button"
              className="font-medium text-brand-700 hover:underline"
              onClick={() => {
                setQuery('');
                setDivision('ALL');
                setAgentFilter('ALL');
                setDueFilter('all');
              }}
            >
              Clear search and filters
            </button>
          ) : (
            'Add chambers, partner labs or chairman-channel accounts to start billing.'
          )}
        </EmptyState>
      ) : (
        <>
          <table className="hidden w-full table-fixed text-left md:table">
            <thead>
              <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Account</th>
                <th className="hidden w-[170px] px-3 py-2.5 font-medium lg:table-cell">Phone</th>
                <th className="hidden w-[140px] px-3 py-2.5 font-medium xl:table-cell">Agent</th>
                <th className="w-[160px] px-3 py-2.5 text-right font-medium">Due</th>
                <th className="w-[150px] px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pageRows.map((a) => (
                <tr key={a.id} onClick={() => setOpenId(a.id)} className="group cursor-pointer hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(a.id);
                      }}
                      className="block max-w-full truncate text-left text-body font-medium text-zinc-900 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {a.name}
                    </button>
                    <p className="truncate text-meta text-zinc-500">
                      {subline(a) || '—'}
                      {a.accountType === 'CHAIRMAN_PERSONAL' && ' · Chairman channel'}
                      {a.accountType === 'PARTNER_LAB' && ' · Partner lab'}
                    </p>
                  </td>
                  <td className="hidden px-3 py-2.5 lg:table-cell">
                    <span className="font-mono text-table text-zinc-700 tabular-nums">{a.phone}</span>
                  </td>
                  <td className="hidden truncate px-3 py-2.5 text-table text-zinc-600 xl:table-cell">{a.assignedAgentName || '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <p className={cx('text-body font-semibold tabular-nums', a.currentBalance > 0 ? 'text-zinc-900' : 'text-zinc-400')}>
                      {a.currentBalance < 0 ? `${formatBDT(-a.currentBalance)} adv.` : formatBDT(a.currentBalance)}
                    </p>
                    <AgingBadge days={daysOf(a)} balance={a.currentBalance} />
                  </td>
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {a.currentBalance > 0 && (
                        <a
                          href={reminderHref(a, rowsFor(a.id))}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Send a WhatsApp due reminder to ${a.name}`}
                          title="Send WhatsApp reminder (Bengali)"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <MessageSquare size={15} />
                        </a>
                      )}
                      <Button size="sm" onClick={() => setDialog({ kind: 'collect', account: a })}>
                        Collect
                      </Button>
                      <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-zinc-100 md:hidden">
            {pageRows.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setOpenId(a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{a.name}</p>
                    <p className="truncate text-meta text-zinc-500">{subline(a) || a.phone}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cx('text-body font-semibold tabular-nums', a.currentBalance > 0 ? 'text-zinc-900' : 'text-zinc-400')}>
                      {a.currentBalance < 0 ? `${formatBDT(-a.currentBalance)} adv.` : formatBDT(a.currentBalance)}
                    </p>
                    <AgingBadge days={daysOf(a)} balance={a.currentBalance} />
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-zinc-300" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="px-4 pb-4">
        <Pager page={curPage} total={filtered.length} perPage={ACCOUNTS_PER_PAGE} onPage={setPage} noun={filtered.length === 1 ? 'account' : 'accounts'} />
      </div>
    </>
  );

  const statusChips: { key: typeof status; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: collections.length },
    { key: 'unverified', label: 'Unverified', n: unverified.length },
    { key: 'verified', label: 'Verified', n: collections.length - unverified.length },
  ];

  const collectionsView = (
    <>
      <div className="space-y-2 border-b border-zinc-100 p-3">
        <div role="radiogroup" aria-label="Filter by verification" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {statusChips.map((c) => (
            <button key={c.key} type="button" role="radio" aria-checked={status === c.key} onClick={() => setStatus(c.key)} className={chip(status === c.key)}>
              {c.label}
              <span className={cx('tabular-nums', status === c.key ? 'text-zinc-300' : 'text-zinc-400')}>{c.n}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-meta text-zinc-500">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-8 w-[9.5rem] text-table" />
          </label>
          <label className="flex items-center gap-1.5 text-meta text-zinc-500">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-8 w-[9.5rem] text-table" />
          </label>
          <Select aria-label="Method" value={method} onChange={(e) => setMethod(e.target.value)} className="h-8 w-36 text-table">
            <option value="ALL">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          {collFiltersOn && (
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              onClick={() => {
                setFrom('');
                setTo('');
                setMethod('ALL');
                setStatus('all');
              }}
            >
              Clear
            </Button>
          )}
          {filteredCollections.length > 0 && (
            <span className="ml-auto text-meta text-zinc-500 tabular-nums">
              {plural(filteredCollections.length, 'collection')} · <span className="font-semibold text-zinc-900">{formatBDT(collTotal)}</span>
            </span>
          )}
        </div>
      </div>

      {collRows.length === 0 ? (
        <EmptyState icon={Wallet} title={collections.length ? 'No collections match' : 'No collections yet'}>
          {collections.length ? 'Widen the dates or change the filters.' : 'Collections recorded on an account appear here.'}
        </EmptyState>
      ) : (
        <>
          <table className="hidden w-full table-fixed text-left md:table">
            <thead>
              <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                <th className="w-[110px] px-4 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Account</th>
                <th className="hidden w-[150px] px-3 py-2.5 font-medium xl:table-cell">Collected by</th>
                <th className="w-[120px] px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="w-[130px] px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-table">
              {collRows.map((e) => {
                const acc = accountById.get(e.clientAccountId);
                const backdated = e.paymentDate && formatDay(e.paymentDate) !== formatDay(e.createdAt);
                return (
                  <tr key={e.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 text-zinc-700 tabular-nums">
                      {formatDay(e.paymentDate || e.createdAt)}
                      {backdated && (
                        <span className="block text-meta text-zinc-400" title={`Entered ${formatDay(e.createdAt)}`}>
                          entered later
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => acc && setOpenId(acc.id)}
                        className="block max-w-full truncate text-left font-medium text-zinc-900 hover:underline"
                      >
                        {acc?.name || 'Client account'}
                      </button>
                      <p className="truncate text-meta text-zinc-500">
                        {[e.paymentMethod, e.notes].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="hidden truncate px-3 py-2.5 text-zinc-600 xl:table-cell">{collectorName(e.collectedById) || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-zinc-900 tabular-nums">{formatBDT(e.netAmount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {e.isVerified ? (
                        <Badge tone="success">
                          <BadgeCheck size={12} aria-hidden="true" /> Verified
                        </Badge>
                      ) : perm.canVerify && !(me.uid && e.collectedById === me.uid) ? (
                        <Button size="sm" onClick={() => void verify(e)} disabled={verifyingId === e.id}>
                          {verifyingId === e.id ? 'Verifying…' : 'Verify'}
                        </Button>
                      ) : (
                        <Badge tone="warning">Unverified</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="divide-y divide-zinc-100 md:hidden">
            {collRows.map((e) => {
              const acc = accountById.get(e.clientAccountId);
              return (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{acc?.name || 'Client account'}</p>
                    <p className="text-meta text-zinc-500">
                      {[formatDay(e.paymentDate || e.createdAt), e.paymentMethod, collectorName(e.collectedById)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <p className="text-body font-medium text-zinc-900 tabular-nums">{formatBDT(e.netAmount)}</p>
                    {e.isVerified ? (
                      <Badge tone="success">Verified</Badge>
                    ) : perm.canVerify && !(me.uid && e.collectedById === me.uid) ? (
                      <Button size="sm" onClick={() => void verify(e)} disabled={verifyingId === e.id}>
                        Verify
                      </Button>
                    ) : (
                      <Badge tone="warning">Unverified</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="px-4 pb-4">
        <Pager page={curCollPage} total={filteredCollections.length} perPage={COLLECTION_PAGE} onPage={setCollPage} noun={filteredCollections.length === 1 ? 'collection' : 'collections'} />
      </div>
    </>
  );

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="dues"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <Button variant="primary" icon={Plus} onClick={() => setDialog({ kind: 'account', account: null })}>
          <span className="hidden sm:inline">Add account</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5">
          <Segmented<View>
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'accounts', label: 'Accounts' },
              { value: 'collections', label: unverified.length ? `Collections · ${unverified.length} to verify` : 'Collections' },
            ]}
          />
        </div>
        {view === 'accounts' ? accountsView : collectionsView}
      </div>

      {openAccount && (
        <AccountPanel
          key={openAccount.id}
          account={openAccount}
          rows={rowsFor(openAccount.id)}
          days={agingDays(openAccount, rowsFor(openAccount.id))}
          collectorName={collectorName}
          canInvoice={perm.canInvoice}
          canEdit={perm.canEditAccount}
          onCollect={() => setDialog({ kind: 'collect', account: openAccount })}
          onInvoice={() => setDialog({ kind: 'invoice', account: openAccount })}
          onEdit={() => setDialog({ kind: 'account', account: openAccount })}
          onClose={() => setOpenId(null)}
        />
      )}

      {dialog?.kind === 'invoice' && (
        <InvoiceDialog account={dialog.account} onClose={() => setDialog(null)} onSaved={() => void fetchData(true)} />
      )}
      {dialog?.kind === 'collect' && (
        <CollectionDialog account={dialog.account} agents={agents} onClose={() => setDialog(null)} onSaved={() => void fetchData(true)} />
      )}
      {dialog?.kind === 'account' && (
        <AccountDialog
          editing={dialog.account}
          agents={agents}
          defaultDivision={division !== 'ALL' ? division : 'DHAKA'}
          onClose={() => setDialog(null)}
          onSaved={() => void fetchData(true)}
        />
      )}
    </SectionFrame>
  );
}
