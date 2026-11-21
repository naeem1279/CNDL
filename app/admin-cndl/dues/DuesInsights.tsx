'use client';
import { useMemo } from 'react';
import { PhoneCall, TrendingUp } from 'lucide-react';
import { AGE_BUCKETS, ageing, openInvoices, riskOf, type Ageing, type Risk } from '@/lib/dues';
import { Badge, Panel } from '../_components/ui';
import type { ErpAccount, ErpLedgerEntry } from '../_lib/types';
import { formatBDT, formatDay, todayInput } from '../_lib/utils';
import type { FollowUp } from './FollowUps';

export type AccountDues = { account: ErpAccount; ageing: Ageing; risk: Risk };

/** Ageing and risk for every account with a balance (payments settle the oldest invoices first). */
/** `now` is passed in (captured once by the page) so rendering stays pure. */
export function useAccountDues(accounts: ErpAccount[], rowsByAccount: Map<string, ErpLedgerEntry[]>, now: number): Map<string, AccountDues> {
  return useMemo(() => {
    const m = new Map<string, AccountDues>();
    for (const a of accounts) {
      const ag = a.currentBalance > 0 ? ageing(openInvoices(rowsByAccount.get(a.id) ?? [], a.currentBalance, a.createdAt), now) : { d0: 0, d31: 0, d61: 0, d90: 0, total: 0, oldestDays: null };
      m.set(a.id, { account: a, ageing: ag, risk: riskOf(a.currentBalance, ag.oldestDays) });
    }
    return m;
  }, [accounts, rowsByAccount, now]);
}

export const RISK_BADGE: Record<Risk, { tone: 'danger' | 'warning' | 'neutral'; label: string } | null> = {
  high: { tone: 'danger', label: 'High risk' },
  watch: { tone: 'warning', label: 'Watch' },
  none: null,
};

/** One account's money by age, as a stacked bar with the four amounts underneath. */
export function AgeingBar({ ag }: { ag: Ageing }) {
  if (ag.total <= 0) return null;
  const colors = ['bg-emerald-500', 'bg-amber-400', 'bg-orange-500', 'bg-rose-600'];
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
        {AGE_BUCKETS.map((b, i) => (ag[b.key] > 0 ? <span key={b.key} className={colors[i]} style={{ width: `${(ag[b.key] / ag.total) * 100}%` }} /> : null))}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-meta sm:grid-cols-4">
        {AGE_BUCKETS.map((b, i) => (
          <div key={b.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${colors[i]}`} />
            <dt className="text-zinc-500">{b.label}</dt>
            <dd className="ml-auto tabular-nums text-zinc-900 sm:ml-0">{formatBDT(ag[b.key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Above the accounts list: the age of all money owed, the biggest debtors, and who to call today
 * (promises due today or overdue, and high-risk clients nobody has followed up in a week).
 */
export function DuesInsights({
  dues,
  promises,
  lastContact,
  now,
  onOpen,
}: {
  dues: Map<string, AccountDues>;
  promises: FollowUp[];
  lastContact: Record<string, string | null>;
  now: number;
  onOpen: (accountId: string) => void;
}) {
  const list = [...dues.values()];
  const total = list.reduce(
    (s, d) => ({ d0: s.d0 + d.ageing.d0, d31: s.d31 + d.ageing.d31, d61: s.d61 + d.ageing.d61, d90: s.d90 + d.ageing.d90, total: s.total + d.ageing.total, oldestDays: null }),
    { d0: 0, d31: 0, d61: 0, d90: 0, total: 0, oldestDays: null } as Ageing
  );
  const top = list.filter((d) => d.account.currentBalance > 0).sort((a, b) => b.account.currentBalance - a.account.currentBalance).slice(0, 5);

  const today = todayInput();
  const weekAgo = now - 7 * 86400000;
  const due = promises.filter((p) => p.promiseDate && p.promiseDate.slice(0, 10) <= today && dues.has(p.clientAccountId));
  const promised = new Set(promises.map((p) => p.clientAccountId));
  const quietHigh = list
    .filter((d) => d.risk === 'high' && !promised.has(d.account.id) && !(lastContact[d.account.id] && Date.parse(lastContact[d.account.id]!) > weekAgo))
    .sort((a, b) => b.account.currentBalance - a.account.currentBalance)
    .slice(0, 8);
  const callCount = due.length + quietHigh.length;

  return (
    <div className="grid gap-4 border-b border-zinc-100 p-3 lg:grid-cols-3">
      <Panel title="Money owed by age" description={`${formatBDT(total.total)} in total`} className="lg:col-span-1" bodyClassName="py-3">
        <AgeingBar ag={total} />
      </Panel>
      <Panel title="Biggest balances" action={<TrendingUp size={16} className="text-zinc-400" aria-hidden="true" />} bodyClassName="p-0">
        {top.length === 0 ? (
          <p className="px-4 py-3 text-table text-zinc-500">Nobody owes anything.</p>
        ) : (
          <ol className="divide-y divide-zinc-100">
            {top.map((d) => (
              <li key={d.account.id}>
                <button type="button" onClick={() => onOpen(d.account.id)} className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                  <span className="min-w-0 flex-1 truncate text-table text-zinc-900">{d.account.name}</span>
                  {RISK_BADGE[d.risk] && <Badge tone={RISK_BADGE[d.risk]!.tone}>{RISK_BADGE[d.risk]!.label}</Badge>}
                  <span className="shrink-0 text-table font-medium tabular-nums text-rose-700">{formatBDT(d.account.currentBalance)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Panel>
      <Panel
        title="Call today"
        description={callCount ? `${callCount} ${callCount === 1 ? 'client' : 'clients'}` : 'Nothing due'}
        action={<PhoneCall size={16} className="text-zinc-400" aria-hidden="true" />}
        bodyClassName="p-0"
      >
        {callCount === 0 ? (
          <p className="px-4 py-3 text-table text-zinc-500">No promises due and no high-risk client left without a follow-up this week.</p>
        ) : (
          <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto">
            {due.map((p) => {
              const a = dues.get(p.clientAccountId)!.account;
              const late = p.promiseDate!.slice(0, 10) < today;
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => onOpen(a.id)} className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-table text-zinc-900">{a.name}</span>
                      <span className="block truncate text-meta text-zinc-500">
                        Promised {formatBDT(p.promiseAmount ?? 0)} by {formatDay(p.promiseDate)}
                      </span>
                    </span>
                    <Badge tone={late ? 'danger' : 'warning'}>{late ? 'Overdue' : 'Due today'}</Badge>
                  </button>
                </li>
              );
            })}
            {quietHigh.map((d) => (
              <li key={d.account.id}>
                <button type="button" onClick={() => onOpen(d.account.id)} className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-table text-zinc-900">{d.account.name}</span>
                    <span className="block truncate text-meta text-zinc-500">
                      {formatBDT(d.account.currentBalance)} · oldest {d.ageing.oldestDays ?? 0} days · no follow-up this week
                    </span>
                  </span>
                  <Badge tone="danger">High risk</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
