import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** CSPRNG 8-hex Case ID — mirrors the hardened public /api/order generator. */
export function newCaseId(): string {
  return 'CNDL-' + randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Creates the order with collision-safe Case IDs: the CSPRNG space (16^8 ≈ 4.3 billion) makes clashes
 * practically impossible, and a P2002 unique-constraint hit simply regenerates and retries.
 */
export async function createOrderWithCaseId(data: Omit<Prisma.OrderUncheckedCreateInput, 'caseId'>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.order.create({ data: { ...data, caseId: newCaseId() } });
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002' && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error('Failed to allocate a unique Case ID');
}
