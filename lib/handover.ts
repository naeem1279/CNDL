import { prisma } from '@/lib/prisma';

const parseIds = (s: string): string[] => {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
export { parseIds as handoverIds };

/**
 * Cash an agent is holding: collections they recorded that the office has not verified yet and that
 * are not already in a handover waiting to be received.
 */
export async function cashInHand(agentId: string) {
  const [unverified, pending] = await Promise.all([
    prisma.financialLedger.findMany({
      where: { transactionType: 'PAYMENT', collectedById: agentId, isVerified: false },
      select: { id: true, netAmount: true, clientAccountId: true, paymentDate: true, createdAt: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.cashHandover.findMany({ where: { agentId, status: 'SUBMITTED' }, select: { collectionIds: true } }),
  ]);
  const held = new Set(pending.flatMap((h) => parseIds(h.collectionIds)));
  const rows = unverified.filter((r) => !held.has(r.id));
  return { rows, amount: rows.reduce((s, r) => s + r.netAmount, 0) };
}
