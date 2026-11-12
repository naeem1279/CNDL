import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/seo';

// G1 (2026-11-05): route metadata — client pages cannot export metadata
// themselves, so a server layout provides it per segment.
export const metadata: Metadata = {
  title: 'Submit a Dental Case Online | CNDL Global',
  description:
    'Send your dental case in 4 steps — clinic details, STL/OBJ scan upload, shade selection and trial & insertion dates. Guaranteed 3–4 working day turnaround.',
  alternates: { canonical: 'https://cndl-global.com/order-create' },
  openGraph: {
    title: 'Submit a Dental Case Online | CNDL Global',
    description:
      'Send your dental case in 4 steps — clinic details, STL/OBJ scan upload, shade selection and trial & insertion dates. Guaranteed 3–4 working day turnaround.',
    url: 'https://cndl-global.com/order-create',
    images: [OG_IMAGE],
  },
};

export default function OrderCreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
