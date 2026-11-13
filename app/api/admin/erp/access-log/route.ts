import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";

/** Roles and access history, newest first (Super Admin only: "audit.view", locked). */

const parse = (s: string | null) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export async function GET(req: Request) {
  const auth = await authorize(req, "audit.view");
  if (auth.denied) return auth.denied;
  try {
    const rows = await prisma.accessAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({
      entries: rows.map((r) => ({
        id: r.id,
        action: r.action,
        roleKey: r.roleKey,
        targetUserId: r.targetUserId,
        before: parse(r.before),
        after: parse(r.after),
        performedBy: r.performedBy,
        performedByName: r.performedByName,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch the access log" }, { status: 500 });
  }
}
