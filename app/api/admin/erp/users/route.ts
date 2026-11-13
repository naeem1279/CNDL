import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, parseMetadata } from "@/lib/admin-auth";
import { accessLogData, authorize, listRoles, resolveRoleInput } from "@/lib/access";
import { firstIssueMessage } from "@/lib/validation";

/** User management needs "users.manage" (locked to Super Admin). Suspension-aware. */

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(30),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().email("Enter a valid email address").max(200).nullish()
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  /** Either the legacy `role` or the new `roleKey` may be sent; any defined role is accepted. */
  role: z.string().trim().max(60).optional(),
  roleKey: z.string().trim().max(60).optional(),
  status: z.string().trim().max(30).default("ACTIVE"),
  metadata: z.string().trim().max(2000).nullish(),
  password: z.string().min(4, "Password must be at least 4 characters").max(100).optional(),
});

/** Never sends the password hash; adds the current role key and its display name. */
function publicUser<T extends { metadata?: string | null; role: string; roleKey?: string | null }>(
  user: T,
  names?: Map<string, string>
) {
  const { metadata: _metadata, ...safe } = user;
  const roleKey = user.roleKey ?? user.role;
  return { ...safe, roleKey, roleName: names?.get(roleKey) ?? roleKey };
}

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

export async function GET(req: Request) {
  const auth = await authorize(req, "users.manage");
  if (auth.denied) return auth.denied;
  try {
    const [users, roles] = await Promise.all([prisma.appUser.findMany({ orderBy: { createdAt: "desc" } }), listRoles()]);
    const names = new Map(roles.map((r) => [r.key, r.name]));
    return NextResponse.json({ users: users.map((u) => publicUser(u, names)) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req, "users.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const json = await req.json();
    const parsed = userCreateSchema.safeParse(json);
    if (!parsed.success) {
      // Surface the exact validation message so the UI can show what went wrong.
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { password, role: roleInput, roleKey: roleKeyInput, ...data } = parsed.data;

    // A new person gets the role named in the request; with none named, the least-privileged built-in (Doctor).
    const resolved = (await resolveRoleInput({ role: roleInput, roleKey: roleKeyInput })) ?? (await resolveRoleInput({ roleKey: "DOCTOR" }));
    if (!resolved || "error" in resolved) {
      return NextResponse.json({ error: resolved && "error" in resolved ? resolved.error : "Role not found" }, { status: 400 });
    }

    // Store the login password as a scrypt hash inside AppUser.metadata.
    if (password) {
      const metaObj = parseMetadata(data.metadata ?? null);
      metaObj.passwordHash = hashPassword(password);
      data.metadata = JSON.stringify(metaObj);
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.appUser.create({ data: { ...data, role: resolved.role, roleKey: resolved.roleKey } });
      await tx.accessAuditLog.create({
        data: accessLogData(access, { action: "USER_ROLE_CHANGE", roleKey: resolved.roleKey, targetUserId: created.id, before: null, after: { roleKey: resolved.roleKey } }),
      });
      return created;
    });
    return NextResponse.json(publicUser(user), { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A user with this phone number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
