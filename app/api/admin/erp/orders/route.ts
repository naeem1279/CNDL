import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { NOT_IN_LAB, bdTodayStart, parseOrderFilters } from "@/lib/orders-filters";
import { buildOrderBy, buildOrderWhere } from "@/lib/orders-where";

/**
 * Lab cases, one page at a time (server-side filtering, sorting and paging).
 * Access: all cases with "cases.view", only the person's own with "cases.view_own". Amounts and
 * commission are removed without "cases.view_money". The CSV export is a separate endpoint.
 */
export async function GET(req: Request) {
  const auth = await authorize(req, ["cases.view", "cases.view_own"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const f = parseOrderFilters(new URL(req.url).searchParams);
    const seeAll = access.can("cases.view");
    const canSeeMoney = access.can("cases.view_money");
    const where = await buildOrderWhere(f, { agentId: seeAll ? undefined : access.uid, canSeeMoney });

    const total = await prisma.order.count({ where });
    const pages = Math.max(1, Math.ceil(total / f.size));
    const page = Math.min(f.page, pages);

    const open = { AND: [where, { NOT: { status: { in: NOT_IN_LAB } } }] };
    const [rows, openCount, lateCount, money] = await Promise.all([
      prisma.order.findMany({ where, orderBy: buildOrderBy(f, canSeeMoney), skip: (page - 1) * f.size, take: f.size }),
      prisma.order.count({ where: open }),
      prisma.order.count({ where: { AND: [open, { deliveryDate: { lt: bdTodayStart() } }] } }),
      canSeeMoney ? prisma.order.aggregate({ where, _sum: { billedAmount: true, commissionAmount: true } }) : Promise.resolve(null),
    ]);

    const orders = canSeeMoney ? rows : rows.map((o) => ({ ...o, billedAmount: null, commissionAmount: 0 }));
    return NextResponse.json({
      orders,
      total,
      page,
      pages,
      size: f.size,
      summary: {
        count: total,
        open: openCount,
        late: lateCount,
        billed: money ? money._sum.billedAmount ?? 0 : null,
        commission: money ? money._sum.commissionAmount ?? 0 : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}
