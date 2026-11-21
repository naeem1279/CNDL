import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { cashInHand, handoverIds } from "@/lib/handover";

/**
 * Cash handovers: a field agent hands the cash they collected to the office in one go.
 * GET  → people who verify collections ("ledger.verify") see every handover; agents see their own.
 * POST ("ledger.collect_own" or "ledger.collect") → hand over ALL cash currently in hand (collections
 *      the agent recorded that are not verified and not already in a waiting handover).
 * Receiving or disputing: PATCH /api/admin/erp/handovers/[id] ("ledger.verify").
 */
const createSchema = z.object({ note: z.string().trim().max(300).nullish() });

export async function GET(req: Request) {
  const auth = await authorize(req, ["ledger.verify", "ledger.collect_own", "ledger.collect"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const status = new URL(req.url).searchParams.get("status");
    const where = {
      ...(access.can("ledger.verify") ? {} : { agentId: access.uid }),
      ...(status && ["SUBMITTED", "RECEIVED", "DISPUTED"].includes(status) ? { status } : {}),
    };
    const items = await prisma.cashHandover.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ handovers: items.map((h) => ({ ...h, collectionIds: handoverIds(h.collectionIds) })) });
  } catch {
    return NextResponse.json({ error: "Failed to load handovers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req, ["ledger.collect_own", "ledger.collect"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const parsed = createSchema.safeParse((await req.json().catch(() => ({}))) ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Note is too long" }, { status: 400 });
    if (!access.uid) return NextResponse.json({ error: "Only a team member can hand over cash" }, { status: 400 });
    const hand = await cashInHand(access.uid);
    if (hand.rows.length === 0) return NextResponse.json({ error: "No cash in hand to hand over" }, { status: 400 });
    const item = await prisma.cashHandover.create({
      data: {
        agentId: access.uid,
        agentName: access.name,
        amount: hand.amount,
        collectionIds: JSON.stringify(hand.rows.map((r) => r.id)),
        note: parsed.data.note ?? null,
      },
    });
    return NextResponse.json({ handover: { ...item, collectionIds: hand.rows.map((r) => r.id) } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record the handover" }, { status: 500 });
  }
}
