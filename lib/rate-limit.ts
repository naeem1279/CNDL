/**
 * Minimal in-memory fixed-window rate limiter for public API routes.
 * Single-process Node server (pm2 fork mode) — module state is shared and
 * sufficient. Behind nginx, the real client IP arrives via X-Forwarded-For.
 */

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000; // crude overflow guard against memory bloat

/**
 * Week 1 fix (2026-11-11): the FIRST X-Forwarded-For entry is whatever the
 * client sent, so rotating fake IPs bypassed every limit. nginx's
 * `proxy_add_x_forwarded_for` APPENDS the real peer address, so the LAST entry
 * is the one our own proxy wrote and cannot be forged by the client.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true when the request is allowed, false when the caller has
 * exceeded `max` requests per `windowMs` for their IP. `scope` isolates
 * budgets per endpoint (tracker traffic must not exhaust the contact budget).
 */
export function rateLimit(
  req: Request,
  opts?: { scope?: string; max?: number; windowMs?: number; key?: string }
): boolean {
  const scope = opts?.scope ?? "global";
  const max = opts?.max ?? 5;
  const windowMs = opts?.windowMs ?? 60_000;
  // `key` overrides the IP bucket (e.g. per-account login lockout).
  const key = `${scope}:${opts?.key ?? clientIp(req)}`;
  const now = Date.now();

  if (buckets.size > MAX_KEYS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
