import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { createOrderWithCaseId } from "@/lib/order-create";
import { AWAITING_APPROVAL } from "@/lib/orders-filters";
import { firstIssueMessage } from "@/lib/validation";

/**
 * Cases submitted by field agents, waiting for approval.
 * POST ("cases.submit"): an agent submits a case for one of THEIR OWN clients. It is stored as
 *   "Awaiting approval" (not in the lab, no invoice, no commission) and credited to the agent.
 * GET  ("cases.create"): everything awaiting approval, oldest first, for the people who approve.
 * Approve / reject: PATCH /api/admin/erp/submissions/[id].
 */

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const submitSchema = z.object({
  clientAccountId: z.string().trim().min(1, "Choose the client").max(64),
  doctorName: z.preprocess(emptyToNull, z.string().trim().min(2).max(150).nullish()),
  patientName: z.preprocess(emptyToNull, z.string().trim().max(150).nullish()),
  toothNo: z.preprocess(emptyToNull, z.string().trim().max(100).nullish()),
  shade: z.preprocess(emptyToNull, z.string().trim().max(50).nullish()),
  productName: z.string().trim().min(2, "Write what work is needed").max(200),
  units: z.coerce.number().int().min(1).max(200).default(1),
  /** The price the agent quoted; the approver confirms or changes it. */
  quotedAmount: z.preprocess(emptyToNull, z.coerce.number().min(0).max(10000000).nullish()),
  deliveryDate: z.preprocess(emptyToNull, z.coerce.date().nullish()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
});

export async function POST(req: Request) {
  const auth = await authorize(req, "cases.submit");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const parsed = submitSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
    const d = parsed.data;
    const account = await prisma.clientAccount.findUnique({ where: { id: d.clientAccountId } });
    // Only one's own clients (anyone else's answers 404 so ids cannot be probed).
    if (!account || account.assignedAgentId !== access.uid) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const work = d.units > 1 ? `${d.productName} (x${d.units})` : d.productName;
    const parts: string[] = [];
    if (d.patientName) parts.push(`Patient: ${d.patientName}`);
    if (d.toothNo) parts.push(`Teeth: ${d.toothNo}`);
    if (d.shade) parts.push(`Shade: ${d.shade}`);
    parts.push(work);
    if (d.notes) parts.push(`Notes: ${d.notes}`);

    const order = await createOrderWithCaseId({
      customerName: d.doctorName ?? account.ownerName,
      phone: account.phone,
      clinicName: account.name,
      patientName: d.patientName ?? null,
      toothNo: d.toothNo ?? null,
      shade: d.shade ?? null,
      billedAmount: d.quotedAmount ?? null,
      orderSource: "OFFLINE_RIDER",
      orderDate: new Date(),
      deliveryDate: d.deliveryDate ?? null,
      productType: parts.join(" | "),
      quantity: d.units,
      status: AWAITING_APPROVAL,
      progress: 0,
      agentId: access.uid,
      clientAccountId: account.id,
      isDirect: false,
      commissionAmount: 0,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit the case" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await authorize(req, "cases.create");
  if (auth.denied) return auth.denied;
  try {
    const orders = await prisma.order.findMany({ where: { status: AWAITING_APPROVAL }, orderBy: { createdAt: "asc" }, take: 200 });
    const agentIds = [...new Set(orders.map((o) => o.agentId).filter((v): v is string => !!v))];
    const agents = agentIds.length ? await prisma.appUser.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } }) : [];
    const name = new Map(agents.map((a) => [a.id, a.name]));
    return NextResponse.json({ submissions: orders.map((o) => ({ ...o, agentName: o.agentId ? name.get(o.agentId) ?? null : null })) });
  } catch {
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
