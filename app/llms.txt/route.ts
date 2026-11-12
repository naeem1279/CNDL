import { prisma } from '@/lib/prisma';

/**
 * /llms.txt — a plain-Markdown brief for AI assistants and answer engines
 * (llmstxt.org convention). Facts mirror the Organization JSON-LD in
 * app/layout.tsx; the product and article lists come live from the database.
 * Cached for an hour so crawlers never hit the database on every request.
 */
export const revalidate = 3600;

const BASE = 'https://cndl-global.com';

export async function GET() {
  let products: { name: string; category: string; basePrice: string | null; turnaroundDays: number; warrantyYears: number }[] = [];
  let posts: { title: string; slug: string; excerpt: string }[] = [];
  try {
    [products, posts] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: { name: true, category: true, basePrice: true, turnaroundDays: true, warrantyYears: true },
      }),
      prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' }, select: { title: true, slug: true, excerpt: true } }),
    ]);
  } catch {
    // Database unavailable: still serve the static facts below.
  }

  const price = (p: string | null) => {
    const v = (p || '').replace(/[৳\s]/g, '');
    return v ? `from ৳${v}` : 'price on request';
  };

  const lines = [
    '# CN Dental Lab (CNDL Global)',
    '',
    '> Digital CAD/CAM dental laboratory in Khilgaon, Dhaka, Bangladesh. Makes zirconia crowns and bridges, E-max veneers, PFM crowns, flexible dentures and in-house clear aligners for dentists, with a 3–4 working day turnaround using Roland 5-axis milling.',
    '',
    '## Key facts',
    '',
    '- Legal name: Chishtia Nizamia Dental Laboratory (trading as CN Dental Lab / CNDL Global)',
    '- Address: 419/1/C Khilgaon (west side of Jorpukur Field), Dhaka 1219, Bangladesh',
    '- Phone / WhatsApp: +880 1743-167963, +880 1805-976351',
    '- Hours: Monday to Saturday, 09:00–23:30 (Bangladesh time, UTC+6); closed Sunday',
    '- Serves: dentists, dental chambers, hospitals and partner labs across Bangladesh',
    '- Languages: English and Bengali',
    '- Chairman: M. Abdul Kadir',
    '',
    '## How dentists work with CNDL',
    '',
    `- [Submit a case online](${BASE}/order-create): clinic details, STL/OBJ scans or photos, prescription`,
    `- [Track a case](${BASE}/case-tracker) by case ID through design, milling, sintering, quality control and dispatch`,
    `- [Printable lab prescription slip](${BASE}/lab-slip) with FDI tooth chart and shade guide`,
    `- [Tooth preparation guide](${BASE}/prep-guide): reduction and margin requirements for CAD/CAM restorations`,
    `- [Contact](${BASE}/contact): call, WhatsApp or visit`,
    '',
    '## Products',
    '',
    ...(products.length
      ? products.map((p) => `- ${p.name} (${p.category}): ${price(p.basePrice)}, about ${p.turnaroundDays} working days, ${p.warrantyYears}-year warranty`)
      : [`- See the [product catalogue](${BASE}/products)`]),
    '',
    '## Pages',
    '',
    `- [Home](${BASE}/)`,
    `- [Products](${BASE}/products)`,
    `- [Technology and machinery](${BASE}/technology)`,
    `- [Laboratory gallery](${BASE}/gallery)`,
    `- [About](${BASE}/about)`,
    `- [Terms and conditions](${BASE}/terms-conditions)`,
    '',
    '## Articles',
    '',
    ...(posts.length ? posts.map((p) => `- [${p.title}](${BASE}/blog/${p.slug}): ${p.excerpt.replace(/\s+/g, ' ').trim()}`) : [`- [Blog](${BASE}/blog)`]),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
