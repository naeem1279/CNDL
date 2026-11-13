import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requirePermission(req, "overview.view");
  if (denied) return denied;

  try {
    const now = new Date();
    // Asia/Dhaka is UTC+6
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);

    const bdYear = bdNow.getUTCFullYear();
    const bdMonth = bdNow.getUTCMonth();
    const bdDate = bdNow.getUTCDate();

    const todayStart = new Date(Date.UTC(bdYear, bdMonth, bdDate, 0, 0, 0) - BD_OFFSET_MS);
    const todayEnd = new Date(Date.UTC(bdYear, bdMonth, bdDate, 23, 59, 59, 999) - BD_OFFSET_MS);
    const monthStart = new Date(Date.UTC(bdYear, bdMonth, 1, 0, 0, 0) - BD_OFFSET_MS);
    const nextMonthStart = new Date(Date.UTC(bdYear, bdMonth + 1, 1, 0, 0, 0) - BD_OFFSET_MS);

    const [
      todayInvoiceAgg,
      monthInvoiceAgg,
      todayCashAgg,
      monthCashAgg,
      todayExpenseAgg,
      monthExpenseAgg,
      marketDuesAgg,
    ] = await Promise.all([
      prisma.financialLedger.aggregate({
        _sum: { netAmount: true },
        where: {
          transactionType: "INVOICE",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.financialLedger.aggregate({
        _sum: { netAmount: true },
        where: {
          transactionType: "INVOICE",
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
      }),
      prisma.financialLedger.aggregate({
        _sum: { netAmount: true },
        where: {
          transactionType: "PAYMENT",
          OR: [
            { paymentDate: { gte: todayStart, lte: todayEnd } },
            { paymentDate: null, createdAt: { gte: todayStart, lte: todayEnd } },
          ],
        },
      }),
      prisma.financialLedger.aggregate({
        _sum: { netAmount: true },
        where: {
          transactionType: "PAYMENT",
          OR: [
            { paymentDate: { gte: monthStart, lt: nextMonthStart } },
            { paymentDate: null, createdAt: { gte: monthStart, lt: nextMonthStart } },
          ],
        },
      }),
      prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: { expenseDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.dailyExpense.aggregate({
        _sum: { amount: true },
        where: { expenseDate: { gte: monthStart, lt: nextMonthStart } },
      }),
      prisma.clientAccount.aggregate({
        _sum: { currentBalance: true },
        where: { currentBalance: { gt: 0 } },
      }),
    ]);

    const todayInvoicedSales = Math.round((todayInvoiceAgg._sum.netAmount || 0) * 100) / 100;
    const monthInvoicedSales = Math.round((monthInvoiceAgg._sum.netAmount || 0) * 100) / 100;
    const todayCashCollected = Math.round((todayCashAgg._sum.netAmount || 0) * 100) / 100;
    const monthCashCollected = Math.round((monthCashAgg._sum.netAmount || 0) * 100) / 100;
    const todayExpenses = Math.round((todayExpenseAgg._sum.amount || 0) * 100) / 100;
    const monthExpenses = Math.round((monthExpenseAgg._sum.amount || 0) * 100) / 100;
    const totalMarketDues = Math.round((marketDuesAgg._sum.currentBalance || 0) * 100) / 100;

    const todayNewDuesAdded = Math.round((todayInvoicedSales - todayCashCollected) * 100) / 100;
    const monthNewDuesAdded = Math.round((monthInvoicedSales - monthCashCollected) * 100) / 100;

    return NextResponse.json({
      success: true,
      metrics: {
        todayInvoicedSales,
        monthInvoicedSales,
        todayCashCollected,
        monthCashCollected,
        todayNewDuesAdded,
        monthNewDuesAdded,
        todayExpenses,
        monthExpenses,
        totalMarketDues,
      },
      timeframes: {
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: nextMonthStart.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Overview metrics error:", error);
    return NextResponse.json({ error: "Failed to fetch overview metrics" }, { status: 500 });
  }
}
