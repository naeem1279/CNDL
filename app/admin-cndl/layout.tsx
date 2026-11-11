import type { Metadata } from 'next';
import { AdminShell } from './_components/AdminShell';

// The console is a private tool: its own tab title, and never indexed.
export const metadata: Metadata = {
  title: 'CNDL Admin Console',
  robots: { index: false, follow: false, nocache: true },
};

/* Session gate, role-filtered sidebar and shared dialogs live in AdminShell;
   each section is its own route under /admin-cndl/<section> and loads only
   the data it shows. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
