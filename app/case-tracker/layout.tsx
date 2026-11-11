import type { Metadata } from 'next';

// G1 (2026-11-05): route metadata — client pages cannot export metadata
// themselves, so a server layout provides it per segment.
export const metadata: Metadata = {
  title: 'Track Your Dental Case | CNDL Global',
  description:
    'Follow your restoration through CAD design, 5-axis milling, Shofu glazing and dispatch — live production status by Case ID or phone number.',
  alternates: { canonical: 'https://cndl-global.com/case-tracker' },
  openGraph: {
    title: 'Track Your Dental Case | CNDL Global',
    description:
      'Follow your restoration through CAD design, 5-axis milling, Shofu glazing and dispatch — live production status by Case ID or phone number.',
    url: 'https://cndl-global.com/case-tracker',
  },
};

export default function CaseTrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
