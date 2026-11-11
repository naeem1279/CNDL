'use client';

import { usePathname } from 'next/navigation';
import NavBer from './NavBer';
import Footer from './Footer';
import FloatingWhatsApp from '../common/FloatingWhatsApp';

/**
 * Renders the public site chrome (Header / Footer / Floating WhatsApp) around
 * page content — EXCEPT on the admin console routes, which must render as a
 * standalone, full-screen enterprise application with zero consumer clutter.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isIsolated = pathname === '/admin-cndl' || pathname.startsWith('/admin-cndl/') || pathname === '/lab-slip' || pathname.startsWith('/lab-slip/');

  if (isIsolated) return <>{children}</>;

  return (
    <>
      <NavBer />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
