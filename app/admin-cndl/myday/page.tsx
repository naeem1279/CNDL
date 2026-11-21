'use client';
import { useCallback, useEffect, useState } from 'react';
import { Banknote, Building2, Coins, HandCoins, Layers, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Panel } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAccount } from '../_lib/types';
import { apiError, formatBDT, formatDay, parseClinical } from '../_lib/utils';
import { SubmitCaseDialog } from './SubmitCaseDialog';

type Handover = { id: string; amount: number; status: 'SUBMITTED' | 'RECEIVED' | 'DISPUTED'; createdAt: string; receivedByName: string | null; receivedNote: string | null };
type Day = {
  clients: { count: number; owing: number; totalDue: number; top: { id: string; name: string; currentBalance: number; phone: string }[] };
  cases: { open: number; awaitingApproval: number; receivedToday: number; recentSubmissions: { id: string; caseId: string; status: string; productType: string | null; clinicName: string | null; billedAmount: number | null; createdAt: string }[] };
  collections: { today: number; todayCount: number };
  cash: { inHand: number; count: number };
  handovers: Handover[];
  commission: { earned: number; pending: number; paid: number; owed: number };
};

const HANDOVER_TONE = { SUBMITTED: 'warning', RECEIVED: 'success', DISPUTED: 'danger' } as const;
const HANDOVER_LABEL = { SUBMITTED: 'Waiting for the office', RECEIVED: 'Received', DISPUTED: 'Disputed' } as const;

