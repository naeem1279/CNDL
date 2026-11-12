'use client';

import { Crosshair, ShieldCheck, Truck, ScanLine } from 'lucide-react';

/**
 * Homepage "Why Choose CNDL" — header first, then 4 clinical capability cards
 * in a mobile-optimized 2-column grid. Clean glassmorphism, CNDL brand blue
 * (#1977C5) accents, subtle border glow.
 */
const features = [
  {
    icon: Crosshair,
    eyebrow: 'CAD/CAM Milling',
    title: '5-Axis Sub-Micron Accuracy',
    desc: 'Roland DWX-52Di Plus wet milling delivers razor-sharp margins and repeatable, micron-level fit.',
    stat: 'DWX-52Di Plus',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Materials',
    title: 'Certified Authentic Blanks',
    desc: 'Aidite Multilayer zirconia and Shofu (Japan) ceramics — batch-traceable, never generic discs.',
    stat: 'Aidite · Shofu Japan',
  },
  {
    icon: Truck,
    eyebrow: 'Logistics',
    title: '3-Day Turnaround to Chamber',
    desc: 'Dedicated lab riders and Pathao logistics across Dhaka — from impression to chair in 72 hours.',
    stat: '72 Hours',
  },
  {
    icon: ScanLine,
    eyebrow: 'Digital Workflow',
    title: 'Open Digital Scan Integration',
    desc: 'Send direct STL/OBJ files from Medit, 3Shape or iTero — no physical impressions required.',
    stat: 'STL / OBJ Ready',
  },
];

export default function WhyChooseSection() {
  return (
    <section className="py-7 sm:py-10 md:py-20 bg-(--bg-primary)">
      <div className="container">
        {/* Section header — always above the cards */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1977C5]/25 bg-[#EAF2FA]/80 px-4 py-1.5 text-xs md:text-xs font-semibold uppercase tracking-widest text-[#1977C5]">
            Why CNDL
          </span>
          <h2 className="mt-3 md:mt-4 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-5xl font-semibold secondary leading-tight">
            Why Choose CNDL for Your <br className="hidden sm:block" />
            Restorations?
          </h2>
          <p className="mt-2 md:mt-4 text-xs sm:text-xs md:text-sm lg:text-base text-(--text-secondary)">
            Four reasons dental surgeons across Dhaka and nationwide trust our fully digital
            workflow — from scan intake to chamber delivery.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col rounded-[14px] md:rounded-[24px] border border-[#1977C5]/15 bg-white/70 backdrop-blur-md p-3.5 sm:p-5 md:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#1977C5]/40 hover:shadow-[0_16px_40px_-12px_rgba(25,119,197,0.35)]"
              >
                {/* top glow accent */}
                <span className="pointer-events-none absolute inset-x-6 -top-px h-px bg-linear-to-r from-transparent via-[#1977C5]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-start justify-between gap-2 mb-3 md:mb-5">
                  <span className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 rounded-[11px] md:rounded-[16px] bg-linear-to-br from-[#1977C5] to-[#3387CB] text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(25,119,197,0.5)] transition-transform duration-300 group-hover:scale-105">
                    <Icon className="w-[18px] h-[18px] sm:w-6 sm:h-6 md:w-[26px] md:h-[26px]" strokeWidth={1.8} />
                  </span>
                  <span className="mt-0.5 rounded-full border border-[#1977C5]/20 bg-[#EAF2FA]/80 min-w-0 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1977C5] text-right">
                    {item.eyebrow}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold secondary leading-snug">
                  {item.title}
                </h3>

                <p className="mt-1.5 md:mt-3 text-xs sm:text-xs md:text-xs lg:text-sm text-(--text-secondary) leading-relaxed flex-1">
                  {item.desc}
                </p>

                <p className="mt-2.5 md:mt-5 pt-2.5 md:pt-4 border-t border-[#1977C5]/10 text-xs sm:text-xs md:text-xs font-semibold tracking-wide text-[#1977C5]">
                  {item.stat}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
