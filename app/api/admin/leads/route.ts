import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireRole } from "@/lib/admin-auth";

/** Only SUPERADMIN has the Dental Leads section (ROLE_TABS), so only it may read or edit leads. */
const LEAD_ROLES = ["SUPERADMIN"];

/**
 * /api/admin/leads — Dhaka Dental Leads (CNDL) panel data source.
 * Reads/writes brand-cndl records from the naeemmia-leads registry
 * (/var/lib/naeemmia-leads/prospects.jsonl). LOCAL-ONLY by rule: CNDL leads are
 * never pushed to GHL, so this route is the single view into them. No Prisma.
 *
 * 2026-11-12: a PATCH used to rewrite the file with only the CNDL records it had
 * read, deleting every other brand's prospect from the shared registry. Writes
 * now replace just the edited line and keep all other lines as they were.
 *
 * Phase 1 (2026-11-06):
 * - All read-modify-write cycles are serialized through an in-process mutex
 *   (`leadsMutex`) so two concurrent PATCHes can no longer drop each other's
 *   updates (previously: read file → mutate → rewrite whole file, unlocked).
 * - Status/note changes append to a timestamped `activityLog` array (capped at
 *   50 entries) instead of only overwriting `last_activity`; `visitNotes` and
 *   `last_activity` are still written for backward compatibility with the
 *   Telegram lead engine and any older consumers.
 */

const LEADS_FILE = process.env.CNDL_LEADS_FILE || "/var/lib/naeemmia-leads/prospects.jsonl";
const ALLOWED_STATUS = ["new", "visited", "sample_given", "client"] as const;

/** Activity history cap per lead (oldest entries are dropped beyond this). */
const ACTIVITY_LOG_CAP = 50;

type Lead = Record<string, unknown> & { key: string };

/**
 * In-process write mutex. pm2 runs this app in fork mode (single Node process),
 * so a chained promise is a sufficient critical section: every queued closure
 * runs strictly after the previous one resolves, and callers await the chain.
 */
let leadsMutex: Promise<unknown> = Promise.resolve();
function withLeadsLock<T>(fn: () => T): Promise<T> {
  const run = leadsMutex.then(() => fn());
  // Keep the chain alive even if a closure rejects.
  leadsMutex = run.catch(() => undefined);
  return run;
}

function isCndl(p: Record<string, unknown>): boolean {
  const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
  return tags.includes("brand-cndl") || p.suggestedBrand === "cndl" || p.brand_context === "cndl";
}

/**
 * Reads the whole shared registry. `lines` keeps every original line (other
 * brands' prospects and any malformed lines) so a write-back never drops them;
 * `cndl` holds the CNDL records with their line numbers.
 */
function readRegistry(): { lines: string[]; cndl: { line: number; rec: Lead }[] } {
  let raw = "";
  try {
    raw = fs.readFileSync(LEADS_FILE, "utf8");
  } catch {
    return { lines: [], cndl: [] };
  }
  const lines = raw.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const cndl: { line: number; rec: Lead }[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    try {
      const p = JSON.parse(t) as Record<string, unknown>;
      if (isCndl(p) && typeof p.key === "string") cndl.push({ line: i, rec: p as Lead });
    } catch {
      /* not ours to touch: kept verbatim */
    }
  });
  return { lines, cndl };
}

function readLeads(): Lead[] {
  return readRegistry().cndl.map((c) => c.rec);
}

/** Rewrites the registry with every line preserved (atomic rename). */
function writeLinesAtomic(lines: string[]): void {
  const dir = path.dirname(LEADS_FILE);
  const tmp = LEADS_FILE + ".tmp_cndl_panel";
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tmp, lines.join("\n") + "\n");
  fs.renameSync(tmp, LEADS_FILE);
}

