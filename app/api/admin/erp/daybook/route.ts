import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { bdDayRange, bdToday, parseDay, shiftDay } from "@/lib/daybook";
import { CATEGORIES, STATUS_ALIASES, categoryOf } from "@/lib/orders-filters";

/**
 * Day book for one Bangladesh calendar day (default today), with the day before for comparison.
 * Money: collections (by the date the money was received), expenses (by expense date), invoices and
 * discounts (by their ledger date). Cases: received that day (by when they were logged), and
 * dispatched / delivered / cancelled that day from the stage history (OrderStatusEvent), which only
 * exists from the day that history was switched on; `stageHistorySince` says from when.
 * Access: "overview.view" (the same people who see the Overview figures).
 */

async function dayFigures(ymd: string) {
  const { start, end } = bdDayRange(ymd);
  const inDay = { gte: start, lt: end };
  const [payments, expenses, invoices, discounts, received, events] = await Promise.all([
    prisma.financialLedger.findMany({
      where: { transactionType: "PAYMENT", OR: [{ paymentDate: inDay }, { paymentDate: null, createdAt: inDay }] },
      select: { netAmount: true, isVerified: true, paymentMethod: true },
    }),
    prisma.dailyExpense.findMany({ where: { expenseDate: inDay }, select: { amount: true, category: true } }),
    prisma.financialLedger.findMany({ where: { transactionType: "INVOICE", createdAt: inDay }, select: { netAmount: true, orderId: true } }),
    prisma.financialLedger.aggregate({ where: { transactionType: "DISCOUNT_OVERRIDE", createdAt: inDay }, _sum: { netAmount: true } }),
    prisma.order.findMany({ where: { createdAt: inDay }, select: { caseId: true, productType: true, billedAmount: true } }),
    prisma.orderStatusEvent.findMany({ where: { createdAt: inDay }, select: { orderId: true, toStatus: true } }),
  ]);

  const sum = (xs: { netAmount?: number; amount?: number }[]) => xs.reduce((s, x) => s + (x.netAmount ?? x.amount ?? 0), 0);
  const collected = sum(payments);
  const spent = sum(expenses);
  const invoiced = sum(invoices);
  const discount = discounts._sum.netAmount ?? 0;

  const byMethod: Record<string, number> = {};
  for (const p of payments) byMethod[p.paymentMethod || "Other"] = (byMethod[p.paymentMethod || "Other"] ?? 0) + p.netAmount;
  const byExpense: Record<string, number> = {};
  for (const e of expenses) byExpense[e.category] = (byExpense[e.category] ?? 0) + e.amount;

  // Distinct cases that reached a stage that day (a case moved twice still counts once).
  const reached = (stage: string) => new Set(events.filter((e) => (STATUS_ALIASES[stage] ?? [stage]).includes(e.toStatus)).map((e) => e.orderId)).size;

  // Work categories: cases received that day, and the value invoiced that day, by type of work.
  const invoicedCaseIds = invoices.map((i) => i.orderId).filter((v): v is string => !!v);
  const invoicedOrders = invoicedCaseIds.length
    ? await prisma.order.findMany({ where: { caseId: { in: invoicedCaseIds } }, select: { caseId: true, productType: true } })
    : [];
  const catOfCase = new Map(invoicedOrders.map((o) => [o.caseId, categoryOf(o.productType)]));
  const keys = [...CATEGORIES.map((c) => c.key), "other"];
  const categories = keys.map((key) => ({
    key,
    received: received.filter((o) => categoryOf(o.productType) === key).length,
    invoiced: invoices.filter((i) => (i.orderId ? catOfCase.get(i.orderId) ?? "other" : "other") === key).reduce((s, i) => s + i.netAmount, 0),
  }));

  return {
    date: ymd,
    money: {
      collected,
      collections: payments.length,
      unverified: payments.filter((p) => !p.isVerified).reduce((s, p) => s + p.netAmount, 0),
      expenses: spent,
      expenseCount: expenses.length,
      netCash: collected - spent,
      invoiced,
      invoices: invoices.length,
      discount,
      // What clients owe went up (positive) or down (negative) by this much that day.
      duesChange: invoiced - collected - discount,
      byMethod,
      byExpense,
    },
    cases: {
      received: received.length,
      dispatched: reached("Dispatched"),
      delivered: reached("Delivered"),
      cancelled: reached("Cancelled"),
      stageMoves: events.length,
    },
    categories,
  };
}

export async function GET(req: Request) {
  const auth = await authorize(req, "overview.view");
  if (auth.denied) return auth.denied;
  try {
    const today = bdToday();
    const asked = parseDay(new URL(req.url).searchParams.get("date"));
    const date = asked && asked <= today ? asked : today;
    const [day, previous, first] = await Promise.all([
      dayFigures(date),
      dayFigures(shiftDay(date, -1)),
      prisma.orderStatusEvent.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);
    return NextResponse.json({ today, day, previous, stageHistorySince: first?.createdAt ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to build the day book" }, { status: 500 });
  }
}
