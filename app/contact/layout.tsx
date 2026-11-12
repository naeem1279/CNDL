import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/seo';

// G1 (2026-11-05): route metadata — client pages cannot export metadata
// themselves, so a server layout provides it per segment.
export const metadata: Metadata = {
  title: 'Contact CNDL Global | Dental Laboratory Dhaka',
  description:
    'Call, WhatsApp or visit CNDL Global in Khilgaon, Dhaka. One-tap phone numbers, lab address, email and a direct message form for pricing and case inquiries.',
  alternates: { canonical: 'https://cndl-global.com/contact' },
  openGraph: {
    title: 'Contact CNDL Global | Dental Laboratory Dhaka',
    description:
      'Call, WhatsApp or visit CNDL Global in Khilgaon, Dhaka. One-tap phone numbers, lab address, email and a direct message form for pricing and case inquiries.',
    url: 'https://cndl-global.com/contact',
    images: [OG_IMAGE],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
