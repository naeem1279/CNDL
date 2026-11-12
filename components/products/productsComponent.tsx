'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import { useState, useEffect } from 'react';
import { Truck, ShieldCheck } from 'lucide-react';
import ProductCard from './ProductCard';
import SectionHeader from '@/components/ui/SectionHeader';

/**
 * Canonical catalogue — mirrors the official CNDL Physical Lab Prescription Slip exactly.
 * These `title` strings are the single source of truth and are shared with
 * app/order-create/page.tsx SERVICE_OPTIONS so /order-create?service=<title> prefills cleanly.
 */
export const LAB_SLIP_CATALOGUE = [
  // ── Category 1: Zirconia & All-Ceramic ─────────────────────────────
  {
    title: 'Zirconia Crown / Bridge',
    desc: 'Monolithic & Multilayer Aidite blanks, milled on 5-axis Roland precision and finished with authentic Shofu (Japan) glaze.',
    tag: 'Monolithic & Multilayer Aidite',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services.webp',
  },
  {
    title: 'Zirconia Inlay / Onlay',
    desc: 'Conservative, adhesive zirconium restorations with margin precision for posterior defects.',
    tag: 'Minimally Invasive',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services_1.webp',
  },
  {
    title: 'Zirconia Core / Repair',
    desc: 'Endodontic post-cores and broken-down unit rebuilds in high-strength zirconia.',
    tag: 'Post & Core',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services_2.webp',
  },
  {
    title: 'Porcelain Veneers',
    desc: 'Contact-lens thin facial veneers with lifelike translucency for anterior aesthetics.',
    tag: 'Anterior Aesthetics',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services_3.webp',
  },
  {
    title: 'IPS E-Max Restorations',
    desc: 'Lithium disilicate crowns, veneers and inlays — maximum opalescence and enamel-like wear.',
    tag: 'IPS E-Max',
    category: 'Zirconia & All-Ceramic',
    image: '/images/Services_4.webp',
  },
  // ── Category 2: Porcelain (PFM & Metal) ────────────────────────────
  {
    title: 'Porcelain Crown Regular',
    desc: 'Classic porcelain-fused-to-metal crowns on precise Co-Cr copings with natural shade matching.',
    tag: 'PFM · Regular Tier',
    category: 'Porcelain (PFM)',
    image: '/images/Services_5.webp',
  },
  {
    title: 'Porcelain Crown Special',
    desc: 'Premium PFM tier with enhanced layering and characterization for visible zones.',
    tag: 'PFM · Special Tier',
    category: 'Porcelain (PFM)',
    image: '/images/Services.webp',
  },
  {
    title: 'Porcelain Metal Bite / Facing',
    desc: 'Metal-based occlusal builds and aesthetic facings for functional posterior load.',
    tag: 'Bite / Facing',
    category: 'Porcelain (PFM)',
    image: '/images/Services_1.webp',
  },
  {
    title: 'Inlay / Onlay & Core / Repair',
    desc: 'Metal and porcelain inlay/onlay plus core build-ups and unit repairs on the PFM line.',
    tag: 'PFM Conservative',
    category: 'Porcelain (PFM)',
    image: '/images/Services_2.webp',
  },
  {
    title: 'Golden Crown / Bridge',
    desc: 'Traditional gold-alloy crowns and bridges — proven longevity and gentle antagonism.',
    tag: 'Gold Alloy',
    category: 'Porcelain (PFM)',
    image: '/images/Services_3.webp',
  },
  // ── Category 3: Dentures & Orthodontics ────────────────────────────
  {
    title: 'Removable Partial Dentures (PD)',
    desc: 'Framework-based partial dentures with precision clasp retention and balanced occlusion.',
    tag: 'Cast / Acrylic PD',
    category: 'Dentures & Ortho',
    image: '/images/Services_4.webp',
  },
  {
    title: 'Full Dentures (Heat-Cure / Self-Cure / Mesh)',
    desc: 'High-impact heat-cure acrylic & digital 3D-milled precision bases with anatomical suction fit and optional mesh reinforcement.',
    tag: 'Digital & Heat-Cure Bases',
    category: 'Dentures & Ortho',
    image: '/images/Services_5.webp',
  },
  {
    title: 'Flexible Partial Dentures (Valplast Style)',
    desc: 'Unbreakable Valplast-style nylon resin with anatomical gingival blending, lightweight comfort, and tissue-colored clasps.',
    tag: 'Unbreakable Flexible Resin',
    category: 'Dentures & Ortho',
    image: '/images/Services.webp',
  },
  {
    title: 'In-House Clear Aligners',
    desc: '100% in-house digital orthodontic staging with 8K printed models in crystal-clear medical-grade PETG.',
    tag: 'Digital Ortho',
    category: 'Dentures & Ortho',
    image: '/images/Services_1.webp',
  },
  {
    title: 'Orthodontic Appliances & Night/Mouth Guards',
    desc: 'Hawley retainers, functional appliances, and soft/hard night & mouth guards.',
    tag: 'Appliances / Guards',
    category: 'Dentures & Ortho',
    image: '/images/Services_2.webp',
  },
] as const;

