import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { friendlyIssue } from "@/lib/validation";

const capexCreateSchema = z.object({
  machineName: z.string().trim().min(2).max(200),
  purchaseCost: z.coerce.number().min(0),
  purchaseDate: z.coerce.date().nullish(),
  status: z.string().trim().max(30).default("OPERATIONAL"),
  notes: z.string().trim().max(1000).nullish(),
});

const capexUpdateSchema = z.object({
  machineName: z.string().trim().min(2).max(200).optional(),
  purchaseCost: z.coerce.number().min(0).optional(),
  purchaseDate: z.coerce.date().nullish(),
  status: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(1000).nullish(),
});

export async function GET(req: Request) {
  const denied = await requirePermission(req, "capex.view");
  if (denied) return denied;
  try {
    const assets = await prisma.capExAsset.findMany({
      orderBy: { createdAt: "desc" },
    });
    const totalValuation = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
    return NextResponse.json({ assets, totalValuation });
  } catch {
    return NextResponse.json({ error: "Failed to fetch capex assets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requirePermission(req, "capex.manage");
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = capexCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const asset = await prisma.capExAsset.create({
      data: parsed.data,
    });
    return NextResponse.json(asset, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create capex asset" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await requirePermission(req, "capex.manage");
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Asset id required (?id=)" }, { status: 400 });
    }
    const existing = await prisma.capExAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const json = await req.json();
    const parsed = capexUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const { purchaseDate, ...rest } = parsed.data;
    const asset = await prisma.capExAsset.update({
      where: { id },
      data: { ...rest, ...(purchaseDate !== undefined ? { purchaseDate } : {}) },
    });
    return NextResponse.json(asset);
  } catch {
    return NextResponse.json({ error: "Failed to update capex asset" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requirePermission(req, "capex.delete");
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Asset id required (?id=)" }, { status: 400 });
    }
    const existing = await prisma.capExAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    await prisma.capExAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete capex asset" }, { status: 500 });
  }
}
