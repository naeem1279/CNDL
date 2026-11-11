import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";

const payoutSchema = z.object({
  agentId: z.string().trim().min(1, "Agent is required").max(60),
  amountPaid: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.string().trim().max(30).default("Cash"),
  notes: z.string().trim().max(1000).nullish(),
  payoutDate: z.coerce.date().optional(),
});

/**
 * Agent commission payout — recorded as a LOGISTICS expense titled
 * "Agent Commission - [Agent Name]" with the agent link embedded in the
 * notes JSON (`{"agentId":...}`) so pending-commission math can subtract it.
 */
export async function POST(req: Request) {
  const denied = await requireRole(req, ["SUPERADMIN", "ACCOUNTS"]);
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = payoutSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    const { agentId, amountPaid, paymentMethod, notes, payoutDate } = parsed.data;

    const agent = await prisma.appUser.findFirst({
      where: { id: agentId, role: "AGENT" },
      select: { id: true, name: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const expense = await prisma.dailyExpense.create({
      data: {
        category: "LOGISTICS",
        title: `Agent Commission - ${agent.name}`,
        amount: amountPaid,
        voucherNo: null,
        notes: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          paymentMethod,
          notes: notes ?? null,
          payoutDate: (payoutDate ?? new Date()).toISOString(),
        }),
        expenseDate: payoutDate ?? new Date(),
      },
    });

    return NextResponse.json({ ok: true, expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record commission payout" }, { status: 500 });
  }
}
