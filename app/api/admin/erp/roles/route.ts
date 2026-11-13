import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { accessLogData, authorize, listRoles } from "@/lib/access";
import { ALL_PERMISSION_KEYS, PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";
import { checkPermissionList, roleBodySchema } from "@/lib/role-input";
import { firstIssueMessage } from "@/lib/validation";

/**
 * Roles and permissions (Super Admin only: "roles.manage", locked).
 * GET  → every role with how many people hold it, plus the catalog of permissions.
 * POST → create a custom role.
 */

export async function GET(req: Request) {
  const auth = await authorize(req, ["roles.manage", "users.manage"]);
  if (auth.denied) return auth.denied;
  try {
    const [roles, people] = await Promise.all([listRoles(), prisma.appUser.findMany({ select: { role: true, roleKey: true } })]);
    const counts = new Map<string, number>();
    for (const p of people) {
      const key = p.roleKey ?? p.role;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return NextResponse.json({
      roles: roles.map((r) => ({ ...r, userCount: counts.get(r.key) ?? 0 })),
      catalog: { permissions: PERMISSIONS, groups: PERMISSION_GROUPS, allKeys: ALL_PERMISSION_KEYS },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req, "roles.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const parsed = roleBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
    const checked = checkPermissionList(parsed.data.permissions);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

    const existing = await listRoles();
    if (existing.some((r) => r.name.toLowerCase() === parsed.data.name.toLowerCase())) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    const key = `custom_${randomBytes(4).toString("hex")}`;
    const [role] = await prisma.$transaction([
      prisma.roleDefinition.create({
        data: { key, name: parsed.data.name, description: parsed.data.description ?? null, permissions: JSON.stringify(checked.permissions), isBuiltIn: false },
      }),
      prisma.accessAuditLog.create({
        data: accessLogData(access, { action: "ROLE_CREATE", roleKey: key, before: null, after: { name: parsed.data.name, permissions: checked.permissions } }),
      }),
    ]);
    return NextResponse.json({ role: { key: role.key, name: role.name, description: role.description, permissions: checked.permissions, isBuiltIn: false, userCount: 0 } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create the role" }, { status: 500 });
  }
}
