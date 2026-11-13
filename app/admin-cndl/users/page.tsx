'use client';
import { useEffect, useMemo, useState } from 'react';
import { Handshake, MoreHorizontal, Pencil, Plus, Search, ShieldCheck, Trash2, UserCheck, UserX, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, MenuButton, Segmented, type Tone } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAgent, ErpExpense, ErpLedgerEntry, ErpUser, Order } from '../_lib/types';
import { apiError, formatBDT, readPref } from '../_lib/utils';
import { MemberDialog, PayoutDialog, canUseConsole, type RoleOption } from './forms';

type View = 'people' | 'agents';
const keyOf = (u: ErpUser) => u.roleKey ?? u.role;
type Group = 'all' | 'leadership' | 'accounts' | 'agents' | 'records' | 'inactive';
const GROUPS: { key: Group; label: string; test: (u: ErpUser) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'leadership', label: 'Leadership', test: (u) => keyOf(u) === 'SUPERADMIN' || keyOf(u) === 'CHAIRMAN' },
  { key: 'accounts', label: 'Accounts', test: (u) => keyOf(u) === 'ACCOUNTS' },
  { key: 'agents', label: 'Field agents', test: (u) => keyOf(u) === 'AGENT' },
  { key: 'records', label: 'Doctors & labs', test: (u) => keyOf(u) === 'DOCTOR' || keyOf(u) === 'PARTNER_LAB' },
  { key: 'inactive', label: 'Not active', test: (u) => u.status !== 'ACTIVE' },
];
const STATUS_TONE: Record<string, Tone> = { ACTIVE: 'success', SUSPENDED: 'danger', INACTIVE: 'neutral' };
const statusLabel = (s: string) => (s === 'ACTIVE' ? 'Active' : s === 'SUSPENDED' ? 'Suspended' : s === 'INACTIVE' ? 'Inactive' : s);
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

