import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { cashInHand } from "@/lib/handover";
import { AWAITING_APPROVAL, NOT_IN_LAB, STATUS_ALIASES } from "@/lib/orders-filters";

/**
 * "My day" for the signed-in person (built for field agents): my clients, my cases, what I collected
 * today, the cash I am holding, my handovers and my commission. Only ever about the caller.
 * Access: anyone who sees their own (or all) cases or ledger.
 */
const BD = 6 * 3600000;
const bdDayStart = (now = Date.now()) => new Date(Date.parse(new Date(now + BD).toISOString().slice(0, 10) + "T00:00:00Z") - BD);

export async function GET(req: Request) {
  const auth = await authorize(req, ["cases.view_own", "ledger.view_own", "cases.view", "ledger.view"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  if (!access.uid) return NextResponse.json({ error: "My day is for team members (sign in with your own account)" }, { status: 400 });
  try {
    const me = access.uid;
    const start = bdDayStart();
    const end = new Date(start.getTime() + 86400000);
    const today = { gte: start, lt: end };
    const dispatchedOrDelivered = [...STATUS_ALIASES.Dispatched, ...STATUS_ALIASES.Delivered];

    const [clients, collectedToday, hand, handovers, earned, pending, awaiting, openCases, receivedToday, payouts, recentSubmissions] = await Promise.all([
      prisma.clientAccount.findMany({ where: { assignedAgentId: me }, select: { id: true, name: true, currentBalance: true, phone: true }, orderBy: { currentBalance: "desc" } }),
      prisma.financialLedger.findMany({
        where: { transactionType: "PAYMENT", collectedById: me, OR: [{ paymentDate: today }, { paymentDate: null, createdAt: today }] },
        select: { netAmount: true },
      }),
      cashInHand(me),
      prisma.cashHandover.findMany({ where: { agentId: me }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.order.aggregate({ where: { agentId: me, status: { in: dispatchedOrDelivered } }, _sum: { commissionAmount: true } }),
      prisma.order.aggregate({ where: { agentId: me, NOT: { status: { in: NOT_IN_LAB } } }, _sum: { commissionAmount: true } }),
      prisma.order.count({ where: { agentId: me, status: AWAITING_APPROVAL } }),
      prisma.order.count({ where: { agentId: me, NOT: { status: { in: NOT_IN_LAB } } } }),
      prisma.order.count({ where: { agentId: me, createdAt: today } }),
      // Commission payouts are recorded as expenses carrying {"agentId": ...} in their notes.
      prisma.dailyExpense.findMany({ where: { category: "LOGISTICS", notes: { contains: `"agentId":"${me}"` } }, select: { amount: true } }),
      prisma.order.findMany({
        where: { agentId: me, OR: [{ status: AWAITING_APPROVAL }, { status: "Cancelled", productType: { contains: "Not approved by" } }] },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, caseId: true, status: true, productType: true, clinicName: true, billedAmount: true, createdAt: true },
      }),
    ]);

    const owing = clients.filter((c) => c.currentBalance > 0);
    const paid = payouts.reduce((s, p) => s + p.amount, 0);
    const earnedSum = earned._sum.commissionAmount ?? 0;
    return NextResponse.json({
      clients: { count: clients.length, owing: owing.length, totalDue: owing.reduce((s, c) => s + c.currentBalance, 0), top: owing.slice(0, 5) },
      cases: { open: openCases, awaitingApproval: awaiting, receivedToday, recentSubmissions },
      collections: { today: collectedToday.reduce((s, r) => s + r.netAmount, 0), todayCount: collectedToday.length },
      cash: { inHand: hand.amount, count: hand.rows.length },
      handovers,
      commission: { earned: earnedSum, pending: pending._sum.commissionAmount ?? 0, paid, owed: earnedSum - paid },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load your day" }, { status: 500 });
  }
}
