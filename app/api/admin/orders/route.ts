import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { firstIssueMessage } from "@/lib/validation";

const SOURCE_ENUM = ["OFFLINE_RIDER", "PHONE", "WHATSAPP", "ONLINE"] as const;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const offlineOrderSchema = z.object({
  orderDate: z.coerce.date({ message: "Order date is required" }),
  deliveryDate: z.preprocess(emptyToNull, z.coerce.date().nullish()),
  orderSource: z.enum(SOURCE_ENUM).default("OFFLINE_RIDER"),
  // Client account link (preferred) or a manual walk-in entry
  clientAccountId: z.preprocess(emptyToNull, z.string().trim().nullish()),
  doctorName: z.string().trim().min(2, "Doctor name must be at least 2 characters").max(150),
  clinicName: z.preprocess(emptyToNull, z.string().trim().max(200).nullish()),
  phone: z.preprocess(
    emptyToNull,
    z.string().trim().min(10, "Phone must be at least 10 characters").max(30).nullish()
  ),
  patientName: z.preprocess(emptyToNull, z.string().trim().max(150).nullish()),
  toothNo: z.preprocess(emptyToNull, z.string().trim().max(100).nullish()),
  shade: z.preprocess(emptyToNull, z.string().trim().max(50).nullish()),
  productName: z.string().trim().min(2, "Select a product").max(200),
  units: z.coerce.number().int().min(1, "Units must be at least 1").max(200).default(1),
  billedAmount: z.preprocess(emptyToNull, z.coerce.number().min(0, "Billed amount cannot be negative").nullish()),
  addToLedger: z.coerce.boolean().default(false),
  // Agent attribution & commission
  agentId: z.preprocess(emptyToNull, z.string().trim().max(60).nullish()),
  isDirect: z.coerce.boolean().optional(),
  commissionAmount: z.preprocess(emptyToNull, z.coerce.number().min(0).nullish()),
  // Initial status — allows historical intake straight to DISPATCHED
  status: z.preprocess(emptyToNull, z.string().trim().max(40).nullish()),
});

/** Canonical production statuses; DISPATCHED short-circuits the milling queue.
 *  Phase 1 (2026-11-06): Designing aligned to 35 — matches the admin UI's
 *  PROGRESS_BY_STATUS and the PATCH endpoint's canonical map. */
const STATUS_META: Record<string, { status: string; progress: number }> = {
  RECEIVED: { status: "Received", progress: 10 },
  DESIGNING: { status: "Designing", progress: 35 },
  MILLING: { status: "Milling", progress: 60 },
  "QUALITY CONTROL": { status: "Quality Control", progress: 85 },
  DISPATCHED: { status: "Dispatched", progress: 100 },
};

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

