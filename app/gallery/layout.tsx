import type { Metadata } from 'next';

// G1 (2026-11-05): route metadata — client pages cannot export metadata
// themselves, so a server layout provides it per segment.
export const metadata: Metadata = {
  title: 'Laboratory Gallery | CNDL Global',
  description:
    'Inside CNDL Global — Roland 5-axis milling, sintering furnaces, CAD stations and finished zirconia cases from our Khilgaon, Dhaka laboratory.',
  alternates: { canonical: 'https://cndl-global.com/gallery' },
  openGraph: {
    title: 'Laboratory Gallery | CNDL Global',
    description:
      'Inside CNDL Global — Roland 5-axis milling, sintering furnaces, CAD stations and finished zirconia cases from our Khilgaon, Dhaka laboratory.',
    url: 'https://cndl-global.com/gallery',
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
