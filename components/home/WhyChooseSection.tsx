'use client';

import { Crosshair, ShieldCheck, Truck, ScanLine } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/ui/Reveal';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useHomeCopy } from './HomeText';

/**
 * Homepage "Why Choose CNDL": a 4-card bento (wide · narrow / narrow · wide on desktop).
 * Cards carry a cursor spotlight and reveal on scroll.
 */
const ICONS = [Crosshair, ShieldCheck, Truck, ScanLine];
const SPAN = ['lg:col-span-2', '', '', 'lg:col-span-2'];

export default function WhyChooseSection() {
  const c = useHomeCopy().why;

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container">
        <Reveal>
          <SectionHeader align="center" eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {c.features.map((item, i) => {
            const Icon = ICONS[i];
            const wide = SPAN[i] !== '';
            return (
              <Reveal key={item.title} delay={i * 80} className={SPAN[i]}>
                <SpotlightCard className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-b from-[#1977C5] to-[#1668AD] text-white shadow-md shadow-[#1977C5]/25 ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:scale-105">
                      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.eyebrow}
                    </span>
                  </div>
                  <h3 className={`secondary mt-8 font-semibold leading-snug text-slate-900 ${wide ? 'text-2xl' : 'text-xl'}`}>
                    {item.title}
                  </h3>
                  <p className={`mt-2 flex-1 leading-relaxed text-slate-600 ${wide ? 'max-w-lg text-base' : 'text-sm'}`}>{item.desc}</p>
                  <p className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#1668AD]">
                    <span className="size-1.5 rounded-full bg-[#1977C5]" aria-hidden="true" />
                    {item.stat}
                  </p>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
