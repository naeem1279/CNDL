import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { DUES_READ, canTouchAccount, visibleAccountIds } from "@/lib/dues-access";
import { firstIssueMessage } from "@/lib/validation";

/**
 * Follow-ups while chasing dues: notes ("called, will pay Friday") and promises to pay (amount + date).
 * GET ?account=<id>  → that client's follow-ups, newest first.
 * GET ?open=1        → every open promise this person may see (for the "call today" list).
 * POST               → add a note or a promise.
 * Access: "ledger.view" (any client) or "ledger.view_own" (only clients assigned to the person).
 */

const createSchema = z
  .object({
    clientAccountId: z.string().trim().min(1).max(64),
    kind: z.enum(["NOTE", "PROMISE"]),
    note: z.string().trim().min(2, "Write a short note (at least 2 characters)").max(1000),
    promiseAmount: z.coerce.number().positive("Enter the promised amount").max(100000000).nullish(),
    promiseDate: z.coerce.date().nullish(),
  })
  .refine((v) => v.kind !== "PROMISE" || (v.promiseAmount && v.promiseDate), { message: "A promise needs an amount and a date", path: ["promiseDate"] });

export async function GET(req: Request) {
  const auth = await authorize(req, DUES_READ);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const sp = new URL(req.url).searchParams;
    const account = sp.get("account");
    if (account) {
      if (!(await canTouchAccount(access, account))) return NextResponse.json({ error: "Client not found" }, { status: 404 });
      const items = await prisma.duesFollowUp.findMany({ where: { clientAccountId: account }, orderBy: { createdAt: "desc" }, take: 100 });
      return NextResponse.json({ followUps: items });
    }
    if (sp.get("open") === "1") {
      const ids = await visibleAccountIds(access);
      const items = await prisma.duesFollowUp.findMany({
        where: { kind: "PROMISE", status: "OPEN", ...(ids ? { clientAccountId: { in: ids } } : {}) },
        orderBy: { promiseDate: "asc" },
        take: 500,
      });
      // Latest follow-up per client, so the "call today" list can skip clients someone just talked to.
      const latest = await prisma.duesFollowUp.groupBy({
        by: ["clientAccountId"],
        where: ids ? { clientAccountId: { in: ids } } : {},
        _max: { createdAt: true },
      });
      return NextResponse.json({ promises: items, lastContact: Object.fromEntries(latest.map((l) => [l.clientAccountId, l._max.createdAt])) });
    }
    return NextResponse.json({ error: "Ask for ?account=<id> or ?open=1" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to load follow-ups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req, DUES_READ);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
    const d = parsed.data;
    if (!(await canTouchAccount(access, d.clientAccountId))) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const item = await prisma.duesFollowUp.create({
      data: {
        clientAccountId: d.clientAccountId,
        kind: d.kind,
        note: d.note,
        promiseAmount: d.kind === "PROMISE" ? d.promiseAmount ?? null : null,
        promiseDate: d.kind === "PROMISE" ? d.promiseDate ?? null : null,
        status: d.kind === "PROMISE" ? "OPEN" : "DONE",
        createdBy: access.uid || access.phone || "master",
        createdByName: access.name,
      },
    });
    return NextResponse.json({ followUp: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save the follow-up" }, { status: 500 });
  }
}
