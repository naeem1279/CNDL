'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Truck, FileCheck2, Package } from 'lucide-react';

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
    <section className="py-7 sm:py-10 md:py-20 bg-(--bg-secondary)">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1977C5]/10 border border-[#1977C5]/20 px-3.5 py-1 text-[11px] font-bold text-[#1977C5] uppercase tracking-wider mb-3">
              <Package size={13} />
              প্রোডাক্ট ক্যাটালগ · Product Catalogue
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary max-w-2xl leading-tight">
              Our Dental Products &amp; Restorations
            </h2>
          </div>

          <div className="flex flex-col items-start lg:items-end justify-end gap-4">
            <p className="text-[10px] md:text-xs lg:text-base text-(--text-secondary) w-full lg:max-w-md">
              Single Source of Truth: Directly synchronized with our active laboratory database — Zirconia &amp; All-Ceramic, Porcelain
              (PFM), and Dentures &amp; Orthodontics.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full bg-(--bg-tertiary)/15 px-4 py-2 text-[10px] md:text-xs font-bold text-[#4d7220]">
              <Truck size={14} />
              3-Day Rider Delivery across Dhaka
            </div>

            <Link
              href="/products"
              className="inline-flex items-center rounded-full bg-(--bg-tertiary) px-6 py-3 text-[10px] md:text-xs lg:text-base font-medium text-(--text-tertiary) hover:bg-(--bg-tertiary)/98 transition"
            >
              View Full Products Catalogue
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {products.map((item) => (
            <div
              key={item.id || item.title}
              className="bg-(--bg-primary) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] group flex flex-col overflow-hidden border border-(--border-primary)/60 shadow-xs"
            >
              <div className="relative h-[220px] bg-slate-100 overflow-hidden">
                <div className="relative h-full w-full overflow-hidden rounded-t-[10px] md:rounded-t-[16px] lg:rounded-t-[24px]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                      <Package size={40} />
                      <span className="text-xs font-bold mt-2">CNDL Dental Restoration</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 shrink-0 rounded-[8px] bg-[#1977C5]/10 flex items-center justify-center">
                      <Image
                        src="/icon/Dental 03.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="object-contain w-3.5 h-3.5"
                      />
                    </span>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1977C5] truncate">
                      {item.category}
                    </span>
                  </div>
                  {/* `> 0`, not truthiness: a 0 would render as a stray "0". */}
                  {!!item.warrantyYears && item.warrantyYears > 0 && (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">
                      {item.warrantyYears}y Warranty
                    </span>
                  )}
                </div>

                <div className="mt-1.5 text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                  {item.title}
                  {item.titleBn && (
                    <span className="block text-xs font-normal text-(--text-secondary) mt-0.5">
                      {item.titleBn}
                    </span>
                  )}
                </div>

                <p className="mt-1 sm:mt-2 md:mt-3 text-[10px] md:text-xs lg:text-base text-(--text-secondary) line-clamp-3">
                  {item.desc}
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href={`/order-create?product=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-full border-2 border-[#1977C5] px-5 py-2.5 text-[10px] md:text-xs lg:text-sm font-bold text-[#1977C5] hover:bg-[#1977C5] hover:text-white transition-colors duration-200"
                  >
                    <FileCheck2 size={15} />
                    Order / Submit Case
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
