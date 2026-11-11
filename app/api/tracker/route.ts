import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Public case tracker — P0 data-leak fix (2026-11-05).
 * SECURITY: responses are STRICTLY field-whitelisted. Never expose financial
 * (billedAmount, commissionAmount), contact (phone, email, address) or
 * internal-ERP (agentId, clientAccountId, orderSource) fields here.
 */
const PUBLIC_ORDER_FIELDS = {
  id: true,
  caseId: true,
  customerName: true,
  productType: true,
  quantity: true,
  status: true,
  progress: true,
  deliveryDate: true,
  updatedAt: true,
} as const;

/**
 * Week 1 privacy fix (2026-11-11): `productType` is a "Work | Key: value | ..."
 * string that also carries the patient's name, free-text clinical notes and
 * uploaded file names. Those segments are stripped before anything leaves this
 * public endpoint; only the restoration line, teeth, shade and trial/insertion
 * dates remain (what the tracker page displays).
 */
const PRIVATE_SEGMENT = /^(Patient|Notes|Files)\s*:/i;

type PublicOrder = { productType: string | null } & Record<string, unknown>;

function scrub<T extends PublicOrder>(order: T): T {
  if (!order.productType) return order;
  const kept = order.productType
    .split(" | ")
    .filter((seg) => seg.trim() && !PRIVATE_SEGMENT.test(seg.trim()));
  return { ...order, productType: kept.length ? kept.join(" | ") : null };
}

export async function GET(req: Request) {
  if (!rateLimit(req, { scope: "tracker", max: 20, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim().slice(0, 80);

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  try {
    // Exact Case ID → single case (legacy behavior).
    const byCaseId = await prisma.order.findFirst({
      where: { caseId: query.toUpperCase() },
      select: PUBLIC_ORDER_FIELDS,
    });
    if (byCaseId) return NextResponse.json(scrub(byCaseId));

    // Phone-like query (10+ digits) → normalize to the 10-digit local suffix and
    // return every matching case, newest first. Works against numbers stored as
    // 01…, +880…, 880… since the suffix is contained in all of them.
    const digits = query.replace(/\D/g, "");
    if (digits.length >= 10) {
      const suffix = digits.slice(-10);
      const cases = await prisma.order.findMany({
        where: { phone: { contains: suffix } },
        orderBy: { createdAt: "desc" },
        select: PUBLIC_ORDER_FIELDS,
      });
      if (cases.length === 0) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }
      return NextResponse.json({ cases: cases.map(scrub) });
    }

    // Legacy exact-email lookup.
    const byEmail = await prisma.order.findFirst({
      where: { email: query },
      select: PUBLIC_ORDER_FIELDS,
    });
    if (byEmail) return NextResponse.json(scrub(byEmail));

    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