export default function TeamPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [agents, setAgents] = useState<ErpAgent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<ErpLedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);
  const [view, setView] = useState<View>(() => (readPref('cndl-admin-team-view') === 'agents' ? 'agents' : 'people'));
  const [group, setGroup] = useState<Group>('all');
  const [query, setQuery] = useState('');
  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ErpUser | null | undefined>(undefined);
  const [paying, setPaying] = useState<{ id: string; name: string; due: number } | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['users', 'accounts', 'data', 'ledger', 'expenses'], me);
      if (!r) return;
      if (r.users) setUsers(r.users);
      const rr = await adminFetch('/api/admin/erp/roles');
      if (rr.ok) setRoles(((await rr.json().catch(() => ({}))).roles as RoleOption[]) ?? []);
      if (r.agents) setAgents(r.agents);
      if (r.orders) setOrders(r.orders);
      if (r.ledger) setLedger(r.ledger);
      if (r.expenses) setExpenses(r.expenses);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load the team');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-team-view', view);
    } catch {
      /* private mode */
    }
  }, [view]);
  // Overview's "Add a team member" links here with ?new=1.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    setView('people');
    setDialog(null);
  }, []);

  /* --------------------------------------------------------- derived */

  const filtered = useMemo(() => {
    const g = GROUPS.find((x) => x.key === group)!;
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return users
      .filter(g.test)
      .filter((u) => !q || [u.name, u.email, u.roleName ?? keyOf(u)].some((v) => (v || '').toLowerCase().includes(q)) || (qDigits.length >= 3 && u.phone.replace(/\D/g, '').includes(qDigits)))
      .sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE') || a.name.localeCompare(b.name));
  }, [users, group, query]);

  /** Same commission maths as before: earned on attributed cases minus payouts logged as expenses. */
  const agentRows = useMemo(
    () =>
      agents.map((a) => {
        const brought = orders.filter((o) => o.agentId === a.id);
        const earned = brought.reduce((s, o) => s + (o.commissionAmount || 0), 0);
        const paid = expenses
          .filter((e) => e.category === 'LOGISTICS' && !!e.notes && e.notes.includes(`"agentId":"${a.id}"`))
          .reduce((s, e) => s + (e.amount || 0), 0);
        const collected = ledger.filter((e) => e.transactionType === 'PAYMENT' && e.collectedById === a.id).reduce((s, e) => s + (e.netAmount || 0), 0);
        return { agent: a, cases: brought.length, sales: brought.reduce((s, o) => s + (o.billedAmount || 0), 0), collected, earned, paid, due: earned - paid };
      }),
    [agents, orders, expenses, ledger]
  );
  const totalDue = agentRows.reduce((s, r) => s + Math.max(0, r.due), 0);
  const active = users.filter((u) => u.status === 'ACTIVE');
  const roleOf = (u: ErpUser) => roles.find((r) => r.key === keyOf(u));
  const roleName = (u: ErpUser) => u.roleName ?? roleOf(u)?.name ?? keyOf(u);
  const canSignIn = active.filter((u) => canUseConsole(roleOf(u)));

  const kpis: Kpi[] = [
    { label: 'Team members', value: String(active.length), icon: Users, sub: `${users.length - active.length} not active` },
    { label: 'Can sign in', value: String(canSignIn.length), icon: ShieldCheck, sub: 'Console access' },
    { label: 'Field agents', value: String(agents.length), icon: Handshake, sub: `${formatBDT(agentRows.reduce((s, r) => s + r.collected, 0))} collected` },
    { label: 'Commission due', value: formatBDT(totalDue), icon: Wallet, sub: 'Earned minus paid', subTone: totalDue > 0 ? 'down' : 'neutral' },
  ];

  /* ---------------------------------------------------------- writes */

  const setStatus = async (u: ErpUser, status: string) => {
    try {
      const res = await adminFetch(`/api/admin/erp/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not update the member'));
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status } : x)));
      toast.success(status === 'ACTIVE' ? `${u.name} can sign in again` : `${u.name} suspended and signed out`);
    } catch {
      toast.error('Network error — not updated');
    }
  };

  const remove = async (u: ErpUser) => {
    if (!(await askConfirm(`Delete ${u.name}? This cannot be undone. Their past cases and collections keep their records. To stop them signing in but keep the account, suspend them instead.`))) return;
    try {
      const res = await adminFetch(`/api/admin/erp/users/${u.id}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the member'));
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`${u.name} deleted`);
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const menu = (u: ErpUser) => {
    const self = u.id === me.uid;
    return (
      <MenuButton
        label={`Actions for ${u.name}`}
        icon={MoreHorizontal}
        iconOnly
        variant="ghost"
        items={[
          { label: 'Edit', icon: Pencil, onSelect: () => setDialog(u) },
          ...(self
            ? []
            : u.status === 'ACTIVE'
              ? [{ label: 'Suspend', icon: UserX, onSelect: () => void setStatus(u, 'SUSPENDED') }]
              : [{ label: 'Reactivate', icon: UserCheck, onSelect: () => void setStatus(u, 'ACTIVE') }]),
          ...(self ? [] : [{ label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(u) }]),
        ]}
      />
    );
  };

  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="users"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
          <span className="hidden sm:inline">Add member</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-3 py-2.5">
          <Segmented<View>
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'people', label: 'People' },
              { value: 'agents', label: totalDue > 0 ? `Agents · ${formatBDT(totalDue)} due` : 'Agents' },
            ]}
          />
        </div>

        {view === 'people' ? (
          <>
            <div className="space-y-2 border-b border-zinc-100 p-3">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email or role" aria-label="Search team" className="pl-9" />
              </div>
              <div role="radiogroup" aria-label="Filter team" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
                {GROUPS.map((g) => {
                  const n = users.filter(g.test).length;
                  if (g.key !== 'all' && n === 0) return null;
                  return (
                    <button key={g.key} type="button" role="radio" aria-checked={group === g.key} onClick={() => setGroup(g.key)} className={chip(group === g.key)}>
                      {g.label}
                      <span className={cx('tabular-nums', group === g.key ? 'text-zinc-300' : 'text-zinc-400')}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={Users} title={users.length ? 'No one matches' : 'No team members yet'}>
                {users.length ? 'Try another search or filter.' : 'Add the people who work in the console: accounts, agents and leadership.'}
              </EmptyState>
            ) : (
              <>
                <table className="hidden w-full table-fixed text-left md:table">
                  <thead>
                    <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="w-[150px] px-3 py-2.5 font-medium">Phone</th>
                      <th className="w-[140px] px-3 py-2.5 font-medium">Role</th>
                      <th className="w-[110px] px-3 py-2.5 font-medium">Status</th>
                      <th className="w-12 px-2 py-2.5" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-table">
                    {filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2.5">
                          <button type="button" onClick={() => setDialog(u)} className={cx('block max-w-full truncate text-left text-body font-medium hover:underline', u.status === 'ACTIVE' ? 'text-zinc-900' : 'text-zinc-500')}>
                            {u.name}
                            {u.id === me.uid && <span className="font-normal text-zinc-400"> (you)</span>}
                          </button>
                          <p className="truncate text-meta text-zinc-500">{u.email || '—'}</p>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-zinc-700 tabular-nums">{u.phone}</td>
                        <td className="px-3 py-2.5 text-zinc-700">
                          {roleName(u)}
                          {!canUseConsole(roleOf(u)) && <span className="block text-meta text-zinc-400">No sign-in</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={STATUS_TONE[u.status] ?? 'neutral'}>{statusLabel(u.status)}</Badge>
                        </td>
                        <td className="px-2 py-1.5 text-right">{menu(u)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="divide-y divide-zinc-100 md:hidden">
                  {filtered.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className={cx('text-body font-medium [overflow-wrap:anywhere]', u.status === 'ACTIVE' ? 'text-zinc-900' : 'text-zinc-500')}>
                          {u.name}
                          {u.id === me.uid && <span className="font-normal text-zinc-400"> (you)</span>}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-meta text-zinc-500">
                          {roleName(u)} · <span className="font-mono">{u.phone}</span>
                          {u.status !== 'ACTIVE' && <Badge tone={STATUS_TONE[u.status] ?? 'neutral'}>{statusLabel(u.status)}</Badge>}
                        </p>
                      </div>
                      <div className="-my-1 shrink-0">{menu(u)}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : agentRows.length === 0 ? (
          <EmptyState icon={Handshake} title="No field agents yet">
            Add a team member with the Field agent role to track their cases, collections and commission.
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="w-[80px] px-3 py-2.5 text-right font-medium">Cases</th>
                  <th className="hidden w-[120px] px-3 py-2.5 text-right font-medium lg:table-cell">Collected</th>
                  <th className="hidden w-[110px] px-3 py-2.5 text-right font-medium xl:table-cell">Earned</th>
                  <th className="hidden w-[110px] px-3 py-2.5 text-right font-medium xl:table-cell">Paid</th>
                  <th className="w-[120px] px-3 py-2.5 text-right font-medium">Due</th>
                  <th className="w-[96px] px-4 py-2.5" aria-label="Pay" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-table">
                {agentRows.map((r) => (
                  <tr key={r.agent.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <p className="truncate text-body font-medium text-zinc-900">{r.agent.name}</p>
                      <p className="truncate text-meta text-zinc-500">
                        <span className="font-mono">{r.agent.phone}</span>
                        <span className="xl:hidden"> · earned {formatBDT(r.earned)}, paid {formatBDT(r.paid)}</span>
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{r.cases}</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums text-zinc-700 lg:table-cell">{formatBDT(r.collected)}</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums text-zinc-700 xl:table-cell">{formatBDT(r.earned)}</td>
                    <td className="hidden px-3 py-2.5 text-right tabular-nums text-zinc-700 xl:table-cell">{formatBDT(r.paid)}</td>
                    <td className={cx('px-3 py-2.5 text-right font-semibold tabular-nums', r.due > 0 ? 'text-zinc-900' : 'text-zinc-400')}>{formatBDT(r.due)}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" disabled={r.due <= 0} onClick={() => setPaying({ id: r.agent.id, name: r.agent.name, due: r.due })}>
                        Pay
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-zinc-100 md:hidden">
              {agentRows.map((r) => (
                <li key={r.agent.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{r.agent.name}</p>
                    <p className="text-meta text-zinc-500 tabular-nums">
                      {r.cases} cases · collected {formatBDT(r.collected)}
                    </p>
                    <p className="text-meta text-zinc-500 tabular-nums">
                      Due <span className="font-semibold text-zinc-900">{formatBDT(r.due)}</span>
                    </p>
                  </div>
                  <Button size="sm" disabled={r.due <= 0} onClick={() => setPaying({ id: r.agent.id, name: r.agent.name, due: r.due })}>
                    Pay
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {dialog !== undefined && <MemberDialog editing={dialog} roles={roles} onClose={() => setDialog(undefined)} onSaved={() => void fetchData(true)} />}
      {paying && <PayoutDialog agent={paying} due={paying.due} onClose={() => setPaying(null)} onSaved={() => void fetchData(true)} />}
    </SectionFrame>
  );
}