const FILTERS = ['All', 'Zirconia & All-Ceramic', 'Porcelain (PFM)', 'Dentures & Ortho'] as const;

type DynamicItem = {
  id?: string;
  title: string;
  titleBn?: string | null;
  desc: string;
  tag: string;
  category: string;
  image: string;
  turnaroundDays?: number;
  warrantyYears?: number;
  basePrice?: string | null;
};

export default function ProductsComponent() {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');
  const [items, setItems] = useState<DynamicItem[]>([...LAB_SLIP_CATALOGUE]);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.services) && data.services.length > 0) {
          const mapped: DynamicItem[] = data.services.map((s: ServiceApiRow, idx: number) => {
            const fallback = LAB_SLIP_CATALOGUE.find(
              (c) => c.title.toLowerCase() === s.name.toLowerCase()
            );
            return {
              id: s.id,
              title: s.name,
              titleBn: s.nameBn,
              desc: s.description || fallback?.desc || s.specs || '',
              // G8 (2026-11-05): never render a fabricated warranty claim
              // (DB rows exist with warrantyYears = 0).
              tag:
                s.specs ||
                fallback?.tag ||
                (s.warrantyYears && s.warrantyYears > 0
                  ? `${s.warrantyYears}-Year Warranty`
                  : 'In-House Fabricated'),
              category: s.category,
              image: s.imageUrl || fallback?.image || `/images/Services${idx % 6 ? `_${idx % 6}` : ''}.webp`,
              turnaroundDays: s.turnaroundDays,
              warrantyYears: s.warrantyYears,
              basePrice: s.basePrice,
            };
          });
          setItems(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const visible =
    activeFilter === 'All'
      ? items
      : items.filter((p) => p.category === activeFilter);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container">
        <SectionHeader
          title={
            <>
              Dental Products &amp; Restorations Catalogue
              <span className="block text-[#1977C5]">Precision Lab Engineering</span>
            </>
          }
          lead="Single Source of Truth: Canonical catalogue driven directly by our dynamic laboratory database. Every product is 100% fabricated in-house across Zirconia & All-Ceramic, Porcelain (PFM), and Dual-Workflow Dentures."
        />

        {/* ================= DUAL-WORKFLOW DENTURE WING SPOTLIGHT ================= */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1977C5]/10 px-3 py-1 text-xs font-medium text-[#1668AD]">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Dual-Workflow Denture Wing · Since 2015
                </span>
                {['Dual Digital & Manual Workflows', 'High Patient Adaptation Rate', 'Unbreakable Flexible Resin'].map((chip) => (
                  <span key={chip} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
              <h3 className="secondary mt-4 text-2xl font-semibold leading-tight text-slate-900">
                Digital CAD/CAM + Master Manual Denture Craftsmanship
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                Combining high-precision digital scanning and 3D printing with 11+ years of chairside master technician finishing. Experience unmatched retention, biological chewing comfort, and rapid adaptation.
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:w-[460px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="mb-1 block text-sm font-semibold text-slate-900">Full Dentures</span>
                <p className="text-sm leading-relaxed text-slate-600">High-impact heat-cure acrylic &amp; digital 3D-milled precision bases with bilateral balanced occlusion.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="mb-1 block text-sm font-semibold text-slate-900">Flexible Partial Dentures</span>
                <p className="text-sm leading-relaxed text-slate-600">Unbreakable Valplast-style nylon resin with anatomical gingival blending &amp; invisible clasps.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10 flex items-center gap-4 rounded-2xl border border-[#1977C5]/15 bg-[#1977C5]/5 p-4 sm:p-5 md:mb-12">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1977C5] text-white">
            <Truck size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-slate-800 md:text-base">
            Fast 3-Day Turnaround across Dhaka via our Dedicated Lab Riders &amp; Pathao Logistics.
          </p>
        </div>

        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto" role="group" aria-label="Filter by category">
          {FILTERS.map((item) => {
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visible.map((item) => (
            <ProductCard key={item.id ?? item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
