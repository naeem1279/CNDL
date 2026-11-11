import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession } from "@/lib/admin-auth";
import { friendlyIssue } from "@/lib/validation";

const accountTypeEnum = z.enum(["CHAMBER", "PARTNER_LAB", "CHAIRMAN_PERSONAL"]);
const institutionTypeEnum = z.enum(["CHAMBER", "HOSPITAL", "PARTNER_LAB", "FREELANCE"]);

const accountCreateSchema = z.object({
  accountType: accountTypeEnum.default("CHAMBER"),
  name: z.string().trim().min(2).max(150),
  ownerName: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200).nullish(),
  address: z.string().trim().max(500).nullish(),
  institutionType: institutionTypeEnum.default("CHAMBER"),
  division: z.string().trim().min(2).max(30).default("DHAKA"),
  district: z.string().trim().max(60).nullish(),
  assignedAgentId: z.string().trim().max(60).nullish(),
  openingDue: z.coerce.number().min(0).default(0),
  allowDuplicate: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Phase 1 (2026-11-06): AGENT and other non-privileged roles receive ONLY
    // the accounts assigned to them — the full 104-account book with balances
    // no longer ships to field collectors.
    const privileged =
      session.role === "SUPERADMIN" ||
      session.role === "CHAIRMAN" ||
      session.role === "ACCOUNTS";
    const accounts = await prisma.clientAccount.findMany({
      where: privileged ? undefined : { assignedAgentId: session.uid },
      orderBy: { createdAt: "desc" },
    });
    // Resolve assigned agent names (assignedAgentId is a soft reference to AppUser).
    const agentIds = Array.from(
      new Set(accounts.map((a) => a.assignedAgentId).filter((v): v is string => Boolean(v)))
    );
    const agents = agentIds.length
      ? await prisma.appUser.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, name: true },
        })
      : [];
    const agentNames = new Map(agents.map((a) => [a.id, a.name]));
    const enriched = accounts.map((a) => ({
      ...a,
      assignedAgentName: a.assignedAgentId ? agentNames.get(a.assignedAgentId) ?? null : null,
    }));
    // Active field agents — powers assignment dropdowns for every admin role
    // (the /erp/users endpoint is SUPERADMIN-only, so it can't serve this).
    const agentList = await prisma.appUser.findMany({
      where: { role: "AGENT", status: "ACTIVE" },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ accounts: enriched, agents: agentList });
  } catch {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const json = await req.json();
    const parsed = accountCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const { allowDuplicate, openingDue, ...accountData } = parsed.data;

    // Week 1 fix (2026-11-11): an opening due is an INVOICE, and invoices are
    // SUPERADMIN/ACCOUNTS-only (same rule as /erp/ledger). Other roles may still
    // onboard an account, but only with a zero opening balance.
    if (openingDue > 0 && !["SUPERADMIN", "ACCOUNTS"].includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden — only SUPERADMIN or ACCOUNTS can set an opening due" },
        { status: 403 }
      );
    }

    // Duplicate phone guard — 409 with the clashing account unless explicitly overridden.
    const existing = await prisma.clientAccount.findFirst({
      where: { phone: accountData.phone },
      select: { name: true },
    });
    if (existing && !allowDuplicate) {
      return NextResponse.json(
        { warning: "DUPLICATE_PHONE", existingName: existing.name },
        { status: 409 }
      );
    }

    // Agent attribution must point at a real AGENT user.
    if (accountData.assignedAgentId) {
      const agent = await prisma.appUser.findFirst({
        where: { id: accountData.assignedAgentId, role: "AGENT" },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "Assigned agent not found" }, { status: 400 });
      }
    }

    if (openingDue > 0) {
      // Atomically create the account, its opening-balance INVOICE, and the due balance.
      const account = await prisma.$transaction(async (tx) => {
        const created = await tx.clientAccount.create({
          data: { ...accountData, currentBalance: openingDue },
        });
        await tx.financialLedger.create({
          data: {
            clientAccountId: created.id,
            transactionType: "INVOICE",
            grossAmount: openingDue,
            discountAmount: 0,
            netAmount: openingDue,
            notes: "Opening balance (backfilled)",
          },
        });
        return created;
      });
      return NextResponse.json(account, { status: 201 });
    }

    const account = await prisma.clientAccount.create({
      data: accountData,
    });
    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
