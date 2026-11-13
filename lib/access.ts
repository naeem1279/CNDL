/**
 * Server-side access control (the authority). Routes call `requirePermission(req, 'key')`; nothing on the
 * client is trusted.
 *
 * - The person's role and its permissions are read from the database on EVERY request, so a change a Super
 *   Admin makes applies immediately, without anyone signing in again. The cookie only proves who they are.
 * - SUPERADMIN (and the env-held master / API-token sessions) always hold every permission, defined in code.
 * - Locked permissions (lib/permissions.ts) are stripped from every other role even if the database says
 *   otherwise.
 * - Anything unexpected (unknown role, unreadable row) resolves to NO permissions, never to more.
 * - The built-in roles are created in the database lazily, the first time they are needed. Until then (or if
 *   the table is not there yet) the defaults in code apply, so deploying this before the schema is pushed
 *   cannot lock anyone out.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/admin-auth';
import {
  ALL_PERMISSION_KEYS,
  BUILTIN_ROLES,
  SUPERADMIN_KEY,
  builtInRole,
  sanitizePermissions,
} from '@/lib/permissions';

export type Access = {
  uid: string;
  name: string;
  phone: string;
  /** Current role key from the database (not the cookie). */
  roleKey: string;
  roleName: string;
  permissions: string[];
  /** Master key or API token: no AppUser row behind it. */
  isMaster: boolean;
  can: (key: string) => boolean;
  canAny: (keys: readonly string[]) => boolean;
};

function build(base: { uid: string; name: string; phone: string; roleKey: string; roleName: string; permissions: string[]; isMaster: boolean }): Access {
  const set = new Set(base.permissions);
  return { ...base, can: (k) => set.has(k), canAny: (ks) => ks.some((k) => set.has(k)) };
}

/* ------------------------------------------------------------------ seeding */

let seeding: Promise<void> | null = null;
let seedFailedAt = 0;

async function seed() {
  const have = new Set((await prisma.roleDefinition.findMany({ select: { key: true } })).map((r) => r.key));
  for (const r of BUILTIN_ROLES) {
    if (have.has(r.key)) continue;
    try {
      await prisma.roleDefinition.create({
        data: { key: r.key, name: r.name, description: r.description, permissions: JSON.stringify(r.permissions), isBuiltIn: true },
      });
    } catch {
      // another request created it first
    }
  }
  // Existing people keep exactly the role they had: roleKey mirrors the legacy enum until someone changes it.
  await prisma.$executeRawUnsafe('UPDATE "AppUser" SET "roleKey" = "role" WHERE "roleKey" IS NULL');
}

/** Creates the built-in roles once per process. Throws if the tables are missing (callers fall back to code defaults). */
export async function ensureRolesSeeded(): Promise<void> {
  if (!seeding) {
    if (Date.now() - seedFailedAt < 30_000) throw new Error('role tables unavailable');
    seeding = seed().catch((e) => {
      seeding = null;
      seedFailedAt = Date.now();
      throw e;
    });
  }
  return seeding;
}

/* ------------------------------------------------------------------ roles */

const parseList = (s: string | null | undefined): unknown => {
  try {
    return JSON.parse(s ?? '[]');
  } catch {
    return [];
  }
};

export type RoleInfo = { key: string; name: string; description: string | null; permissions: string[]; isBuiltIn: boolean };

/** One role by key, as the database has it (falls back to the code defaults for built-ins). Null when unknown. */
export async function loadRole(roleKey: string): Promise<RoleInfo | null> {
  if (roleKey === SUPERADMIN_KEY) {
    return { key: SUPERADMIN_KEY, name: 'Super Admin', description: 'Everything, always. Cannot be edited.', permissions: ALL_PERMISSION_KEYS, isBuiltIn: true };
  }
  try {
    await ensureRolesSeeded();
    const row = await prisma.roleDefinition.findUnique({ where: { key: roleKey } });
    if (row) {
      return { key: row.key, name: row.name, description: row.description, permissions: sanitizePermissions(parseList(row.permissions)), isBuiltIn: row.isBuiltIn };
    }
  } catch {
    // tables not there yet: built-ins use the defaults below, anything else gets nothing
  }
  const b = builtInRole(roleKey);
  return b ? { key: b.key, name: b.name, description: b.description, permissions: sanitizePermissions(b.permissions), isBuiltIn: true } : null;
}

/** Every role (built-in first), for the Users and Roles screens. */
export async function listRoles(): Promise<RoleInfo[]> {
  let rows: RoleInfo[] = [];
  try {
    await ensureRolesSeeded();
    const db = await prisma.roleDefinition.findMany();
    rows = db.map((r) => ({
      key: r.key,
      name: r.name,
      description: r.description,
      permissions: r.key === SUPERADMIN_KEY ? ALL_PERMISSION_KEYS : sanitizePermissions(parseList(r.permissions)),
      isBuiltIn: r.isBuiltIn,
    }));
  } catch {
    rows = BUILTIN_ROLES.map((b) => ({ key: b.key, name: b.name, description: b.description, permissions: sanitizePermissions(b.permissions, { keepLocked: b.key === SUPERADMIN_KEY }), isBuiltIn: true }));
  }
  const order = new Map(BUILTIN_ROLES.map((b, i) => [b.key, i]));
  return rows.sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99) || a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ requests */

