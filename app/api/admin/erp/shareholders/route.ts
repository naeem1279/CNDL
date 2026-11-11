import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FINANCE_ROLES, requireRole } from "@/lib/admin-auth";
import { firstIssueMessage } from "@/lib/validation";

const TOTAL_SHARES = 100;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const shareholderCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  phone: z.preprocess(emptyToNull, z.string().trim().min(6, "Phone must be at least 6 characters").max(30).nullish()),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  sharesCount: z.coerce
    .number({ message: "Shares must be a number" })
    .int("Shares must be a whole number")
    .min(1, "Shares must be between 1 and 100")
    .max(TOTAL_SHARES, `Shares must be between 1 and ${TOTAL_SHARES}`),
  paymentDetails: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
});

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

export async function GET(req: Request) {
  const denied = await requireRole(req, FINANCE_ROLES);
  if (denied) return denied;
  try {
    const shareholders = await prisma.shareholder.findMany({
      orderBy: { createdAt: "asc" },
    });
    const totalShares = shareholders.reduce((sum, s) => sum + (s.sharesCount || 0), 0);
    return NextResponse.json({
      shareholders,
      totalShares,
      unallocated: Math.max(0, TOTAL_SHARES - totalShares),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch shareholders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireRole(req, FINANCE_ROLES);
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = shareholderCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const agg = await prisma.shareholder.aggregate({ _sum: { sharesCount: true } });
    const allocated = agg._sum.sharesCount ?? 0;
    if (allocated + data.sharesCount > TOTAL_SHARES) {
      return NextResponse.json(
        { error: `Only ${Math.max(0, TOTAL_SHARES - allocated)} of ${TOTAL_SHARES} shares remain unallocated` },
        { status: 400 }
      );
    }

    const shareholder = await prisma.shareholder.create({ data });
    return NextResponse.json(shareholder, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create shareholder" }, { status: 500 });
  }
}