/** Public shape for the admin UI (no raw geo/OSM internals). */
function toPublic(p: Lead) {
  const act = (p.last_activity && typeof p.last_activity === "object" ? p.last_activity : {}) as Record<string, unknown>;
  const log = Array.isArray(p.activityLog) ? (p.activityLog as Record<string, unknown>[]) : [];
  return {
    key: p.key,
    name: typeof p.name === "string" ? p.name : "",
    contactName: typeof p.contactName === "string" ? p.contactName : "",
    area: typeof p.area === "string" ? p.area : "",
    address: typeof p.address === "string" ? p.address : "",
    phone: typeof p.phone === "string" ? p.phone : "",
    email: typeof p.email === "string" ? p.email : "",
    facebook: typeof p.facebook === "string" ? p.facebook : "",
    website: typeof p.website === "string" ? p.website : "",
    status: typeof p.status === "string" ? p.status : "new",
    visitNotes: typeof p.visitNotes === "string" ? p.visitNotes : "",
    lastActivityText: typeof act.text === "string" ? act.text : "",
    lastActivityAt: typeof act.at === "string" ? act.at : typeof p.updatedAt === "string" ? p.updatedAt : "",
    activityLog: log.slice(-ACTIVITY_LOG_CAP).map((e) => ({
      text: typeof e.text === "string" ? e.text : "",
      at: typeof e.at === "string" ? e.at : "",
    })),
  };
}

export async function GET(req: Request) {
  const denied = await requireRole(req, LEAD_ROLES);
  if (denied) return denied;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "").trim();
  let rows = readLeads();
  if (status && (ALLOWED_STATUS as readonly string[]).includes(status)) {
    rows = rows.filter((r) => r.status === status);
  }
  if (q) {
    const hay = (r: Lead) =>
      [r.name, r.area, r.address, r.contactName, r.phone].filter((v) => typeof v === "string").join(" ").toLowerCase();
    rows = rows.filter((r) => hay(r).includes(q));
  }
  rows.sort((a, b) => String(b.discoveredAt || "").localeCompare(String(a.discoveredAt || "")));
  return NextResponse.json({ leads: rows.map(toPublic), total: rows.length });
}

export async function PATCH(req: Request) {
  const denied = await requireRole(req, LEAD_ROLES);
  if (denied) return denied;
  let body: { key?: string; status?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const key = String(body.key || "");
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  const status = body.status ? String(body.status).trim() : "";
  if (status && !(ALLOWED_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED_STATUS.join(", ")}` }, { status: 400 });
  }
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  if (!status && body.notes === undefined) {
    return NextResponse.json({ error: "Nothing to update — provide status and/or notes" }, { status: 400 });
  }

  // Serialize the entire read-modify-write cycle so concurrent PATCHes queue
  // instead of racing on the shared JSONL file.
  try {
    const lead = await withLeadsLock(() => {
      const { lines, cndl } = readRegistry();
      const hit = cndl.find((c) => c.rec.key === key);
      if (!hit) return null;

      const rec = hit.rec as Record<string, unknown>;
      const now = new Date().toISOString();

      // Append-only history: keep previous notes visible with timestamps.
      const log = Array.isArray(rec.activityLog) ? [...(rec.activityLog as Record<string, unknown>[])] : [];
      if (status) log.push({ text: `স্ট্যাটস: ${status}`, at: now });
      if (body.notes !== undefined && notes) log.push({ text: `ভিজিট নোট: ${notes}`, at: now });
      rec.activityLog = log.slice(-ACTIVITY_LOG_CAP);

      if (status) rec.status = status;
      if (body.notes !== undefined) rec.visitNotes = notes;
      rec.updatedAt = now;
      rec.last_activity = {
        text:
          (status ? `স্ট্যাটস: ${status}` : "") +
          (status && notes ? " — " : "") +
          (notes || (!status ? "নোট আপডেট" : "")),
        at: now,
      };
      // Replace only this lead's line; every other line is written back as read.
      lines[hit.line] = JSON.stringify(rec);
      writeLinesAtomic(lines);
      return rec as Lead;
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ ok: true, lead: toPublic(lead) });
  } catch (err) {
    return NextResponse.json({ error: `Write failed: ${String(err).slice(0, 120)}` }, { status: 500 });
  }
}
