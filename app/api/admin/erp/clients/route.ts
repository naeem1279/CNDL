import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/access";
import { clientTypeOf, isChairmanChannel } from "@/lib/client-types";
import { compareClients, isDormant, isNewThisMonth, matchesClient, parseClientFilters, type ClientRowFacts } from "@/lib/clients-filters";

/**
 * Client accounts, one page at a time, with case activity per client.
 * Access: the whole book with "clients.view"; only the clients assigned to the person with
 * "clients.view_own". The account book is small (hundreds), so it is filtered and sorted here on
 * the server after one query, and only the requested page is sent.
 */
export async function GET(req: Request) {
  const auth = await authorize(req, ["clients.view", "clients.view_own"]);
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const f = parseClientFilters(new URL(req.url).searchParams);
    const seeAll = access.can("clients.view");
    const accounts = await prisma.clientAccount.findMany({ where: seeAll ? undefined : { assignedAgentId: access.uid } });
    const ids = accounts.map((a) => a.id);
    const activity = ids.length
      ? await prisma.order.groupBy({ by: ["clientAccountId"], where: { clientAccountId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } })
      : [];
    const act = new Map(activity.map((r) => [r.clientAccountId as string, { n: r._count._all, last: r._max.createdAt }]));

    const now = new Date();
    const rows = accounts.map((a) => {
      const x = act.get(a.id);
      return { ...a, type: clientTypeOf(a), chairmanChannel: isChairmanChannel(a), caseCount: x?.n ?? 0, lastCaseAt: x?.last ?? null } satisfies ClientRowFacts & Record<string, unknown>;
    });

    const matched = rows.filter((r) => matchesClient(r, f, now)).sort(compareClients(f));
    const total = matched.length;
    const pages = Math.max(1, Math.ceil(total / f.size));
    const page = Math.min(f.page, pages);
    const slice = matched.slice((page - 1) * f.size, page * f.size);

    const agentIds = [...new Set(slice.map((r) => r.assignedAgentId).filter((v): v is string => !!v))];
    const [named, agents] = await Promise.all([
      agentIds.length ? prisma.appUser.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } }) : Promise.resolve([]),
      prisma.appUser.findMany({ where: { role: "AGENT", status: "ACTIVE" }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" } }),
    ]);
    const agentName = new Map(named.map((a) => [a.id, a.name]));

    return NextResponse.json({
      clients: slice.map((r) => ({ ...r, assignedAgentName: r.assignedAgentId ? agentName.get(r.assignedAgentId) ?? null : null })),
      total,
      page,
      pages,
      size: f.size,
      agents: seeAll ? agents : [],
      // Counts over everything this person may see (not just the filtered set), for the summary strip.
      summary: {
        total: rows.length,
        newThisMonth: rows.filter((r) => isNewThisMonth(r, now)).length,
        dormant: rows.filter((r) => isDormant(r, now)).length,
        owing: rows.filter((r) => r.currentBalance > 0).length,
        totalDue: rows.reduce((s, r) => s + Math.max(0, r.currentBalance), 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
