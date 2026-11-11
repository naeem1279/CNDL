import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public quick-search for the header dialog: published blog topics only. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();

  try {
    const blogs = await prisma.blogPost.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { category: { contains: q } },
              { excerpt: { contains: q } },
            ],
          }
        : {},
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { title: true, slug: true, category: true },
    });
    return NextResponse.json({ blogs });
  } catch {
    return NextResponse.json({ blogs: [] });
  }
}
