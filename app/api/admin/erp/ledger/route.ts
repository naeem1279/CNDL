import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { friendlyIssue } from "@/lib/validation";

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
  const auth = await authorize(req, ["ledger.view", "ledger.view_own"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const privileged = access.can("ledger.view");
    if (privileged) {
      // Phase 1 (2026-11-06): the arbitrary take:500 cap is removed — aging and
      // today/month revenue are computed client-side from this list and used to
      // drift when old payments scrolled out of the window.
      const entries = await prisma.financialLedger.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ entries });
    }
    // "ledger.view_own" (field agents): only ledger activity of the accounts assigned
    // to them, or collections they personally recorded.
    const assigned = await prisma.clientAccount.findMany({
      where: { assignedAgentId: access.uid },
      select: { id: true },
    });
    const accountIds = assigned.map((a) => a.id);
    const entries = await prisma.financialLedger.findMany({
      where: {
        OR: [
          { clientAccountId: { in: accountIds } },
          { collectedById: access.uid },
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
  const auth = await authorize(req, ["ledger.invoice", "ledger.collect", "ledger.collect_own"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const json = await req.json();
    const parsed = ledgerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Phase 1 financial-integrity rules (2026-11-06), now permission-based:
    // - INVOICE (billing/due creation) needs "ledger.invoice".
    // - A PAYMENT needs "ledger.collect" (any client) or "ledger.collect_own". With only the
    //   "own" permission (field agents) it must be against an account assigned to them, and
    //   collectedById is FORCED to their own id — no attributing collections to colleagues.
    const anyClient = access.can("ledger.collect");
    const ownOnly = !anyClient && access.can("ledger.collect_own");
    if (input.transactionType === "INVOICE" && !access.can("ledger.invoice")) {
      return NextResponse.json(
        { error: ownOnly ? "Forbidden — agents can only record collections" : "Forbidden — recording invoices needs its own permission" },
        { status: 403 }
      );
    }
    if (input.transactionType === "PAYMENT" && !anyClient && !ownOnly) {
      return NextResponse.json({ error: "Forbidden — recording collections needs its own permission" }, { status: 403 });
    }
    let collectedById = input.transactionType === "PAYMENT" ? input.collectedById ?? null : null;
    if (ownOnly) {
      const account = await prisma.clientAccount.findUnique({
        where: { id: input.clientAccountId },
        select: { assignedAgentId: true },
      });
      if (!account || account.assignedAgentId !== access.uid) {
        return NextResponse.json(
          { error: "Forbidden — agents can only record collections for their assigned accounts" },
          { status: 403 }
        );
      }
      collectedById = access.uid;
    }
    // Week 1 fix (2026-11-11): a collector with only the "own" permission can never verify
    // their own cash — verification is the accounts team's sign-off.
    const isVerified = input.transactionType === "PAYMENT" && anyClient ? input.isVerified : false;

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
