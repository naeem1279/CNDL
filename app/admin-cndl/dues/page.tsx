'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck, Check, Clock, Landmark, MessageSquare, Package, Pencil, Phone, Plus, Search, User,
  Wallet, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import {
  ACCOUNTS_PER_PAGE, DIVISIONS, DIVISION_LABEL, EMPTY_ACCOUNT_FORM, EMPTY_INVOICE_FORM,
  EMPTY_PAYMENT_FORM, INSTITUTION_TYPE_META, PAYMENT_METHODS,
} from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent, ErpLedgerEntry, ErpUser } from '../_lib/types';
import { apiError, formatBDT, formatDate, formatDay, phoneLinks, readPref, todayInput } from '../_lib/utils';

export default function DuesPage() {
  const { me, adminFetch } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ERP & Accounts state
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);
  const [erpAgents, setErpAgents] = useState<ErpAgent[]>([]);
  const [erpUsers, setErpUsers] = useState<ErpUser[]>([]);
  const [erpLedger, setErpLedger] = useState<ErpLedgerEntry[]>([]);
  const [accountModal, setAccountModal] = useState(false);
  const [invoiceModalAcc, setInvoiceModalAcc] = useState<ErpAccount | null>(null);
  const [paymentModalAcc, setPaymentModalAcc] = useState<ErpAccount | null>(null);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);

  const [duesView, setDuesView] = useState<'accounts' | 'collections'>(() =>
    readPref('cndl-admin-dues-view') === 'collections' ? 'collections' : 'accounts'
  );
  const [divisionFilter, setDivisionFilter] = useState('DHAKA');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [editingAccount, setEditingAccount] = useState<ErpAccount | null>(null);
  const [accountDupWarning, setAccountDupWarning] = useState<string | null>(null);
  const [savingErp, setSavingErp] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  // Phase 2: Client Dues search/pagination + Collection Log filters
  const [accSearch, setAccSearch] = useState('');
  const [accPage, setAccPage] = useState(1);
  const [collFrom, setCollFrom] = useState('');
  const [collTo, setCollTo] = useState('');
  const [collMethod, setCollMethod] = useState('ALL');

  /** Loads only this section's feeds: accounts, ledger, users. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'ledger', 'users'], me.role);
      if (!r) return;
      if (r.accounts) setErpAccounts(r.accounts);
      if (r.agents) setErpAgents(r.agents);
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

  /* ---------- ERP: Client Dues & Ledger ---------- */
  const openInvoiceModal = (acc: ErpAccount) => {
    setInvoiceForm(EMPTY_INVOICE_FORM);
    setInvoiceModalAcc(acc);
  };

  const openPaymentModal = (acc: ErpAccount) => {
    setPaymentForm({ ...EMPTY_PAYMENT_FORM, paymentDate: todayInput() });
    setPaymentModalAcc(acc);
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceModalAcc) return;
    const gross = parseFloat(invoiceForm.grossAmount);
    const discount = parseFloat(invoiceForm.discountAmount || '0') || 0;
    if (!gross || gross <= 0) {
      toast.error('Enter a valid gross amount');
      return;
    }
    if (discount < 0 || discount > gross) {
      toast.error('Discount must be between 0 and the gross amount');
      return;
    }
    if (discount > 0 && !invoiceForm.notes.trim()) {
      toast.error('A note is mandatory when applying a discretionary discount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'INVOICE',
          clientAccountId: invoiceModalAcc.id,
          grossAmount: gross,
          discountAmount: discount,
          orderId: invoiceForm.orderId.trim() || null,
          notes: invoiceForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Invoice recorded');
        setInvoiceModalAcc(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record invoice'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalAcc) return;
    const amount = parseFloat(paymentForm.netAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid collection amount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'PAYMENT',
          clientAccountId: paymentModalAcc.id,
          netAmount: amount,
          collectedById: paymentForm.collectedById || (me?.role === 'AGENT' && me.uid ? me.uid : null),
          isVerified: paymentForm.isVerified,
          paymentMethod: paymentForm.paymentMethod || null,
          paymentDate: paymentForm.paymentDate
            ? new Date(paymentForm.paymentDate + 'T12:00:00').toISOString()
            : null,
          notes: paymentForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Collection recorded');
        setPaymentModalAcc(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record collection'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const openNewAccount = () => {
    setEditingAccount(null);
    setAccountDupWarning(null);
    setAccountForm({
      ...EMPTY_ACCOUNT_FORM,
      division: divisionFilter !== 'ALL' ? divisionFilter : 'DHAKA',
    });
    setAccountModal(true);
  };

  const openEditAccount = (acc: ErpAccount) => {
    setEditingAccount(acc);
    setAccountDupWarning(null);
    setAccountForm({
      accountType: acc.accountType || 'CHAMBER',
      name: acc.name,
      ownerName: acc.ownerName,
      phone: acc.phone,
      email: acc.email || '',
      address: acc.address || '',
      institutionType: acc.institutionType || 'CHAMBER',
      division: acc.division || 'DHAKA',
      district: acc.district || '',
      assignedAgentId: acc.assignedAgentId || '',
      openingDue: '',
    });
    setAccountModal(true);
  };

  const saveAccount = async (allowDuplicate: boolean) => {
    setSavingErp(true);
    setAccountDupWarning(null);
    try {
      const editing = editingAccount;
      const payload = editing
        ? { ...accountForm, openingDue: undefined, allowDuplicate: undefined }
        : { ...accountForm, allowDuplicate: allowDuplicate || undefined };
      const res = await adminFetch(
        editing ? `/api/admin/erp/accounts/${editing.id}` : '/api/admin/erp/accounts',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body.warning === 'DUPLICATE_PHONE') {
        setAccountDupWarning(body.existingName || 'an existing account');
        return;
      }
      if (res.ok) {
        toast.success(editing ? 'Client account updated' : 'Client account created');
        setAccountModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save account'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    saveAccount(false);
  };

  const visibleAccounts = useMemo(
    () => (me?.role === 'AGENT' && me.uid ? erpAccounts.filter((a) => a.assignedAgentId === me.uid) : erpAccounts),
    [erpAccounts, me]
  );

  const { totalMarketDue, chairmanDue } = useMemo(() => {
    const total = visibleAccounts.reduce((sum, a) => sum + Math.max(0, a.currentBalance || 0), 0);
    const chairman = visibleAccounts
      .filter((a) => a.accountType === 'CHAIRMAN_PERSONAL')
      .reduce((sum, a) => sum + Math.max(0, a.currentBalance || 0), 0);
    return {
      totalMarketDue: total,
      chairmanDue: chairman,
      compactDue:
        total >= 1000
          ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(total)
          : String(Math.round(total)),
    };
  }, [visibleAccounts]);

  const filteredAccounts = useMemo(() => {
    const sq = accSearch.trim().toLowerCase();
    return visibleAccounts.filter((a) => {
      if (divisionFilter !== 'ALL' && (a.division || 'DHAKA') !== divisionFilter) return false;
      if (agentFilter === 'UNASSIGNED' && a.assignedAgentId) return false;
      if (agentFilter !== 'ALL' && agentFilter !== 'UNASSIGNED' && a.assignedAgentId !== agentFilter) return false;
      if (
        sq &&
        ![a.name, a.ownerName, a.phone, a.district || ''].some((v) => (v || '').toLowerCase().includes(sq))
      )
        return false;
      return true;
    });
  }, [visibleAccounts, divisionFilter, agentFilter, accSearch]);

  // Due aging per account (memoized map — previously recomputed per row per render
  // and capped-ledger-dependent).
  const agingDaysByAccount = useMemo(() => {
    const m = new Map<string, number>();
    for (const acc of visibleAccounts) {
      const rows = erpLedger.filter((e) => e.clientAccountId === acc.id);
      const payments = rows.filter((e) => e.transactionType === 'PAYMENT');
      const invoices = rows.filter((e) => e.transactionType === 'INVOICE');
      let anchor: number;
      if (payments.length) {
        anchor = Math.max(...payments.map((e) => new Date(e.paymentDate || e.createdAt).getTime()));
      } else if (invoices.length) {
        anchor = Math.min(...invoices.map((e) => new Date(e.paymentDate || e.createdAt).getTime()));
      } else {
        anchor = new Date(acc.createdAt).getTime();
      }
      m.set(acc.id, Math.max(0, Math.floor((Date.now() - anchor) / 86400000)));
    }
    return m;
  }, [visibleAccounts, erpLedger]);

  // Bengali due-reminder deep links (memoized — itemized ledger summary per account).
  const reminderHrefByAccount = useMemo(() => {
    const m = new Map<string, string>();
    for (const acc of visibleAccounts) {
      const rows = erpLedger.filter((e) => e.clientAccountId === acc.id);
      const invoices = rows.filter((e) => e.transactionType === 'INVOICE').slice(0, 3);
      const paid = rows.filter((e) => e.transactionType === 'PAYMENT').reduce((s, e) => s + (e.netAmount || 0), 0);
      const parts: string[] = invoices.map(
        (inv) => `• ${formatDay(inv.createdAt)} — ৳${Math.round(inv.netAmount).toLocaleString('en-IN')}`
      );
      if (paid > 0) parts.push(`মোট পরিশোধ: ৳${Math.round(paid).toLocaleString('en-IN')}`);
      if (!parts.length) parts.push('নতুন হিসাব');
      const text = `শ্রদ্ধেয ডক্টর ${acc.ownerName}, CNDL ল্যাব থেকে আপনার মোট বকেয়া ৳${Math.round(acc.currentBalance).toLocaleString('en-IN')}। বিস্তারিত: ${parts.join(' ')}। বিকাশ/মার্চেন্ট: 01743-167963। ধন্যবাদ!`;
      const num = phoneLinks(acc.phone)?.wa || acc.phone.replace(/\D/g, '');
      m.set(acc.id, `https://wa.me/${num}?text=${encodeURIComponent(text)}`);
    }
    return m;
  }, [visibleAccounts, erpLedger]);

  const visibleAccountIds = useMemo(() => new Set(visibleAccounts.map((a) => a.id)), [visibleAccounts]);
  const todayCollection = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayOf = (e: ErpLedgerEntry) => new Date(e.paymentDate || e.createdAt).getTime();
    return erpLedger
      .filter(
        (e) =>
          e.transactionType === 'PAYMENT' &&
          dayOf(e) >= start.getTime() &&
          (me?.role === 'AGENT' ? visibleAccountIds.has(e.clientAccountId) : true)
      )
      .reduce((sum, e) => sum + (e.netAmount || 0), 0);
  }, [erpLedger, me, visibleAccountIds]);

  const collectedByMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of erpAgents) m[a.id] = a.name;
    for (const u of erpUsers) m[u.id] = u.name;
    return m;
  }, [erpAgents, erpUsers]);

  const collectionRows = useMemo(
    () =>
      erpLedger
        .filter((e) =>
          e.transactionType === 'PAYMENT' &&
          (me?.role === 'AGENT' ? visibleAccountIds.has(e.clientAccountId) : true)
        )
        .slice()
        .sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime()),
    [erpLedger, me, visibleAccountIds]
  );

  // Phase 2: dues pagination — snap back to page 1 whenever filters change.
  useEffect(() => {
    setAccPage(1);
  }, [accSearch, divisionFilter, agentFilter]);

  const pagedAccounts = useMemo(() => {
    const start = (accPage - 1) * ACCOUNTS_PER_PAGE;
    return filteredAccounts.slice(start, start + ACCOUNTS_PER_PAGE);
  }, [filteredAccounts, accPage]);

  // Phase 2: Collection Log filters — date range (paymentDate-aware) + method.
  const filteredCollections = useMemo(() => {
    const from = collFrom ? new Date(`${collFrom}T00:00:00`).getTime() : null;
    const to = collTo ? new Date(`${collTo}T23:59:59.999`).getTime() : null;
    return collectionRows.filter((e) => {
      const t = new Date(e.paymentDate || e.createdAt).getTime();
      if (!isNaN(t)) {
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
      }
      if (collMethod !== 'ALL' && (e.paymentMethod || '') !== collMethod) return false;
      return true;
    });
  }, [collectionRows, collFrom, collTo, collMethod]);

  const agentList = erpAgents;

  // Aging + reminder badges read the memoized per-account maps (built above).
  const agingBadge = (acc: ErpAccount): { label: string; cls: string } | null => {
    if ((acc.currentBalance || 0) <= 0) return null;
    const d = agingDaysByAccount.get(acc.id) ?? 0;
    if (d > 30) return { label: `${d}d overdue`, cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (d >= 15) return { label: `${d}d`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: `${d}d`, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  };
  const whatsappReminderHref = (acc: ErpAccount): string => reminderHrefByAccount.get(acc.id) ?? '';

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the accounts/collections choice.
  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-dues-view', duesView);
    } catch {
      /* ignore */
    }
  }, [duesView]);

  const kpiCards: Kpi[] = (
      me?.role === 'AGENT' ? [
        { label: 'Assigned Accounts', value: visibleAccounts.length, icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
        { label: 'Outstanding (Assigned)', value: formatBDT(totalMarketDue), icon: Wallet, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
        { label: "Today's Collection", value: formatBDT(todayCollection), icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      ] : [
        { label: 'Total Market Due', value: formatBDT(totalMarketDue), icon: Landmark, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
        { label: 'Active Accounts', value: visibleAccounts.length, icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
        { label: "Today's Collection", value: formatBDT(todayCollection), icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
        { label: 'Chairman Channel Due', value: formatBDT(chairmanDue), icon: Wallet, bg: 'bg-amber-50', fg: 'text-amber-600', valueCls: 'text-amber-600' },
      ]
  );

  return (
    <>
      <SectionFrame
        tab="dues"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= CLIENT DUES & LEDGER ================= */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Client Dues &amp; Ledger</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Track chamber, partner-lab &amp; chairman channel balances, invoices and collections</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Accounts / Collection Log view toggle */}
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        onClick={() => setDuesView('accounts')}
                        className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-colors ${duesView === 'accounts' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Client Accounts
                      </button>
                      <button
                        onClick={() => setDuesView('collections')}
                        className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-colors ${duesView === 'collections' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Collection Log
                      </button>
                    </div>
                    {duesView === 'accounts' && (
                      <button
                        onClick={openNewAccount}
                        className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                      >
                        <Plus size={16} /> Add Client Account
                      </button>
                    )}
                  </div>
                </div>

                {duesView === 'collections' ? (
                  <>
                    {/* Phase 2: date-range + method filters */}
                    <div className="flex flex-wrap items-end gap-2.5 mb-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
                        <input
                          type="date"
                          value={collFrom}
                          onChange={(e) => setCollFrom(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
                        <input
                          type="date"
                          value={collTo}
                          onChange={(e) => setCollTo(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Method</label>
                        <select
                          value={collMethod}
                          onChange={(e) => setCollMethod(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        >
                          <option value="ALL">All Methods</option>
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      {(collFrom || collTo || collMethod !== 'ALL') && (
                        <button
                          onClick={() => { setCollFrom(''); setCollTo(''); setCollMethod('ALL'); }}
                          className="min-h-[36px] px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </div>
                    {filteredCollections.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3.5 py-1.5 text-xs font-semibold">
                          <Wallet size={13} /> {filteredCollections.length} collection{filteredCollections.length === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3.5 py-1.5 text-xs font-semibold">
                          Total: {formatBDT(filteredCollections.reduce((s, e) => s + (e.netAmount || 0), 0))}
                        </span>
                      </div>
                    )}

                    {/* Desktop: collection log table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl">
                      <table className="w-full text-left tabular-nums">
                        <thead>
                          <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="pb-4 pr-4">Date &amp; Time</th>
                            <th className="pb-4 pr-4">Clinic</th>
                            <th className="pb-4 pr-4">Amount Collected</th>
                            <th className="pb-4 pr-4">Method</th>
                            <th className="pb-4 pr-4">Collected By</th>
                            <th className="pb-4">Verified</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCollections.map((e) => {
                            const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 pr-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                  {formatDate(e.paymentDate || e.createdAt)}
                                  {e.paymentDate && new Date(e.paymentDate).getTime() !== new Date(e.createdAt).getTime() && (
                                    <span className="ml-1.5 rounded-full bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[11px] font-medium" title="Backdated entry">backdated</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="font-bold text-sm">{acc?.name || 'Client account'}</div>
                                  {e.orderId && <div className="text-[11px] text-slate-500">Case {e.orderId}</div>}
                                </td>
                                <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">+{formatBDT(e.netAmount)}</td>
                                <td className="py-3.5 pr-4">
                                  {e.paymentMethod ? (
                                    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">{e.paymentMethod}</span>
                                  ) : (
                                    <span className="text-xs text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4 text-sm text-slate-600 whitespace-nowrap">{(e.collectedById && collectedByMap[e.collectedById]) || '—'}</td>
                                <td className="py-3.5">
                                  {e.isVerified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"><BadgeCheck size={12} /> Verified</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredCollections.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                            <Wallet size={28} />
                          </span>
                          <p className="text-sm font-bold text-gray-500">{collectionRows.length > 0 ? 'No collections match these filters' : 'No collections recorded yet'}</p>
                          <p className="text-xs text-slate-500 mt-1">{collectionRows.length > 0 ? 'Widen the date range or switch the method filter.' : 'Record a payment from the Client Accounts view to build the log.'}</p>
                        </div>
                      )}
                    </div>

                    {/* Mobile: collection rows */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {filteredCollections.map((e) => {
                        const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                        return (
                          <div key={e.id} className="py-3.5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">{acc?.name || 'Client account'}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{formatDate(e.paymentDate || e.createdAt)}{e.paymentMethod ? ` · ${e.paymentMethod}` : ''}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {(e.collectedById && collectedByMap[e.collectedById]) || 'Unattributed'}
                                {e.isVerified ? ' · Verified' : ' · Pending verification'}
                              </div>
                            </div>
                            <span className="font-semibold text-emerald-600 whitespace-nowrap text-sm">+{formatBDT(e.netAmount)}</span>
                          </div>
                        );
                      })}
                      {filteredCollections.length === 0 && (
                        <p className="text-center text-sm text-slate-500 py-10">
                          {collectionRows.length > 0 ? 'No collections match these filters.' : 'No collections recorded yet.'}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                <>
                {/* Division & Agent filter toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                  <div className="flex items-center overflow-x-auto no-scrollbar py-1 gap-1.5 flex-nowrap -mx-2 px-2 sm:mx-0 sm:px-0">
                    <button
                      onClick={() => setDivisionFilter('ALL')}
                      className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${divisionFilter === 'ALL' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
                    >
                      All
                    </button>
                    {DIVISIONS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDivisionFilter(d.key)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${divisionFilter === d.key ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
                      >
                        {d.bn ? `${d.label} (${d.bn})` : d.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full lg:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={accSearch}
                      onChange={(e) => setAccSearch(e.target.value)}
                      placeholder="Search account, owner, phone, district…"
                      className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="lg:ml-auto min-h-[36px] px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20 max-w-[220px]"
                  >
                    <option value="ALL">All Agents</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {agentList.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Desktop: accounts table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Account</th>
                        <th className="pb-4 pr-4 hidden 2xl:table-cell">Institution</th>
                        <th className="pb-4 pr-4">Owner / Phone</th>
                        <th className="pb-4 pr-4">Division / Area</th>
                        <th className="pb-4 pr-4">Assigned Agent</th>
                        <th className="pb-4 pr-4">Current Due (BDT)</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedAccounts.map((acc) => {
                        const instMeta = INSTITUTION_TYPE_META[acc.institutionType] || INSTITUTION_TYPE_META.CHAMBER;
                        const aging = agingBadge(acc);
                        return (
                          <tr key={acc.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="font-bold text-sm min-w-[160px]">{acc.name}</div>
                              {acc.customDiscountNote && (
                                <div className="text-[11px] text-slate-500 max-w-[180px] truncate" title={acc.customDiscountNote}>
                                  {acc.customDiscountNote}
                                </div>
                              )}
                            </td>
                            <td className="py-4 pr-4 hidden 2xl:table-cell">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap ${instMeta.cls}`}>
                                {instMeta.label}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-medium text-slate-800 whitespace-nowrap">{acc.ownerName}</div>
                              <div className="text-xs text-slate-500 whitespace-nowrap">{acc.phone}</div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                {DIVISION_LABEL[acc.division || 'DHAKA'] || acc.division}{acc.district ? ` — ${acc.district}` : ''}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              {acc.assignedAgentName ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 whitespace-nowrap">
                                  <User size={11} /> {acc.assignedAgentName}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-4 pr-4 whitespace-nowrap">
                              <div className={`font-semibold ${acc.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatBDT(acc.currentBalance)}
                              </div>
                              {aging && (
                                <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${aging.cls}`}>
                                  <Clock size={10} /> {aging.label}
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {me?.role === 'SUPERADMIN' && (
                                  <button
                                    onClick={() => openEditAccount(acc)}
                                    aria-label={`Edit ${acc.name}`}
                                    title="Edit account / re-assign agent"
                                    className="min-h-[40px] w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                {acc.currentBalance > 0 ? (
                                  <a
                                    href={whatsappReminderHref(acc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`WhatsApp due reminder to ${acc.name}`}
                                    title="Send Bengali due reminder on WhatsApp"
                                    className="min-h-[40px] w-10 inline-flex items-center justify-center rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 text-[#1a8f4a] hover:bg-[#25D366]/20 transition-colors"
                                  >
                                    <MessageSquare size={14} />
                                  </a>
                                ) : (
                                  <span aria-hidden="true" className="w-10 shrink-0" />
                                )}
                                <button
                                  onClick={() => openInvoiceModal(acc)}
                                  className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors whitespace-nowrap"
                                >
                                  <Plus size={13} /> Invoice
                                </button>
                                <button
                                  onClick={() => openPaymentModal(acc)}
                                  className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                                >
                                  <Check size={13} /> Collection
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredAccounts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Landmark size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">
                        {visibleAccounts.length === 0 ? 'No client accounts yet' : 'No accounts match these filters'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {visibleAccounts.length === 0
                          ? 'Add chambers, partner labs or chairman channel accounts to start billing.'
                          : 'Try another division or agent — or switch to the All tab.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile: account cards */}
                <div className="md:hidden space-y-4">
                  {pagedAccounts.map((acc) => {
                    const instMeta = INSTITUTION_TYPE_META[acc.institutionType] || INSTITUTION_TYPE_META.CHAMBER;
                    const aging = agingBadge(acc);
                    return (
                      <div key={acc.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{acc.name}</div>
                            <div className="text-xs text-gray-500 truncate">Owner: {acc.ownerName}</div>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 ${instMeta.cls}`}>
                            {instMeta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1"><Phone size={12} /> {acc.phone}</span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                            {DIVISION_LABEL[acc.division || 'DHAKA'] || acc.division}{acc.district ? ` — ${acc.district}` : ''}
                          </span>
                          <span>Agent: {acc.assignedAgentName || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-500">Current Due</span>
                          <span className="flex items-center gap-2">
                            {aging && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${aging.cls}`}>
                                <Clock size={10} /> {aging.label}
                              </span>
                            )}
                            <span className={`font-semibold ${acc.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatBDT(acc.currentBalance)}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openInvoiceModal(acc)}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-700/30 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                          >
                            <Plus size={13} /> Invoice
                          </button>
                          <button
                            onClick={() => openPaymentModal(acc)}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Check size={13} /> Collection
                          </button>
                          {acc.currentBalance > 0 && (
                            <a
                              href={whatsappReminderHref(acc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-xs font-bold text-[#1a8f4a] hover:bg-[#25D366]/20 transition-colors"
                            >
                              <MessageSquare size={13} /> Reminder
                            </a>
                          )}
                          {me?.role === 'SUPERADMIN' && (
                            <button
                              onClick={() => openEditAccount(acc)}
                              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAccounts.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {visibleAccounts.length === 0 ? 'No client accounts yet.' : 'No accounts match these filters.'}
                    </p>
                  )}
                </div>

                <Pager
                  page={accPage}
                  total={filteredAccounts.length}
                  perPage={ACCOUNTS_PER_PAGE}
                  onPage={setAccPage}
                  noun={filteredAccounts.length === 1 ? 'account' : 'accounts'}
                />
                </>
                )}
              </div>
        )}
      </SectionFrame>

      {invoiceModalAcc && (() => {
        const grossNum = parseFloat(invoiceForm.grossAmount) || 0;
        const discNum = parseFloat(invoiceForm.discountAmount || '0') || 0;
        const netNum = Math.max(0, grossNum - discNum);
        return (
          <ModalShell onClose={() => setInvoiceModalAcc(null)}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          >
            <form
              onSubmit={submitInvoice}
              className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700">Add Case Invoice</h3>
                  <p className="text-xs text-slate-500 truncate">{invoiceModalAcc.name} · Current due {formatBDT(invoiceModalAcc.currentBalance)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceModalAcc(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Gross Amount (BDT) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.grossAmount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, grossAmount: e.target.value })}
                      placeholder="e.g. 12000"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Case ID (optional)</label>
                    <input
                      value={invoiceForm.orderId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, orderId: e.target.value })}
                      placeholder="Link a lab case"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Discretionary Discount (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceForm.discountAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Note {invoiceForm.discountAmount && parseFloat(invoiceForm.discountAmount) > 0 && <span className="text-rose-500 normal-case">* (mandatory for discount override)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    placeholder="Reason for discount, invoice context..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Net Payable</span>
                  <span className="text-lg font-semibold text-teal-700">{formatBDT(netNum)}</span>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setInvoiceModalAcc(null)}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingErp}
                  className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
                >
                  {savingErp ? 'Recording...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </ModalShell>
        );
      })()}

      {/* Record Payment / Collection Modal */}
      {paymentModalAcc && (() => (
        <ModalShell onClose={() => setPaymentModalAcc(null)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitPayment}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-600">Record Payment</h3>
                <p className="text-xs text-slate-500 truncate">{paymentModalAcc.name} · Current due {formatBDT(paymentModalAcc.currentBalance)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalAcc(null)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount Collected (BDT) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.netAmount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, netAmount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Collected By (Agent)</label>
                {me?.role === 'AGENT' ? (
                  <div className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm font-bold text-slate-600">
                    {me.name} (you)
                  </div>
                ) : (
                  <select
                    value={paymentForm.collectedById}
                    onChange={(e) => setPaymentForm({ ...paymentForm, collectedById: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">— Select agent —</option>
                    {agentList.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Payment Date * <span className="normal-case font-medium text-slate-400">(backdating allowed)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">— Select —</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Note (optional)</label>
                <input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="bKash TrxID, cheque no, receipt reference..."
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={paymentForm.isVerified}
                  onChange={(e) => setPaymentForm({ ...paymentForm, isVerified: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Payment verified <span className="font-normal text-slate-500">(cash / bank / bKash confirmed)</span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPaymentModalAcc(null)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Recording...' : 'Record Collection'}
              </button>
            </div>
          </form>
        </ModalShell>
      ))()}

      {/* Add / Edit Client Account Modal */}
      {accountModal && (
        <ModalShell onClose={() => setAccountModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitAccount}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingAccount ? 'Edit Client Account' : 'Add Client Account'}
              </h3>
              <button
                type="button"
                onClick={() => setAccountModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {accountDupWarning && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Phone size={13} /> Phone already registered — &ldquo;{accountDupWarning}&rdquo;
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    এই নম্বরে একটি অ্যাকাউন্ট রয়েছে। ভিন্ন নম্বর ব্যবহার করুন, অথবা নিশ্চিত হলে নিচের বাটনে গিয়ে যাই হোক তৈরি করুন।
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountDupWarning(null)}
                      className="min-h-[36px] px-3.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-800 hover:bg-amber-50"
                    >
                      Change Phone
                    </button>
                    {!editingAccount && (
                      <button
                        type="button"
                        onClick={() => saveAccount(true)}
                        disabled={savingErp}
                        className="min-h-[36px] px-3.5 rounded-lg bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {savingErp ? 'Saving…' : 'Create Anyway (allow duplicate)'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Type *</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="CHAMBER">Chamber</option>
                    <option value="PARTNER_LAB">Partner Lab</option>
                    <option value="CHAIRMAN_PERSONAL">Chairman (Personal Channel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Institution Type *</label>
                  <select
                    value={accountForm.institutionType}
                    onChange={(e) => setAccountForm({ ...accountForm, institutionType: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="CHAMBER">Chamber</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="PARTNER_LAB">Lab</option>
                    <option value="FREELANCE">Personal (Freelance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Name *</label>
                <input
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. Dr. Rahim Dental Care"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Owner Name *</label>
                  <input
                    required
                    value={accountForm.ownerName}
                    onChange={(e) => setAccountForm({ ...accountForm, ownerName: e.target.value })}
                    placeholder="Owner / proprietor"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone *</label>
                  <input
                    required
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Division *</label>
                  <select
                    value={accountForm.division}
                    onChange={(e) => setAccountForm({ ...accountForm, division: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d.key} value={d.key}>{d.bn ? `${d.label} (${d.bn})` : d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">District / Area</label>
                  <input
                    value={accountForm.district}
                    onChange={(e) => setAccountForm({ ...accountForm, district: e.target.value })}
                    placeholder="e.g. Dhanmondi"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned Agent</label>
                <select
                  value={accountForm.assignedAgentId}
                  onChange={(e) => setAccountForm({ ...accountForm, assignedAgentId: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">— Unassigned —</option>
                  {agentList.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.phone ? ` (${a.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  placeholder="clinic@email.com (optional)"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Previous Opening Due (পূর্বের বকেয়া ৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={accountForm.openingDue}
                    onChange={(e) => setAccountForm({ ...accountForm, openingDue: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Logged as an opening-balance invoice in the ledger.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                <input
                  value={accountForm.address}
                  onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })}
                  placeholder="Chamber / lab address"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setAccountModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add / Edit User Modal */}
    </>
  );
}
