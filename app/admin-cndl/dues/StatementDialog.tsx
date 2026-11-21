'use client';
import { useMemo, useState } from 'react';
import { Copy, MessageSquare, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { bdMonthOf, monthStatement, statementText } from '@/lib/dues';
import { ModalShell } from '../_components/ModalShell';
import { Button, IconButton, Select, buttonClass } from '../_components/ui';
import type { ErpAccount, ErpLedgerEntry } from '../_lib/types';
import { formatBDT, formatDay, monthLabel, phoneLinks } from '../_lib/utils';

/** The last 12 Bangladesh months, newest first ("YYYY-MM"). */
function lastMonths(n = 12): string[] {
  const out: string[] = [];
  const now = bdMonthOf(Date.now());
  let [y, m] = now.split('-').map(Number);
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}

/** Monthly statement for one client: on screen, printable (A4) and as a WhatsApp message. */
export function StatementDialog({ account, rows, onClose }: { account: ErpAccount; rows: ErpLedgerEntry[]; onClose: () => void }) {
  const months = useMemo(() => lastMonths(), []);
  const [month, setMonth] = useState(months[0]);
  const s = useMemo(() => monthStatement(rows, account.currentBalance, month), [rows, account.currentBalance, month]);
  const label = monthLabel(month);
  const text = statementText(account.name, account.ownerName, s, label);
  const wa = phoneLinks(account.phone)?.wa;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Statement copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <ModalShell onClose={onClose} className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-6 print:static print:block print:bg-white print:p-0">
      <div role="dialog" aria-modal="true" aria-label={`Statement for ${account.name}`} className="flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:max-w-2xl sm:rounded-xl print:max-h-none print:max-w-none print:shadow-none">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 print:hidden">
          <h2 className="text-title font-semibold text-zinc-900">Monthly statement</h2>
          <IconButton label="Close" icon={X} onClick={onClose} />
        </header>
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-5 py-3 print:hidden">
          <div className="w-44">
            <Select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          {wa && (
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
              <MessageSquare size={14} aria-hidden="true" /> WhatsApp
            </a>
          )}
          <Button size="sm" variant="ghost" icon={Copy} onClick={() => void copy()}>
            Copy text
          </Button>
        </div>

        {/* Print only the statement, not the console around it. */}
        <style>{'@media print { body * { visibility: hidden !important; } #cndl-statement, #cndl-statement * { visibility: visible !important; } #cndl-statement { position: absolute; inset: 0 auto auto 0; width: 100%; } }'}</style>
        <div id="cndl-statement" className="overflow-y-auto px-5 py-4 print:overflow-visible">
          <div className="mb-4">
            <p className="text-title font-semibold text-zinc-900">CNDL Dental Lab — statement of account</p>
            <p className="text-table text-zinc-700">
              {account.name} · {account.ownerName} · {account.phone}
            </p>
            <p className="text-table text-zinc-500">{label}</p>
          </div>
          <dl className="mb-4 grid grid-cols-2 gap-2 text-table sm:grid-cols-4">
            {[
              ['Brought forward', s.opening],
              ['Invoiced', s.invoiced],
              ['Paid', s.paid],
              ['Balance', s.closing],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg border border-zinc-200 p-2">
                <dt className="text-meta text-zinc-500">{k}</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">{formatBDT(v as number)}</dd>
              </div>
            ))}
          </dl>
          {s.lines.length === 0 ? (
            <p className="text-table text-zinc-500">No invoices or payments in {label}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-table">
                <thead>
                  <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                    <th className="py-1.5 pr-2 font-medium">Date</th>
                    <th className="px-2 py-1.5 font-medium">Item</th>
                    <th className="px-2 py-1.5 text-right font-medium">Bill</th>
                    <th className="px-2 py-1.5 text-right font-medium">Paid</th>
                    <th className="py-1.5 pl-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {s.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-1.5 pr-2 tabular-nums text-zinc-700">{formatDay(new Date(l.at).toISOString())}</td>
                      <td className="px-2 py-1.5 text-zinc-900">
                        {l.kind}
                        {l.ref ? <span className="text-zinc-500"> · {l.ref}</span> : null}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{l.debit ? formatBDT(l.debit) : ''}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700">{l.credit ? formatBDT(l.credit) : ''}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums text-zinc-900">{formatBDT(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-meta text-zinc-500">bKash / merchant: 01743-167963 · Thank you.</p>
        </div>
      </div>
    </ModalShell>
  );
}
