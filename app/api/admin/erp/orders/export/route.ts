import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accessLogData, authorize } from "@/lib/access";
import { CATEGORY_LABEL, MAX_EXPORT_ROWS, categoryOf, filtersToQuery, parseOrderFilters, toCsv } from "@/lib/orders-filters";
import { buildOrderBy, buildOrderWhere } from "@/lib/orders-where";

/**
 * CSV export of lab cases. SUPER ADMIN ONLY: it needs "exports.run", a locked permission that no
 * other role can ever be given (so Chairman, Accounts and everyone else get 403 here whatever the
 * Roles screen says). It honours the same filters and sort as the list, ignores paging, includes
 * every column and writes an audit record of who exported what.
 */

const HEADER = [
  "Case ID", "Received (BD date)", "Delivery date", "Stage", "Clinic / doctor", "Customer", "Phone", "Patient", "Work",
  "Teeth", "Shade", "Category", "Source", "Client account", "Agent", "Billed (BDT)", "Commission (BDT)", "Invoiced",
];

const bdDate = (d: Date | null) => (d ? new Date(d.getTime() + 6 * 3600000).toISOString().slice(0, 10) : "");

/** Pulls the labelled parts back out of the stored work description ("Work | Patient: x | Teeth: y | Shade: z"). */
function clinical(productType: string | null) {
  const out = { patient: "", work: "", teeth: "", shade: "" };
  const work: string[] = [];
  for (const seg of (productType || "").split(" | ")) {
    const m = seg.match(/^(Patient|Teeth|Shade|Notes|Trial|Insertion):\s*([\s\S]*)$/);
    if (m) {
      const k = m[1].toLowerCase();
      if (k === "patient" || k === "teeth" || k === "shade") out[k] = m[2];
    } else if (seg) work.push(seg);
  }
  out.work = work.join(" | ");
  return out;
}

export async function GET(req: Request) {
  const auth = await authorize(req, "exports.run");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const f = parseOrderFilters(new URL(req.url).searchParams);
    const where = await buildOrderWhere(f, { canSeeMoney: true });
    const total = await prisma.order.count({ where });
    if (total > MAX_EXPORT_ROWS) {
      return NextResponse.json({ error: `That is ${total} cases; narrow the filters to ${MAX_EXPORT_ROWS} or fewer and export again.` }, { status: 413 });
    }
    const [rows, accounts, agents, invoiced] = await Promise.all([
      prisma.order.findMany({ where, orderBy: buildOrderBy(f, true) }),
      prisma.clientAccount.findMany({ select: { id: true, name: true } }),
      prisma.appUser.findMany({ where: { role: "AGENT" }, select: { id: true, name: true } }),
      prisma.financialLedger.findMany({ where: { transactionType: "INVOICE", orderId: { not: null } }, select: { orderId: true }, distinct: ["orderId"] }),
    ]);
    const account = new Map(accounts.map((a) => [a.id, a.name]));
    const agent = new Map(agents.map((a) => [a.id, a.name]));
    const invoicedIds = new Set(invoiced.map((r) => r.orderId));

    const csv = toCsv(
      HEADER,
      rows.map((o) => {
        const c = clinical(o.productType);
        return [
          o.caseId, bdDate(o.createdAt), bdDate(o.deliveryDate), o.status, o.clinicName, o.customerName, o.phone,
          c.patient || o.patientName, c.work, c.teeth || o.toothNo, c.shade || o.shade, CATEGORY_LABEL[categoryOf(o.productType)],
          o.orderSource, o.clientAccountId ? account.get(o.clientAccountId) ?? "" : "", o.agentId ? agent.get(o.agentId) ?? "" : "",
          o.billedAmount ?? "", o.commissionAmount, invoicedIds.has(o.caseId) ? "Yes" : "No",
        ];
      })
    );

    await prisma.accessAuditLog.create({
      data: accessLogData(access, { action: "EXPORT_ORDERS", roleKey: null, before: null, after: { filters: filtersToQuery(f, { withPaging: false }) || "(none)", rows: rows.length } }),
    });

    const day = bdDate(new Date());
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cndl-cases-${day}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export the cases" }, { status: 500 });
  }
}
