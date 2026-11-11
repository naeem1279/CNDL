'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, BadgeCheck, GripVertical, Handshake, Inbox, LayoutGrid, MapPin, MessageSquare, Package,
  Pencil, PhoneCall, Search, Stethoscope, Table2, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { LEADS_PER_PAGE, LEAD_PILL_META, LEAD_STATUS_META } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, LeadRow } from '../_lib/types';
import { apiError, phoneCore, readPref } from '../_lib/utils';

export default function LeadsPage() {
  const { me, adminFetch, handleAuthLoss } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ERP & Accounts state
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);

  // Dhaka Dental Leads (CNDL local pipeline)
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadNoteKey, setLeadNoteKey] = useState<string | null>(null);
  const [leadNoteText, setLeadNoteText] = useState('');
  const [savingLeadNote, setSavingLeadNote] = useState(false);
  const [savingLeadKey, setSavingLeadKey] = useState<string | null>(null);
  // Phase 3: CRM view mode + native drag-and-drop + lead→account conversion
  const [leadView, setLeadView] = useState<'table' | 'board'>(() =>
    readPref('cndl-admin-lead-view') === 'board' ? 'board' : 'table'
  );
  const [dragLeadKey, setDragLeadKey] = useState<string | null>(null);
  const [boardDropCol, setBoardDropCol] = useState<string | null>(null);
  const [convertingLeadKey, setConvertingLeadKey] = useState<string | null>(null);

  const updateLead = async (key: string, patch: { status?: string; notes?: string }) => {
    setSavingLeadKey(key);
    try {
      const res = await adminFetch('/api/admin/leads', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, ...patch }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return false;
      }
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.lead) {
        setLeads((prev) => prev.map((l) => (l.key === key ? { ...l, ...d.lead } : l)));
        return true;
      }
      toast.error(apiError(d, 'Update failed'));
      return false;
    } catch {
      toast.error('Network error updating lead');
      return false;
    } finally {
      setSavingLeadKey(null);
    }
  };

  const saveLeadNote = async () => {
    if (!leadNoteKey) return;
    setSavingLeadNote(true);
    const ok = await updateLead(leadNoteKey, { notes: leadNoteText });
    setSavingLeadNote(false);
    if (ok) {
      setLeadNoteKey(null);
      setLeadNoteText('');
    }
  };

  const waLeadLink = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${digits.startsWith('880') ? digits : '880' + digits.replace(/^0+/, '')}`;
  };

  /**
   * Phase 3: push a lead into the Dues/Accounts ledger as a CHAMBER
   * ClientAccount (opening due 0), then flip the lead status to `client`.
   * Duplicate-safe: a phone-core match against existing accounts (or the
   * route's own 409 DUPLICATE_PHONE guard) short-circuits creation.
   */
  const convertLeadToAccount = async (l: LeadRow) => {
    if (!l.phone || phoneCore(l.phone).length < 6) {
      toast.error('Lead has no usable phone number');
      return;
    }
    setConvertingLeadKey(l.key);
    try {
      const existing = erpAccounts.find((a) => phoneCore(a.phone) && phoneCore(a.phone) === phoneCore(l.phone));
      if (existing) {
        toast.info(`${existing.name} is already in the client ledger`);
        if ((LEAD_STATUS_META[l.status] ? l.status : 'new') !== 'client') await updateLead(l.key, { status: 'client' });
        return;
      }
      const res = await adminFetch('/api/admin/erp/accounts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: l.name || l.contactName || 'Chamber',
          ownerName: l.contactName || l.name || 'Owner',
          phone: l.phone,
          email: l.email || null,
          address: l.address || null,
          institutionType: 'CHAMBER',
          division: 'DHAKA',
          district: l.area || null,
          openingDue: 0,
        }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body?.warning === 'DUPLICATE_PHONE') {
        toast.info(`${body.existingName || 'An account'} already exists with this phone`);
        await updateLead(l.key, { status: 'client' });
        return;
      }
      if (res.ok && body?.id) {
        setErpAccounts((prev) => [body as ErpAccount, ...prev]);
        toast.success(`Client account created — ${body.name} is now billable in Dues`);
        await updateLead(l.key, { status: 'client' });
        return;
      }
      toast.error(apiError(body, 'Failed to create client account'));
    } catch {
      toast.error('Network error converting lead');
    } finally {
      setConvertingLeadKey(null);
    }
  };

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [leadPage, setLeadPage] = useState(1);

  /** Loads only this section's feeds: accounts, leads. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'leads'], me.role);
      if (!r) return;
      if (r.accounts) setErpAccounts(r.accounts);
      if (r.leads) setLeads(r.leads);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const sq = leadSearch.trim().toLowerCase();
    return leads
      .filter((l) => leadStatusFilter === 'All' || l.status === leadStatusFilter)
      .filter(
        (l) =>
          !sq ||
          [l.name, l.contactName, l.area, l.address, l.phone].some((v) => (v || '').toLowerCase().includes(sq))
      );
  }, [leads, leadSearch, leadStatusFilter]);
  useEffect(() => {
    setLeadPage(1);
  }, [leadSearch, leadStatusFilter]);
  const pagedLeads = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE));
    const p = Math.min(leadPage, pages);
    return filteredLeads.slice((p - 1) * LEADS_PER_PAGE, p * LEADS_PER_PAGE);
  }, [filteredLeads, leadPage]);

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the table/board choice.
  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-lead-view', leadView);
    } catch {
      /* ignore */
    }
  }, [leadView]);

  const kpiCards: Kpi[] = [
      { label: 'Total Chambers', value: leads.length, icon: MapPin, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'New Leads', value: leads.filter((l) => l.status === 'new').length, icon: Activity, bg: 'bg-sky-50', fg: 'text-sky-700' },
      { label: 'Sample Given', value: leads.filter((l) => l.status === 'sample_given').length, icon: Package, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Active Clients', value: leads.filter((l) => l.status === 'client').length, icon: BadgeCheck, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="leads"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= TAB: DHAKA DENTAL LEADS (CNDL local pipeline) ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
                  <MapPin size={22} className="text-teal-700" /> Dhaka Dental Leads
                </h2>
                <p className="text-xs text-slate-500 mt-1">CNDL chamber pipeline — local-only (never pushed to GHL)</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search chamber, doctor, area or phone..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700/30 bg-slate-50"
                  />
                </div>
                {leadView === 'table' && (
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                  >
                    <option value="All">All Status</option>
                    {Object.entries(LEAD_STATUS_META).map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </select>
                )}
                <div className="inline-flex self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Leads layout">
                  <button
                    onClick={() => setLeadView('table')}
                    aria-pressed={leadView === 'table'}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${leadView === 'table' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Table2 size={14} /> Table
                  </button>
                  <button
                    onClick={() => { setLeadView('board'); setLeadStatusFilter('All'); }}
                    aria-pressed={leadView === 'board'}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${leadView === 'board' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <LayoutGrid size={14} /> Stage Board
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const filtered = filteredLeads;
              if (!filtered.length) {
                return (
                  <div className="text-center py-16 text-slate-500">
                    <MapPin size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">{leads.length ? 'No chambers match this search/filter' : 'No CNDL leads yet — collect from the Telegram lead engine'}</p>
                  </div>
                );
              }
              const accountFor = (l: LeadRow) =>
                erpAccounts.find((a) => phoneCore(a.phone) && phoneCore(a.phone) === phoneCore(l.phone));
              const fmtAct = (iso: string) =>
                iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

              /* Append-only activity timeline (newest first) — Phase 3. */
              const leadTimeline = (l: LeadRow) =>
                (l.activityLog?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activity Timeline</p>
                    {[...l.activityLog].reverse().map((a, i) => (
                      <div key={`${a.at}-${i}`} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                        <span className="flex-1 leading-snug">{a.text}</span>
                        <span className="text-slate-400 whitespace-nowrap shrink-0">{fmtAct(a.at)}</span>
                      </div>
                    ))}
                  </div>
                ) : null;

              /* Shared note editor + timeline drawer (table + board). */
              const leadDrawer = (l: LeadRow) =>
                leadNoteKey === l.key ? (
                  <>
                    {leadTimeline(l)}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <textarea
                        value={leadNoteText}
                        onChange={(e) => setLeadNoteText(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Visit note — who met, sample given, pricing discussed, follow-up..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button onClick={() => { setLeadNoteKey(null); setLeadNoteText(''); }} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Cancel</button>
                        <button
                          onClick={saveLeadNote}
                          disabled={savingLeadNote}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
                        >
                          {savingLeadNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null;

              /* Phase 3: Convert-to-ledger control — deduped against existing accounts. */
              const convertControl = (l: LeadRow, compact = false) => {
                if (!l.phone || phoneCore(l.phone).length < 6) return null;
                const linked = accountFor(l);
                if (linked) {
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
                      title={`Already in ledger: ${linked.name}`}
                    >
                      <Handshake size={12} /> In Ledger
                    </span>
                  );
                }
                const busy = convertingLeadKey === l.key;
                return (
                  <button
                    onClick={() => convertLeadToAccount(l)}
                    disabled={busy}
                    title="Create a client account in the Dues ledger"
                    className={`inline-flex items-center gap-1 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 transition-colors ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
                  >
                    <UserPlus size={12} /> {busy ? 'Converting…' : 'Convert'}
                  </button>
                );
              };

              /* Compact lead card — Stage Board (draggable) + mobile list. */
              const leadCard = (l: LeadRow, isBoard: boolean) => {
                const statusMeta = LEAD_STATUS_META[l.status] || { label: l.status || 'Unknown', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
                const activeStatus = LEAD_STATUS_META[l.status] ? l.status : 'new';
                const isNoteOpen = leadNoteKey === l.key;
                const isSaving = savingLeadKey === l.key;
                return (
                  <div
                    key={l.key}
                    draggable={isBoard && !isSaving}
                    onDragStart={(e) => {
                      setDragLeadKey(l.key);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', l.key);
                    }}
                    onDragEnd={() => {
                      setDragLeadKey(null);
                      setBoardDropCol(null);
                    }}
                    className={`rounded-xl border border-slate-200 bg-white p-3 transition-all ${
                      dragLeadKey === l.key ? 'opacity-40' : ''
                    } ${isBoard ? 'cursor-grab active:cursor-grabbing' : ''} hover:border-teal-400/60 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-start gap-1.5">
                        {isBoard && <GripVertical size={13} className="text-slate-300 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <span className="font-bold text-sm truncate block">{l.name || 'Unnamed Chamber'}</span>
                          {l.contactName && (
                            <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <Stethoscope size={11} className="text-teal-700 shrink-0" /> {l.contactName}
                            </span>
                          )}
                          {(l.area || l.address) && (
                            <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <MapPin size={11} className="text-teal-700 shrink-0" /> {l.area || l.address}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 ${statusMeta.cls}`}>{statusMeta.label}</span>
                    </div>
                    {l.phone && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-mono text-slate-600">{l.phone}</span>
                        <a
                          href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                        >
                          <PhoneCall size={11} /> Call
                        </a>
                        <a
                          href={waLeadLink(l.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </a>
                      </div>
                    )}
                    {l.lastActivityText && (
                      <p className="mt-1.5 text-[11px] text-slate-400 truncate" title={l.lastActivityText}>
                        Last: {l.lastActivityText}{l.lastActivityAt ? ` · ${fmtAct(l.lastActivityAt)}` : ''}
                      </p>
                    )}
                    {/* One-click status switcher (doubles as non-drag stage control) */}
                    <div
                      className={`mt-2 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 ${isSaving ? 'opacity-60' : ''}`}
                      role="group"
                      aria-label={`Update status for ${l.name || 'chamber'}`}
                    >
                      {Object.entries(LEAD_STATUS_META).map(([k, m]) => {
                        const active = activeStatus === k;
                        return (
                          <button
                            key={k}
                            onClick={() => {
                              if (!active && !isSaving) updateLead(l.key, { status: k });
                            }}
                            disabled={isSaving}
                            aria-pressed={active}
                            title={`Mark as ${m.label}`}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                              active
                                ? LEAD_PILL_META[k] || 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {convertControl(l, true)}
                      <button
                        onClick={() => {
                          setLeadNoteKey(isNoteOpen ? null : l.key);
                          setLeadNoteText(isNoteOpen ? '' : l.visitNotes || '');
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${isNoteOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Pencil size={11} /> {isNoteOpen ? 'Close' : 'Note'}
                      </button>
                      {isSaving && <span className="text-[11px] font-semibold text-slate-400 animate-pulse">Saving…</span>}
                    </div>
                    {leadDrawer(l)}
                  </div>
                );
              };

              /* ================= TABLE VIEW ================= */
              const tableView = (
                <div>
                  <div className="hidden md:block overflow-x-auto rounded-xl">
                    <table className="w-full text-left tabular-nums">
                      <thead>
                        <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="pb-4 pr-4">Chamber</th>
                          <th className="pb-4 pr-4">Phone</th>
                          <th className="pb-4 pr-4">Stage</th>
                          <th className="pb-4 pr-4">Last Activity</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedLeads.map((l) => {
                          const activeStatus = LEAD_STATUS_META[l.status] ? l.status : 'new';
                          const isNoteOpen = leadNoteKey === l.key;
                          const isSaving = savingLeadKey === l.key;
                          return (
                            [
                              <tr key={l.key} className={`align-top hover:bg-slate-50/80 transition-colors ${isNoteOpen ? 'bg-teal-50/40' : ''}`}>
                                <td className="py-3.5 pr-4">
                                  <div className="font-bold text-sm">{l.name || 'Unnamed Chamber'}</div>
                                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                    {l.contactName && <span className="inline-flex items-center gap-1"><Stethoscope size={11} className="text-teal-700" /> {l.contactName}</span>}
                                    {(l.area || l.address) && <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-teal-700" /> {l.area || l.address}</span>}
                                    {l.facebook && (
                                      <a href={l.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                                        <Activity size={11} /> FB Page
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  {l.phone ? (
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-xs font-mono text-slate-700">{l.phone}</span>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}
                                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <PhoneCall size={11} /> Call
                                        </a>
                                        <a
                                          href={waLeadLink(l.phone)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <MessageSquare size={11} /> WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div
                                    className={`inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 ${isSaving ? 'opacity-60' : ''}`}
                                    role="group"
                                    aria-label={`Update status for ${l.name || 'chamber'}`}
                                  >
                                    {Object.entries(LEAD_STATUS_META).map(([k, m]) => {
                                      const active = activeStatus === k;
                                      return (
                                        <button
                                          key={k}
                                          onClick={() => {
                                            if (!active && !isSaving) updateLead(l.key, { status: k });
                                          }}
                                          disabled={isSaving}
                                          aria-pressed={active}
                                          title={`Mark as ${m.label}`}
                                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                            active
                                              ? LEAD_PILL_META[k] || 'bg-slate-700 text-white shadow-sm'
                                              : 'text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer'
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  {l.lastActivityText ? (
                                    <div className="text-xs text-slate-600 max-w-[220px]">
                                      <p className="leading-snug line-clamp-2" title={l.lastActivityText}>{l.lastActivityText}</p>
                                      <p className="text-slate-400 mt-0.5">
                                        {fmtAct(l.lastActivityAt)} · {l.activityLog?.length ?? 0} event{(l.activityLog?.length ?? 0) === 1 ? '' : 's'}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                    {convertControl(l)}
                                    <button
                                      onClick={() => {
                                        setLeadNoteKey(isNoteOpen ? null : l.key);
                                        setLeadNoteText(isNoteOpen ? '' : l.visitNotes || '');
                                      }}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${isNoteOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                      <Pencil size={12} /> {isNoteOpen ? 'Close' : 'Note'}
                                    </button>
                                    {isSaving && <span className="text-[11px] font-semibold text-slate-400 animate-pulse">Saving…</span>}
                                  </div>
                                </td>
                              </tr>,
                              isNoteOpen && (
                                <tr key={`${l.key}-drawer`} className="bg-teal-50/40">
                                  <td colSpan={5} className="px-4 py-3 border-t border-slate-100">
                                    {leadDrawer(l)}
                                  </td>
                                </tr>
                              ),
                            ]
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile: compact lead cards */}
                  <div className="md:hidden space-y-3">
                    {pagedLeads.map((l) => leadCard(l, false))}
                  </div>
                <Pager
                  page={leadPage}
                  total={filteredLeads.length}
                  perPage={LEADS_PER_PAGE}
                  onPage={setLeadPage}
                  noun={filteredLeads.length === 1 ? 'lead' : 'leads'}
                />
                </div>
              );

              /* ================= STAGE BOARD (KANBAN) ================= */
              const boardView = (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
                  {Object.entries(LEAD_STATUS_META).map(([colKey, meta]) => {
                    const colLeads = filtered.filter((l) => (LEAD_STATUS_META[l.status] ? l.status : 'new') === colKey);
                    const isOver = boardDropCol === colKey && !!dragLeadKey;
                    const dotCls = colKey === 'new' ? 'bg-sky-500' : colKey === 'visited' ? 'bg-amber-400' : colKey === 'sample_given' ? 'bg-slate-500' : 'bg-emerald-500';
                    return (
                      <div
                        key={colKey}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDragEnter={() => { if (dragLeadKey) setBoardDropCol(colKey); }}
                        onDragLeave={() => { setBoardDropCol((c) => (c === colKey ? null : c)); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const key = dragLeadKey || e.dataTransfer.getData('text/plain');
                          setBoardDropCol(null);
                          setDragLeadKey(null);
                          const ld = leads.find((x) => x.key === key);
                          if (ld && (LEAD_STATUS_META[ld.status] ? ld.status : 'new') !== colKey) updateLead(key, { status: colKey });
                        }}
                        className={`rounded-2xl border p-3 min-h-[240px] transition-colors ${isOver ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-600/20' : 'border-slate-200 bg-slate-50/70'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                            {meta.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500">{colLeads.length}</span>
                        </div>
                        <div className="space-y-2.5">
                          {colLeads.map((l) => leadCard(l, true))}
                        </div>
                        {colLeads.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                            <Inbox size={22} />
                            <p className="text-[11px] font-bold mt-1.5 text-slate-400">Drop cards here</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );

              return leadView === 'board' ? boardView : tableView;
            })()}
          </div>
        )}
      </SectionFrame>

    </>
  );
}
