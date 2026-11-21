'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, MessageSquare, Pencil, Phone } from 'lucide-react';
import { SidePanel } from '../_components/SidePanel';
import { Badge, Button, Skeleton, buttonClass } from '../_components/ui';
import { CLIENT_TYPE_LABEL, type ClientType } from '../_lib/clients';
import { DIVISION_LABEL } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpLedgerEntry } from '../_lib/types';
import { apiError, formatBDT, formatDay, parseClinical, phoneLinks } from '../_lib/utils';
import { stageOf } from '../orders/cases';

type Profile = {
  client: ErpAccount & { type: ClientType; chairmanChannel: boolean; assignedAgentName: string | null; assignedAgentPhone: string | null };
  stats: { cases: number; open: number; firstCaseAt: string | null; lastCaseAt: string | null; billed: number | null };
  recentCases: { id: string; caseId: string; status: string; productType: string | null; createdAt: string; deliveryDate: string | null; billedAmount: number | null }[];
  ledger: ErpLedgerEntry[] | null;
};

const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);

/** Everything about one client in a side panel: contact, type, agent, balance, case activity, recent cases and ledger. */
export function ClientProfile({ id, canEdit, onEdit, onClose }: { id: string; canEdit: boolean; onEdit: (a: ErpAccount) => void; onClose: () => void }) {
  const { adminFetch } = useAdmin();
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/erp/clients/${encodeURIComponent(id)}`);
        const body = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) return void setError(apiError(body, 'Could not load this client'));
        setData(body);
      } catch {
        if (live) setError('Network error — could not load this client');
      }
    })();
    return () => {
      live = false;
    };
  }, [adminFetch, id]);

  const c = data?.client;
  const links = c ? phoneLinks(c.phone) : null;
  const quiet = daysSince(data?.stats.lastCaseAt ?? null);

  return (
    <SidePanel
      title={c?.name ?? 'Client'}
      subtitle={c ? `${c.ownerName} · ${CLIENT_TYPE_LABEL[c.type]}${c.chairmanChannel ? ' · Chairman channel' : ''}` : undefined}
      onClose={onClose}
      footer={
        c ? (
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="secondary" icon={Pencil} onClick={() => onEdit(c)}>
                Edit
              </Button>
            )}
            <Link href={`/admin-cndl/orders?client=${encodeURIComponent(c.id)}&stage=all`} className={buttonClass('secondary', 'md')}>
              <Layers size={16} aria-hidden="true" /> All cases
            </Link>
          </div>
        ) : undefined
      }
    >
      {error ? (
        <p className="text-body text-rose-700">{error}</p>
      ) : !data || !c ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-meta text-zinc-500">Owes</p>
              <p className={`text-title font-semibold tabular-nums ${c.currentBalance > 0 ? 'text-rose-700' : 'text-zinc-900'}`}>{formatBDT(c.currentBalance)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-meta text-zinc-500">Cases</p>
              <p className="text-title font-semibold tabular-nums text-zinc-900">{data.stats.cases}</p>
              <p className="text-meta text-zinc-500">{data.stats.open} in the lab</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-meta text-zinc-500">Last case</p>
              <p className="text-body font-medium text-zinc-900">{data.stats.lastCaseAt ? formatDay(data.stats.lastCaseAt) : 'Never'}</p>
              {quiet !== null && <p className={`text-meta ${quiet >= 60 ? 'text-amber-700' : 'text-zinc-500'}`}>{quiet === 0 ? 'Today' : quiet === 1 ? 'Yesterday' : `${quiet} days ago`}</p>}
            </div>
            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-meta text-zinc-500">{data.stats.billed !== null ? 'Billed in total' : 'Client since'}</p>
              <p className="text-body font-medium tabular-nums text-zinc-900">{data.stats.billed !== null ? formatBDT(data.stats.billed) : formatDay(c.createdAt)}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">Contact</h3>
            <dl className="space-y-1.5 text-table">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-zinc-500">Phone</dt>
                <dd className="flex flex-wrap items-center gap-2 text-zinc-900">
                  <span className="font-mono">{c.phone}</span>
                  {links && (
                    <>
                      <a href={links.tel} className="inline-flex min-h-[32px] items-center gap-1 text-brand-700 hover:underline">
                        <Phone size={13} aria-hidden="true" /> Call
                      </a>
                      <a href={links.wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[32px] items-center gap-1 text-brand-700 hover:underline">
                        <MessageSquare size={13} aria-hidden="true" /> WhatsApp
                      </a>
                    </>
                  )}
                </dd>
              </div>
              {c.email && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-zinc-500">Email</dt>
                  <dd className="min-w-0 text-zinc-900 [overflow-wrap:anywhere]">{c.email}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-zinc-500">Area</dt>
                <dd className="text-zinc-900">{[c.district, DIVISION_LABEL[c.division] ?? c.division].filter(Boolean).join(', ')}</dd>
              </div>
              {c.address && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-zinc-500">Address</dt>
                  <dd className="min-w-0 text-zinc-900 [overflow-wrap:anywhere]">{c.address}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-zinc-500">Field agent</dt>
                <dd className="text-zinc-900">{c.assignedAgentName ?? <span className="text-zinc-400">Not assigned</span>}</dd>
              </div>
              {c.customDiscountNote && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-zinc-500">Pricing note</dt>
                  <dd className="min-w-0 text-zinc-900 [overflow-wrap:anywhere]">{c.customDiscountNote}</dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">Recent cases</h3>
            {data.recentCases.length === 0 ? (
              <p className="text-table text-zinc-500">No cases yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {data.recentCases.map((o) => {
                  const s = stageOf(o.status);
                  return (
                    <li key={o.id}>
                      <Link href={`/admin-cndl/orders?case=${encodeURIComponent(o.caseId)}&stage=all`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-table font-medium text-zinc-900">{parseClinical(o.productType).work || '—'}</p>
                          <p className="text-meta text-zinc-500">
                            <span className="font-mono">{o.caseId}</span> · {formatDay(o.createdAt)}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1.5 text-meta text-zinc-600">
                          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                        {o.billedAmount ? <span className="shrink-0 text-meta tabular-nums text-zinc-700">{formatBDT(o.billedAmount)}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {data.ledger && (
            <section>
              <h3 className="mb-2 text-meta font-semibold uppercase tracking-wide text-zinc-500">Recent invoices and collections</h3>
              {data.ledger.length === 0 ? (
                <p className="text-table text-zinc-500">Nothing recorded yet.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                  {data.ledger.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 text-table">
                      <span className="min-w-0 flex-1">
                        <span className="text-zinc-900">{e.transactionType === 'PAYMENT' ? 'Collection' : e.transactionType === 'INVOICE' ? 'Invoice' : 'Adjustment'}</span>
                        <span className="block text-meta text-zinc-500">
                          {formatDay(e.paymentDate || e.createdAt)}
                          {e.orderId ? ` · ${e.orderId}` : ''}
                        </span>
                      </span>
                      {e.transactionType === 'PAYMENT' && !e.isVerified && <Badge tone="warning">Unverified</Badge>}
                      <span className={`shrink-0 tabular-nums ${e.transactionType === 'PAYMENT' ? 'text-emerald-700' : 'text-zinc-900'}`}>
                        {e.transactionType === 'PAYMENT' ? '−' : ''}
                        {formatBDT(e.netAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </SidePanel>
  );
}
