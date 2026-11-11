'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Check, ClipboardList, Clock, Copy, Eye, Layers, Phone, Plus, RefreshCw, Search,
  Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Chip, ProgressBar, StagePill, StatusBadge } from '../_components/badges';
import { CaseControls } from '../_components/CaseControls';
import { ModalShell } from '../_components/ModalShell';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import {
  DIVISIONS, EMPTY_OFFLINE_ORDER_FORM, IN_PRODUCTION, ORDERS_PER_PAGE, ORDER_SOURCE_META,
  PROGRESS_BY_STATUS, STATUS_LABELS, STATUS_OPTIONS, VITA_SHADES,
} from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, EditState, ErpAccount, ErpAgent, Message, Order, ReviewRow, ServiceRow } from '../_lib/types';
import { apiError, formatBDT, formatDate, formatDay, parseClinical, phoneLinks, todayInput } from '../_lib/utils';

export default function OrdersPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, setCopiedEmail] = useState<string | null>(null);

  // Orders search/filter/pagination + modal
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [modalId, setModalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ERP & Accounts state
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);
  const [erpAgents, setErpAgents] = useState<ErpAgent[]>([]);
  const [offlineOrderModal, setOfflineOrderModal] = useState(false);
  const [offlineOrderForm, setOfflineOrderForm] = useState(EMPTY_OFFLINE_ORDER_FORM);
  const [savingOrder, setSavingOrder] = useState(false);
  const [quickAccountOpen, setQuickAccountOpen] = useState(false);
  const [quickAccountForm, setQuickAccountForm] = useState({ name: '', ownerName: '', phone: '', division: 'DHAKA' });
  const [savingQuickAccount, setSavingQuickAccount] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: accounts, data, services. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'data', 'services'], me.role);
      if (!r) return;
      setData((prev) => ({
        orders: r.orders ?? prev.orders,
        messages: r.messages ?? prev.messages,
        blogs: r.blogs ?? prev.blogs,
        reviews: r.reviews ?? prev.reviews,
        services: r.services ?? prev.services,
      }));
      const ordersList = r.orders;
      if (ordersList) {
        setEdits((prev) => {
          const next: EditState = {};
          for (const o of ordersList) {
            if (o?.id) {
              next[o.id] = prev[o.id] ?? { status: o.status ?? 'Received', progress: o.progress ?? 10 };
            }
          }
          return next;
        });
      }
      if (r.accounts) setErpAccounts(r.accounts);
      if (r.agents) setErpAgents(r.agents);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (order: Order) => {
    const edit = edits[order.id] ?? { status: order.status, progress: order.progress };
    setSavingId(order.id);
    try {
      const res = await adminFetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: edit.status, progress: edit.progress }),
      });
      if (res.ok) {
        toast.success(`${order.caseId} updated`);
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingId(null);
    }
  };

  /** One-click clinical stage change from the modern stage pill (auto-derives progress). */
  const updateStage = async (order: Order, newStatus: string) => {
    const progress = PROGRESS_BY_STATUS[newStatus] ?? order.progress;
    setSavingId(order.id);
    // Optimistic update for a snappy pill transition.
    setEdits((prev) => ({ ...prev, [order.id]: { status: newStatus, progress } }));
    try {
      const res = await adminFetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus, progress }),
      });
      if (res.ok) {
        toast.success(`${order.caseId} → ${STATUS_LABELS[newStatus] || newStatus}`);
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Stage update failed');
        await fetchData(true);
      }
    } catch {
      toast.error('Stage update failed');
      await fetchData(true);
    } finally {
      setSavingId(null);
    }
  };

  const deleteOrder = async (order: Order) => {
    if (!(await askConfirm(`Delete / archive case ${order.caseId}? This cannot be undone.`))) return;
    setDeletingId(`order-${order.id}`);
    try {
      const res = await adminFetch(`/api/admin/data?id=${encodeURIComponent(order.id)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Case ${order.caseId} deleted`);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to delete case'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const openOfflineOrder = () => {
    setOfflineOrderForm({ ...EMPTY_OFFLINE_ORDER_FORM, orderDate: todayInput() });
    setOfflineOrderModal(true);
  };

    const handleQuickCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickAccountForm.name.trim()) {
      toast.error('Clinic / Lab name is required');
      return;
    }
    if (!quickAccountForm.ownerName.trim()) {
      toast.error('Doctor name is required');
      return;
    }
    if (!quickAccountForm.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setSavingQuickAccount(true);
    try {
      const res = await adminFetch('/api/admin/erp/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'CHAMBER',
          institutionType: 'CHAMBER',
          name: quickAccountForm.name.trim(),
          ownerName: quickAccountForm.ownerName.trim(),
          phone: quickAccountForm.phone.trim(),
          division: quickAccountForm.division || 'DHAKA',
          openingDue: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.warning === 'DUPLICATE_PHONE') {
        toast.error(`Phone already registered to ${data.existingName || 'an account'}`);
        return;
      }
      if (!res.ok) {
        toast.error(apiError(data, 'Failed to create account'));
        return;
      }
      toast.success(`Client account "${data.name}" created!`);
      // Update local erpAccounts list immediately so it appears in the select dropdown
      setErpAccounts((prev) => [data, ...prev]);
      // Immediately select the newly created account for this order
      setOfflineOrderForm((f) => ({
        ...f,
        clientAccountId: data.id,
        clinicName: data.name,
        doctorName: data.ownerName,
        phone: data.phone,
        attribution: data.assignedAgentId ? 'AGENT' : 'DIRECT',
        agentId: data.assignedAgentId || '',
      }));
      // Reset and close quick account inline form
      setQuickAccountForm({ name: '', ownerName: '', phone: '', division: 'DHAKA' });
      setQuickAccountOpen(false);
    } catch {
      toast.error('Network error creating account');
    } finally {
      setSavingQuickAccount(false);
    }
  };

  const submitOfflineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineOrderForm.orderDate) {
      toast.error('Order date is required');
      return;
    }
    const linked = !!offlineOrderForm.clientAccountId;
    if (!linked && !offlineOrderForm.doctorName.trim()) {
      toast.error('Doctor name is required for a walk-in order');
      return;
    }
    if (!offlineOrderForm.productName) {
      toast.error('Select a product');
      return;
    }
    const billed = parseFloat(offlineOrderForm.billedAmount);
    if (offlineOrderForm.addToLedger && (!billed || billed <= 0)) {
      toast.error('Enter the billed amount to add this case to the due ledger');
      return;
    }
    const viaAgent = offlineOrderForm.attribution === 'AGENT';
    if (viaAgent && !offlineOrderForm.agentId) {
      toast.error('Select the agent this case is attributed to');
      return;
    }
    const commission = viaAgent ? (parseFloat(offlineOrderForm.commissionAmount) || 0) : 0;
    if (commission < 0) {
      toast.error('Commission cannot be negative');
      return;
    }
    setSavingOrder(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDate: new Date(offlineOrderForm.orderDate).toISOString(),
          deliveryDate: offlineOrderForm.deliveryDate
            ? new Date(offlineOrderForm.deliveryDate).toISOString()
            : null,
          orderSource: offlineOrderForm.orderSource,
          clientAccountId: offlineOrderForm.clientAccountId || null,
          doctorName: linked
            ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId)?.ownerName || offlineOrderForm.doctorName
            : offlineOrderForm.doctorName,
          clinicName: linked
            ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId)?.name || offlineOrderForm.clinicName
            : offlineOrderForm.clinicName,
          phone: offlineOrderForm.phone.trim() || null,
          patientName: offlineOrderForm.patientName.trim() || null,
          toothNo: offlineOrderForm.toothNo.trim() || null,
          shade: offlineOrderForm.shade || null,
          productName: offlineOrderForm.productName,
          units: parseInt(offlineOrderForm.units) || 1,
          billedAmount: offlineOrderForm.billedAmount.trim() === '' ? null : billed,
          addToLedger: (offlineOrderForm.addToLedger || offlineOrderForm.historical) && linked,
          agentId: viaAgent ? offlineOrderForm.agentId : null,
          isDirect: !viaAgent,
          commissionAmount: commission,
          status: offlineOrderForm.historical ? 'DISPATCHED' : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Case ${body.order?.caseId} created${offlineOrderForm.historical ? ' — recorded as delivered' : ''}${offlineOrderForm.addToLedger && linked ? ' & added to due ledger' : ''}`);
        setOfflineOrderModal(false);
        setQuickAccountOpen(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to create order'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingOrder(false);
    }
  };

  const copyText = async (id: string, text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (what === 'Case ID') setCopiedId(id);
      else setCopiedEmail(id);
      toast.success(`${what} copied`);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedEmail(null);
      }, 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  // Reset pagination when filters change / clamp out-of-range pages
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const { safePage, pagedOrders, orderFilteredCount } = useMemo(() => {
    const sq = search.trim().toLowerCase();
    const filtered = data.orders.filter((o) => {
      if (!o) return false;
      const c = parseClinical(o.productType);
      const haystack = [o.caseId, o.customerName, o.phone, c.patient, o.clinicName, c.work, c.teeth, c.shade, c.notes]
        .filter((v) => typeof v === 'string')
        .join(' ')
        .toLowerCase();
      const matchesSearch = !sq || haystack.includes(sq);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
    const page2 = Math.min(page, totalPages);
    return {
      orderTotalPages: totalPages,
      safePage: page2,
      pagedOrders: filtered.slice((page2 - 1) * ORDERS_PER_PAGE, page2 * ORDERS_PER_PAGE),
      orderFilteredCount: filtered.length,
    };
  }, [data.orders, search, statusFilter, page]);

  /* ---------- Derived data — thin render-facing aliases over the memoized
     Phase 2 aggregates above. ---------- */
  const totalOrders = data.orders.length;
  const dispatchedCount = data.orders.filter((o) => o?.status === 'Dispatched').length;
  const productionCount = data.orders.filter((o) => o?.status && IN_PRODUCTION.includes(o.status)).length;

  const agentList = erpAgents;
  const avgTurnaroundDays = data.services.length ? Math.round(data.services.reduce((sum, s) => sum + (s.turnaroundDays || 0), 0) / data.services.length) : 3;

  const modalOrder = modalId ? (data?.orders ?? []).find((o) => o?.id === modalId) ?? null : null;

  const filtersActive = search.trim() !== '' || statusFilter !== 'All';

  const commsButtons = (order: Order, size: 'sm' | 'md' = 'md') => {
    const links = phoneLinks(order.phone);
    const btn = `min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors`;
    return (
      <div className="flex items-center gap-2">
        {links && (
          <>
            <a
              href={`https://wa.me/${links.wa}?text=${encodeURIComponent(`Hello, this is CNDL Dental Lab regarding Case ID: ${order.caseId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${order.caseId}`}
              title="WhatsApp the clinic"
              className={`${btn} bg-[#25D366] border-[#25D366] text-white hover:bg-[#1fbd59]`}
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className={size === 'md' ? 'w-4 h-4' : 'w-4 h-4'} aria-hidden="true">
                <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
              </svg>
            </a>
            <a
              href={`tel:${links.tel}`}
              aria-label={`Call ${order.caseId}`}
              title="Call the clinic"
              className={`${btn} bg-white border-slate-200 text-teal-700 hover:bg-blue-50`}
            >
              <Phone size={15} />
            </a>
          </>
        )}
        <button
          onClick={() => setModalId(order.id)}
          aria-label={`Open prescription details for ${order.caseId}`}
          title="Case prescription details"
          className={`${btn} bg-white border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          <Eye size={15} />
        </button>
      </div>
    );
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Total Cases', value: totalOrders, icon: Layers, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'In Production', value: productionCount, icon: RefreshCw, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Dispatched', value: dispatchedCount, icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
      { label: 'Turnaround Avg', value: `${avgTurnaroundDays} Days`, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="orders"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= TAB 1: LAB CASES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg sm:text-2xl font-semibold">Manage Lab Cases</h2>
                <button
                  onClick={openOfflineOrder}
                  className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors shadow-sm whitespace-nowrap"
                >
                  <Plus size={16} /> Add Offline Order
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Case ID, doctor or phone..."
                    className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                {filtersActive && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('All');
                    }}
                    className="min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['All', ...STATUS_OPTIONS].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`min-h-[36px] px-4 rounded-full text-xs font-bold border transition-all duration-300 ${
                    statusFilter === s
                      ? 'bg-teal-700 border-teal-700 text-white shadow'
                      : 'bg-white border-slate-200 text-gray-500 hover:border-teal-700/20 hover:text-teal-700'
                  }`}
                >
                  {s === 'All' ? 'All Statuses' : s}
                </button>
              ))}
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-4">
              {pagedOrders.map((order) => {
                const c = parseClinical(order.productType);
                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-xs font-semibold shrink-0 whitespace-nowrap">
                          {order.caseId}
                        </span>
                        {order.orderSource && ORDER_SOURCE_META[order.orderSource] && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${ORDER_SOURCE_META[order.orderSource].cls}`}>
                            {ORDER_SOURCE_META[order.orderSource].label}
                          </span>
                        )}
                        <button
                          onClick={() => copyText(order.id, order.caseId, 'Case ID')}
                          aria-label={`Copy ${order.caseId}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                        >
                          {copiedId === order.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <StagePill
                        status={order.status}
                        saving={savingId === order.id}
                        onChange={(s) => updateStage(order, s)}
                      />
                    </div>

                    <div className="text-sm space-y-1 min-w-0">
                      <div className="font-bold truncate">{order.customerName}</div>
                      {c.patient && <div className="text-xs text-gray-500 truncate">Patient: {c.patient}</div>}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> Ordered {formatDay(order.orderDate || order.createdAt)}</span>
                        {order.deliveryDate && <span className="inline-flex items-center gap-1 font-bold text-teal-700/80"><Clock size={11} /> Promised {formatDay(order.deliveryDate)}</span>}
                      </div>
                    </div>

                    {phoneLinks(order.phone) && (
                      <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 min-h-[44px]">
                        <Phone size={14} /> {order.phone}
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {c.work && c.work.split(' | ').filter(Boolean).map((w, i) => (
                        <span key={`${order.id}-mw-${i}`} className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-100 px-2.5 py-1 text-[11px] font-bold max-w-full truncate">
                          {w}
                        </span>
                      ))}
                      {c.teeth && <Chip label="Teeth" value={c.teeth} tone="green" />}
                      {c.shade && <Chip label="Shade" value={c.shade} tone="gray" />}
                      {c.trial && <Chip label="Trial" value={c.trial} tone="gray" />}
                      {c.insertion && <Chip label="Insertion" value={c.insertion} tone="gray" />}
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 break-words" title={c.notes}>Notes: {c.notes}</p>}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {commsButtons(order, 'sm')}
                      <button
                        onClick={() => deleteOrder(order)}
                        disabled={deletingId === `order-${order.id}`}
                        aria-label={`Delete or archive ${order.caseId}`}
                        title="Delete / Archive case"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {orderFilteredCount === 0 && (
                <p className="text-center text-sm text-slate-500 py-10">
                  {filtersActive ? 'No cases match your filters.' : 'No lab cases yet.'}
                </p>
              )}
            </div>

            {/* Tablet/Desktop: modern structured table */}
            <div className="hidden md:block overflow-x-auto rounded-xl">
              <table className="w-full text-left tabular-nums">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-4 pr-4">Case</th>
                    <th className="pb-4 pr-4">Doctor / Clinic</th>
                    <th className="pb-4 pr-4">Restoration</th>
                    <th className="pb-4 pr-4">Clinical Stage</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedOrders.map((order) => {
                    const c = parseClinical(order.productType);
                    return (
                      <tr key={order.id} className="align-top hover:bg-slate-50/80 transition-colors">
                        <td className="py-5 pr-4">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-xs font-semibold whitespace-nowrap">
                              {order.caseId}
                            </span>
                            {order.orderSource && ORDER_SOURCE_META[order.orderSource] && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${ORDER_SOURCE_META[order.orderSource].cls}`}>
                                {ORDER_SOURCE_META[order.orderSource].label}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => copyText(order.id, order.caseId, 'Case ID')}
                            aria-label={`Copy ${order.caseId}`}
                            title="Copy Case ID"
                            className="mt-1.5 p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-white"
                          >
                            {copiedId === order.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                            <CalendarDays size={11} /> Ordered {formatDay(order.orderDate || order.createdAt)}
                          </div>
                          {order.deliveryDate && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                              <Clock size={11} /> <span className="font-bold text-teal-700/80">Promised {formatDay(order.deliveryDate)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-5 pr-4 max-w-[220px] min-w-0">
                          <div className="font-bold text-sm truncate" title={order.customerName}>{order.customerName || '—'}</div>
                          {c.patient && (
                            <div className="text-xs text-gray-500 truncate mt-0.5" title={c.patient}>
                              <span className="text-slate-500">Patient:</span> {c.patient}
                            </div>
                          )}
                        </td>
                        <td className="py-5 pr-4 max-w-[220px]">
                          {c.work ? (
                            <div className="flex flex-wrap gap-1.5">
                              {c.work.split(' | ').filter(Boolean).map((w, i) => (
                                <span
                                  key={`${order.id}-w-${i}`}
                                  className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-100 px-2.5 py-1 text-[11px] font-bold max-w-[200px] truncate"
                                  title={w}
                                >
                                  {w}
                                </span>
                              ))}
                              {c.teeth && <Chip label="Teeth" value={c.teeth} tone="green" />}
                              {c.shade && <Chip label="Shade" value={c.shade} tone="gray" />}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-5 pr-4">
                          <StagePill
                            status={order.status}
                            saving={savingId === order.id}
                            onChange={(s) => updateStage(order, s)}
                          />
                        </td>
                        <td className="py-5">
                          <div className="flex items-center gap-2">
                            {commsButtons(order)}
                            <button
                              onClick={() => deleteOrder(order)}
                              disabled={deletingId === `order-${order.id}`}
                              aria-label={`Delete or archive ${order.caseId}`}
                              title="Delete / Archive case"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
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
              {orderFilteredCount === 0 && (
                <p className="text-center text-sm text-slate-500 py-10">
                  {filtersActive ? 'No cases match your filters.' : 'No lab cases yet.'}
                </p>
              )}
            </div>

            <Pager
              page={safePage}
              total={orderFilteredCount}
              perPage={ORDERS_PER_PAGE}
              onPage={setPage}
              noun={orderFilteredCount === 1 ? 'case' : 'cases'}
              note={filtersActive ? `(filtered from ${totalOrders})` : undefined}
            />
          </div>
        )}
      </SectionFrame>

      {modalOrder && (() => {
        const c = parseClinical(modalOrder.productType);
        const edit = edits[modalOrder.id] ?? { status: modalOrder.status, progress: modalOrder.progress };
        return (
          <ModalShell onClose={() => setModalId(null)}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
            onClick={() => setModalId(null)}
          >
            <div
              className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 truncate">{modalOrder.caseId}</h3>
                  <button
                    onClick={() => copyText(modalOrder.id, modalOrder.caseId, 'Case ID')}
                    aria-label="Copy Case ID"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    {copiedId === modalOrder.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => setModalId(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <p className="text-xs text-slate-500 font-medium">
                  Created {formatDate(modalOrder.createdAt)} · Last updated {formatDate(modalOrder.updatedAt)}
                </p>

                {/* Communication shortcuts */}
                <div className="flex items-center gap-2">
                  {commsButtons(modalOrder)}
                  <span className="text-xs text-slate-500 font-medium">Contact shortcuts</span>
                </div>

                {/* Clinical parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Doctor / Clinic</p>
                    <p className="text-sm font-bold">{modalOrder.customerName}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Patient</p>
                    <p className="text-sm font-bold">{c.patient || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Phone</p>
                    {phoneLinks(modalOrder.phone) ? (
                      <a href={`tel:${modalOrder.phone}`} className="text-sm font-bold text-teal-700">
                        {modalOrder.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-bold">{modalOrder.phone || '—'}</p>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Restoration &amp; Material</p>
                    <p className="text-sm font-bold">{c.work || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Tooth Number(s)</p>
                    <p className="text-sm font-bold">{c.teeth || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Shade</p>
                    <p className="text-sm font-bold">{c.shade || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Trial Date</p>
                    <p className="text-sm font-bold">{c.trial || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Insertion / Delivery</p>
                    <p className="text-sm font-bold">{c.insertion || '—'}</p>
                  </div>
                </div>

                {c.notes && (
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Clinical Notes / Special Instructions</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                  </div>
                )}

                {/* Editable status inside modal */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500">Current Status &amp; Progress</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={edit.status} />
                    <span className="text-xs font-semibold text-slate-500">{edit.progress}%</span>
                  </div>
                  <ProgressBar value={edit.progress} />
                  <CaseControls
                    order={modalOrder}
                    edit={edit}
                    onEdit={(e) => setEdits({ ...edits, [modalOrder.id]: e })}
                    onSave={() => updateStatus(modalOrder)}
                    saving={savingId === modalOrder.id}
                  />
                </div>
              </div>
            </div>
          </ModalShell>
        );
      })()}

            {/* Service Create / Edit Modal */}
      {offlineOrderModal && (() => {
        const linkedAccount = offlineOrderForm.clientAccountId
          ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId) ?? null
          : null;
        const activeProducts = (data?.services ?? []).filter((s) => s.isActive);
        return (
          <ModalShell onClose={() => (quickAccountOpen ? setQuickAccountOpen(false) : setOfflineOrderModal(false))}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          >
            <form
              onSubmit={submitOfflineOrder}
              className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 inline-flex items-center gap-2">
                    <ClipboardList size={18} /> Add Offline / Manual Order
                  </h3>
                  <p className="text-xs text-slate-500">Register rider pickups, phone &amp; WhatsApp intakes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOfflineOrderModal(false)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Date *</label>
                    <input
                      type="date"
                      required
                      value={offlineOrderForm.orderDate}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, orderDate: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Promised Delivery Date</label>
                    <input
                      type="date"
                      value={offlineOrderForm.deliveryDate}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, deliveryDate: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Source *</label>
                  <select
                    value={offlineOrderForm.orderSource}
                    onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, orderSource: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="OFFLINE_RIDER">Offline — Rider Pickup</option>
                    <option value="PHONE">Phone</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="ONLINE">Online (website)</option>
                  </select>
                </div>

                {/* Client account or manual entry */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-500">Client Account</label>
                    <button
                      type="button"
                      onClick={() => setQuickAccountOpen(!quickAccountOpen)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {quickAccountOpen ? '✕ Close Quick Add' : '+ Quick New Account'}
                    </button>
                  </div>

                  {quickAccountOpen && (
                    <div className="mb-3 p-3.5 rounded-xl border border-teal-700/30 bg-teal-700/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Quick Add Client Account</span>
                        <span className="text-[11px] text-slate-500 font-medium">Auto-selects on save</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Clinic / Lab Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Popular Dental Clinic"
                            value={quickAccountForm.name}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, name: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Doctor Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Dr. Rafiqul Islam"
                            value={quickAccountForm.ownerName}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, ownerName: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. 01711000000"
                            value={quickAccountForm.phone}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, phone: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Division *</label>
                          <select
                            value={quickAccountForm.division}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, division: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          >
                            {DIVISIONS.map((d) => (
                              <option key={d.key} value={d.key}>
                                {d.bn ? `${d.label} (${d.bn})` : d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setQuickAccountOpen(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCreateAccount}
                          disabled={savingQuickAccount}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {savingQuickAccount ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create & Select'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <select
                    value={offlineOrderForm.clientAccountId}
                    onChange={(e) => {
                      const acc = erpAccounts.find((a) => a.id === e.target.value);
                      setOfflineOrderForm((f) => ({
                        ...f,
                        clientAccountId: e.target.value,
                        // Auto-attribute to the account's assigned agent when one exists.
                        attribution: acc?.assignedAgentId ? 'AGENT' : 'DIRECT',
                        agentId: acc?.assignedAgentId || '',
                      }));
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="">— Walk-in / new (manual entry) —</option>
                    {erpAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} · {a.ownerName}</option>
                    ))}
                  </select>
                  {linkedAccount ? (
                    <div className="mt-2 rounded-xl border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-xs">
                      <p className="font-bold text-teal-700">{linkedAccount.name}</p>
                      <p className="text-slate-600 mt-0.5">Dr. {linkedAccount.ownerName} · {linkedAccount.phone}</p>
                      <p className="text-slate-500 mt-0.5">
                        Current due: <span className={linkedAccount.currentBalance > 0 ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>{formatBDT(linkedAccount.currentBalance)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Doctor Name *</label>
                        <input
                          required
                          value={offlineOrderForm.doctorName}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, doctorName: e.target.value })}
                          placeholder="Dr. Full Name"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinic Name</label>
                        <input
                          value={offlineOrderForm.clinicName}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, clinicName: e.target.value })}
                          placeholder="Clinic / chamber name"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                        <input
                          value={offlineOrderForm.phone}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, phone: e.target.value })}
                          placeholder="01XXXXXXXXX"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order attribution */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Attribution *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'DIRECT', label: 'Direct CNDL' },
                      { key: 'AGENT', label: 'Via Agent' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setOfflineOrderForm({
                          ...offlineOrderForm,
                          attribution: opt.key,
                          agentId: opt.key === 'DIRECT' ? '' : (offlineOrderForm.agentId || linkedAccount?.assignedAgentId || ''),
                          commissionAmount: opt.key === 'DIRECT' ? '' : offlineOrderForm.commissionAmount,
                        })}
                        className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                          offlineOrderForm.attribution === opt.key
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {offlineOrderForm.attribution === 'AGENT' && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent *</label>
                        <select
                          value={offlineOrderForm.agentId}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, agentId: e.target.value })}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        >
                          <option value="">— Select agent —</option>
                          {agentList.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        {linkedAccount?.assignedAgentId && offlineOrderForm.agentId === linkedAccount.assignedAgentId && (
                          <p className="text-[11px] text-teal-600 mt-1 font-semibold">Auto-selected from {linkedAccount.name}&rsquo;s assigned agent.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Commission (৳)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={offlineOrderForm.commissionAmount}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, commissionAmount: e.target.value })}
                          placeholder="0"
                          className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient / Tooth / Shade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Patient Name</label>
                    <input
                      value={offlineOrderForm.patientName}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, patientName: e.target.value })}
                      placeholder="Patient"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">FDI Tooth No</label>
                    <input
                      value={offlineOrderForm.toothNo}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, toothNo: e.target.value })}
                      placeholder="e.g. 36, 11-21"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Shade (Vita / Bleach)</label>
                    <select
                      value={offlineOrderForm.shade}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, shade: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="">— Select —</option>
                      <optgroup label="Vita Classical">
                        {VITA_SHADES.filter((s) => !s.startsWith('BL')).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Bleach">
                        {VITA_SHADES.filter((s) => s.startsWith('BL')).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Product + units + billed amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Product / Restoration *</label>
                    <select
                      required
                      value={offlineOrderForm.productName}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, productName: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="">— Select product —</option>
                      {activeProducts.map((p) => (
                        <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                    {activeProducts.length === 0 && (
                      <p className="text-xs text-rose-500 mt-1">No active products in the catalogue — add one under Dental Products.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Units *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="200"
                        value={offlineOrderForm.units}
                        onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, units: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Billed (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offlineOrderForm.billedAmount}
                        onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, billedAmount: e.target.value })}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Ledger link */}
                <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  linkedAccount ? 'cursor-pointer hover:bg-slate-50 border-slate-200' : 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    disabled={!linkedAccount}
                    checked={offlineOrderForm.addToLedger}
                    onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, addToLedger: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Add to Client Due Ledger
                    <span className="block text-xs font-normal text-slate-500">
                      {linkedAccount
                        ? `Records an invoice against ${linkedAccount.name} and increases its outstanding due.`
                        : 'Link a client account above to enable ledger billing.'}
                    </span>
                  </span>
                </label>

                {/* Historical intake */}
                <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 cursor-pointer hover:bg-amber-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={offlineOrderForm.historical}
                    onChange={(e) => setOfflineOrderForm((f) => ({
                      ...f,
                      historical: e.target.checked,
                      // A case that was already delivered posts its full due to the ledger.
                      addToLedger: e.target.checked && linkedAccount ? true : f.addToLedger,
                    }))}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Historical Case (Already Delivered)
                    <span className="block text-xs font-normal text-gray-500">
                      Sets status straight to Dispatched — bypasses the milling queue{linkedAccount ? ' and posts the full billed amount to the client due ledger.' : '.'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setOfflineOrderModal(false)}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
                >
                  {savingOrder ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </ModalShell>
        );
      })()}
    </>
  );
}
