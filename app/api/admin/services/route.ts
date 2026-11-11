import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession, requireRole } from "@/lib/admin-auth";
import { friendlyIssue } from "@/lib/validation";

const serviceCreateSchema = z.object({
  category: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(150),
  nameBn: z.string().trim().max(150).nullish(),
  description: z.string().trim().max(1000).nullish(),
  specs: z.string().trim().max(300).nullish(),
  imageUrl: z.string().trim().max(500).nullish(),
  turnaroundDays: z.coerce.number().int().min(1).max(30).default(3),
  warrantyYears: z.coerce.number().int().min(0).max(30).default(5),
  basePrice: z.string().trim().max(100).nullish(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export async function GET(req: Request) {
  if (!(await readActiveSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const services = await prisma.service.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): catalogue writes drive the public website —
  // SUPERADMIN only.
  const denied = await requireRole(req, ["SUPERADMIN"]);
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = serviceCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const service = await prisma.service.create({
      data: parsed.data,
    });
    return NextResponse.json(service, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
