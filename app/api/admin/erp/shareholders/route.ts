import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { firstIssueMessage } from "@/lib/validation";
import { TOTAL_SHARES, formatShares, sharesField, sumShares, toHundredths, unallocatedShares } from "@/lib/shares";

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const shareholderCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  phone: z.preprocess(emptyToNull, z.string().trim().min(6, "Phone must be at least 6 characters").max(30).nullish()),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  sharesCount: sharesField,
  paymentDetails: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(1000).nullish()),
});

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

export async function GET(req: Request) {
  const denied = await requirePermission(req, "shareholders.view");
  if (denied) return denied;
  try {
    const shareholders = await prisma.shareholder.findMany({
      orderBy: { createdAt: "asc" },
    });
    const totalShares = sumShares(shareholders.map((s) => s.sharesCount));
    return NextResponse.json({
      shareholders,
      totalShares,
      unallocated: unallocatedShares(totalShares),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch shareholders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requirePermission(req, "shareholders.manage");
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = shareholderCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;

    const holdings = await prisma.shareholder.findMany({ select: { sharesCount: true } });
    const allocated = sumShares(holdings.map((h) => h.sharesCount));
    if (toHundredths(allocated) + toHundredths(data.sharesCount) > toHundredths(TOTAL_SHARES)) {
      return NextResponse.json(
        { error: `Only ${formatShares(unallocatedShares(allocated))} of ${TOTAL_SHARES} shares remain unallocated` },
        { status: 400 }
      );
    }

    const shareholder = await prisma.shareholder.create({ data });
    return NextResponse.json(shareholder, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create shareholder" }, { status: 500 });
  }
}
