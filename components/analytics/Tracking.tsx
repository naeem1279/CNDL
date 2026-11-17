'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

/** Public GTM web container (an identifier, not a secret). Override with NEXT_PUBLIC_GTM_ID. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TCQ8XDL8';

/**
 * Loads the GTM web container on public pages only (never the admin console or lab slip)
 * and reports WhatsApp / phone clicks. Meta Pixel and GA4 run as tags inside GTM, so they
 * are not loaded here as well (that would double-count every visit).
 * Set NEXT_PUBLIC_GTM_SERVER_URL (e.g. https://sgtm.cndl-global.com) once the server
 * container is live; the loader then comes from that first-party domain.
 */
export default function Tracking() {
  const pathname = usePathname() ?? '';
  const off =
    pathname.startsWith('/admin-cndl') || pathname.startsWith('/lab-slip');

  useEffect(() => {
    if (off) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      const href = a?.getAttribute('href') || '';
      if (href.startsWith('https://wa.me/')) track('whatsapp_click');
      else if (href.startsWith('tel:')) track('phone_click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [off]);

  if (off || !GTM_ID) return null;
  const host = process.env.NEXT_PUBLIC_GTM_SERVER_URL || 'https://www.googletagmanager.com';

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=document.getElementsByTagName('script')[0],j=document.createElement('script');j.async=true;j.src='${host}/gtm.js?id=${GTM_ID}';f.parentNode.insertBefore(j,f);`}
    </Script>
  );
}
