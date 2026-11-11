'use client';
import { Check, Copy, MessageSquare, Phone, Trash2 } from 'lucide-react';
import { SidePanel } from '../_components/SidePanel';
import { Badge, Button, buttonClass } from '../_components/ui';
import { ORDER_SOURCE_META } from '../_lib/constants';
import type { Order } from '../_lib/types';
import { formatBDT, formatDay, parseClinical, phoneLinks } from '../_lib/utils';
import { LINE, STAGES, isLate, stageOf, waLink } from './cases';

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-1.5 text-table">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-800 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export function CasePanel({
  order,
  accountName,
  agentName,
  canMove,
  canDelete,
  saving,
  copied,
  onStage,
  onCopy,
  onDelete,
  onClose,
}: {
  order: Order;
  accountName: string | null;
  agentName: string | null;
  canMove: boolean;
  canDelete: boolean;
  saving: boolean;
  copied: boolean;
  onStage: (value: string) => void;
  onCopy: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const c = parseClinical(order.productType);
  const stage = stageOf(order.status);
  const lineIndex = LINE.findIndex((s) => s.value === stage.value);
  const links = phoneLinks(order.phone);
  const late = isLate(order);
  const source = order.orderSource ? ORDER_SOURCE_META[order.orderSource]?.label ?? order.orderSource : null;

  return (
    <SidePanel
      title={order.caseId}
      subtitle={[order.clinicName || order.customerName, c.patient && `Patient: ${c.patient}`].filter(Boolean).join(' · ')}
      onClose={onClose}
    >
      <section className="border-b border-zinc-100 pb-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-body font-medium text-zinc-900">
            <span aria-hidden="true" className={cx('h-2 w-2 rounded-full', stage.dot)} />
            {stage.value === 'Quality Control' ? 'Quality control' : stage.label}
          </span>
          {late && <Badge tone="danger">Late</Badge>}
        </div>
        {/* Production line: completed steps filled, the current one outlined. */}
        <ol className="grid grid-cols-5 gap-1" aria-label="Production progress">
          {LINE.map((s, i) => (
            <li key={s.value} className="min-w-0">
              <span
                aria-hidden="true"
                className={cx('block h-1.5 rounded-full', lineIndex >= 0 && i <= lineIndex ? 'bg-brand-500' : 'bg-zinc-200')}
              />
              <span className={cx('mt-1 block truncate text-meta', i === lineIndex ? 'font-medium text-zinc-900' : 'text-zinc-400')}>{s.label}</span>
            </li>
          ))}
        </ol>
        {canMove && (
          <div className="mt-3">
            <label htmlFor="case-stage" className="mb-1 block text-meta font-medium text-zinc-500">
              Move to
            </label>
            <select
              id="case-stage"
              value={stage.value}
              disabled={saving}
              onChange={(e) => onStage(e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
            >
              {!STAGES.some((s) => s.value === stage.value) && <option value={stage.value}>{stage.label}</option>}
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value === 'Quality Control' ? 'Quality control' : s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="border-b border-zinc-100 py-4">
        <h3 className="mb-1 text-meta font-medium text-zinc-500">Prescription</h3>
        <dl>
          <Row label="Work">{c.work || '—'}{order.quantity > 1 && !/\(x\d+\)/.test(c.work) ? ` (x${order.quantity})` : ''}</Row>
          <Row label="Teeth (FDI)">{c.teeth || order.toothNo || '—'}</Row>
          <Row label="Shade">{c.shade || order.shade || '—'}</Row>
          {c.trial && <Row label="Trial">{c.trial}</Row>}
          {c.insertion && <Row label="Insertion">{c.insertion}</Row>}
          {c.notes && <Row label="Notes">{c.notes}</Row>}
        </dl>
      </section>

      <section className="border-b border-zinc-100 py-4">
        <h3 className="mb-1 text-meta font-medium text-zinc-500">Case</h3>
        <dl>
          <Row label="Doctor">{order.customerName}</Row>
          {order.clinicName && <Row label="Clinic">{order.clinicName}</Row>}
          <Row label="Phone">
            <span className="font-mono tabular-nums">{order.phone}</span>
          </Row>
          <Row label="Ordered">{formatDay(order.orderDate || order.createdAt)}</Row>
          <Row label="Promised">
            {order.deliveryDate ? <span className={late ? 'font-medium text-rose-700' : undefined}>{formatDay(order.deliveryDate)}</span> : '—'}
          </Row>
          {source && <Row label="Came in by">{source}</Row>}
          {order.billedAmount != null && <Row label="Billed">{formatBDT(order.billedAmount)}</Row>}
          {accountName && <Row label="Client account">{accountName}</Row>}
          {agentName && (
            <Row label="Agent">
              {agentName}
              {order.commissionAmount > 0 ? ` · ${formatBDT(order.commissionAmount)} commission` : ''}
            </Row>
          )}
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" icon={copied ? Check : Copy} onClick={onCopy}>
            {copied ? 'Copied' : 'Copy case ID'}
          </Button>
          {links && (
            <>
              <a href={waLink(links.wa, order.caseId)} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'sm')}>
                <MessageSquare size={14} /> WhatsApp
              </a>
              <a href={`tel:${links.tel.replace(/[^\d+]/g, '')}`} className={buttonClass('secondary', 'sm')}>
                <Phone size={14} /> Call
              </a>
            </>
          )}
        </div>
      </section>

      {canDelete && (
        <section className="pt-4">
          <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
            Delete case
          </Button>
        </section>
      )}
    </SidePanel>
  );
}
