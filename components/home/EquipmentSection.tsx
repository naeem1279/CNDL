'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Cog, Flame, Sparkles, Printer, ScanLine, Timer, Cpu, FileCheck, type LucideIcon } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useHomeCopy } from './HomeText';

/** Machine names stay as manufacturers write them; tag and description come from the copy file. */
const MACHINES: { title: string; icon: LucideIcon; image?: string }[] = [
  { title: 'Roland DGSHAPE DWX-52Di Plus', icon: Cog, image: '/images/lab/roland-milling-5axis.webp' },
  { title: 'UP3D F20 Sintering Furnace', icon: Flame, image: '/images/lab/up3d-furnace.webp' },
  { title: 'Cameo CFP-200 Glaze Furnace', icon: Sparkles, image: '/images/lab/cameo-shofu-glaze.webp' },
  { title: 'Phrozen Sonic 8K LCD System', icon: Printer, image: '/images/lab/phrozen-8k-printer.webp' },
  { title: 'Shining 3D DS-EX PRO Scanner', icon: ScanLine },
];
const BADGE_ICONS = [Timer, Cpu, FileCheck];

const TILE = 'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl';

/** Icon tile by default; the real lab photo fades in over it once it exists in /public/images/lab/. */
function LabImage({ src, alt, icon: Icon }: { src: string; alt: string; icon: LucideIcon }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`${TILE} bg-white/10 text-sky-300 ring-1 ring-inset ring-white/10`}>
      <Icon size={24} strokeWidth={1.75} className={loaded ? 'hidden' : ''} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default function EquipmentSection() {
  const c = useHomeCopy().equipment;

  return (
    <section className="bg-mesh-dark relative isolate overflow-hidden py-20 text-white md:py-28">
      <div className="bg-grid-fade-dark pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="container">
        <Reveal className="mb-12 flex flex-col gap-6 md:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-sky-300">{c.eyebrow}</p>
            <h2 className="secondary text-3xl font-semibold leading-tight md:text-4xl">{c.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">{c.lead}</p>
          </div>
          <Link
            href="/technology"
            className="group inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            {c.more}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {MACHINES.map((m, i) => (
            <Reveal key={m.title} delay={(i % 4) * 70}>
              <SpotlightCard
                dark
                className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors duration-300 hover:border-white/20"
              >
                {m.image ? (
                  <LabImage src={m.image} alt={m.title} icon={m.icon} />
                ) : (
                  <div className={`${TILE} bg-white/10 text-sky-300 ring-1 ring-inset ring-white/10`}>
                    <m.icon size={24} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                )}
                <h3 className="secondary mt-6 text-lg font-semibold leading-snug">{m.title}</h3>
                <p className="mt-1 text-sm font-medium text-sky-300">{c.machines[i].tag}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.machines[i].desc}</p>
              </SpotlightCard>
            </Reveal>
          ))}

          {c.badges.map((b, i) => {
            const Icon = BADGE_ICONS[i];
            return (
              <Reveal key={b.title} delay={((i + 1) % 4) * 70}>
                <div className="h-full rounded-3xl border border-[#1977C5]/40 bg-linear-to-b from-[#1977C5]/25 to-[#1977C5]/10 p-6">
                  <div className={`${TILE} bg-[#1977C5] text-white shadow-lg shadow-[#1977C5]/30`}>
                    <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <h3 className="secondary mt-6 text-lg font-semibold leading-snug">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{b.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="relative mt-12 flex min-h-44 items-center justify-center overflow-hidden rounded-3xl border border-white/10 px-6 py-10 md:min-h-56">
          <Image src="/images/CTA.jpg" alt="CNDL Global laboratory" fill sizes="(min-width: 1440px) 1296px, 90vw" className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-linear-to-r from-[#0b1220]/90 via-[#0b1220]/60 to-[#0b1220]/90" />
          <p className="secondary relative max-w-2xl text-center text-xl font-semibold leading-snug md:text-3xl">{c.strip}</p>
        </Reveal>
      </div>
    </section>
  );
}
