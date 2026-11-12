import type { MetadataRoute } from 'next';

const BASE = 'https://cndl-global.com';

/** Never crawled: the admin console, APIs and auth endpoints. */
const PRIVATE = ['/admin-cndl', '/api/', '/auth'];

/**
 * AI search and answer-engine crawlers, named explicitly so the site's
 * openness to them is unambiguous (GEO/AEO). Same rules as everyone else.
 */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE }))],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
