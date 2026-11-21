import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { DUES_READ, canTouchAccount } from "@/lib/dues-access";

/** Mark a promise kept or broken (or close it). Same access as the follow-ups list. */
const schema = z.object({ status: z.enum(["OPEN", "KEPT", "BROKEN", "DONE"]) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, DUES_READ);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Status must be OPEN, KEPT, BROKEN or DONE" }, { status: 400 });
    const item = await prisma.duesFollowUp.findUnique({ where: { id } });
    if (!item || !(await canTouchAccount(access, item.clientAccountId))) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    const updated = await prisma.duesFollowUp.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json({ followUp: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update the follow-up" }, { status: 500 });
  }
}
