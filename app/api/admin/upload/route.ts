import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireRole } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Magic-byte sniffing so the sharp-less fallback path never writes a disguised file. */
function sniffImageMime(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.toString("ascii", 4, 8) === "ftyp") return "image/avif"; // ISO-BMFF container (avif/heic family)
  return null;
}

function safeBaseName(name: string): string {
  const base = path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "image";
}

/**
 * `next start` with `output: "standalone"` serves the public/ copy baked into
 * .next/standalone at build time, so writes go to BOTH locations — the project
 * root (survives for the next build) and the live standalone copy (visible now).
 */
async function uploadDirs(): Promise<string[]> {
  const root = path.join(process.cwd(), "public", "images", "uploads");
  const standalone = path.join(
    process.cwd(),
    ".next",
    "standalone",
    "www",
    "cndl-frontend",
    "public",
    "images",
    "uploads"
  );
  const dirs = [root];
  try {
    await mkdir(standalone, { recursive: true });
    dirs.push(standalone);
  } catch {
    // standalone copy unavailable — root write is still authoritative for builds
  }
  return dirs;
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): file writes are SUPERADMIN-only — agents and other
  // staff roles can no longer push files to the web-served public directory.
  const denied = await requireRole(req, ["SUPERADMIN"]);
  if (denied) return denied;

  let file: File | null = null;
  try {
    const formData = await req.formData();
    const entry = formData.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a `file` field" }, { status: 400 });
  }

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }
  if (file.type && !ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageMime(bytes);
  if (!sniffed) {
    return NextResponse.json({ error: "File is not a valid image" }, { status: 415 });
  }

  const dirs = await uploadDirs();
  const filename = `${safeBaseName(file.name)}-${Date.now()}.webp`;

  // sharp is bundled with Next.js in production. If it is genuinely unavailable we
  // fall back to a validated raw write; if it is available but the bytes do not
  // decode, the file is rejected — corrupt files are never stored.
  let sharpFn: typeof import("sharp") | null = null;
  try {
    const sharpModule = await import("sharp");
    sharpFn = sharpModule.default || (sharpModule as unknown as typeof import("sharp"));
  } catch {
    sharpFn = null;
  }

  let stored: { name: string; buffer: Buffer } | null = null;

  if (sharpFn) {
    try {
      const optimized = await sharpFn(bytes, { failOn: "error" })
        .rotate() // respect EXIF orientation
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      stored = { name: filename, buffer: optimized };
    } catch {
      return NextResponse.json({ error: "File is not a valid image" }, { status: 415 });
    }
  } else {
    const ext =
      sniffed === "image/jpeg"
        ? ".jpg"
        : sniffed === "image/png"
          ? ".png"
          : sniffed === "image/gif"
            ? ".gif"
            : sniffed === "image/avif"
              ? ".avif"
              : ".webp";
    stored = { name: `${safeBaseName(file.name)}-${Date.now()}${ext}`, buffer: bytes };
  }

  try {
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, stored.name), stored.buffer);
    }
  } catch {
    return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: `/images/uploads/${stored.name}` });
}
