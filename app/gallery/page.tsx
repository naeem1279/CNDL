'use client';

import Image from 'next/image';
import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import CtaBand from '@/components/ui/CtaBand';

const FILTERS = ['All Work', 'Zirconia', 'E-max', 'PFM', 'Full Dentures'] as const;

/** `category` drives the filter chips; items without one show under "All Work" only. */
const products: { title: string; image: string; category?: (typeof FILTERS)[number] }[] = [
  { title: 'Zirconia Crowns & Bridges', image: '/images/gallery-1.jpg', category: 'Zirconia' },
  { title: 'E-max Veneers & Inlays', image: '/images/gallery-3.png', category: 'E-max' },
  { title: 'PFM & Metal Restorations', image: '/images/gallery-4.png', category: 'PFM' },
  { title: 'Cobalt-Chrome Framework', image: '/images/Services_3.png', category: 'PFM' },
  { title: 'Custom Abutment', image: '/images/Services_4.png' },
  { title: 'Malo Bridge', image: '/images/gallery-5.png' },
  { title: 'Zirconia Crowns & Bridges', image: '/images/gallery-6.jpg', category: 'Zirconia' },
  { title: 'E-max Veneers & Inlays', image: '/images/Services_1.png', category: 'E-max' },
  { title: 'PFM & Metal Restorations', image: '/images/gallery-7.jpg', category: 'PFM' },
  { title: 'Malo Bridge', image: '/images/Services_5.png' },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All Work');
  // Only offer a filter when it has work to show (e.g. no denture photos yet).
  const filters = FILTERS.filter((f) => f === 'All Work' || products.some((p) => p.category === f));
  const visible = activeFilter === 'All Work' ? products : products.filter((p) => p.category === activeFilter);

  return (
    <>
    <section>
      <PageHeader
        eyebrow="Precision in Every Restoration"
        title="CNDL Work Gallery"
        lead="Explore our portfolio of high-quality Zirconia, E-max, and PFM restorations. Each case represents our commitment to clinical excellence and aesthetic precision."
      />
      <div className="container py-12 md:py-16">
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto" role="group" aria-label="Filter by restoration">
          {filters.map((item) => {
            const active = item === activeFilter;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setActiveFilter(item)}
                aria-pressed={active}
                className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'border-[#1977C5] bg-[#1977C5] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <figure key={item.image} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="mt-3 text-base font-medium text-slate-900 md:text-lg">{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
    <CtaBand title="Like what you see? Send us your next case" lead="Every restoration is fabricated in-house in Dhaka. Submit online or chat with our team." />
    </>
  );
}
