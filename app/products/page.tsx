import type { Metadata } from 'next';
import ShareHero from '@/components/share/ShareHero';
import ProductsComponent from '@/components/products/productsComponent';
import FAQSection from '@/components/home/FAQSection';
import ProcessSection from '@/components/home/ProcessSection';

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
  },
};

function ProductsPage() {
  return (
    <section>
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          Comprehensive Dental
          <br />
          Lab Services for Dentists
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4  text-(--text-tertiary)">
          From Zirconia to Flexible Dentures – precise and consistent quality you can rely on.
        </p>
      </ShareHero>
      <ProductsComponent />
      <ProcessSection />
      <FAQSection cta={false} />
    </section>
  );
}

export default ProductsPage;
