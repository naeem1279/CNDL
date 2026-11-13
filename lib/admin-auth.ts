import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Server-side only. ADMIN_SECRET MUST be provided via the environment
// (.env.local / PM2 env). No fallback constant — the process refuses to boot
// with missing or weak admin credentials (P0 fix 2026-11-05).
const ADMIN_SECRET_RAW = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET_RAW || ADMIN_SECRET_RAW.length < 32) {
  throw new Error(
    'ADMIN_SECRET is missing or too short (<32 chars) — refusing to start with insecure admin credentials. Set it in .env.local and restart.'
  );
}
export const ADMIN_SECRET: string = ADMIN_SECRET_RAW;

export const ADMIN_COOKIE = 'cndl_admin';

/**
 * Optional machine-to-machine token (Week 1 fix, 2026-11-11). The master login
 * password is no longer accepted as an API Bearer token; integrations must use
 * a separate ADMIN_API_TOKEN (>= 32 chars). Unset → Bearer auth is disabled.
 */
const ADMIN_API_TOKEN =
  process.env.ADMIN_API_TOKEN && process.env.ADMIN_API_TOKEN.length >= 32
    ? process.env.ADMIN_API_TOKEN
    : null;

/** Identifier that unlocks the master key (defaults to "admin"). */
export const MASTER_ADMIN_ID = (process.env.MASTER_ADMIN_ID || 'admin').toLowerCase();

export type SessionUser = {
  uid: string;
  name: string;
  phone: string;
  role: string;
};

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Master-key check (login as SUPERADMIN). */
export function verifyPassword(password: string): boolean {
  return safeEqual(password, ADMIN_SECRET);
}

/* ---------- AppUser password hashing (scrypt, no external deps) ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyUserPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const test = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== test.length) return false;
  return timingSafeEqual(expected, test);
}

/** Best-effort parse of AppUser.metadata JSON (stores { passwordHash }). */
export function parseMetadata(metadata: string | null | undefined): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/* ---------- Signed session tokens (carry the user's role) ---------- */

function signPayload(payload: string): string {
  return createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
}

/** Signed sessions expire after 8h (matches the login cookie maxAge). */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function issueSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({ ...user, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS })
  ).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

/**
 * Reads WHO the cookie or API token says this is. This is identity only, never authorization: the role in
 * the cookie can be stale, and suspension is not checked here. Authorization lives in lib/access.ts
 * (`requirePermission` / `authorize`), which reads the person's current role and permissions from the database.
 * - `Authorization: Bearer <ADMIN_API_TOKEN>` → SUPERADMIN (only if that env is set).
 * - Signed session cookie → the stored uid/name/phone (8h expiry).
 * The legacy never-expiring static cookie was removed on 2026-11-11.
 */
export function readSession(req: Request): SessionUser | null {
  const authHeader = req.headers.get('authorization') || '';
  if (ADMIN_API_TOKEN && authHeader.startsWith('Bearer ') && safeEqual(authHeader.slice(7), ADMIN_API_TOKEN)) {
    return { uid: '', name: 'API', phone: 'api', role: 'SUPERADMIN' };
  }

  const token = getCookie(req, ADMIN_COOKIE);
  if (!token) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!sig || !safeEqual(sig, signPayload(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.role !== 'string') return null;
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return {
      uid: typeof data.uid === 'string' ? data.uid : '',
      name: typeof data.name === 'string' ? data.name : 'User',
      phone: typeof data.phone === 'string' ? data.phone : '',
      role: data.role,
    };
  } catch {
    return null;
  }
}
