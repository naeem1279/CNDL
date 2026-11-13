import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";

/** Latest 50 expense audit entries (pre-change snapshots) — SUPERADMIN only. */
export async function GET(req: Request) {
  const denied = await requirePermission(req, "expenses.audit");
  if (denied) return denied;
  try {
    const entries = await prisma.expenseAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
