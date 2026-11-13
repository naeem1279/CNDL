import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { friendlyIssue } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const serviceUpdateSchema = z.object({
  category: z.string().trim().min(2).max(100).optional(),
  name: z.string().trim().min(2).max(150).optional(),
  nameBn: z.string().trim().max(150).nullish(),
  description: z.string().trim().max(1000).nullish(),
  specs: z.string().trim().max(300).nullish(),
  imageUrl: z.string().trim().max(500).nullish(),
  turnaroundDays: z.coerce.number().int().min(1).max(30).optional(),
  warrantyYears: z.coerce.number().int().min(0).max(30).optional(),
  basePrice: z.string().trim().max(100).nullish(),
  isActive: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

export async function PUT(req: Request, { params }: Params) {
  // Phase 1 (2026-11-06): catalogue edits drive the public website — SUPERADMIN only.
  const denied = await requirePermission(req, "products.manage");
  if (denied) return denied;
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = serviceUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const updated = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Service not found or update failed" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const denied = await requirePermission(req, "products.delete");
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service not found or delete failed" }, { status: 404 });
  }
}
