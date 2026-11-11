'use client';
import { useState } from 'react';
import { MessageSquare, Pencil, Phone, Plus, Wallet } from 'lucide-react';
import { SidePanel } from '../_components/SidePanel';
import { Badge, Button, buttonClass } from '../_components/ui';
import { DIVISION_LABEL, INSTITUTION_TYPE_META } from '../_lib/constants';
import type { ErpAccount, ErpLedgerEntry } from '../_lib/types';
import { formatBDT, formatDay, formatDate, phoneLinks } from '../_lib/utils';

const STATEMENT_LIMIT = 25;

/** When a ledger row happened: collections use the date the money was received. */
export const entryTime = (e: ErpLedgerEntry) => new Date(e.paymentDate || e.createdAt).getTime();

/**
 * Days a balance has been waiting: since the last collection, or (if none) the
 * first invoice, or (if none) the account's creation. Same rule as before.
 */
export function agingDays(acc: ErpAccount, rows: ErpLedgerEntry[]): number {
  const payments = rows.filter((e) => e.transactionType === 'PAYMENT');
  const invoices = rows.filter((e) => e.transactionType === 'INVOICE');
  const anchor = payments.length
    ? Math.max(...payments.map(entryTime))
    : invoices.length
      ? Math.min(...invoices.map(entryTime))
      : new Date(acc.createdAt).getTime();
  return Math.max(0, Math.floor((Date.now() - anchor) / 86400000));
}

