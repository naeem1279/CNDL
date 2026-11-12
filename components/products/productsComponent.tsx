'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Truck, FileCheck2, ShieldCheck, FileText, BookOpen } from 'lucide-react';

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
    <section className="py-7 sm:py-10 md:py-20">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-14">
          <div className="space-y-3">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold secondary max-w-2xl leading-tight">
              Dental Products &amp; Restorations Catalogue
              <br />
              <span className="text-[#1977C5]">Precision Lab Engineering</span>
            </div>
            <p className="text-xs md:text-xs lg:text-base text-(--text-secondary) max-w-md">
              Single Source of Truth: Canonical catalogue driven directly by our dynamic laboratory database.
              Every product is 100% fabricated in-house across Zirconia &amp; All-Ceramic, Porcelain (PFM), and Dual-Workflow Dentures.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:gap-4 max-w-[340px]">
            <p className="text-sm md:text-base lg:text-lg xl:text-xl font-medium">
              Ready to send a case? Submit online or print our official lab slip.
            </p>
            <div className="flex flex-wrap items-center gap-2 w-full">
              <Link
                href="/order-create"
                className="inline-flex items-center justify-center rounded-full bg-(--bg-muted) px-5 py-2.5 text-xs md:text-xs lg:text-sm font-medium text-(--text-tertiary) hover:bg-(--bg-muted)/98 transition text-center shadow-xs"
              >
                Order Online
              </Link>
              <Link
                href="/prep-guide"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-xs md:text-xs lg:text-sm font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition text-center shadow-xs"
              >
                <BookOpen size={14} />
                Clinical Prep Guide
              </Link>
              <Link
                href="/lab-slip"
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[#1977C5] bg-white px-4 py-2 text-xs md:text-xs lg:text-sm font-semibold text-[#1977C5] hover:bg-[#1977C5] hover:text-white transition text-center shadow-xs"
              >
                <FileText size={14} />
                Open Printable Lab Slip
              </Link>
            </div>
          </div>
        </div>

        {/* ================= DUAL-WORKFLOW DENTURE WING SPOTLIGHT ================= */}
        <div className="mb-8 sm:mb-10 md:mb-12 rounded-[16px] md:rounded-[24px] bg-linear-to-r from-slate-900 via-[#13324d] to-slate-900 border border-blue-500/20 p-6 sm:p-8 md:p-10 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs md:text-xs font-semibold text-blue-300">
                  <ShieldCheck size={13} />
                  Dual-Workflow Denture Wing · Since 2015
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs md:text-xs font-semibold text-emerald-300">
                  Dual Digital &amp; Manual Workflows
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 text-xs md:text-xs font-semibold text-cyan-300">
                  High Patient Adaptation Rate
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-xs md:text-xs font-semibold text-purple-300">
                  Unbreakable Flexible Resin
                </span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white">
                Digital CAD/CAM + Master Manual Denture Craftsmanship
              </h3>
              <p className="text-xs md:text-sm lg:text-base text-slate-300 leading-relaxed">
                Combining high-precision digital scanning and 3D printing with 11+ years of chairside master technician finishing. Experience unmatched retention, biological chewing comfort, and rapid adaptation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-[460px] shrink-0">
              <div className="rounded-[12px] bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                <span className="text-xs font-semibold text-blue-400 block mb-1">Full Dentures</span>
                <p className="text-xs text-slate-300 leading-relaxed">High-impact heat-cure acrylic &amp; digital 3D-milled precision bases with bilateral balanced occlusion.</p>
              </div>
              <div className="rounded-[12px] bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                <span className="text-xs font-semibold text-emerald-400 block mb-1">Flexible Partial Dentures</span>
                <p className="text-xs text-slate-300 leading-relaxed">Unbreakable Valplast-style nylon resin with anatomical gingival blending &amp; invisible clasps.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[10px] md:rounded-[16px] bg-(--bg-muted) text-(--text-tertiary) p-4 sm:p-5 mb-8 sm:mb-10 md:mb-12 lg:mb-14">
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] bg-white/20 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </span>
          <p className="text-xs md:text-xs lg:text-base font-semibold">
            Fast 3-Day Turnaround across Dhaka via our Dedicated Lab Riders &amp; Pathao Logistics.
          </p>
        </div>

        <div className="flex gap-2 md:gap-4 items-center flex-col md:flex-row w-full mb-8 sm:mb-10 md:mb-12 lg:mb-14 xl:mb-16">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveFilter(item)}
              aria-pressed={item === activeFilter}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-xs md:text-xs lg:text-base font-medium ${
                item === activeFilter
                  ? 'bg-(--bg-tertiary) hover:bg-(--bg-tertiary)/98 border-(--border-tertiary) text-(--text-tertiary)'
                  : 'border-(--border-primary) hover:bg-(--bg-tertiary)/98 hover:border-(--border-tertiary) hover:text-(--text-tertiary)'
              } transition duration-200 border-2  w-full cursor-pointer`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {visible.map((item) => (
            <div key={item.id ?? item.title} className="bg-(--bg-secondary) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] group flex flex-col">
              <div className="relative h-[220px]">
                <div className="relative h-full w-full overflow-hidden  rounded-t-[10px] md:rounded-t-[16px] lg:rounded-t-[24px]">
                  <div className="h-full w-full transition-transform duration-300 group-hover:scale-110">
                    {item.image.startsWith('/images/uploads') ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                </div>

                <div className="absolute -bottom-8 left-8 w-16 h-16 rounded-[16px] bg-(--bg-muted) flex items-center justify-center shadow text-2xl text-(--text-primary)">
                  <Image
                    src="/icon/Dental 03.svg"
                    alt="Dental-icon"
                    width={1000}
                    height={1000}
                    className="object-cover w-[40px] h-[40px]"
                  />
                </div>
              </div>

              <div className="p-8 pt-16 flex flex-col flex-1">
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-[#1977C5]">
                  {item.category}
                </span>
                <div className="mt-1.5 text-base md:text-lg lg:text-xl xl:text-2xl">{item.title}</div>
                <div className="mt-2 flex items-center flex-wrap gap-2">
                  <span className="inline-flex items-center self-start rounded-full bg-(--bg-tertiary)/15 px-3 py-1 text-xs md:text-xs font-semibold text-[#4d7220]">
                    {item.tag}
                  </span>
                  {item.turnaroundDays && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-[#1977C5] px-2.5 py-0.5 text-xs font-semibold">
                      {item.turnaroundDays}d Turnaround
                    </span>
                  )}
                  {item.basePrice && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
                      From ৳{item.basePrice}
                    </span>
                  )}
                </div>
                <p className="mt-2 sm:mt-3 md:mt-4 text-xs md:text-xs lg:text-base text-(--text-secondary)">
                  {item.desc}
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href={`/order-create?product=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-full border-2 border-[#1977C5] px-5 py-2.5 text-xs md:text-xs lg:text-sm font-semibold text-[#1977C5] hover:bg-[#1977C5] hover:text-white transition-colors duration-200"
                  >
                    <FileCheck2 size={15} />
                    Submit Case for This Item
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
