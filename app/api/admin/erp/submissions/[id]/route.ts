import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { AWAITING_APPROVAL } from "@/lib/orders-filters";
import { firstIssueMessage } from "@/lib/validation";

/**
 * Approve or reject a case an agent submitted ("cases.create").
 * approve → the case enters the lab as "Received" with the confirmed amount and commission.
 * reject  → "Cancelled", with the reason kept in the case notes for the agent to see.
 * Only cases still awaiting approval can be decided (a second decision answers 409).
 */
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    billedAmount: z.preprocess(emptyToNull, z.coerce.number().min(0).max(10000000).nullish()),
    commissionAmount: z.preprocess(emptyToNull, z.coerce.number().min(0).max(10000000).nullish()),
    deliveryDate: z.preprocess(emptyToNull, z.coerce.date().nullish()),
  }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "Say why (at least 3 characters)").max(300) }),
]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "cases.create");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (order.status !== AWAITING_APPROVAL) return NextResponse.json({ error: `${order.caseId} was already decided (${order.status})` }, { status: 409 });

    const d = parsed.data;
    const by = access.name || "Admin";
    // updateMany with the status in the filter: two people deciding at once cannot both win.
    const data =
      d.action === "approve"
        ? {
            status: "Received",
            progress: 10,
            billedAmount: d.billedAmount === undefined ? order.billedAmount : d.billedAmount,
            commissionAmount: d.commissionAmount ?? 0,
            deliveryDate: d.deliveryDate === undefined ? order.deliveryDate : d.deliveryDate,
            orderDate: new Date(),
          }
        : { status: "Cancelled", progress: 0, productType: `${order.productType ?? ""} | Notes: Not approved by ${by} — ${d.reason}`.replace(/^ \| /, "") };
    const res = await prisma.order.updateMany({ where: { id, status: AWAITING_APPROVAL }, data });
    if (res.count === 0) return NextResponse.json({ error: `${order.caseId} was just decided by someone else` }, { status: 409 });
    const updated = await prisma.order.findUnique({ where: { id } });
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Failed to decide on the case" }, { status: 500 });
  }
}
