import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { accessLogData, authorize, listRoles, loadRole } from "@/lib/access";
import { SUPERADMIN_KEY } from "@/lib/permissions";
import { firstIssueMessage } from "@/lib/validation";
import { checkPermissionList } from "@/lib/role-input";

/**
 * One role (Super Admin only: "roles.manage", locked).
 * PUT    → rename and/or change its permissions (built-in roles included; Super Admin itself is fixed).
 * DELETE → remove a custom role that nobody holds.
 * Every change is written to the access log in the same transaction.
 */

const updateSchema = z.object({
  name: z.string().trim().min(2, "Give the role a name (at least 2 characters)").max(60).optional(),
  description: z.string().trim().max(300).nullish(),
  permissions: z.array(z.string().max(80)).max(200).optional(),
});

type Ctx = { params: Promise<{ key: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await authorize(req, "roles.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { key } = await ctx.params;
    if (key === SUPERADMIN_KEY) {
      return NextResponse.json({ error: "Super Admin always has every permission and cannot be edited" }, { status: 403 });
    }
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });

    const before = await loadRole(key);
    if (!before) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    let permissions = before.permissions;
    if (parsed.data.permissions) {
      const checked = checkPermissionList(parsed.data.permissions);
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      permissions = checked.permissions;
    }
    const name = parsed.data.name ?? before.name;
    if (parsed.data.name) {
      const others = (await listRoles()).filter((r) => r.key !== key);
      if (others.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
        return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
      }
    }
    const description = parsed.data.description === undefined ? before.description : parsed.data.description;

    const data = { name, description, permissions: JSON.stringify(permissions) };
    await prisma.$transaction([
      // upsert: a built-in role that was never written to the table yet is created on its first edit
      prisma.roleDefinition.upsert({
        where: { key },
        update: data,
        create: { key, ...data, isBuiltIn: before.isBuiltIn },
      }),
      prisma.accessAuditLog.create({
        data: accessLogData(access, {
          action: "ROLE_UPDATE",
          roleKey: key,
          before: { name: before.name, permissions: before.permissions },
          after: { name, permissions },
        }),
      }),
    ]);
    return NextResponse.json({ role: { key, name, description, permissions, isBuiltIn: before.isBuiltIn } });
  } catch {
    return NextResponse.json({ error: "Failed to update the role" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await authorize(req, "roles.manage");
  if (auth.denied) return auth.denied;
  const { access } = auth;
  try {
    const { key } = await ctx.params;
    const role = await loadRole(key);
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (role.isBuiltIn) {
      return NextResponse.json({ error: "Built-in roles cannot be deleted. Edit their permissions instead." }, { status: 403 });
    }
    // Custom roles only ever live in roleKey (the legacy enum column holds a placeholder for them).
    const holders = await prisma.appUser.count({ where: { roleKey: key } });
    if (holders > 0) {
      return NextResponse.json({ error: `${holders} ${holders === 1 ? "person has" : "people have"} this role. Move them to another role first.` }, { status: 409 });
    }
    await prisma.$transaction([
      prisma.roleDefinition.delete({ where: { key } }),
      prisma.accessAuditLog.create({
        data: accessLogData(access, { action: "ROLE_DELETE", roleKey: key, before: { name: role.name, permissions: role.permissions }, after: null }),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete the role" }, { status: 500 });
  }
}
