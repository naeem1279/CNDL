'use client';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Landmark, Pencil, Phone, Plus, Receipt, Search, Trash2, Users, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import { EMPTY_PAYOUT_FORM, EMPTY_USER_FORM, ROLE_META, USER_GROUPS } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, ErpAgent, ErpExpense, ErpLedgerEntry, ErpUser, Message, Order, ReviewRow, ServiceRow, UserGroupKey } from '../_lib/types';
import { apiError, formatBDT, formatDate, todayInput } from '../_lib/utils';

export default function UsersPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [erpAgents, setErpAgents] = useState<ErpAgent[]>([]);
  const [erpUsers, setErpUsers] = useState<ErpUser[]>([]);
  const [erpExpenses, setErpExpenses] = useState<ErpExpense[]>([]);
  const [erpLedger, setErpLedger] = useState<ErpLedgerEntry[]>([]);
  const [userModal, setUserModal] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [editingUser, setEditingUser] = useState<ErpUser | null>(null);
  const [payoutModalAgent, setPayoutModalAgent] = useState<ErpAgent | null>(null);
  const [payoutForm, setPayoutForm] = useState(EMPTY_PAYOUT_FORM);
  const [savingPayout, setSavingPayout] = useState(false);
  const [savingErp, setSavingErp] = useState(false);

  // User Management: role-group filter + instant search
  const [userRoleFilter, setUserRoleFilter] = useState<UserGroupKey>('all');
  const [userSearch, setUserSearch] = useState('');

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: accounts, data, expenses, ledger, users. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'data', 'expenses', 'ledger', 'users'], me.role);
      if (!r) return;
      setData((prev) => ({
        orders: r.orders ?? prev.orders,
        messages: r.messages ?? prev.messages,
        blogs: r.blogs ?? prev.blogs,
        reviews: r.reviews ?? prev.reviews,
        services: r.services ?? prev.services,
      }));
      if (r.agents) setErpAgents(r.agents);
      if (r.expenses) setErpExpenses(r.expenses);
      if (r.ledger) setErpLedger(r.ledger);
      if (r.users) setErpUsers(r.users);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openPayoutModal = (agent: ErpAgent) => {
    setPayoutModalAgent(agent);
    setPayoutForm({ ...EMPTY_PAYOUT_FORM, payoutDate: todayInput() });
  };

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalAgent) return;
    const amt = parseFloat(payoutForm.amountPaid);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid payout amount');
      return;
    }
    setSavingPayout(true);
    try {
      const res = await adminFetch('/api/admin/erp/agents/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: payoutModalAgent.id,
          amountPaid: amt,
          paymentMethod: payoutForm.paymentMethod,
          notes: payoutForm.notes.trim() || null,
          payoutDate: payoutForm.payoutDate ? new Date(payoutForm.payoutDate).toISOString() : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Commission paid to ${payoutModalAgent.name}`);
        setPayoutModalAgent(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record payout'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPayout(false);
    }
  };

  /* ---------- ERP: User Management ---------- */
  const openNewUser = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserModal(true);
  };

  const openEditUser = (u: ErpUser) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      address: u.address || '',
      role: u.role,
      status: u.status || 'ACTIVE',
      password: '',
    });
    setUserModal(true);
  };

  const submitErpUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.phone.trim()) {
      toast.error('Full name and phone are required');
      return;
    }
    setSavingErp(true);
    try {
      const payload = {
        name: userForm.name,
        phone: userForm.phone,
        email: userForm.email.trim() || null,
        address: userForm.address.trim() || null,
        role: userForm.role,
        ...(editingUser ? { status: userForm.status } : {}),
        ...(userForm.password ? { password: userForm.password } : {}),
      };
      const res = await adminFetch(
        editingUser ? `/api/admin/erp/users/${editingUser.id}` : '/api/admin/erp/users',
        {
          method: editingUser ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingUser ? 'User updated' : 'User registered');
        setUserModal(false);
        setEditingUser(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, editingUser ? 'Failed to update user' : 'Failed to register user'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const deleteUser = async (u: ErpUser) => {
    if (!(await askConfirm(`Delete user "${u.name}"? This cannot be undone.`))) return;
    setDeletingId(`user-${u.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/users/${u.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('User deleted');
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to delete user'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const { agentMetrics, agentTotals } = useMemo(() => {
    const withdrawnOf = (agentId: string) =>
      erpExpenses
        .filter((e) => e.category === 'LOGISTICS' && !!e.notes && e.notes.includes(`"agentId":"${agentId}"`))
        .reduce((s, e) => s + (e.amount || 0), 0);
    const metrics = erpAgents.map((agent) => {
      const brought = data.orders.filter((o) => o.agentId === agent.id);
      const sales = brought.reduce((s, o) => s + (o.billedAmount || 0), 0);
      const collected = erpLedger
        .filter((e) => e.transactionType === 'PAYMENT' && e.collectedById === agent.id)
        .reduce((s, e) => s + (e.netAmount || 0), 0);
      const earned = brought.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      const withdrawn = withdrawnOf(agent.id);
      return { agent, cases: brought.length, sales, collected, earned, withdrawn, pending: earned - withdrawn };
    });
    const totals = metrics.reduce(
      (acc, m) => ({
        cases: acc.cases + m.cases,
        sales: acc.sales + m.sales,
        collected: acc.collected + m.collected,
        pending: acc.pending + m.pending,
      }),
      { cases: 0, sales: 0, collected: 0, pending: 0 }
    );
    return { agentMetrics: metrics, agentTotals: totals };
  }, [erpAgents, data.orders, erpLedger, erpExpenses]);

  const teamStats = useMemo(
    () => ({
      chairman: erpUsers.filter((u) => u.role === 'CHAIRMAN').length,
      accounts: erpUsers.filter((u) => u.role === 'ACCOUNTS').length,
      superAdmin: erpUsers.filter((u) => u.role === 'SUPERADMIN').length,
      doctor: erpUsers.filter((u) => u.role === 'DOCTOR').length,
      partnerLab: erpUsers.filter((u) => u.role === 'PARTNER_LAB').length,
    }),
    [erpUsers]
  );

  const filteredUsers = useMemo(() => {
    const sq = userSearch.trim().toLowerCase();
    return erpUsers.filter((u) => {
      const group = USER_GROUPS.find((g) => g.key === userRoleFilter);
      if (group && !group.roles.includes(u.role)) return false;
      if (!sq) return true;
      const haystack = [u.name, u.phone, u.email || '', u.address || '', (ROLE_META[u.role] || ROLE_META.DOCTOR).label]
        .join(' ')
        .toLowerCase();
      return haystack.includes(sq);
    });
  }, [erpUsers, userRoleFilter, userSearch]);

  const agentList = erpAgents;

  const chairmanUsers = teamStats.chairman;
  const accountsUsers = teamStats.accounts;

  /* ---------- User Management: department metrics + role-group filtering ---------- */
  const superAdminUsers = teamStats.superAdmin;
  const leadershipCount = superAdminUsers + chairmanUsers;
  const userGroupCount = (key: UserGroupKey) =>
    key === 'all'
      ? erpUsers.length
      : erpUsers.filter((u) => USER_GROUPS.find((g) => g.key === key)!.roles.includes(u.role)).length;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overview quick actions link here with ?new=1 to open the create form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new') !== '1') return;
    window.history.replaceState(null, '', window.location.pathname);
    openNewUser();
  }, []);

  return (
    <>
      <SectionFrame
        tab="users"
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
              /* ---------- USER MANAGEMENT ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold text-slate-900">Team &amp; Staff Management (ল্যাব টিম ও কর্মী ব্যবস্থাপনা)</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage internal lab employees, leadership, and field collection agents. For clinics, chambers &amp; partner labs, visit Client Dues &amp; Ledger.</p>
                  </div>
                  <button
                    onClick={openNewUser}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Add New User
                  </button>
                </div>

                {/* Department metrics strip — Internal Personnel Only */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Leadership & Exec', value: leadershipCount, icon: Landmark, cls: 'bg-amber-50 text-amber-600', sub: 'SuperAdmin & Chairman' },
                    { label: 'Finance & Accounts', value: accountsUsers, icon: Receipt, cls: 'bg-emerald-50 text-emerald-600', sub: 'Billing & Ledgers' },
                    { label: 'Field Agents', value: agentList.length, icon: Phone, cls: 'bg-teal-50 text-teal-700', sub: 'Chamber Collectors' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}>
                        <m.icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xl font-semibold text-slate-900 tracking-tight leading-tight">{m.value}</span>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight line-clamp-2">{m.label}</span>
                        <span className="block text-xs text-slate-500">{m.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Segmented role filter + instant search */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 w-fit max-w-full overflow-x-auto">
                    {([{ key: 'all' as UserGroupKey, label: 'All Team' }, ...USER_GROUPS.map((g) => ({ key: g.key as UserGroupKey, label: g.label }))]).map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setUserRoleFilter(g.key)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                          userRoleFilter === g.key
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {g.label}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            userRoleFilter === g.key ? 'bg-teal-700/10 text-teal-700' : 'bg-slate-200/80 text-slate-500'
                          }`}
                        >
                          {userGroupCount(g.key)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, phone, email, address..."
                      className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-gray-600 hover:bg-slate-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Agent Performance — visible when the Field Agents segment is active */}
                {userRoleFilter === 'agents' && (
                  <div className="mb-6 space-y-4">
                    {/* Metrics bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Cases Brought', value: String(agentTotals.cases), icon: ClipboardList, cls: 'bg-teal-50 text-teal-700' },
                        { label: 'Sales Volume', value: formatBDT(agentTotals.sales), icon: Receipt, cls: 'bg-sky-50 text-sky-700' },
                        { label: 'Cash Collected', value: formatBDT(agentTotals.collected), icon: Wallet, cls: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Pending Commission', value: formatBDT(agentTotals.pending), icon: Landmark, cls: 'bg-rose-50 text-rose-600' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}>
                            <m.icon size={17} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-base sm:text-lg font-semibold tracking-tight leading-tight truncate">{m.value}</span>
                            <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight line-clamp-2">{m.label}</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Per-agent breakdown + payout action */}
                    {/* Mobile: stacked card view */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {agentMetrics.map((m) => (
                        <div key={m.agent.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm">{m.agent.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{m.agent.phone || 'No phone'}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 whitespace-nowrap">
                              {m.cases} cases
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Sales Volume</span>
                              <span className="font-semibold text-slate-800">{formatBDT(m.sales)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Cash Collected</span>
                              <span className="font-bold text-emerald-600">{formatBDT(m.collected)}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Commission Earned</span>
                              <span className="font-semibold text-slate-800">{formatBDT(m.earned)}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Pending Payout</span>
                              <span className={`font-semibold ${m.pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatBDT(m.pending)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1 border-t border-slate-100">
                            <button
                              onClick={() => openPayoutModal(m.agent)}
                              disabled={m.pending <= 0}
                              className="min-h-[40px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:hover:bg-teal-700"
                            >
                              Record Payout
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table view */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left tabular-nums">
                        <thead>
                          <tr className="text-[11px] uppercase font-semibold border-b text-slate-500 bg-slate-50/60">
                            <th className="px-4 py-3 pr-4">Agent</th>
                            <th className="px-2 py-3 pr-4">Cases</th>
                            <th className="px-2 py-3 pr-4">Sales (৳)</th>
                            <th className="px-2 py-3 pr-4">Collected (৳)</th>
                            <th className="px-2 py-3 pr-4">Earned (৳)</th>
                            <th className="px-2 py-3 pr-4">Withdrawn (৳)</th>
                            <th className="px-2 py-3 pr-4">Pending Commission</th>
                            <th className="px-2 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agentMetrics.map((m) => (
                            <tr key={m.agent.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 pr-4">
                                <div className="font-bold text-sm">{m.agent.name}</div>
                                <div className="text-xs text-slate-500">{m.agent.phone || '—'}</div>
                              </td>
                              <td className="px-2 py-3 pr-4 text-sm font-bold">{m.cases}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold">{formatBDT(m.sales)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold text-emerald-600">{formatBDT(m.collected)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold">{formatBDT(m.earned)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold text-slate-500">{formatBDT(m.withdrawn)}</td>
                              <td className={`px-2 py-3 pr-4 text-sm font-semibold ${m.pending > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {formatBDT(m.pending)}
                              </td>
                              <td className="px-2 py-3 text-right">
                                <button
                                  onClick={() => openPayoutModal(m.agent)}
                                  className="min-h-[36px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
                                >
                                  <Plus size={13} /> Pay Commission
                                </button>
                              </td>
                            </tr>
                          ))}
                          {agentMetrics.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No active agents.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Desktop: users table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">User</th>
                        <th className="pb-4 pr-4">Phone</th>
                        <th className="pb-4 pr-4">Email</th>
                        <th className="pb-4 pr-4">Role</th>
                        <th className="pb-4 pr-4">Status</th>
                        <th className="pb-4 pr-4">Current Address</th>
                        <th className="pb-4 pr-4">Registered</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const roleMeta = ROLE_META[u.role] || ROLE_META.DOCTOR;
                        const isSelf = me?.uid === u.id;
                        return (
                          <tr key={u.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-sm">
                                  {u.name}
                                  {isSelf && <span className="ml-1.5 text-[11px] font-bold text-slate-500">(you)</span>}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-sm">{u.phone}</td>
                            <td className="py-4 pr-4 text-sm text-gray-500 max-w-[180px] truncate" title={u.email || ''}>{u.email || '—'}</td>
                            <td className="py-4 pr-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap ${roleMeta.cls}`}>
                                {roleMeta.label}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-xs text-gray-500 max-w-[200px] truncate" title={u.address || ''}>{u.address || '—'}</td>
                            <td className="py-4 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                            <td className="py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEditUser(u)}
                                  aria-label={`Edit ${u.name}`}
                                  title="Edit user"
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => deleteUser(u)}
                                  disabled={deletingId === `user-${u.id}`}
                                  aria-label={`Delete ${u.name}`}
                                  title={isSelf ? 'You cannot delete your own active account' : 'Delete user'}
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Users size={28} />
                      </span>
                      {erpUsers.length === 0 ? (
                        <>
                          <p className="text-sm font-bold text-gray-500">No users registered yet</p>
                          <p className="text-xs text-slate-500 mt-1">Add your team — chairman, accounts, collection agents, partner labs and doctors.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-500">No users match your filter</p>
                          <p className="text-xs text-slate-500 mt-1">Try a different role group or clear the search query.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile: user cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const roleMeta = ROLE_META[u.role] || ROLE_META.DOCTOR;
                    const isSelf = me?.uid === u.id;
                    return (
                      <div key={u.id} className="py-4 flex items-start gap-3">
                        <span className="w-10 h-10 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0 text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm truncate">
                              {u.name}{isSelf && <span className="ml-1 text-[11px] font-bold text-slate-500">(you)</span>}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 ${roleMeta.cls}`}>
                              {roleMeta.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{u.phone}{u.email ? ` · ${u.email}` : ''}</div>
                          {u.address && <div className="text-xs text-slate-500 truncate mt-0.5">{u.address}</div>}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => openEditUser(u)}
                              className="min-h-[38px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => deleteUser(u)}
                              disabled={deletingId === `user-${u.id}`}
                              className="min-h-[38px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {erpUsers.length === 0 ? 'No users registered yet.' : 'No users match your filter or search.'}
                    </p>
                  )}
                </div>
              </div>
        )}
      </SectionFrame>

      {userModal && (
        <ModalShell onClose={() => setUserModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitErpUser}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                {editingUser && <p className="text-xs text-slate-500 truncate">{editingUser.name} · {editingUser.phone}</p>}
              </div>
              <button
                type="button"
                onClick={() => setUserModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                <input
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Dr. Full Name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone *</label>
                  <input
                    required
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="doctor@email.com"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Address (বর্তমান ঠিকানা)</label>
                <input
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  placeholder="House / Road / Area, City"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {editingUser ? 'Reset Password' : 'Login Password'} <span className="normal-case font-medium text-slate-400">(min 4 chars{editingUser ? ' — leave blank to keep current' : ' — lets this user sign in'})</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep the current password' : 'Set an initial password (optional)'}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="AGENT">Agent (Field Collector)</option>
                  <option value="ACCOUNTS">Accounts &amp; Finance</option>
                  <option value="CHAIRMAN">Chairman</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Status *</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setUserModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingUser ? 'Save Changes' : 'Register User'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Change Your Password Modal (self-service, all roles) */}
      {payoutModalAgent && (
        <ModalShell onClose={() => setPayoutModalAgent(null)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitPayout}
            className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-700">Pay Commission</h3>
                <p className="text-xs text-slate-500 truncate">Agent: {payoutModalAgent.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalAgent(null)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={payoutForm.amountPaid}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amountPaid: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Payout Date</label>
                <input
                  type="date"
                  value={payoutForm.payoutDate}
                  onChange={(e) => setPayoutForm({ ...payoutForm, payoutDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  placeholder="e.g. October commission settlement"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white resize-none"
                />
              </div>
              <p className="text-xs text-slate-500">
                Recorded as a LOGISTICS expense — &ldquo;Agent Commission - {payoutModalAgent.name}&rdquo; — and subtracted from the agent&rsquo;s pending commission.
              </p>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPayoutModalAgent(null)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPayout}
                className="min-h-[44px] px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
              >
                {savingPayout ? 'Recording...' : 'Record Payout'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

    </>
  );
}
