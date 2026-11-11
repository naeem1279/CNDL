import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession, requireRole } from "@/lib/admin-auth";

/**
 * Phase 1 RBAC hardening (2026-11-06):
 * - GET is role-scoped: AGENT (and any non-privileged role) receives only the
 *   orders attributed to them and NO inquiry messages; SUPERADMIN / CHAIRMAN /
 *   ACCOUNTS receive everything.
 * - PATCH validates status/progress with zod and is restricted to
 *   SUPERADMIN / ACCOUNTS / CHAIRMAN — an AGENT can no longer move cases or
 *   trigger dispatch auto-invoicing.
 * - DELETE is strictly SUPERADMIN.
 */

/** Roles that see the full operations dataset. */
const PRIVILEGED_ROLES = new Set(["SUPERADMIN", "CHAIRMAN", "ACCOUNTS"]);

/**
 * Canonical lifecycle statuses (Phase 1 spec) UNION the legacy production
 * vocabulary the current UI pills still send (Milling / Quality Control /
 * PENDING rows in the DB). Anything outside this map is rejected with 400.
 */
const PATCH_STATUS_MAP: Record<string, { status: string; progress: number }> = {
  PENDING: { status: "PENDING", progress: 10 },
  RECEIVED: { status: "Received", progress: 10 },
  DESIGNING: { status: "Designing", progress: 35 },
  PRODUCTION: { status: "Production", progress: 50 },
  MILLING: { status: "Milling", progress: 60 },
  QC: { status: "QC", progress: 85 },
  "QUALITY CONTROL": { status: "Quality Control", progress: 85 },
  DISPATCHED: { status: "Dispatched", progress: 100 },
  DELIVERED: { status: "Delivered", progress: 100 },
  CANCELLED: { status: "Cancelled", progress: 0 },
};

const patchSchema = z.object({
  id: z.string().trim().min(1, "Case id is required"),
  status: z.string().trim().max(40),
  progress: z.coerce.number().int().min(0).max(100),
});

export async function GET(req: Request) {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const scoped = !PRIVILEGED_ROLES.has(session.role);
    const orders = await prisma.order.findMany({
      where: scoped ? { agentId: session.uid } : undefined,
      orderBy: { createdAt: "desc" },
    });
    const messages = scoped
      ? [] // inquiries are never sent to field agents
      : await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ orders, messages });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const denied = await requireRole(req, ["SUPERADMIN", "ACCOUNTS", "CHAIRMAN"]);
  if (denied) return denied;
  try {
    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    const { id, progress } = parsed.data;

    const statusMeta = PATCH_STATUS_MAP[parsed.data.status.toUpperCase()];
    if (!statusMeta) {
      return NextResponse.json(
        {
          error:
            "Invalid status — use Pending, Received, Designing, Production, Milling, QC / Quality Control, Dispatched, Delivered or Cancelled",
        },
        { status: 400 }
      );
    }

    // Explicit progress (when the client slider differs from the stage default) wins;
    // otherwise the canonical stage progress is applied.
    const explicitProgress = progress !== statusMeta.progress;
    const nextProgress = explicitProgress ? progress : statusMeta.progress;

    const updated = await prisma.order.update({
      where: { id },
      data: { status: statusMeta.status, progress: nextProgress },
    });

    // Automated Lifecycle Invoicing on Order Dispatch:
    // When an order is moved to Dispatched, check if it has a linked client account and billed amount.
    // If no INVOICE has been created for this order, atomically post to FinancialLedger and update ClientAccount.
    if (
      updated.status?.toUpperCase() === "DISPATCHED" &&
      updated.clientAccountId &&
      updated.billedAmount &&
      updated.billedAmount > 0
    ) {
      const existingInvoice = await prisma.financialLedger.findFirst({
        where: {
          orderId: updated.caseId,
          transactionType: "INVOICE",
        },
        select: { id: true },
      });

      if (!existingInvoice) {
        const invoiceDate = updated.orderDate ? new Date(updated.orderDate) : updated.createdAt;
        await prisma.$transaction(async (tx) => {
          await tx.financialLedger.create({
            data: {
              clientAccountId: updated.clientAccountId!,
              orderId: updated.caseId,
              transactionType: "INVOICE",
              grossAmount: updated.billedAmount!,
              discountAmount: 0,
              netAmount: updated.billedAmount!,
              notes: `Auto-billed on Dispatch: ${updated.caseId} (${updated.productType || 'Restoration'})`,
              createdAt: invoiceDate,
            },
          });
          await tx.clientAccount.update({
            where: { id: updated.clientAccountId! },
            data: { currentBalance: { increment: updated.billedAmount! } },
          });
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Order status update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireRole(req, ["SUPERADMIN"]);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing case id" }, { status: 400 });
    }
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
