import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession, requireRole } from "@/lib/admin-auth";

const invoiceSchema = z.object({
  transactionType: z.literal("INVOICE"),
  clientAccountId: z.string().min(1),
  orderId: z.string().trim().max(100).nullish(),
  grossAmount: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(1000).nullish(),
});

const paymentSchema = z.object({
  transactionType: z.literal("PAYMENT"),
  clientAccountId: z.string().min(1),
  netAmount: z.coerce.number().positive(),
  collectedById: z.string().trim().max(100).nullish(),
  isVerified: z.coerce.boolean().default(false),
  paymentMethod: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(50).nullish()
  ),
  paymentDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.coerce.date().nullish()
  ),
  notes: z.string().trim().max(1000).nullish(),
});

const ledgerSchema = z.discriminatedUnion("transactionType", [invoiceSchema, paymentSchema]);

export async function GET(req: Request) {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const privileged = session.role === "SUPERADMIN" || session.role === "CHAIRMAN" || session.role === "ACCOUNTS";
    if (privileged) {
      // Phase 1 (2026-11-06): the arbitrary take:500 cap is removed — aging and
      // today/month revenue are computed client-side from this list and used to
      // drift when old payments scrolled out of the window.
      const entries = await prisma.financialLedger.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ entries });
    }
    // AGENT (and other non-privileged roles): only ledger activity of the
    // accounts assigned to them, or collections they personally recorded.
    const assigned = await prisma.clientAccount.findMany({
      where: { assignedAgentId: session.uid },
      select: { id: true },
    });
    const accountIds = assigned.map((a) => a.id);
    const entries = await prisma.financialLedger.findMany({
      where: {
        OR: [
          { clientAccountId: { in: accountIds } },
          { collectedById: session.uid },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const json = await req.json();
    const parsed = ledgerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Phase 1 financial-integrity rules (2026-11-06):
    // - INVOICE (billing/due creation) is SUPERADMIN/ACCOUNTS-only.
    // - AGENT may only post PAYMENT, only against accounts assigned to them,
    //   and collectedById is FORCED to their own id — no attributing
    //   collections to colleagues.
    if (input.transactionType === "INVOICE" && !["SUPERADMIN", "ACCOUNTS"].includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden — invoices can only be recorded by SUPERADMIN or ACCOUNTS" },
        { status: 403 }
      );
    }
    let collectedById = input.transactionType === "PAYMENT" ? input.collectedById ?? null : null;
    if (session.role === "AGENT") {
      if (input.transactionType !== "PAYMENT") {
        return NextResponse.json(
          { error: "Forbidden — agents can only record collections" },
          { status: 403 }
        );
      }
      const account = await prisma.clientAccount.findUnique({
        where: { id: input.clientAccountId },
        select: { assignedAgentId: true },
      });
      if (!account || account.assignedAgentId !== session.uid) {
        return NextResponse.json(
          { error: "Forbidden — agents can only record collections for their assigned accounts" },
          { status: 403 }
        );
      }
      collectedById = session.uid;
    }
    // Week 1 fix (2026-11-11): a collector can never verify their own cash —
    // verification is the accounts team's sign-off.
    const isVerified =
      input.transactionType === "PAYMENT" && session.role !== "AGENT" ? input.isVerified : false;

    // Discretionary discount override requires a mandatory justification note.
    if (input.transactionType === "INVOICE" && input.discountAmount > 0 && !input.notes) {
      return NextResponse.json(
        { error: "A note is mandatory when applying a discount override" },
        { status: 400 }
      );
    }

    const account = await prisma.clientAccount.findUnique({
      where: { id: input.clientAccountId },
    });
    if (!account) {
      return NextResponse.json({ error: "Client account not found" }, { status: 404 });
    }

    const netAmount =
      input.transactionType === "INVOICE"
        ? input.grossAmount - input.discountAmount
        : input.netAmount;
    if (netAmount < 0) {
      return NextResponse.json({ error: "Discount cannot exceed the gross amount" }, { status: 400 });
    }

    // INVOICE increases the client's outstanding due; PAYMENT reduces it.
    const delta = input.transactionType === "INVOICE" ? netAmount : -netAmount;

    const [entry] = await prisma.$transaction([
      prisma.financialLedger.create({
        data: {
          clientAccountId: input.clientAccountId,
          orderId: input.transactionType === "INVOICE" ? input.orderId ?? null : null,
          transactionType: input.transactionType,
          grossAmount: input.transactionType === "INVOICE" ? input.grossAmount : netAmount,
          discountAmount: input.transactionType === "INVOICE" ? input.discountAmount : 0,
          netAmount,
          collectedById: input.transactionType === "PAYMENT" ? collectedById : null,
          isVerified,
          paymentMethod: input.transactionType === "PAYMENT" ? input.paymentMethod ?? null : null,
          paymentDate: input.transactionType === "PAYMENT" ? input.paymentDate ?? null : null,
          notes: input.notes ?? null,
        },
      }),
      prisma.clientAccount.update({
        where: { id: input.clientAccountId },
        data: { currentBalance: { increment: delta } },
      }),
    ]);

    return NextResponse.json(
      { entry, currentBalance: account.currentBalance + delta },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
