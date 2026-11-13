import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/access";
import { friendlyIssue } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const blogUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens")
    .optional(),
  category: z.string().trim().min(2).max(80).optional(),
  excerpt: z.string().trim().min(10).max(500).optional(),
  content: z.string().trim().min(20).optional(),
  image: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s]*$/, "Image URL must be a root-relative path")
    .optional(),
});

export async function PUT(req: Request, { params }: Params) {
  // Phase 1 (2026-11-06): public content writes — SUPERADMIN/CHAIRMAN only.
  const denied = await requirePermission(req, "blogs.manage");
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = blogUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues.map(friendlyIssue) },
        { status: 400 }
      );
    }
    const updated = await prisma.blogPost.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const denied = await requirePermission(req, "blogs.delete");
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }
}
