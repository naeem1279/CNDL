'use client';

import Image from 'next/image';
import { useState } from 'react';
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

/** Renders the styled icon tile by default; the real lab photo fades in over it
 *  as soon as it exists in /public/images/lab/ (checked on every page load). */
function LabImage({ src, alt, icon: Icon }: { src: string; alt: string; icon: LucideIcon }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[11px] md:rounded-[16px] overflow-hidden shadow mb-3 sm:mb-4 md:mb-6 bg-(--bg-muted) flex items-center justify-center text-(--text-tertiary)">
      <Icon className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 ${loaded ? 'hidden' : ''}`} strokeWidth={1.75} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function EquipmentSection() {
  return (
    <section className="py-7 sm:py-10 md:py-20 bg-(--bg-primary)">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-14">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold secondary max-w-2xl">
            Advanced Equipment,
            <br />
            Certified Quality
          </div>

          <p className="text-xs md:text-xs lg:text-base text-(--text-secondary) w-full lg:max-w-md">
            We invest in authentic Japanese and global digital dentistry hardware so every case is
            designed, milled and finished in-house with sub-micron precision.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {equipment.map((item, index) => (
            <div
              key={index}
              className="bg-(--bg-secondary) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] p-4 sm:p-6 md:p-8 transition-all duration-300 hover:scale-105"
            >
              {item.image ? (
                <LabImage src={item.image} alt={item.title} icon={item.icon} />
              ) : (
                <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[11px] md:rounded-[16px] bg-(--bg-muted) flex items-center justify-center shadow text-(--text-tertiary) mb-3 sm:mb-4 md:mb-6">
                  <item.icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" strokeWidth={1.75} />
                </div>
              )}

              <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl secondary leading-snug">{item.title}</div>
              <div className="mt-1 text-xs sm:text-xs md:text-xs text-(--text-muted) font-medium">{item.tag}</div>
              <p className="mt-1 sm:mt-2 md:mt-3 text-xs sm:text-xs md:text-xs lg:text-base text-(--text-secondary)">
                {item.desc}
              </p>
            </div>
          ))}

          {badges.map((item, index) => (
            <div
              key={index}
              className="bg-(--bg-muted) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] p-4 sm:p-6 md:p-8 text-(--text-tertiary) transition-all duration-300 hover:scale-105"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[11px] md:rounded-[16px] bg-white/90 text-(--text-primary) flex items-center justify-center shadow mb-3 sm:mb-4 md:mb-6">
                <item.icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" strokeWidth={1.75} />
              </div>

              <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl secondary leading-snug">{item.title}</div>
              <p className="mt-1 sm:mt-2 md:mt-3 text-xs sm:text-xs md:text-xs lg:text-base text-white/80">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="relative h-[160px] md:h-[220px] mt-14 rounded-[10px] md:rounded-[16px] lg:rounded-[24px] overflow-hidden">
          <Image
            src="/images/CTA.jpg"
            alt="CNDL Global laboratory"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#226AB46B] to-[#3387CB]" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold secondary text-(--text-tertiary)">
              Every restoration crafted in-house on certified digital hardware.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
