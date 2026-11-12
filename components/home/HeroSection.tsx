'use client';

import Image from 'next/image';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ButtonLink } from '@/components/ui/Button';

export default function HeroSection() {
  const [heroSrc, setHeroSrc] = useState('/images/hero-dental-cadcam.webp');
  const { t } = useLanguage();

  return (
    <section className="border-b border-slate-200 bg-linear-to-b from-white to-slate-50">
      <div className="container grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20 xl:gap-16">
        <div>
          <p className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck size={14} className="shrink-0 text-[#1977C5]" aria-hidden="true" />
            <span className="min-w-0">{t.footer.servingSince}</span>
          </p>

          <h1 className="secondary mt-5 text-3xl font-semibold leading-[1.15] text-slate-900 sm:text-4xl lg:text-5xl">
            <span className="block">
              {t.hero.titleLine1} {t.hero.titleLine2}
            </span>
            <span className="mt-1 block text-[#1977C5]">
              {t.hero.titleLine3} {t.hero.titleLine4}
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/order-create" size="lg" className="group">
              {t.hero.getStarted}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              {t.hero.sendCase}
            </ButtonLink>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <Image
            src={heroSrc}
            alt="CNDL Digital CAD/CAM Dental Laboratory"
            fill
            sizes="(min-width: 1440px) 640px, (min-width: 1024px) 45vw, 90vw"
            className="object-cover"
            priority
            onError={() => setHeroSrc('/images/RightSiteBanner.png')}
          />
        </div>
      </div>
    </section>
  );
}
