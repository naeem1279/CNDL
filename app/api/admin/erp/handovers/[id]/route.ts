import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { handoverIds } from "@/lib/handover";

/**
 * The office receives (or disputes) a cash handover ("ledger.verify").
 * receive → every collection in it is marked verified, in one transaction.
 * dispute → nothing is verified; the collections count as cash in hand again.
 * Nobody can receive their own handover (the same rule as not verifying one's own cash).
 */
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("receive"), note: z.string().trim().max(300).nullish() }),
  z.object({ action: z.literal("dispute"), note: z.string().trim().min(3, "Say what is wrong (at least 3 characters)").max(300) }),
]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "ledger.verify");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    const h = await prisma.cashHandover.findUnique({ where: { id } });
    if (!h) return NextResponse.json({ error: "Handover not found" }, { status: 404 });
    if (h.agentId === access.uid) return NextResponse.json({ error: "You cannot receive your own handover" }, { status: 403 });
    if (h.status !== "SUBMITTED") return NextResponse.json({ error: `This handover was already ${h.status.toLowerCase()}` }, { status: 409 });

    const d = parsed.data;
    const stamp = { receivedBy: access.uid || access.phone || "master", receivedByName: access.name, receivedNote: d.note ?? null, receivedAt: new Date() };
    if (d.action === "dispute") {
      const res = await prisma.cashHandover.updateMany({ where: { id, status: "SUBMITTED" }, data: { status: "DISPUTED", ...stamp } });
      if (res.count === 0) return NextResponse.json({ error: "This handover was just decided by someone else" }, { status: 409 });
    } else {
      const ids = handoverIds(h.collectionIds);
      const done = await prisma.$transaction(async (tx) => {
        const res = await tx.cashHandover.updateMany({ where: { id, status: "SUBMITTED" }, data: { status: "RECEIVED", ...stamp } });
        if (res.count === 0) return false;
        // Only this agent's own, still-unverified collections (anything else in the list is ignored).
        await tx.financialLedger.updateMany({ where: { id: { in: ids }, transactionType: "PAYMENT", collectedById: h.agentId, isVerified: false }, data: { isVerified: true } });
        return true;
      });
      if (!done) return NextResponse.json({ error: "This handover was just decided by someone else" }, { status: 409 });
    }
    const updated = await prisma.cashHandover.findUnique({ where: { id } });
    return NextResponse.json({ handover: { ...updated, collectionIds: handoverIds(updated!.collectionIds) } });
  } catch {
    return NextResponse.json({ error: "Failed to update the handover" }, { status: 500 });
  }
}
