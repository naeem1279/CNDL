'use client';

import Image from 'next/image';
import { useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { Cog, Flame, Sparkles, Printer, ScanLine, Timer, Cpu, FileCheck, type LucideIcon } from 'lucide-react';

const equipment = [
  {
    title: 'Roland DGSHAPE DWX-52Di Plus',
    tag: 'Made in Japan',
    desc: '5-axis dry dental milling with sub-micron marginal adaptation for monolithic and multilayer zirconia.',
    icon: Cog,
    image: '/images/lab/roland-milling-5axis.webp',
  },
  {
    title: 'UP3D F20 Sintering Furnace',
    tag: 'Zirconia Sintering',
    desc: 'High-translucency precision temperature profiling for ultra-aesthetic restorations.',
    icon: Flame,
    image: '/images/lab/up3d-furnace.webp',
  },
  {
    title: 'Cameo CFP-200 Glaze Furnace',
    tag: 'Shofu Glaze, Japan',
    desc: 'Authentic Japanese Shofu glaze with a 900°C curve for natural vitality, enamel-like fluorescence and wear resistance.',
    icon: Sparkles,
    image: '/images/lab/cameo-shofu-glaze.webp',
  },
  {
    title: 'Phrozen Sonic 8K LCD System',
    tag: '3D Printing',
    desc: 'In-house ultra-high resolution models, working dies and surgical guides.',
    icon: Printer,
    image: '/images/lab/phrozen-8k-printer.webp',
  },
  {
    title: 'Shining 3D DS-EX PRO Scanner',
    tag: 'Digitization',
    desc: 'Micron-accurate digitization of physical models and impressions.',
    icon: ScanLine,
  },
];

const badges = [
  {
    title: '3 - 4 Working Days Turnaround',
    desc: 'Fast, dependable delivery across Dhaka and nationwide.',
    icon: Timer,
  },
  {
    title: '100% In-House Digital Production',
    desc: 'CAD design, CAM milling, 3D printing and staining/glazing under one roof.',
    icon: Cpu,
  },
  {
    title: 'Open STL / Digital Scan Acceptance',
    desc: 'Direct integration with Medit, 3Shape, iTero and Carestream.',
    icon: FileCheck,
  },
];

const TILE = 'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl';

/** Renders the styled icon tile by default; the real lab photo fades in over it
 *  as soon as it exists in /public/images/lab/ (checked on every page load). */
function LabImage({ src, alt, icon: Icon }: { src: string; alt: string; icon: LucideIcon }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`${TILE} bg-[#1977C5]/10 text-[#1668AD]`}>
      <Icon size={24} strokeWidth={1.75} className={loaded ? 'hidden' : ''} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function EquipmentSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container">
        <SectionHeader
          title={
            <>
              Advanced Equipment,
              <br />
              Certified Quality
            </>
          }
          lead="We invest in authentic Japanese and global digital dentistry hardware so every case is designed, milled and finished in-house with sub-micron precision."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {equipment.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              {item.image ? (
                <LabImage src={item.image} alt={item.title} icon={item.icon} />
              ) : (
                <div className={`${TILE} bg-[#1977C5]/10 text-[#1668AD]`}>
                  <item.icon size={24} strokeWidth={1.75} aria-hidden="true" />
                </div>
              )}
              <h3 className="secondary mt-5 text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm font-medium text-[#1668AD]">{item.tag}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}

          {badges.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#1977C5]/15 bg-[#1977C5]/5 p-6">
              <div className={`${TILE} bg-[#1977C5] text-white`}>
                <item.icon size={24} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="secondary mt-5 text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-12 flex min-h-40 items-center justify-center overflow-hidden rounded-2xl px-6 py-10 md:min-h-52">
          <Image src="/images/CTA.jpg" alt="CNDL Global laboratory" fill sizes="(min-width: 1440px) 1296px, 90vw" className="object-cover" />
          <div className="absolute inset-0 bg-slate-900/65" />
          <p className="secondary relative max-w-2xl text-center text-xl font-semibold leading-snug text-white md:text-2xl">
            Every restoration crafted in-house on certified digital hardware.
          </p>
        </div>
      </div>
    </section>
  );
}
