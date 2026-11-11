import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readActiveSession, requireRole } from "@/lib/admin-auth";

const blogSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  category: z.string().trim().min(2).max(80).default("Zirconia & CAD/CAM"),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20),
  imageUrl: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s]*$/, "Image URL must be a root-relative path")
    .default("/images/blog.jpg"),
});

export async function GET(req: Request) {
  if (!(await readActiveSession(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const blogs = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
    return NextResponse.json({ blogs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Phase 1 (2026-11-06): public content writes — SUPERADMIN/CHAIRMAN only.
  const denied = await requireRole(req, ["SUPERADMIN", "CHAIRMAN"]);
  if (denied) return denied;
  try {
    const parsed = blogSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    const { imageUrl, ...data } = parsed.data;
    const blog = await prisma.blogPost.create({
      data: { ...data, image: imageUrl },
    });
    return NextResponse.json(blog, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
