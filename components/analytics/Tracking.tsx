'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackPageView } from '@/lib/track';

/** Public GTM web container (an identifier, not a secret). Override with NEXT_PUBLIC_GTM_ID. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TCQ8XDL8';

/**
 * Public pages only (never the admin console or lab slip): loads the Google tag from the
 * first-party tagging server, routes GA4 hits through it, runs the Meta Pixel and reports
 * WhatsApp / phone clicks.
 */
export default function Tracking() {
  const pathname = usePathname() ?? '';
  const off =
    pathname.startsWith('/admin-cndl') || pathname.startsWith('/lab-slip');

  useEffect(() => {
    if (!off) trackPageView();
  }, [off, pathname]);

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
  const google = 'https://www.googletagmanager.com';
  const host = process.env.NEXT_PUBLIC_GTM_SERVER_URL || 'https://sgtm.cndl-global.com';

  // First-party sGTM first; if it cannot serve gtm.js (e.g. its Web Container client is
  // not set up yet), fall back to Google so tracking never goes dark.
  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('set','server_container_url','${host}');window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});(function(){var f=document.getElementsByTagName('script')[0];function load(src,fb){var j=document.createElement('script');j.async=true;j.src=src+'/gtm.js?id=${GTM_ID}';if(fb){j.onerror=function(){load(fb)}}f.parentNode.insertBefore(j,f)}load('${host}','${host === google ? '' : google}')})();`}
    </Script>
  );
}
