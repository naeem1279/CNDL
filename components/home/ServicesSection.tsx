'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import { useState, useEffect } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useHomeCopy } from './HomeText';

type HomeProduct = {
  id?: string;
  title: string;
  titleBn?: string | null;
  desc: string;
  category: string;
  image?: string | null;
  imageUrl?: string | null;
  /** Material / spec line from the catalogue (first part shows in the card's meta line). */
  tag?: string | null;
  turnaroundDays?: number;
  warrantyYears?: number;
  basePrice?: string | null;
};

/**
 * Initial fallback products — kept in sync with the canonical 1:1 database items
 * so initial server/client hydration is instantaneous and never flashes empty.
 */
const INITIAL_PRODUCTS: HomeProduct[] = [
  {
    title: 'Zirconia Crown / Bridge',
    desc: 'Monolithic & Multilayer Aidite blanks, 5-axis Roland milling and authentic Shofu (Japan) glaze finish.',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services.webp',
  },
  {
    title: 'IPS E-Max Restorations',
    desc: 'Lithium disilicate crowns & veneers — superior translucency for anterior aesthetics.',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services_1.webp',
  },
  {
    title: 'Porcelain Crown Regular',
    desc: 'Classic PFM on precise Co-Cr copings with natural shade matching. Regular & Special tiers.',
    category: 'Porcelain (PFM)',
    image: '/images/Services_2.webp',
  },
  {
    title: 'Removable Partial Dentures (PD)',
    desc: 'Framework-based partials with precision clasp retention and balanced occlusion.',
    category: 'Dentures & Ortho',
    image: '/images/Services_3.webp',
  },
  {
    title: 'Flexible Partial Dentures (Valplast Style)',
    desc: 'Lightweight nylon resin with natural pink aesthetics and unbreakable flexibility.',
    category: 'Dentures & Ortho',
    image: '/images/Services_3.webp',
  },
  {
    title: 'In-House Clear Aligners',
    desc: '100% in-house digital orthodontic staging with 8K printed models in medical-grade PETG.',
    category: 'Dentures & Ortho',
    image: '/images/Services_4.webp',
  },
];

export default function ServicesSection() {
  const [products, setProducts] = useState<HomeProduct[]>(INITIAL_PRODUCTS);
  const c = useHomeCopy().services;

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.services) && data.services.length > 0) {
          const mapped: HomeProduct[] = data.services.map((s: ServiceApiRow, idx: number) => {
            const fallback = INITIAL_PRODUCTS.find(
              (p) => p.title.toLowerCase() === s.name.toLowerCase()
            );
            return {
              id: s.id,
              title: s.name,
              titleBn: s.nameBn,
              desc: s.description || fallback?.desc || s.specs || 'Precision dental restoration engineered to international clinical standards.',
              category: s.category,
              imageUrl: s.imageUrl || null,
              tag: s.specs || null,
              image: s.imageUrl || fallback?.image || `/images/Services${idx % 6 ? `_${idx % 6}` : ''}.webp`,
              turnaroundDays: s.turnaroundDays,
              warrantyYears: s.warrantyYears,
              basePrice: s.basePrice,
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {
        // graceful fallback to static initial list
      });
  }, []);

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow={c.eyebrow}
          title={c.title}
          lead={c.lead}
          action={
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Truck size={16} className="text-[#1977C5]" aria-hidden="true" />
                {c.delivery}
              </p>
              <ButtonLink href="/products">
                {c.viewAll}
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {products.map((item, i) => (
            <Reveal key={item.id || item.title} delay={(i % 3) * 80} className="h-full">
              <ProductCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
