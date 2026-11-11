import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        category: true,
        name: true,
        nameBn: true,
        description: true,
        specs: true,
        imageUrl: true,
        turnaroundDays: true,
        warrantyYears: true,
        basePrice: true,
      },
    });
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
