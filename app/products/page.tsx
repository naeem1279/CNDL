import type { Metadata } from 'next';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import ProductsComponent from '@/components/products/productsComponent';
import FAQSection from '@/components/home/FAQSection';
import ProcessSection from '@/components/home/ProcessSection';
import { OG_IMAGE } from '@/lib/seo';

// G1 (2026-11-05): unique per-page metadata (was inheriting the homepage title).
export const metadata: Metadata = {
  title: 'Dental Products & Restorations Catalogue | CNDL Global',
  description:
    'Zirconia crowns & bridges, E-max veneers, PFM, flexible dentures and clear aligners — 15 canonical lab lines, 100% fabricated in-house in Dhaka.',
  alternates: { canonical: 'https://cndl-global.com/products' },
  openGraph: {
    title: 'Dental Products & Restorations Catalogue | CNDL Global',
    description:
      'Zirconia crowns & bridges, E-max veneers, PFM, flexible dentures and clear aligners — 15 canonical lab lines, 100% fabricated in-house in Dhaka.',
    url: 'https://cndl-global.com/products',
    images: [OG_IMAGE],
  },
};

function ProductsPage() {
  return (
    <section>
      <PageHeader
        title={
          <>
            Comprehensive Dental
            <br className="hidden sm:block" /> Lab Services for Dentists
          </>
        }
        lead="From Zirconia to Flexible Dentures – precise and consistent quality you can rely on."
      >
        <p className="mb-4 text-sm font-medium text-slate-700">
          Ready to send a case? Submit online or print our official lab slip.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/order-create" size="lg">
            Order Online
            <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/prep-guide" variant="secondary" size="lg">
            <BookOpen size={18} aria-hidden="true" />
            Clinical Prep Guide
          </ButtonLink>
          <ButtonLink href="/lab-slip" target="_blank" variant="secondary" size="lg">
            <FileText size={18} aria-hidden="true" />
            Open Printable Lab Slip
          </ButtonLink>
        </div>
      </PageHeader>
      <ProductsComponent />
      <ProcessSection />
      <FAQSection cta={false} />
    </section>
  );
}

export default ProductsPage;