/** CSPRNG 8-hex Case ID — mirrors the hardened public /api/order generator. */
function newCaseId(): string {
  return "CNDL-" + randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Creates the order with collision-safe Case IDs: the CSPRNG space (16^8 ≈
 * 4.3 billion) makes clashes practically impossible, and a P2002 unique-constraint
 * hit simply regenerates and retries.
 */
async function createOrderWithCaseId(data: Omit<Prisma.OrderUncheckedCreateInput, "caseId">) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.order.create({ data: { ...data, caseId: newCaseId() } });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002" &&
        attempt < 4
      ) {
        continue; // caseId collision — regenerate
      }
      throw err;
    }
  }
  throw new Error("Failed to allocate a unique Case ID");
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): offline intake needs the "Record new cases" permission — a field
  // AGENT can no longer self-attribute cases with arbitrary commissions.
  const denied = await requirePermission(req, "cases.create");
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = offlineOrderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const input = parsed.data;

    // Resolve the client account (if linked) — it supplies defaults and the ledger target.
    let account = null;
    if (input.clientAccountId) {
      account = await prisma.clientAccount.findUnique({ where: { id: input.clientAccountId } });
      if (!account) {
        return NextResponse.json({ error: "Client account not found" }, { status: 404 });
      }
    }

    if (input.addToLedger && !account) {
      return NextResponse.json(
        { error: "Link a client account to add this case to the due ledger" },
        { status: 400 }
      );
    }
    if (input.addToLedger && (!input.billedAmount || input.billedAmount <= 0)) {
      return NextResponse.json(
        { error: "Enter the billed amount to add this case to the due ledger" },
        { status: 400 }
      );
    }

    // Initial status — historical cases may go straight to Dispatched (progress 100).
    const statusKey = (input.status || "RECEIVED").toUpperCase();
    const statusMeta = STATUS_META[statusKey];
    if (!statusMeta) {
      return NextResponse.json(
        { error: "Invalid status — use Received, Designing, Milling, Quality Control or Dispatched" },
        { status: 400 }
      );
    }

    // Agent attribution: explicit agentId wins; otherwise inherit the account's
    // assigned agent. An attributed order is not direct; direct orders have no agent.
    let agentId = input.agentId ?? null;
    if (!agentId && account?.assignedAgentId) {
      agentId = account.assignedAgentId;
    }
    if (agentId) {
      const agent = await prisma.appUser.findFirst({
        where: { id: agentId, role: "AGENT" },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Attributed agent not found" }, { status: 400 });
      }
    }
    const isDirect = input.isDirect ?? !agentId;
    const commissionAmount = isDirect ? 0 : input.commissionAmount ?? 0;

    // productType uses the `Key: value | ...` convention parsed by the case tracker & admin UI.
    const work = input.units > 1 ? `${input.productName} (x${input.units})` : input.productName;
    const segments: string[] = [];
    if (input.patientName) segments.push(`Patient: ${input.patientName}`);
    if (input.toothNo) segments.push(`Teeth: ${input.toothNo}`);
    if (input.shade) segments.push(`Shade: ${input.shade}`);
    segments.push(work);
    const productType = segments.join(" | ");

    const order = await createOrderWithCaseId({
      customerName: input.doctorName,
      phone: input.phone ?? account?.phone ?? "—",
      clinicName: account?.name ?? input.clinicName ?? null,
      patientName: input.patientName ?? null,
      toothNo: input.toothNo ?? null,
      shade: input.shade ?? null,
      billedAmount: input.billedAmount ?? null,
      orderSource: input.orderSource,
      orderDate: input.orderDate,
      deliveryDate: input.deliveryDate ?? null,
      productType,
      quantity: input.units,
      status: statusMeta.status,
      progress: statusMeta.progress,
      agentId,
      clientAccountId: account?.id ?? null,
      isDirect,
      commissionAmount,
    });
    const caseId = order.caseId;

    // Auto-link the billed amount to the client's due ledger as an INVOICE.
    // Triggered if addToLedger is explicitly selected OR if the order is intake straight to DISPATCHED.
    let ledgerEntry = null;
    const isDispatched = statusKey === "DISPATCHED";

    if ((input.addToLedger || isDispatched) && account && input.billedAmount && input.billedAmount > 0) {
      const existing = await prisma.financialLedger.findFirst({
        where: { orderId: caseId, transactionType: "INVOICE" },
        select: { id: true },
      });

      if (!existing) {
        const effectiveDate = input.orderDate ? new Date(input.orderDate) : new Date();
        const targetAccountId = account.id;
        const billedVal = input.billedAmount;
        ledgerEntry = await prisma.$transaction(async (tx) => {
          const entry = await tx.financialLedger.create({
            data: {
              clientAccountId: targetAccountId,
              orderId: caseId,
              transactionType: "INVOICE",
              grossAmount: billedVal,
              discountAmount: 0,
              netAmount: billedVal,
              createdAt: effectiveDate,
              notes: isDispatched
                ? `Auto-billed on Dispatch: ${caseId} (${productType || 'Restoration'})`
                : `Offline case ${caseId} (${input.orderSource})`,
            },
          });
          await tx.clientAccount.update({
            where: { id: targetAccountId },
            data: { currentBalance: { increment: billedVal } },
          });
          return entry;
        });
      }
    }

    return NextResponse.json({ order, ledgerEntry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
