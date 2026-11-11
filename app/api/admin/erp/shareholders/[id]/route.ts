import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FINANCE_ROLES, requireRole } from "@/lib/admin-auth";

const TOTAL_SHARES = 100;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const shareholderUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
  phone: z.preprocess(emptyToNull, z.string().trim().min(6, "Phone must be at least 6 characters").max(30).nullish()),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  sharesCount: z.coerce
    .number({ message: "Shares must be a number" })
    .int("Shares must be a whole number")
    .min(1, "Shares must be between 1 and 100")
    .max(TOTAL_SHARES, `Shares must be between 1 and ${TOTAL_SHARES}`)
    .optional(),
  paymentDetails: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
});

function firstZodMessage(err: unknown): string {
  const e = err as { issues?: { message?: string }[]; errors?: { message?: string }[] };
  return e?.issues?.[0]?.message ?? e?.errors?.[0]?.message ?? "Validation failed";
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, FINANCE_ROLES);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const json = await req.json();
    const parsed = shareholderUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    if (data.sharesCount !== undefined) {
      const [existing, agg] = await Promise.all([
        prisma.shareholder.findUnique({ where: { id } }),
        prisma.shareholder.aggregate({ _sum: { sharesCount: true } }),
      ]);
      if (!existing) {
        return NextResponse.json({ error: "Shareholder not found" }, { status: 404 });
      }
      const others = (agg._sum.sharesCount ?? 0) - existing.sharesCount;
      if (others + data.sharesCount > TOTAL_SHARES) {
        return NextResponse.json(
          { error: `Only ${Math.max(0, TOTAL_SHARES - others)} of ${TOTAL_SHARES} shares are available (held by others)` },
          { status: 400 }
        );
      }
    }

    const shareholder = await prisma.shareholder.update({ where: { id }, data });
    return NextResponse.json(shareholder);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A shareholder with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update shareholder" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireRole(req, FINANCE_ROLES);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    await prisma.shareholder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Shareholder not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete shareholder" }, { status: 500 });
  }
}
