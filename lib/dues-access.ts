import { prisma } from '@/lib/prisma';
import type { Access } from '@/lib/access';

/** People who see every client's dues ("ledger.view") or only their own clients' ("ledger.view_own"). */
export const DUES_READ = ['ledger.view', 'ledger.view_own'];

/** Can this person work on this client's dues? Their own client, or anyone with the whole ledger. */
export async function canTouchAccount(access: Access, clientAccountId: string): Promise<boolean> {
  const acc = await prisma.clientAccount.findUnique({ where: { id: clientAccountId }, select: { assignedAgentId: true } });
  if (!acc) return false;
  return access.can('ledger.view') || (access.can('ledger.view_own') && acc.assignedAgentId === access.uid);
}

/** The clients whose dues this person may see (null = all of them). */
export async function visibleAccountIds(access: Access): Promise<string[] | null> {
  if (access.can('ledger.view')) return null;
  const mine = await prisma.clientAccount.findMany({ where: { assignedAgentId: access.uid }, select: { id: true } });
  return mine.map((a) => a.id);
}
