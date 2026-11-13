import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import {
  ADMIN_COOKIE,
  MASTER_ADMIN_ID,
  issueSessionToken,
  parseMetadata,
  verifyPassword,
  verifyUserPassword,
} from '@/lib/admin-auth';
import { getAccess, loadRole } from '@/lib/access';
import { ALL_PERMISSION_KEYS } from '@/lib/permissions';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

/** Returns the current session user (used by the client to restore state on load).
 *  Phase 1 (2026-11-06): a session whose AppUser has been SUSPENDED (or deleted) is
 *  rejected immediately instead of surviving until the cookie TTL. The role and the
 *  permissions come from the database NOW, not from the cookie, so a Super Admin's
 *  change shows up on the person's next page load without signing in again. */
export async function GET(req: Request) {
  const access = await getAccess(req);
  if (!access) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    user: { uid: access.uid, name: access.name, phone: access.phone, role: access.roleKey, roleName: access.roleName, permissions: access.permissions },
  });
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): brute-force protection — 8 attempts per 15 min per IP.
  if (!rateLimit(req, { scope: 'admin-login', max: 8, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts — try again in 15 minutes' },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => null);
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!identifier || !password) {
    return NextResponse.json(
      { success: false, error: 'Phone/email and password are required' },
      { status: 400 }
    );
  }

  // Week 1 fix (2026-11-11): per-account lockout — 10 attempts per 15 min per
  // identifier, independent of IP, so rotating addresses cannot brute-force one
  // account. (Counts every attempt; a successful login inside the window still
  // works until the budget is spent.)
  if (!rateLimit(req, { scope: 'admin-login-id', key: identifier.toLowerCase(), max: 10, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts for this account — try again in 15 minutes' },
      { status: 429 }
    );
  }

  // Master override: identifier "admin" (or MASTER_ADMIN_ID) + master key → SUPERADMIN.
  if (identifier.toLowerCase() === MASTER_ADMIN_ID) {
    if (!verifyPassword(password)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
    const user = { uid: '', name: 'Administrator', phone: 'master', role: 'SUPERADMIN' };
    const res = NextResponse.json({ success: true, user: { ...user, roleName: 'Super Admin', permissions: ALL_PERMISSION_KEYS } });
    res.cookies.set(ADMIN_COOKIE, issueSessionToken(user), {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  }

  // AppUser login: match phone OR email, must be ACTIVE, and their role must hold at least one permission.
  try {
    const account = await prisma.appUser.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });

    if (!account || account.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
    const roleKey = account.roleKey ?? account.role;
    const roleInfo = await loadRole(roleKey);
    if (!roleInfo || roleInfo.permissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'This role does not have admin console access' },
        { status: 403 }
      );
    }

    const { passwordHash } = parseMetadata(account.metadata);
    const storedHash = typeof passwordHash === 'string' ? passwordHash : null;
    if (!verifyUserPassword(password, storedHash)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = {
      uid: account.id,
      name: account.name,
      phone: account.phone,
      role: roleKey,
    };
    const res = NextResponse.json({ success: true, user: { ...user, roleName: roleInfo.name, permissions: roleInfo.permissions } });
    res.cookies.set(ADMIN_COOKIE, issueSessionToken(user), {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
