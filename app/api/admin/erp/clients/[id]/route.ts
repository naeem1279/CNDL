import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { clientTypeOf, isChairmanChannel } from "@/lib/client-types";

/**
 * One client's profile: the account, case activity, recent cases and recent ledger entries.
 * The same scope as the list: "clients.view" (any client) or "clients.view_own" (assigned ones only;
 * anyone else's client answers 404, so ids cannot be probed). Case amounts need "cases.view_money";
 * ledger rows need "ledger.view" (or "ledger.view_own" for one's own clients).
 */
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await authorize(req, ["clients.view", "clients.view_own"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { id } = await ctx.params;
    const account = await prisma.clientAccount.findUnique({ where: { id } });
    const mine = !!account && account.assignedAgentId === access.uid;
    if (!account || (!access.can("clients.view") && !mine)) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const canMoney = access.can("cases.view_money");
    const canLedger = access.can("ledger.view") || (mine && access.can("ledger.view_own"));
    const [stats, firstLast, recent, ledger, agent] = await Promise.all([
      prisma.order.aggregate({ where: { clientAccountId: id }, _count: { _all: true }, _sum: { billedAmount: true } }),
      prisma.order.aggregate({ where: { clientAccountId: id }, _min: { createdAt: true }, _max: { createdAt: true } }),
      prisma.order.findMany({ where: { clientAccountId: id }, orderBy: { createdAt: "desc" }, take: 8 }),
      canLedger ? prisma.financialLedger.findMany({ where: { clientAccountId: id }, orderBy: { createdAt: "desc" }, take: 10 }) : Promise.resolve(null),
      account.assignedAgentId ? prisma.appUser.findUnique({ where: { id: account.assignedAgentId }, select: { name: true, phone: true } }) : Promise.resolve(null),
    ]);
    const open = await prisma.order.count({ where: { clientAccountId: id, NOT: { status: { in: ["Dispatched", "Delivered", "Cancelled"] } } } });

    return NextResponse.json({
      client: {
        ...account,
        type: clientTypeOf(account),
        chairmanChannel: isChairmanChannel(account),
        assignedAgentName: agent?.name ?? null,
        assignedAgentPhone: agent?.phone ?? null,
      },
      stats: {
        cases: stats._count._all,
        open,
        firstCaseAt: firstLast._min.createdAt,
        lastCaseAt: firstLast._max.createdAt,
        billed: canMoney ? stats._sum.billedAmount ?? 0 : null,
      },
      recentCases: recent.map((o) => ({
        id: o.id,
        caseId: o.caseId,
        status: o.status,
        productType: o.productType,
        createdAt: o.createdAt,
        deliveryDate: o.deliveryDate,
        billedAmount: canMoney ? o.billedAmount : null,
      })),
      ledger,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch the client" }, { status: 500 });
  }
}
