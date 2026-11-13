'use client';
import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronRight, Footprints, LayoutGrid, MapPin, MessageSquare, Phone, Search, Sprout, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, Segmented } from '../_components/ui';
import { LEADS_PER_PAGE, LEAD_STAGES, LEAD_STAGE_LABEL, leadStage, type LeadStage } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, LeadRow } from '../_lib/types';
import { apiError, phoneCore, phoneLinks, readPref } from '../_lib/utils';
import { LeadPanel, StageSelect, activityText, fullTime, hasUsablePhone, relTime } from './LeadPanel';

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
type View = 'table' | 'board';
type StageFilter = 'all' | LeadStage;
/** Cards shown per board column before "Show more". */
const BOARD_COLUMN_LIMIT = 25;
const UNDO_MS = 10_000;

export default function LeadsPage() {
  const { me, adminFetch, handleAuthLoss } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);

  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [view, setView] = useState<View>(() => (readPref('cndl-admin-lead-view') === 'board' ? 'board' : 'table'));
  const [page, setPage] = useState(1);
  const [openKey, setOpenKey] = useState<string | null>(null);
  /** Unsaved note text per lead, so closing the panel never loses typing. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [convertingKey, setConvertingKey] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<LeadStage | null>(null);
  const [expanded, setExpanded] = useState<Partial<Record<LeadStage, boolean>>>({});

  /* ------------------------------------------------------------- data */

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['accounts', 'leads'], me);
      if (!r) return;
      if (r.accounts) setAccounts(r.accounts);
      if (r.leads) setLeads(r.leads);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load leads');
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
      window.localStorage.setItem('cndl-admin-lead-view', view);
    } catch {
      /* private mode */
    }
  }, [view]);

  useEffect(() => setPage(1), [query, stageFilter]);

  const accountByPhone = useMemo(() => {
    const m = new Map<string, ErpAccount>();
    for (const a of accounts) {
      const c = phoneCore(a.phone);
      if (c.length >= 6 && !m.has(c)) m.set(c, a);
    }
    return m;
  }, [accounts]);
  const accountFor = (l: LeadRow) => (hasUsablePhone(l) ? accountByPhone.get(phoneCore(l.phone)) : undefined);

  /* ---------------------------------------------------------- writes */

  /** PATCH one lead; merges the server's copy on success. */
  const patchLead = async (key: string, patch: { status?: LeadStage; notes?: string }): Promise<boolean> => {
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
      toast.error(apiError(d, 'Could not update the lead'));
      return false;
    } catch {
      toast.error('Network error — the lead was not updated');
      return false;
    }
  };

  const setLocalStage = (key: string, s: LeadStage) =>
    setLeads((prev) => prev.map((l) => (l.key === key ? { ...l, status: s } : l)));

  /** Optimistic stage change; reverts on failure and offers Undo on success. */
  const changeStage = async (l: LeadRow, next: LeadStage, undoable = true) => {
    const prev = leadStage(l.status);
    if (prev === next) return;
    setLocalStage(l.key, next);
    setSavingKey(l.key);
    const ok = await patchLead(l.key, { status: next });
    setSavingKey(null);
    if (!ok) {
      setLocalStage(l.key, prev);
      return;
    }
    if (undoable) {
      toast(`${l.name || 'Lead'} moved to ${LEAD_STAGE_LABEL[next]}`, {
        duration: UNDO_MS,
        action: { label: 'Undo', onClick: () => void changeStage({ ...l, status: next }, prev, false) },
      });
    }
  };

  const saveNote = async (l: LeadRow) => {
    const text = drafts[l.key] ?? l.visitNotes ?? '';
    setSavingKey(l.key);
    const ok = await patchLead(l.key, { notes: text });
    setSavingKey(null);
    if (ok) {
      setDrafts(({ [l.key]: _, ...rest }) => rest);
      toast.success('Note saved');
    }
  };

  /** Removes a just-created account and puts the lead back where it was. */
  const undoConvert = async (accountId: string, l: LeadRow, prevStage: LeadStage) => {
    try {
      const res = await adminFetch(`/api/admin/erp/accounts/${encodeURIComponent(accountId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.status === 401) return handleAuthLoss();
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(apiError(d, 'Could not undo — remove the account from Client Dues instead'));
        return;
      }
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      if (prevStage !== 'client') {
        setLocalStage(l.key, prevStage);
        await patchLead(l.key, { status: prevStage });
      }
      toast.success(`${l.name || 'Lead'} removed from Client Dues`);
    } catch {
      toast.error('Network error — the account was not removed');
    }
  };

  /**
   * One click: create a CHAMBER account in Client Dues (opening due 0) and mark
   * the lead Client. Duplicate-safe on phone number. Undo for 10 seconds.
   */
  const convert = async (l: LeadRow) => {
    if (!hasUsablePhone(l)) {
      toast.error('This lead has no usable phone number');
      return;
    }
    const prevStage = leadStage(l.status);
    const existing = accountFor(l);
    if (existing) {
      toast.info(`${existing.name} is already in Client Dues`);
      if (prevStage !== 'client') await changeStage(l, 'client', false);
      return;
    }
    setConvertingKey(l.key);
    try {
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
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body?.warning === 'DUPLICATE_PHONE') {
        toast.info(`${body.existingName || 'An account'} already uses this phone number`);
        if (prevStage !== 'client') await changeStage(l, 'client', false);
        return;
      }
      if (!res.ok || !body?.id) {
        toast.error(apiError(body, 'Could not add the chamber to Client Dues'));
        return;
      }
      const account = body as ErpAccount;
      setAccounts((prev) => [account, ...prev]);
      if (prevStage !== 'client') {
        setLocalStage(l.key, 'client');
        const ok = await patchLead(l.key, { status: 'client' });
        if (!ok) setLocalStage(l.key, prevStage);
      }
      toast.success(`${account.name} added to Client Dues`, {
        duration: UNDO_MS,
        action: { label: 'Undo', onClick: () => void undoConvert(account.id, l, prevStage) },
      });
    } catch {
      toast.error('Network error — nothing was added');
    } finally {
      setConvertingKey(null);
    }
  };

  /* --------------------------------------------------------- derived */

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    if (!q) return leads;
    return leads.filter(
      (l) =>
        [l.name, l.contactName, l.area, l.address].some((v) => (v || '').toLowerCase().includes(q)) ||
        (qDigits.length >= 3 && (l.phone || '').replace(/\D/g, '').includes(qDigits))
    );
  }, [leads, query]);

  const stageCounts = useMemo(() => {
    const c: Record<LeadStage, number> = { new: 0, visited: 0, sample_given: 0, client: 0 };
    for (const l of searched) c[leadStage(l.status)]++;
    return c;
  }, [searched]);

  const tableRows = useMemo(
    () => (stageFilter === 'all' ? searched : searched.filter((l) => leadStage(l.status) === stageFilter)),
    [searched, stageFilter]
  );
  const pages = Math.max(1, Math.ceil(tableRows.length / LEADS_PER_PAGE));
  const curPage = Math.min(page, pages);
  const pageRows = tableRows.slice((curPage - 1) * LEADS_PER_PAGE, curPage * LEADS_PER_PAGE);

  const total = leads.length;
  const all = { new: 0, visited: 0, sample_given: 0, client: 0 } as Record<LeadStage, number>;
  for (const l of leads) all[leadStage(l.status)]++;
  const inDues = leads.filter((l) => accountFor(l)).length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const kpis: Kpi[] = [
    { label: 'Chambers', value: total.toLocaleString('en-IN'), icon: MapPin, sub: `${pct(all.client)}% became clients` },
    { label: 'New', value: all.new.toLocaleString('en-IN'), icon: Sprout, sub: 'Not visited yet' },
    {
      label: 'In follow-up',
      value: (all.visited + all.sample_given).toLocaleString('en-IN'),
      icon: Footprints,
      sub: `${all.sample_given} with a sample`,
    },
    { label: 'Clients', value: all.client.toLocaleString('en-IN'), icon: BadgeCheck, sub: `${inDues} in Client Dues` },
  ];

  const openLead = openKey ? leads.find((l) => l.key === openKey) : undefined;
  const clearFilters = () => {
    setQuery('');
    setStageFilter('all');
  };

  /* ------------------------------------------------------------ bits */

  const sub = (l: LeadRow) => [l.contactName, l.area || l.address].filter(Boolean).join(' · ');

  const contactButtons = (l: LeadRow) => {
    const links = phoneLinks(l.phone);
    if (!links) return null;
    const cls =
      'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';
    return (
      <span className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <a href={`tel:${links.tel.replace(/[^\d+]/g, '')}`} className={cls} aria-label={`Call ${l.name || 'chamber'}`} title="Call">
          <Phone size={14} />
        </a>
        <a href={`https://wa.me/${links.wa}`} target="_blank" rel="noreferrer" className={cls} aria-label={`WhatsApp ${l.name || 'chamber'}`} title="WhatsApp">
          <MessageSquare size={14} />
        </a>
      </span>
    );
  };

  const stageDot = (s: LeadStage) => (
    <span aria-hidden="true" className={cx('h-2 w-2 shrink-0 rounded-full', LEAD_STAGES.find((x) => x.key === s)?.dot)} />
  );

  const empty = (
    <EmptyState icon={MapPin} title={total ? 'No chambers match' : 'No leads yet'}>
      {total ? (
        <button type="button" onClick={clearFilters} className="font-medium text-brand-700 hover:underline">
          Clear search and filters
        </button>
      ) : (
        'Chambers collected by the Telegram lead engine appear here.'
      )}
    </EmptyState>
  );

  /* ------------------------------------------------------------ views */

  const tableView = (
    <>
      {pageRows.length === 0 ? (
        empty
      ) : (
        <>
          {/* md and up: table */}
          <table className="hidden w-full table-fixed text-left md:table">
            <thead>
              <tr className="border-b border-zinc-200 text-meta font-medium text-zinc-500">
                <th className="px-4 py-2.5 font-medium">Chamber</th>
                <th className="w-[200px] px-3 py-2.5 font-medium">Phone</th>
                <th className="w-[160px] px-3 py-2.5 font-medium">Stage</th>
                <th className="hidden w-[260px] px-3 py-2.5 font-medium xl:table-cell">Last activity</th>
                <th className="w-10 py-2.5" aria-label="Open" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pageRows.map((l) => {
                const stage = leadStage(l.status);
                const acct = accountFor(l);
                return (
                  <tr key={l.key} onClick={() => setOpenKey(l.key)} className="group cursor-pointer align-middle hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenKey(l.key);
                          }}
                          className="truncate text-left text-body font-medium text-zinc-900 hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {l.name || 'Unnamed chamber'}
                        </button>
                        {acct && <Badge tone="success" className="shrink-0">In Dues</Badge>}
                        {drafts[l.key] !== undefined && <Badge className="shrink-0">Draft</Badge>}
                      </div>
                      <div className="truncate text-meta text-zinc-500">
                        {sub(l) || '—'}
                        {l.lastActivityAt && <span className="xl:hidden" title={fullTime(l.lastActivityAt)}> · {relTime(l.lastActivityAt)}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {l.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-mono text-table text-zinc-700 tabular-nums">{l.phone}</span>
                          {contactButtons(l)}
                        </div>
                      ) : (
                        <span className="text-table text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StageSelect
                        value={stage}
                        disabled={savingKey === l.key || convertingKey === l.key}
                        onChange={(s) => void changeStage(l, s)}
                        label={`Stage for ${l.name || 'chamber'}`}
                      />
                    </td>
                    <td className="hidden px-3 py-2.5 xl:table-cell">
                      {l.lastActivityText ? (
                        <>
                          <p className="truncate text-table text-zinc-700" title={activityText(l.lastActivityText)}>
                            {activityText(l.lastActivityText)}
                          </p>
                          <p className="text-meta text-zinc-400" title={fullTime(l.lastActivityAt)}>
                            {relTime(l.lastActivityAt)}
                          </p>
                        </>
                      ) : (
                        <span className="text-table text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <ChevronRight size={16} className="inline text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* phones: list */}
          <ul className="divide-y divide-zinc-100 md:hidden">
            {pageRows.map((l) => {
              const stage = leadStage(l.status);
              return (
                <li key={l.key}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(l.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{l.name || 'Unnamed chamber'}</p>
                      {sub(l) && <p className="truncate text-meta text-zinc-500">{sub(l)}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-meta text-zinc-600">
                        {stageDot(stage)}
                        {LEAD_STAGE_LABEL[stage]}
                        {accountFor(l) && <span className="text-emerald-700">· In Dues</span>}
                        {l.lastActivityAt && <span className="text-zinc-400">· {relTime(l.lastActivityAt)}</span>}
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
        <Pager page={curPage} total={tableRows.length} perPage={LEADS_PER_PAGE} onPage={setPage} noun={tableRows.length === 1 ? 'chamber' : 'chambers'} />
      </div>
    </>
  );

  const boardView =
    searched.length === 0 ? (
      empty
    ) : (
      /* Phones: columns swipe sideways (one at a time); sm: 2 per row; xl: all 4. */
      <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-3 overflow-x-auto p-3 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
        {LEAD_STAGES.map((col) => {
          const cards = searched.filter((l) => leadStage(l.status) === col.key);
          const shown = expanded[col.key] ? cards : cards.slice(0, BOARD_COLUMN_LIMIT);
          const isOver = dropStage === col.key && !!dragKey;
          return (
            <section
              key={col.key}
              aria-label={`${col.label}: ${cards.length}`}
              onDragOver={(e) => {
                if (!dragKey) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dropStage !== col.key) setDropStage(col.key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropStage((s) => (s === col.key ? null : s));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const key = dragKey || e.dataTransfer.getData('text/plain');
                setDropStage(null);
                setDragKey(null);
                const l = leads.find((x) => x.key === key);
                if (l) void changeStage(l, col.key);
              }}
              className={cx(
                'w-[85%] min-w-0 shrink-0 snap-start rounded-lg border p-2 transition-colors sm:w-auto',
                isOver ? 'border-brand-400 bg-brand-50/60' : 'border-zinc-200 bg-zinc-50'
              )}
            >
              <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                <span className="inline-flex items-center gap-2 text-table font-medium text-zinc-700">
                  {stageDot(col.key)}
                  {col.label}
                </span>
                <span className="text-meta text-zinc-500 tabular-nums">{cards.length}</span>
              </header>
              <div className="space-y-2">
                {shown.map((l) => (
                  <div
                    key={l.key}
                    draggable={savingKey !== l.key}
                    onDragStart={(e) => {
                      setDragKey(l.key);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', l.key);
                    }}
                    onDragEnd={() => {
                      setDragKey(null);
                      setDropStage(null);
                    }}
                    className={cx(
                      'rounded-md border border-zinc-200 bg-white transition-shadow hover:border-zinc-300 hover:shadow-sm',
                      dragKey === l.key && 'opacity-40',
                      savingKey === l.key && 'opacity-60'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenKey(l.key)}
                      className="block w-full cursor-pointer p-3 text-left focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                      <p className="line-clamp-2 text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{l.name || 'Unnamed chamber'}</p>
                      {sub(l) && <p className="mt-0.5 truncate text-meta text-zinc-500">{sub(l)}</p>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-meta text-zinc-400" title={fullTime(l.lastActivityAt)}>
                          {l.lastActivityAt ? relTime(l.lastActivityAt) : 'No activity'}
                        </span>
                        {accountFor(l) && <Badge tone="success" className="shrink-0">In Dues</Badge>}
                      </div>
                    </button>
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="rounded-md border border-dashed border-zinc-200 px-3 py-6 text-center text-meta text-zinc-400">
                    {dragKey ? 'Drop here' : 'No chambers'}
                  </p>
                )}
                {cards.length > BOARD_COLUMN_LIMIT && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setExpanded((x) => ({ ...x, [col.key]: !x[col.key] }))}
                  >
                    {expanded[col.key] ? 'Show fewer' : `Show ${cards.length - BOARD_COLUMN_LIMIT} more`}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );

  /* ----------------------------------------------------------- render */

  return (
    <SectionFrame
      tab="leads"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      description="Dhaka chambers from the lead engine. Kept in CNDL only, never sent to GHL."
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, area or phone"
              aria-label="Search leads"
              className="pl-9"
            />
          </div>
          {view === 'table' && (
            <div role="radiogroup" aria-label="Filter by stage" className="no-scrollbar -mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1">
              {([{ key: 'all', label: 'All', dot: '' }, ...LEAD_STAGES] as { key: StageFilter; label: string; dot: string }[]).map((s) => {
                const on = stageFilter === s.key;
                const n = s.key === 'all' ? searched.length : stageCounts[s.key];
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setStageFilter(s.key)}
                    className={cx(
                      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors',
                      on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                  >
                    {s.dot && <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-full', s.dot)} />}
                    {s.label}
                    <span className={cx('tabular-nums', on ? 'text-zinc-300' : 'text-zinc-400')}>{n}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="ml-auto">
            <Segmented<View>
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table', icon: Table2 },
                { value: 'board', label: 'Board', icon: LayoutGrid },
              ]}
            />
          </div>
        </div>
        {view === 'board' ? boardView : tableView}
      </div>

      {openLead && (
        <LeadPanel
          key={openLead.key}
          lead={openLead}
          account={accountFor(openLead)}
          saving={savingKey === openLead.key}
          converting={convertingKey === openLead.key}
          draft={drafts[openLead.key] ?? openLead.visitNotes ?? ''}
          onDraft={(text) =>
            setDrafts((d) => {
              if (text.trim() === (openLead.visitNotes || '').trim()) {
                const { [openLead.key]: _, ...rest } = d;
                return rest;
              }
              return { ...d, [openLead.key]: text };
            })
          }
          onStage={(s) => void changeStage(openLead, s)}
          onConvert={() => void convert(openLead)}
          onSaveNote={() => void saveNote(openLead)}
          onClose={() => setOpenKey(null)}
        />
      )}
    </SectionFrame>
  );
}
