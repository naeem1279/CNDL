'use client';

import { Crosshair, ShieldCheck, Truck, ScanLine } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

/**
 * Homepage "Why Choose CNDL" — header first, then 4 clinical capability cards
 * in a 1 / 2 / 4-column grid. Flat white cards with a hairline border and
 * CNDL blue (#1977C5) icon tiles.
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
    <section className="bg-white py-16 md:py-24">
      <div className="container">
        <SectionHeader
          align="center"
          eyebrow="Why CNDL"
          title={
            <>
              Why Choose CNDL for Your <br className="hidden sm:block" />
              Restorations?
            </>
          }
          lead="Four reasons dental surgeons across Dhaka and nationwide trust our fully digital workflow — from scan intake to chamber delivery."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors duration-150 hover:border-slate-300"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                  <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">{item.eyebrow}</p>
                <h3 className="secondary mt-1 text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium text-[#1668AD]">{item.stat}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
