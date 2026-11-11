import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/erp/ledger/:id — mark a collection (PAYMENT) as verified.
 *
 * Verification is the accounts team's sign-off that the cash, bank transfer or
 * bKash actually arrived. Rules:
 * - SUPERADMIN or ACCOUNTS only.
 * - PAYMENT entries only; verifying is one-way (there is no un-verify).
 * - Nobody verifies a collection they recorded as the collector (same rule as
 *   POST /api/admin/erp/ledger, which never lets an agent self-verify).
 * Amounts and balances are never touched here.
 */
const VERIFY_ROLES = ["SUPERADMIN", "ACCOUNTS"];
const patchSchema = z.object({ isVerified: z.literal(true) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await readActiveSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!VERIFY_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden — only SUPERADMIN or ACCOUNTS can verify collections" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send { isVerified: true } to verify a collection" }, { status: 400 });
  }
  try {
    const { id } = await ctx.params;
    const entry = await prisma.financialLedger.findUnique({
      where: { id },
      select: { id: true, transactionType: true, isVerified: true, collectedById: true },
    });
    if (!entry) return NextResponse.json({ error: "Ledger entry not found" }, { status: 404 });
    if (entry.transactionType !== "PAYMENT") {
      return NextResponse.json({ error: "Only collections can be verified" }, { status: 400 });
    }
    if (session.uid && entry.collectedById === session.uid) {
      return NextResponse.json(
        { error: "You collected this payment, so someone else has to verify it" },
        { status: 403 }
      );
    }
    if (entry.isVerified) return NextResponse.json({ ok: true, entry, alreadyVerified: true });
    const updated = await prisma.financialLedger.update({ where: { id }, data: { isVerified: true } });
    return NextResponse.json({ ok: true, entry: updated });
  } catch {
    return NextResponse.json({ error: "Failed to verify the collection" }, { status: 500 });
  }
}
