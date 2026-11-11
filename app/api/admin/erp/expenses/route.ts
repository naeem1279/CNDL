import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FINANCE_ROLES, readSession, requireRole } from "@/lib/admin-auth";

const categoryEnum = z.enum(["RAW_MATERIAL", "LOGISTICS", "LAB_UTILITY", "MAINTENANCE", "OTHER"]);

const expenseCreateSchema = z.object({
  category: categoryEnum,
  title: z.string().trim().min(2).max(200),
  amount: z.coerce.number().positive(),
  voucherNo: z.string().trim().max(100).nullish(),
  notes: z.string().trim().max(1000).nullish(),
  expenseDate: z.coerce.date().optional(),
});

const expenseUpdateSchema = expenseCreateSchema.partial();

/** Best-effort actor identity for the audit trail. */
function performedBy(req: Request): string {
  const session = readSession(req);
  return session?.uid || session?.phone || "master";
}

/** Snapshot the pre-change expense row into ExpenseAuditLog. */
async function auditExpense(
  expenseId: string,
  action: "UPDATE" | "DELETE",
  original: unknown,
  actor: string
) {
  await prisma.expenseAuditLog.create({
    data: {
      expenseId,
      action,
      originalData: JSON.stringify(original),
      performedBy: actor,
    },
  });
}

export async function GET(req: Request) {
  const denied = await requireRole(req, FINANCE_ROLES);
  if (denied) return denied;
  try {
    const expenses = await prisma.dailyExpense.findMany({
      orderBy: { expenseDate: "desc" },
    });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthTotal = expenses
      .filter((e) => e.expenseDate >= monthStart && e.expenseDate < monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    return NextResponse.json({ expenses, monthTotal });
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireRole(req, ["ACCOUNTS", "SUPERADMIN"]);
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = expenseCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    const { expenseDate, ...rest } = parsed.data;
    const expense = await prisma.dailyExpense.create({
      data: { ...rest, expenseDate: expenseDate ?? new Date() },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await requireRole(req, ["SUPERADMIN"]);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Expense id required (?id=)" }, { status: 400 });
    }
    const existing = await prisma.dailyExpense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    const json = await req.json();
    const parsed = expenseUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    await auditExpense(id, "UPDATE", existing, performedBy(req));
    const { expenseDate, ...rest } = parsed.data;
    const expense = await prisma.dailyExpense.update({
      where: { id },
      data: { ...rest, ...(expenseDate !== undefined ? { expenseDate } : {}) },
    });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireRole(req, ["SUPERADMIN"]);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Expense id required (?id=)" }, { status: 400 });
    }
    const existing = await prisma.dailyExpense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    await auditExpense(id, "DELETE", existing, performedBy(req));
    await prisma.dailyExpense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
