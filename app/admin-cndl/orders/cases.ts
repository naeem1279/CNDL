import { hasPermission } from '@/lib/permissions';
/* Lab case stages, roles and helpers shared by the Lab Cases page, panel and form. */
import type { ErpLedgerEntry, Order } from '../_lib/types';

/** Stages offered in the UI, in order. Values are what /api/admin/data PATCH stores. */
export const STAGES: { value: string; label: string; dot: string; progress: number }[] = [
  { value: 'Received', label: 'Received', dot: 'bg-zinc-400', progress: 10 },
  { value: 'Designing', label: 'Designing', dot: 'bg-brand-300', progress: 35 },
  { value: 'Milling', label: 'Milling', dot: 'bg-brand-500', progress: 60 },
  { value: 'Quality Control', label: 'QC', dot: 'bg-amber-500', progress: 85 },
  { value: 'Dispatched', label: 'Dispatched', dot: 'bg-emerald-500', progress: 100 },
  { value: 'Delivered', label: 'Delivered', dot: 'bg-emerald-700', progress: 100 },
  { value: 'Cancelled', label: 'Cancelled', dot: 'bg-rose-400', progress: 0 },
];
/** The production line (what the panel's step bar shows). */
export const LINE = STAGES.slice(0, 5);
/** Older rows may hold legacy values; map them onto the current stages for display. */
const LEGACY: Record<string, string> = { PENDING: 'Received', Production: 'Milling', QC: 'Quality Control' };
export const stageOf = (status: string | null | undefined) => {
  const v = LEGACY[status || ''] || status || 'Received';
  return STAGES.find((s) => s.value === v) ?? { value: v, label: v, dot: 'bg-zinc-300', progress: 0 };
};

const DONE = new Set(['Dispatched', 'Delivered', 'Cancelled']);
export const isOpen = (o: Order) => !DONE.has(stageOf(o.status).value);

/** Start of today, local time. */
const todayStart = () => new Date().setHours(0, 0, 0, 0);
/** Past its promised delivery date and not yet out of the lab (same rule as Overview). */
export const isLate = (o: Order) => !!o.deliveryDate && isOpen(o) && new Date(o.deliveryDate).getTime() < todayStart();
export const dueThisWeek = (o: Order) => {
  if (!o.deliveryDate || !isOpen(o)) return false;
  const t = new Date(o.deliveryDate).getTime();
  return t >= todayStart() && t < todayStart() + 7 * 86400000;
};

/** Role rules mirrored from the API (POST /api/admin/orders, PATCH/DELETE /api/admin/data). */
export function casePermissions(permissions: readonly string[]) {
  return {
    canCreate: hasPermission(permissions, 'cases.create'),
    canMove: hasPermission(permissions, 'cases.move_stage'),
    canDelete: hasPermission(permissions, 'cases.delete'),
  };
}

/**
 * Moving a case to Dispatched posts an invoice when it is linked to a client
 * account, has a billed amount, and has no invoice yet. Returns that amount, or 0.
 */
export function dispatchBills(o: Order, ledger: ErpLedgerEntry[]): number {
  if (!o.clientAccountId || !o.billedAmount || o.billedAmount <= 0) return 0;
  const invoiced = ledger.some((e) => e.transactionType === 'INVOICE' && e.orderId === o.caseId);
  return invoiced ? 0 : o.billedAmount;
}

export const waLink = (wa: string, caseId: string) =>
  `https://wa.me/${wa}?text=${encodeURIComponent(`Hello, this is CNDL Dental Lab regarding Case ID: ${caseId}`)}`;
