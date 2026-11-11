import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, parseMetadata, readActiveSession } from "@/lib/admin-auth";
import { firstIssueMessage } from "@/lib/validation";

/** User management is strictly SUPERADMIN. Phase 1: suspension-aware. */
async function requireSuperAdmin(req: Request): Promise<NextResponse | null> {
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Only a SuperAdmin can manage users" }, { status: 403 });
  }
  return null;
}

const roleEnum = z.enum(["SUPERADMIN", "CHAIRMAN", "ACCOUNTS", "AGENT", "PARTNER_LAB", "DOCTOR"]);

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(30).optional(),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().email("Enter a valid email address").max(200).nullish()
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  role: roleEnum.optional(),
  status: z.string().trim().max(30).optional(),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

function publicUser<T extends { metadata?: string | null }>(user: T) {
  const { metadata: _metadata, ...safe } = user;
  return safe;
}

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return id;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;
  try {
    const id = await resolveId(ctx.params);
    const json = await req.json();
    const parsed = userUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { password, ...rest } = parsed.data;

    const existing = await prisma.appUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = { ...rest };
    // Undefined fields must not overwrite stored values (email/address use null explicitly).
    for (const key of Object.keys(data)) {
      if (data[key] === undefined) delete data[key];
    }

    // Password reset: re-hash and merge into metadata without clobbering other keys.
    if (password) {
      const metaObj = parseMetadata(existing.metadata);
      metaObj.passwordHash = hashPassword(password);
      data.metadata = JSON.stringify(metaObj);
    }

    const user = await prisma.appUser.update({ where: { id }, data });
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
  const session = await readActiveSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Only a SuperAdmin can manage users" }, { status: 403 });
  }
  try {
    const id = await resolveId(ctx.params);
    const target = await prisma.appUser.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Never allow deleting the signed-in, active SuperAdmin account (incl. master-key session).
    const isOwnAccount = session.uid === id || (!session.uid && target.role === "SUPERADMIN");
    if (isOwnAccount && target.role === "SUPERADMIN" && target.status === "ACTIVE") {
      return NextResponse.json(
        { error: "You cannot delete your own active SuperAdmin account" },
        { status: 403 }
      );
    }
    await prisma.appUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
