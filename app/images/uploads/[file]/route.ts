import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Serves admin-uploaded images from /public/images/uploads/ directly from disk.
 * `next start` with `output: "standalone"` snapshots public/ at boot, so newly
 * uploaded files would 404 from static serving until a restart — this handler
 * makes /images/uploads/<file> work immediately after upload.
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

  const candidates = [
    path.join(process.cwd(), "public", "images", "uploads", file),
    path.join(
      process.cwd(),
      ".next",
      "standalone",
      "www",
      "cndl-frontend",
      "public",
      "images",
      "uploads",
      file
    ),
  ];

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
