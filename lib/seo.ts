/**
 * Shared SEO constants for the public site.
 *
 * Next.js replaces (does not merge) a parent's `openGraph` object when a page
 * sets its own, so every page that defines `openGraph` must list an image or
 * link previews show none. Pages spread `images: [OG_IMAGE]` for that reason.
 */
export const SITE_URL = 'https://cndl-global.com';

/** Branded 1200x630 share card (public/og-image.png, built from public/icon/Logo.svg). */
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'CNDL — Digital CAD/CAM Dental Laboratory in Khilgaon, Dhaka',
};