/** Who is asking, with their CURRENT permissions. Null when not signed in or suspended. */
export async function getAccess(req: Request): Promise<Access | null> {
  const s = readSession(req);
  if (!s) return null;

  if (!s.uid) {
    // Master key or API token: held in the environment, always Super Admin.
    return build({ uid: '', name: s.name, phone: s.phone, roleKey: SUPERADMIN_KEY, roleName: 'Super Admin', permissions: ALL_PERMISSION_KEYS, isMaster: true });
  }

  let user: { name: string; phone: string; status: string; role: string; roleKey: string | null } | null;
  try {
    user = await prisma.appUser.findUnique({ where: { id: s.uid }, select: { name: true, phone: true, status: true, role: true, roleKey: true } });
  } catch {
    return null; // database unavailable: fail closed
  }
  if (!user || user.status !== 'ACTIVE') return null;

  const roleKey = user.roleKey ?? user.role;
  const role = await loadRole(roleKey);
  return build({
    uid: s.uid,
    name: user.name,
    phone: user.phone,
    roleKey,
    roleName: role?.name ?? roleKey,
    permissions: role?.permissions ?? [],
    isMaster: false,
  });
}

/**
 * Allows the request when the person holds ANY of the given permissions. Returns the 401/403 response to
 * send back, or null when allowed:
 *
 *   const denied = await requirePermission(req, 'blogs.manage');
 *   if (denied) return denied;
 */
export async function requirePermission(req: Request, keys: string | readonly string[]): Promise<NextResponse | null> {
  const r = await authorize(req, keys);
  return r.denied ?? null;
}

/** Same check, but hands back the Access too (for routes that scope or strip data by permission). */
export async function authorize(
  req: Request,
  keys: string | readonly string[],
): Promise<{ denied: NextResponse; access?: undefined } | { denied?: undefined; access: Access }> {
  const access = await getAccess(req);
  if (!access) return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const list = Array.isArray(keys) ? (keys as readonly string[]) : [keys as string];
  if (!access.canAny(list)) {
    return { denied: NextResponse.json({ error: `Forbidden — requires permission: ${list.join(' or ')}` }, { status: 403 }) };
  }
  return { access };
}

/* ------------------------------------------------------------------ audit */

export type AccessLogEntry = {
  action: 'ROLE_CREATE' | 'ROLE_UPDATE' | 'ROLE_DELETE' | 'USER_ROLE_CHANGE';
  roleKey?: string | null;
  targetUserId?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * The audit row for one roles/access change, as data. Put it in the SAME `prisma.$transaction` as the change
 * so the change and its record succeed or fail together:
 *
 *   await prisma.$transaction([
 *     prisma.roleDefinition.update(...),
 *     prisma.accessAuditLog.create({ data: accessLogData(access, { action: 'ROLE_UPDATE', ... }) }),
 *   ]);
 */
export function accessLogData(actor: Access, e: AccessLogEntry) {
  return {
    action: e.action,
    roleKey: e.roleKey ?? null,
    targetUserId: e.targetUserId ?? null,
    before: e.before === undefined ? null : JSON.stringify(e.before),
    after: e.after === undefined ? null : JSON.stringify(e.after),
    performedBy: actor.uid || actor.phone || 'master',
    performedByName: actor.name,
  };
}

/* ------------------------------------------------------------------ assigning roles to people */

/** The values the legacy `AppUser.role` column accepts. */
const LEGACY_ROLE_COLUMN = new Set(['SUPERADMIN', 'CHAIRMAN', 'ACCOUNTS', 'AGENT', 'PARTNER_LAB', 'DOCTOR']);
export type LegacyRole = 'SUPERADMIN' | 'CHAIRMAN' | 'ACCOUNTS' | 'AGENT' | 'PARTNER_LAB' | 'DOCTOR';

/**
 * Turns "role" / "roleKey" from a request into the pair to store, or an error. The key must be a role that
 * exists. For a role that is not in the legacy enum, the legacy column gets DOCTOR (zero permissions), the
 * safest value should anything still look at it. Returns null when the request names no role.
 */
export async function resolveRoleInput(input: {
  role?: string | null;
  roleKey?: string | null;
}): Promise<{ roleKey: string; role: LegacyRole } | { error: string } | null> {
  const key = (input.roleKey ?? input.role ?? '').trim();
  if (!key) return null;
  const found = await loadRole(key);
  if (!found) return { error: 'That role does not exist' };
  return { roleKey: key, role: (LEGACY_ROLE_COLUMN.has(key) ? key : 'DOCTOR') as LegacyRole };
}

/** Active Super Admin accounts other than `excludeId` (the master key is not an account). */
export async function otherActiveSuperAdmins(excludeId: string): Promise<number> {
  return prisma.appUser.count({
    where: { id: { not: excludeId }, status: 'ACTIVE', OR: [{ roleKey: SUPERADMIN_KEY }, { roleKey: null, role: 'SUPERADMIN' }] },
  });
}
