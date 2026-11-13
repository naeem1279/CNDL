import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { friendlyIssue } from "@/lib/validation";
import { sharesField } from "@/lib/shares";

const dividendCreateSchema = z.object({
  shareholderName: z.string().trim().min(2).max(150),
  sharesCount: sharesField.default(1),
  amountPaid: z.coerce.number().positive(),
  payoutMonth: z.string().trim().min(3).max(20),
  paymentMethod: z.string().trim().max(100).nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

export async function GET(req: Request) {
  const denied = await requirePermission(req, "shareholders.view");
  if (denied) return denied;
  try {
    const dividends = await prisma.shareholderPayout.findMany({
      orderBy: { createdAt: "desc" },
    });
    const totalPaid = dividends.reduce((sum, d) => sum + d.amountPaid, 0);
    return NextResponse.json({ dividends, totalPaid });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dividends" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requirePermission(req, "shareholders.payout");
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = dividendCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const payout = await prisma.shareholderPayout.create({
      data: parsed.data,
    });
    return NextResponse.json(payout, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record dividend payout" }, { status: 500 });
  }
}
