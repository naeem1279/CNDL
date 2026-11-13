import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { firstIssueMessage } from "@/lib/validation";

const institutionTypeEnum = z.enum(["CHAMBER", "HOSPITAL", "PARTNER_LAB", "FREELANCE"]);

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const accountUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
  ownerName: z.string().trim().min(2, "Owner name must be at least 2 characters").max(150).optional(),
  phone: z.string().trim().min(6, "Phone must be at least 6 characters").max(30).optional(),
  email: z.preprocess(emptyToNull, z.string().trim().email("Invalid email").max(200).nullish()),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  institutionType: institutionTypeEnum.optional(),
  division: z.string().trim().min(2).max(30).optional(),
  district: z.preprocess(emptyToNull, z.string().trim().max(60).nullish()),
  assignedAgentId: z.preprocess(emptyToNull, z.string().trim().max(60).nullish()),
});

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission(req, "clients.edit");
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const json = await req.json();
    const parsed = accountUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    // Agent re-assignment must point at a real AGENT user.
    if (data.assignedAgentId) {
      const agent = await prisma.appUser.findFirst({
        where: { id: data.assignedAgentId, role: "AGENT" },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Assigned agent not found" }, { status: 400 });
      }
    }

    // Duplicate phone guard (excluding this account).
    if (data.phone) {
      const dup = await prisma.clientAccount.findFirst({
        where: { phone: data.phone, NOT: { id } },
        select: { name: true },
      });
      if (dup) {
        return NextResponse.json(
          { warning: "DUPLICATE_PHONE", existingName: dup.name },
          { status: 409 }
        );
      }
    }

    const account = await prisma.clientAccount.update({ where: { id }, data });
    return NextResponse.json(account);
  } catch {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission(req, "clients.delete");
  if (denied) return denied;
  try {
    const { id } = await ctx.params;

    // Safe-delete guard: refuse when financial history or orders reference the account.
    const ledgerCount = await prisma.financialLedger.count({ where: { clientAccountId: id } });
    if (ledgerCount > 0) {
      return NextResponse.json(
        { warning: "HAS_LEDGER", error: `Cannot delete — ${ledgerCount} ledger entr${ledgerCount === 1 ? "y" : "ies"} attached. Settle or archive instead.` },
        { status: 409 }
      );
    }
    const orderCount = await prisma.order.count({ where: { clientAccountId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        { warning: "HAS_ORDERS", error: `Cannot delete — ${orderCount} order${orderCount === 1 ? "" : "s"} linked to this account.` },
        { status: 409 }
      );
    }

    await prisma.clientAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
