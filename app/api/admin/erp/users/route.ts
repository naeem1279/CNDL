import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, parseMetadata, readActiveSession } from "@/lib/admin-auth";

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

const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  phone: z.string().trim().min(10, "Phone must be at least 10 characters").max(30),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().email("Enter a valid email address").max(200).nullish()
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  role: roleEnum.default("DOCTOR"),
  status: z.string().trim().max(30).default("ACTIVE"),
  metadata: z.string().trim().max(2000).nullish(),
  password: z.string().min(4, "Password must be at least 4 characters").max(100).optional(),
});

function publicUser<T extends { metadata?: string | null }>(user: T) {
  const { metadata: _metadata, ...safe } = user;
  return safe;
}

/** Extract the first human-readable message from a zod error (v3 `.errors` / v4 `.issues`). */
function firstZodMessage(err: unknown): string {
  const e = err as { issues?: { message?: string }[]; errors?: { message?: string }[] };
  return e?.issues?.[0]?.message ?? e?.errors?.[0]?.message ?? "Validation failed";
}

export async function GET(req: Request) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;
  try {
    const users = await prisma.appUser.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users: users.map(publicUser) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin(req);
  if (denied) return denied;
  try {
    const json = await req.json();
    const parsed = userCreateSchema.safeParse(json);
    if (!parsed.success) {
      // Surface the exact validation message so the UI can show what went wrong.
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }
    const { password, ...data } = parsed.data;

    // Store the login password as a scrypt hash inside AppUser.metadata.
    if (password) {
      const metaObj = parseMetadata(data.metadata ?? null);
      metaObj.passwordHash = hashPassword(password);
      data.metadata = JSON.stringify(metaObj);
    }

    const user = await prisma.appUser.create({ data });
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
