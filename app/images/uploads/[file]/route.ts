import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { PUBLIC_UPLOADS_DIR } from "@/lib/paths";

/**
 * Serves admin-uploaded images from /public/images/uploads/ directly from disk.
 * Static serving only knows the public/ copy baked into the build, so this
 * handler makes /images/uploads/<file> work immediately after an upload and
 * keeps uploads out of the build entirely.
 */
const MIME: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
};

type Params = { params: Promise<{ file: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { file } = await params;
  if (!/^[a-z0-9-]+\.(webp|jpe?g|png|gif|avif)$/i.test(file) || file.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Single source of truth: the project folder's public/images/uploads
  // (the build never contains uploads — see scripts/postbuild-standalone.mjs).
  const candidates = [path.join(PUBLIC_UPLOADS_DIR, file)];

  for (const candidate of candidates) {
    try {
      const buf = await readFile(candidate);
      const ext = (file.split(".").pop() || "").toLowerCase();
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": MIME[ext] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try the next candidate location
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
