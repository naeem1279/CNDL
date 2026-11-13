import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, parseMetadata } from "@/lib/admin-auth";
import { accessLogData, authorize, otherActiveSuperAdmins, resolveRoleInput } from "@/lib/access";
import { SUPERADMIN_KEY } from "@/lib/permissions";
import { firstIssueMessage } from "@/lib/validation";

/** User management needs "users.manage" (locked to Super Admin). Suspension-aware. */

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(30).optional(),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().email("Enter a valid email address").max(200).nullish()
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  /** Either the legacy `role` or the new `roleKey` may be sent; any defined role is accepted. */
  role: z.string().trim().max(60).optional(),
  roleKey: z.string().trim().max(60).optional(),
  status: z.string().trim().max(30).optional(),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

function publicUser<T extends { metadata?: string | null; role: string; roleKey?: string | null }>(user: T) {
  const { metadata: _metadata, ...safe } = user;
  return { ...safe, roleKey: user.roleKey ?? user.role };
}

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return id;
}

const LAST_SUPERADMIN = "You cannot demote, suspend or remove the last Super Admin";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "users.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const id = await resolveId(ctx.params);
    const json = await req.json();
    const parsed = userUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { password, role: roleInput, roleKey: roleKeyInput, ...rest } = parsed.data;

    const existing = await prisma.appUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const existingKey = existing.roleKey ?? existing.role;

    const resolved = await resolveRoleInput({ role: roleInput, roleKey: roleKeyInput });
    if (resolved && "error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const roleChanges = !!resolved && resolved.roleKey !== existingKey;
    const suspends = !!rest.status && rest.status !== "ACTIVE";

    // Same rule as DELETE: you cannot lock yourself out by suspending or
    // demoting your own account (it would end your session immediately).
    if (access.uid && access.uid === id && (suspends || roleChanges)) {
      return NextResponse.json(
        { error: "You cannot suspend your own account or change your own role" },
        { status: 403 }
      );
    }

    // The last active Super Admin account is protected from being demoted or suspended.
    if (existingKey === SUPERADMIN_KEY && existing.status === "ACTIVE" && (suspends || roleChanges)) {
      if ((await otherActiveSuperAdmins(id)) === 0) {
        return NextResponse.json({ error: LAST_SUPERADMIN }, { status: 403 });
      }
    }

    const data: Record<string, unknown> = { ...rest };
    // Undefined fields must not overwrite stored values (email/address use null explicitly).
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) delete data[key];
    }
    if (resolved) {
      data.role = resolved.role;
      data.roleKey = resolved.roleKey;
    }

    // Password reset: re-hash and merge into metadata without clobbering other keys.
    if (password) {
      const metaObj = parseMetadata(existing.metadata);
      metaObj.passwordHash = hashPassword(password);
      data.metadata = JSON.stringify(metaObj);
    }

    const [user] = await prisma.$transaction([
      prisma.appUser.update({ where: { id }, data }),
      ...(roleChanges
        ? [
            prisma.accessAuditLog.create({
              data: accessLogData(access, {
                action: "USER_ROLE_CHANGE",
                roleKey: resolved!.roleKey,
                targetUserId: id,
                before: { roleKey: existingKey },
                after: { roleKey: resolved!.roleKey },
              }),
            }),
          ]
        : []),
    ]);
    return NextResponse.json(publicUser(user));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A user with this phone number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "users.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const id = await resolveId(ctx.params);
    const target = await prisma.appUser.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const targetKey = target.roleKey ?? target.role;
    const targetIsActiveSuperAdmin = targetKey === SUPERADMIN_KEY && target.status === "ACTIVE";
    // Never allow deleting the signed-in, active SuperAdmin account (incl. master-key session).
    const isOwnAccount = access.uid === id || (!access.uid && targetKey === SUPERADMIN_KEY);
    if (isOwnAccount && targetIsActiveSuperAdmin) {
      return NextResponse.json(
        { error: "You cannot delete your own active SuperAdmin account" },
        { status: 403 }
      );
    }
    // And never the last active Super Admin account.
    if (targetIsActiveSuperAdmin && (await otherActiveSuperAdmins(id)) === 0) {
      return NextResponse.json({ error: LAST_SUPERADMIN }, { status: 403 });
    }
    await prisma.$transaction([
      prisma.appUser.delete({ where: { id } }),
      prisma.accessAuditLog.create({
        data: accessLogData(access, { action: "USER_ROLE_CHANGE", roleKey: targetKey, targetUserId: id, before: { roleKey: targetKey }, after: null }),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
