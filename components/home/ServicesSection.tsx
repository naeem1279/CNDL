'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ArrowRight, Truck, FileCheck2, Package } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useHomeCopy } from './HomeText';

type ProductCard = {
  id?: string;
  title: string;
  titleBn?: string | null;
  desc: string;
  category: string;
  image?: string | null;
  imageUrl?: string | null;
  turnaroundDays?: number;
  warrantyYears?: number;
  basePrice?: string | null;
};

/**
 * Initial fallback products — kept in sync with the canonical 1:1 database items
 * so initial server/client hydration is instantaneous and never flashes empty.
 */
const INITIAL_PRODUCTS: ProductCard[] = [
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
  const [products, setProducts] = useState<ProductCard[]>(INITIAL_PRODUCTS);
  const c = useHomeCopy().services;

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.services) && data.services.length > 0) {
          const mapped: ProductCard[] = data.services.map((s: ServiceApiRow, idx: number) => {
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
            <Reveal
              key={item.id || item.title}
              delay={(i % 3) * 80}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                    <Package size={40} aria-hidden="true" />
                    <span className="mt-2 text-xs font-medium">CNDL Dental Restoration</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-[#1668AD]">
                    {item.category}
                  </span>
                  {/* `> 0`, not truthiness: a 0 would render as a stray "0". */}
                  {!!item.warrantyYears && item.warrantyYears > 0 && (
                    <span className="shrink-0 text-xs text-slate-500">{c.warranty(item.warrantyYears)}</span>
                  )}
                </div>

                <h3 className="secondary mt-2 text-xl font-semibold leading-snug text-slate-900">
                  {item.title}
                  {item.titleBn && (
                    <span className="mt-0.5 block text-sm font-normal tracking-normal text-slate-500">{item.titleBn}</span>
                  )}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>

                <div className="mt-auto pt-6">
                  <ButtonLink
                    href={`/order-create?product=${encodeURIComponent(item.title)}`}
                    variant="secondary"
                    className="w-full"
                  >
                    <FileCheck2 size={16} aria-hidden="true" />
                    {c.order}
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
