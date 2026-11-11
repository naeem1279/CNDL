import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const routes: {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}[] = [
  { path: "", changeFrequency: "monthly", priority: 1.0 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/technology", changeFrequency: "monthly", priority: 0.9 },
  { path: "/prep-guide", changeFrequency: "monthly", priority: 0.9 },
  { path: "/lab-slip", changeFrequency: "monthly", priority: 0.8 },
  { path: "/order-create", changeFrequency: "monthly", priority: 0.9 },
  { path: "/case-tracker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://cndl-global.com"
  // Pinned content-refresh date (G5): a moving new Date() fake-freshens every
  // static URL on every crawl. Bump deliberately when content meaningfully changes.
  const lastModified = new Date("2026-11-05T00:00:00+06:00")

  let blogUrls: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      select: { slug: true, publishedAt: true },
    })
    blogUrls = posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  } catch {
    blogUrls = []
  }

  return [
    ...routes.map(({ path, changeFrequency, priority }) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...blogUrls,
  ]
}