/** A field agent's day: clients, cases, collections, cash in hand, handovers and commission. */
export default function MyDayPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const canSubmit = me.permissions.includes('cases.submit');
  const canHandOver = me.permissions.includes('ledger.collect_own') || me.permissions.includes('ledger.collect');
  const [day, setDay] = useState<Day | null>(null);
  const [accounts, setAccounts] = useState<ErpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [handing, setHanding] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await adminFetch('/api/admin/erp/my-day');
        if (res.status === 401) return;
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return void toast.error(apiError(body, 'Could not load your day'));
        setDay(body);
        setLastSyncedAt(Date.now());
      } catch {
        toast.error('Network error — could not load your day');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminFetch]
  );
  useEffect(() => {
    void load();
    void (async () => {
      const r = await loadResources(adminFetch, ['accounts'], me).catch(() => null);
      if (r?.accounts) setAccounts(r.accounts.filter((a) => a.assignedAgentId === me.uid));
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handOver = async () => {
    if (!day) return;
    if (!(await askConfirm(`Hand over ${formatBDT(day.cash.inHand)} (${day.cash.count} ${day.cash.count === 1 ? 'collection' : 'collections'}) to the office? The office confirms when they receive it.`, { title: 'Hand over cash?', confirmLabel: `Hand over ${formatBDT(day.cash.inHand)}`, tone: 'primary' }))) return;
    setHanding(true);
    try {
      const res = await adminFetch('/api/admin/erp/handovers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not record the handover'));
      toast.success(`Handover of ${formatBDT(body.handover.amount)} recorded — waiting for the office`);
      void load(true);
    } catch {
      toast.error('Network error — nothing was recorded');
    } finally {
      setHanding(false);
    }
  };

  const kpis: Kpi[] = day
    ? [
        { label: 'Collected today', value: formatBDT(day.collections.today), icon: Banknote, sub: `${day.collections.todayCount} ${day.collections.todayCount === 1 ? 'collection' : 'collections'}` },
        { label: 'Cash in hand', value: formatBDT(day.cash.inHand), icon: HandCoins, sub: day.cash.count ? 'Not yet handed over' : 'Nothing to hand over' },
        { label: 'My clients owe', value: formatBDT(day.clients.totalDue), icon: Building2, sub: `${day.clients.owing} of ${day.clients.count} clients` },
        { label: 'Commission owed to me', value: formatBDT(day.commission.owed), icon: Coins, sub: `${formatBDT(day.commission.pending)} more when cases leave the lab` },
      ]
    : [];

  return (
    <SectionFrame
      tab="myday"
      kpis={kpis}
      loading={loading && !day}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => void load(true)}
      actions={
        <>
          {canHandOver && (
            <Button variant="secondary" icon={HandCoins} onClick={() => void handOver()} disabled={!day || day.cash.count === 0 || handing}>
              <span className="hidden sm:inline">Hand over cash</span>
              <span className="sm:hidden">Hand over</span>
            </Button>
          )}
          {canSubmit && (
            <Button variant="primary" icon={Plus} onClick={() => setSubmitting(true)} disabled={accounts.length === 0}>
              <span className="hidden sm:inline">Submit a case</span>
              <span className="sm:hidden">Case</span>
            </Button>
          )}
        </>
      }
    >
      {day && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="My cases" description={`${day.cases.open} in the lab · ${day.cases.awaitingApproval} waiting for approval · ${day.cases.receivedToday} new today`} bodyClassName="p-0">
            {day.cases.recentSubmissions.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Layers} title="No cases waiting">
                  {canSubmit ? 'Cases you submit appear here until the office approves them.' : null}
                </EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {day.cases.recentSubmissions.map((o) => {
                  const c = parseClinical(o.productType);
                  const rejected = o.status === 'Cancelled';
                  return (
                    <li key={o.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-table text-zinc-900">{o.caseId}</span>
                        <Badge tone={rejected ? 'danger' : 'warning'}>{rejected ? 'Not approved' : 'Waiting for approval'}</Badge>
                      </div>
                      <p className="text-table text-zinc-700">
                        {o.clinicName} · {c.work || '—'}
                        {o.billedAmount ? ` · ${formatBDT(o.billedAmount)}` : ''}
                      </p>
                      {rejected && c.notes && <p className="text-meta text-rose-700 [overflow-wrap:anywhere]">{c.notes}</p>}
                      <p className="text-meta text-zinc-500">{formatDay(o.createdAt)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Cash handovers" description="Collections you recorded are verified when the office receives your handover." bodyClassName="p-0">
            {day.handovers.length === 0 ? (
              <p className="px-4 py-3 text-table text-zinc-500">No handovers yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {day.handovers.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-table font-medium tabular-nums text-zinc-900">{formatBDT(h.amount)}</p>
                      <p className="text-meta text-zinc-500">
                        {formatDay(h.createdAt)}
                        {h.receivedByName ? ` · ${h.receivedByName}` : ''}
                      </p>
                      {h.receivedNote && <p className="text-meta text-zinc-600 [overflow-wrap:anywhere]">{h.receivedNote}</p>}
                    </div>
                    <Badge tone={HANDOVER_TONE[h.status]}>{HANDOVER_LABEL[h.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Clients who owe the most" bodyClassName="p-0">
            {day.clients.top.length === 0 ? (
              <p className="px-4 py-3 text-table text-zinc-500">None of your clients owe anything.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {day.clients.top.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0 truncate text-table text-zinc-900">{c.name}</span>
                    <span className="shrink-0 text-table font-medium tabular-nums text-rose-700">{formatBDT(c.currentBalance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Commission" bodyClassName="py-3">
            <dl className="grid grid-cols-2 gap-3 text-table">
              <div>
                <dt className="text-meta text-zinc-500">Earned (cases dispatched or delivered)</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">{formatBDT(day.commission.earned)}</dd>
              </div>
              <div>
                <dt className="text-meta text-zinc-500">Pending (still in the lab)</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">{formatBDT(day.commission.pending)}</dd>
              </div>
              <div>
                <dt className="text-meta text-zinc-500">Paid to me</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">{formatBDT(day.commission.paid)}</dd>
              </div>
              <div>
                <dt className="text-meta text-zinc-500">Owed to me</dt>
                <dd className="font-semibold tabular-nums text-emerald-700">{formatBDT(day.commission.owed)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}

      {submitting && <SubmitCaseDialog accounts={accounts} onClose={() => setSubmitting(false)} onSaved={() => void load(true)} />}
    </SectionFrame>
  );
}
