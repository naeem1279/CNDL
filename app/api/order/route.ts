import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ORDER_FILES_DIR } from "@/lib/paths";

/** P0 hardening (2026-11-05): strict validation, rate limiting, collision-safe Case IDs.
 *  P1/F1 (2026-11-05): accepts multipart/form-data and stores clinical files
 *  (STL/OBJ/DCM/PDF/JPG/PNG) PRIVATELY under <project>/uploads/orders/<caseId>/
 *  — deliberately NOT inside public/, since patient scans must never be web-served. */

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const orderSchema = z.object({
  name: z.string().trim().min(2, "Clinic/doctor name must be at least 2 characters").max(150),
  phone: z.string().trim().min(10, "Enter a valid phone number").max(30),
  email: z.preprocess(
    emptyToNull,
    z.string().trim().email("Enter a valid email address").max(200).nullish()
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullish()),
  patientName: z.preprocess(emptyToNull, z.string().trim().max(150).nullish()),
  productType: z.preprocess(emptyToNull, z.string().trim().max(600).nullish()),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(1000).optional(),
});

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 5;
const ALLOWED_EXT = [".stl", ".obj", ".dcm", ".pdf", ".jpg", ".jpeg", ".png"];

/** Extract the first human-readable message from a zod error (v4 `.issues`). */
function firstZodMessage(err: unknown): string {
  const e = err as { issues?: { message?: string }[] };
  return e?.issues?.[0]?.message ?? "Validation failed";
}

/** 8 hex chars from a CSPRNG (≈4.3 billion space) instead of Math.random's 5
 *  base-36 chars — birthday collisions become practically impossible. */
function newCaseId(): string {
  return "CNDL-" + randomBytes(4).toString("hex").toUpperCase();
}

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function safeBaseName(name: string): string {
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "case-file";
}

export async function POST(req: Request) {
  if (!rateLimit(req, { scope: "order", max: 5, windowMs: 60_000 })) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let parsed: ReturnType<typeof orderSchema.safeParse>;
    const incoming: { original: string; buffer: Buffer }[] = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData().catch(() => null);
      if (!fd) {
        return NextResponse.json(
          { success: false, error: "Invalid form data" },
          { status: 400 }
        );
      }
      const fields: Record<string, string> = {};
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") fields[k] = v;
      }
      parsed = orderSchema.safeParse(fields);

      const files = [...fd.entries()]
        .filter(([, v]) => v instanceof File)
        .map(([, v]) => v as File);
      if (files.length > MAX_FILES) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_FILES} files per case` },
          { status: 400 }
        );
      }
      for (const f of files) {
        if (!ALLOWED_EXT.includes(fileExt(f.name))) {
          return NextResponse.json(
            { success: false, error: `Unsupported file type: ${f.name}` },
            { status: 415 }
          );
        }
        if (f.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { success: false, error: `File too large (max 10 MB): ${f.name}` },
            { status: 413 }
          );
        }
      }
      for (const f of files) {
        incoming.push({ original: f.name, buffer: Buffer.from(await f.arrayBuffer()) });
      }
    } else {
      const json = await req.json().catch(() => null);
      parsed = orderSchema.safeParse(json);
    }

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }
    const d = parsed.data;

    // Deterministic private storage names (assigned up-front so the case row can
    // reference them; identical clock stamps disambiguated by index).
    const stamp = Date.now();
    const storedNames = incoming.map(
      (f, i) => `${safeBaseName(f.original)}-${stamp}-${i}${fileExt(f.original)}`
    );

    const clinical =
      (d.patientName ? `Patient: ${d.patientName} | ` : "") +
      (d.productType || "") +
      (storedNames.length ? ` | Files: ${storedNames.join(", ")}` : "");

    let lastError: unknown = null;
    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await prisma.order.create({
          data: {
            caseId: newCaseId(),
            customerName: d.name,
            phone: d.phone,
            email: d.email ?? null,
            address: d.address ?? null,
            productType: clinical,
            quantity: d.quantity ?? 1,
            status: "Received",
            progress: 10,
          },
        });
        break;
      } catch (e) {
        lastError = e;
        const code = (e as { code?: string })?.code;
        if (code !== "P2002") break; // not a unique-constraint collision — bail out
      }
    }

    if (!order) {
      console.error("Order API Error:", lastError);
      return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 });
    }

    // Persist clinical files privately AFTER the case row exists.
    if (incoming.length) {
      try {
        const dir = path.join(ORDER_FILES_DIR, order.caseId);
        await mkdir(dir, { recursive: true });
        for (let i = 0; i < incoming.length; i++) {
          await writeFile(path.join(dir, storedNames[i]), incoming[i].buffer);
        }
      } catch (e) {
        // The case row is authoritative; a storage hiccup must not lose the order.
        console.error("Order file storage failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      order: { id: order.id, caseId: order.caseId },
    });
  } catch (error) {
    console.error("Order API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 });
  }
}
