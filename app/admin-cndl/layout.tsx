import type { Metadata } from 'next';

// The console is a private tool: its own tab title, and never indexed.
export const metadata: Metadata = {
  title: 'CNDL Admin Console',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
