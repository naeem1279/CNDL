import type { Metadata } from 'next';

// G1 (2026-11-05): route metadata — client pages cannot export metadata
// themselves, so a server layout provides it per segment.
export const metadata: Metadata = {
  title: 'Printable Dental Lab Prescription Slip (RX) | CNDL Global',
  description:
    'Official CNDL lab prescription slip with FDI tooth chart, 15 restoration lines, shade guide and margin/occlusion specifications — print-ready A4.',
  alternates: { canonical: 'https://cndl-global.com/lab-slip' },
  openGraph: {
    title: 'Printable Dental Lab Prescription Slip (RX) | CNDL Global',
    description:
      'Official CNDL lab prescription slip with FDI tooth chart, 15 restoration lines, shade guide and margin/occlusion specifications — print-ready A4.',
    url: 'https://cndl-global.com/lab-slip',
  },
};

export default function LabSlipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
