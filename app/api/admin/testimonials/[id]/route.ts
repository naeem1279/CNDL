import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { friendlyIssue } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const testimonialUpdateSchema = z.object({
  doctorName: z.string().trim().min(3).max(120).optional(),
  clinicName: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(10).max(1500).optional(),
  avatar: z.string().trim().max(300).regex(/^\/[^\s]*$/, "Avatar must be a root-relative path").nullish(),
});

export async function PUT(req: Request, { params }: Params) {
  // Phase 1 (2026-11-06): public content writes — SUPERADMIN/CHAIRMAN only.
  const denied = await requireRole(req, ["SUPERADMIN", "CHAIRMAN"]);
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = testimonialUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const data = { ...parsed.data };
    if (data.avatar === undefined) delete data.avatar; // don't overwrite with null unless explicitly sent
    const updated = await prisma.testimonial.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const denied = await requireRole(req, ["SUPERADMIN", "CHAIRMAN"]);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }
}
