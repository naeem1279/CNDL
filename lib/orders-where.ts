import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, NOT_IN_LAB, STATUS_ALIASES, bdDayStart, bdTodayStart, type OrderFilters } from '@/lib/orders-filters';

/** Case ids that already have an invoice in the ledger (the ledger links to a case by its case id). */
async function invoicedCaseIds(): Promise<string[]> {
  const rows = await prisma.financialLedger.findMany({
    where: { transactionType: 'INVOICE', orderId: { not: null } },
    select: { orderId: true },
    distinct: ['orderId'],
  });
  return rows.map((r) => r.orderId as string);
}

const contains = (words: string[]): Prisma.OrderWhereInput[] => words.map((w) => ({ productType: { contains: w } }));

/**
 * The database filter for a list request. `scope.agentId` limits the result to one agent's cases
 * (people who only hold "see their own cases"). `canSeeMoney` is false when the person may not see
 * amounts: the billing filter is then ignored, so it cannot be used to probe them.
 */
export async function buildOrderWhere(
  f: OrderFilters,
  scope: { agentId?: string; canSeeMoney: boolean }
): Promise<Prisma.OrderWhereInput> {
  const and: Prisma.OrderWhereInput[] = [];
  if (scope.agentId) and.push({ agentId: scope.agentId });

  const today = bdTodayStart();
  if (f.stage === 'open') and.push({ NOT: { status: { in: NOT_IN_LAB } } });
  else if (f.stage === 'late') and.push({ NOT: { status: { in: NOT_IN_LAB } } }, { deliveryDate: { lt: today } });
  else if (f.stage !== 'all') and.push({ status: { in: STATUS_ALIASES[f.stage] ?? [f.stage] } });

  const from = bdDayStart(f.from);
  const to = bdDayStart(f.to);
  if (from) and.push({ createdAt: { gte: from } });
  if (to) and.push({ createdAt: { lt: new Date(to.getTime() + 86400000) } });

  if (f.client) and.push({ clientAccountId: f.client });
  if (f.agent) and.push({ agentId: f.agent });
  if (f.source) and.push({ orderSource: f.source });

  if (f.category) {
    const idx = CATEGORIES.findIndex((c) => c.key === f.category);
    const earlier = CATEGORIES.slice(0, idx === -1 ? CATEGORIES.length : idx).flatMap((c) => c.words);
    if (idx === -1) and.push({ NOT: { OR: contains(CATEGORIES.flatMap((c) => c.words)) } }); // "other"
    else and.push({ OR: contains(CATEGORIES[idx].words) }, ...(earlier.length ? [{ NOT: { OR: contains(earlier) } }] : []));
  }

  if (f.billing && scope.canSeeMoney) {
    if (f.billing === 'unbilled') and.push({ OR: [{ billedAmount: null }, { billedAmount: { lte: 0 } }] });
    else {
      const ids = await invoicedCaseIds();
      if (f.billing === 'invoiced') and.push({ caseId: { in: ids } });
      else and.push({ billedAmount: { gt: 0 } }, { NOT: { caseId: { in: ids } } });
    }
  }

  const q = f.q.trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    const or: Prisma.OrderWhereInput[] = [
      { caseId: { contains: q } },
      { customerName: { contains: q } },
      { clinicName: { contains: q } },
      { patientName: { contains: q } },
      { productType: { contains: q } },
    ];
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    and.push({ OR: or });
  }
  return and.length ? { AND: and } : {};
}

/** Sort order for the list. The id is always the last key so pages never overlap. */
export function buildOrderBy(f: OrderFilters, canSeeMoney: boolean): Prisma.OrderOrderByWithRelationInput[] {
  const dir = f.dir;
  const key =
    f.sort === 'due' ? { deliveryDate: dir }
    : f.sort === 'case' ? { caseId: dir }
    : f.sort === 'client' ? { clinicName: dir }
    : f.sort === 'stage' ? { progress: dir }
    : f.sort === 'amount' && canSeeMoney ? { billedAmount: dir }
    : { createdAt: dir };
  return [key, { id: 'desc' }];
}
