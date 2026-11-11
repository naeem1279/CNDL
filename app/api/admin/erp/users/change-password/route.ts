import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  parseMetadata,
  readSession,
  verifyUserPassword,
} from "@/lib/admin-auth";

/**
 * Self-service password change for ANY signed-in admin user.
 * - Master SUPERADMIN sessions (uid === "") have no AppUser record; the master
 *   key is locked to the ADMIN_SECRET environment variable → rejected.
 * - AppUser sessions verify currentPassword against the scrypt hash stored in
 *   AppUser.metadata, then persist a fresh hash.
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100),
});

export async function POST(req: Request) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(json);
  if (!parsed.success) {
    const e = parsed.error as { issues?: { message?: string }[] };
    return NextResponse.json(
      { error: e.issues?.[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }
  const { currentPassword, newPassword } = parsed.data;

  // Master key sessions are env-locked; no AppUser row to update.
  if (!session.uid) {
    return NextResponse.json(
      {
        error:
          "The master administrator password is locked in the server environment and cannot be changed here.",
      },
      { status: 403 }
    );
  }

  try {
    const account = await prisma.appUser.findUnique({ where: { id: session.uid } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const metaObj = parseMetadata(account.metadata);
    const storedHash = typeof metaObj.passwordHash === "string" ? metaObj.passwordHash : null;
    if (!verifyUserPassword(currentPassword, storedHash)) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    metaObj.passwordHash = hashPassword(newPassword);
    await prisma.appUser.update({
      where: { id: account.id },
      data: { metadata: JSON.stringify(metaObj) },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