/** Bengali WhatsApp due reminder (text unchanged from the previous version). */
export function reminderHref(acc: ErpAccount, rows: ErpLedgerEntry[]): string {
  const invoices = rows.filter((e) => e.transactionType === 'INVOICE').slice(0, 3);
  const paid = rows.filter((e) => e.transactionType === 'PAYMENT').reduce((s, e) => s + (e.netAmount || 0), 0);
  const parts: string[] = invoices.map((inv) => `• ${formatDay(inv.createdAt)} — ৳${Math.round(inv.netAmount).toLocaleString('en-IN')}`);
  if (paid > 0) parts.push(`মোট পরিশোধ: ৳${Math.round(paid).toLocaleString('en-IN')}`);
  if (!parts.length) parts.push('নতুন হিসাব');
  const text = `শ্রদ্ধেয ডক্টর ${acc.ownerName}, CNDL ল্যাব থেকে আপনার মোট বকেয়া ৳${Math.round(acc.currentBalance).toLocaleString('en-IN')}। বিস্তারিত: ${parts.join(' ')}। বিকাশ/মার্চেন্ট: 01743-167963। ধন্যবাদ!`;
  const num = phoneLinks(acc.phone)?.wa || acc.phone.replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/** Each ledger row (newest first) with the account balance right after it. */
function runningBalances(current: number, rows: ErpLedgerEntry[]) {
  const newestFirst = [...rows].sort((a, b) => entryTime(b) - entryTime(a));
  const out: { e: ErpLedgerEntry; balance: number }[] = [];
  let after = current;
  for (const e of newestFirst) {
    out.push({ e, balance: after });
    after -= e.transactionType === 'INVOICE' ? e.netAmount : -e.netAmount;
  }
  return out;
}

export function AgingBadge({ days, balance }: { days: number; balance: number }) {
  if (balance <= 0) return null;
  if (days > 30) return <Badge tone="danger">{days}d overdue</Badge>;
  if (days >= 15) return <Badge tone="warning">{days}d</Badge>;
  return <Badge>{days}d</Badge>;
}

export function AccountPanel({
  account,
  rows,
  days,
  collectorName,
  canInvoice,
  canEdit,
  onCollect,
  onInvoice,
  onEdit,
  onClose,
}: {
  account: ErpAccount;
  /** This account's ledger rows, newest first. */
  rows: ErpLedgerEntry[];
  days: number;
  collectorName: (id: string | null | undefined) => string | null;
  canInvoice: boolean;
  canEdit: boolean;
  onCollect: () => void;
  onInvoice: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const links = phoneLinks(account.phone);
  const inst = INSTITUTION_TYPE_META[account.institutionType]?.label || 'Chamber';

  // Balance after each row, newest first: start from today's balance and undo
  // each newer row in turn.
  const statement = runningBalances(account.currentBalance, rows);
  const shown = showAll ? statement : statement.slice(0, STATEMENT_LIMIT);
  const invoiced = rows.filter((e) => e.transactionType === 'INVOICE').reduce((s, e) => s + e.netAmount, 0);
  const collected = rows.filter((e) => e.transactionType === 'PAYMENT').reduce((s, e) => s + e.netAmount, 0);

  return (
    <SidePanel
      title={account.name}
      subtitle={[account.ownerName, inst, account.district || DIVISION_LABEL[account.division] || account.division].filter(Boolean).join(' · ')}
      onClose={onClose}
    >
      <section className="border-b border-zinc-100 pb-4">
        <p className="text-meta font-medium text-zinc-500">{account.currentBalance < 0 ? 'Advance (paid ahead)' : 'Owes'}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-kpi font-semibold tracking-tight text-zinc-900 tabular-nums">{formatBDT(Math.abs(account.currentBalance))}</span>
          <AgingBadge days={days} balance={account.currentBalance} />
        </div>
        <p className="mt-1 text-meta text-zinc-500 tabular-nums">
          Invoiced {formatBDT(invoiced)} · collected {formatBDT(collected)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" size="sm" icon={Wallet} onClick={onCollect}>
            Record collection
          </Button>
          {canInvoice ? (
            <Button size="sm" icon={Plus} onClick={onInvoice}>
              Record invoice
            </Button>
          ) : (
            <span />
          )}
        </div>
      </section>

      <section className="border-b border-zinc-100 py-4">
        <h3 className="mb-2 text-meta font-medium text-zinc-500">Contact</h3>
        <p className="font-mono text-table text-zinc-700 tabular-nums">{account.phone}</p>
        {account.assignedAgentName && <p className="mt-1 text-table text-zinc-600">Field agent: {account.assignedAgentName}</p>}
        {account.address && <p className="mt-1 text-table text-zinc-600 [overflow-wrap:anywhere]">{account.address}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {links && (
            <a href={`tel:${links.tel.replace(/[^\d+]/g, '')}`} className={buttonClass('secondary', 'sm')}>
              <Phone size={14} /> Call
            </a>
          )}
          {account.currentBalance > 0 && (
            <a href={reminderHref(account, rows)} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
              <MessageSquare size={14} /> Send reminder
            </a>
          )}
          {canEdit && (
            <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </section>

      <section className="pt-4">
        <h3 className="mb-2 text-meta font-medium text-zinc-500">Statement{rows.length ? ` · ${rows.length}` : ''}</h3>
        {statement.length === 0 ? (
          <p className="text-table text-zinc-400">No invoices or collections yet.</p>
        ) : (
          <ol className="divide-y divide-zinc-100">
            {shown.map(({ e, balance }) => {
              const isPay = e.transactionType === 'PAYMENT';
              const who = isPay ? collectorName(e.collectedById) : null;
              return (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-table font-medium text-zinc-800">
                      {isPay ? 'Collection' : e.discountAmount ? 'Invoice (discounted)' : 'Invoice'}
                      {isPay && !e.isVerified && <Badge tone="warning" className="ml-1.5">Unverified</Badge>}
                    </p>
                    <p className="text-meta text-zinc-500" title={formatDate(e.paymentDate || e.createdAt)}>
                      {formatDay(e.paymentDate || e.createdAt)}
                      {e.paymentMethod ? ` · ${e.paymentMethod}` : ''}
                      {who ? ` · ${who}` : ''}
                      {e.orderId ? ` · ${e.orderId}` : ''}
                    </p>
                    {e.notes && <p className="text-meta text-zinc-400 [overflow-wrap:anywhere]">{e.notes}</p>}
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className={`text-table font-medium ${isPay ? 'text-emerald-700' : 'text-zinc-900'}`}>
                      {isPay ? '−' : '+'}
                      {formatBDT(e.netAmount)}
                    </p>
                    <p className="text-meta text-zinc-400">{formatBDT(balance)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {statement.length > STATEMENT_LIMIT && (
          <Button size="sm" variant="ghost" className="mt-1" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${statement.length}`}
          </Button>
        )}
      </section>
    </SidePanel>
  );
}
