import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession, requireRole } from "@/lib/admin-auth";
import { friendlyIssue } from "@/lib/validation";

const testimonialSchema = z.object({
  doctorName: z.string().trim().min(3).max(120),
  clinicName: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(120).default("Dhaka, Bangladesh"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  comment: z.string().trim().min(10).max(1500),
});

export async function GET(req: Request) {
  if (!(await readActiveSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ testimonials });
  } catch {
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): public content writes — SUPERADMIN/CHAIRMAN only.
  const denied = await requireRole(req, ["SUPERADMIN", "CHAIRMAN"]);
  if (denied) return denied;
  try {
    const parsed = testimonialSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const testimonial = await prisma.testimonial.create({ data: parsed.data });
    return NextResponse.json(testimonial, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
