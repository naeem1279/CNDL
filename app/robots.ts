import type { MetadataRoute } from 'next';

const BASE = 'https://cndl-global.com';
const SITEMAP = `${BASE}/sitemap.xml`;

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/products',
  '/gallery',
  '/order-create',
  '/case-tracker',
  '/contact',
  '/blog',
];

const PRIVATE = ['/admin-cndl', '/api/', '/auth'];

/** AI knowledge-extraction crawlers explicitly welcomed for GEO/AEO. */
const AI_BOTS = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ROUTES,
        disallow: PRIVATE,
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: PUBLIC_ROUTES,
        disallow: PRIVATE,
      })),
    ],
    sitemap: SITEMAP,
  };
}
