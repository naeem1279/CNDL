'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoveRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HeroSection() {
  const [heroSrc, setHeroSrc] = useState('/images/hero-dental-cadcam.webp');
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-(--bg-muted)">
      <div className="container relative">
        <div className="w-full h-screen lg:h-[600px] flex items-center justify-center py-8 sm:py-16 lg:py-0">
          <Image
            src="/images/PattranBanner.png"
            alt="Dental Model"
            width={1000}
            height={1000}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <div className="absolute inset-0 h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-10 xl:gap-14 items-center">
          <div className="order-2 lg:order-1 text-(--text-tertiary) w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary">
              {t.hero.titleLine1}
              <br />
              {t.hero.titleLine2} <br />
              {t.hero.titleLine3} <br />
              {t.hero.titleLine4}
            </h1>

            <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 max-w-xl text-(--text-tertiary)">
              {t.hero.subtitle}
            </p>

            <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 flex gap-4 flex-wrap">
              <Link
                href="/order-create"
                className="inline-flex items-center gap-2 rounded-full bg-(--bg-tertiary) border-2 border-(--border-tertiary) px-6 py-3 text-xs md:text-sm lg:text-base xl:text-lg font-medium text-black hover:bg-(--bg-tertiary)/98 transition group"
              >
                {t.hero.getStarted} <MoveRight size={24} className="group-hover:translate-x-2 transition"/>
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border-2 border-(--border-primary) px-6 py-3 text-xs md:text-sm lg:text-base xl:text-lg font-medium text-(--text-tertiary) hover:bg-(--bg-tertiary) transition group"
              >
                {t.hero.sendCase} <MoveRight size={24} className="group-hover:translate-x-2 transition"/>
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative flex items-center justify-center w-full h-full">
            <div className="absolute inset-0 bg-[url('/images/ShapeBanner.png')] bg-contain bg-no-repeat bg-center" />

            <div className='pl-10 -pt-10'>
              <Image
                src={heroSrc}
                alt="CNDL Digital CAD/CAM Dental Laboratory"
                width={600}
                height={600}
                className="object-contain w-full h-full sm:h-[250px] md:w-[300px] md:h-[300px] lg:w-[600px] lg:h-[600px]"
                priority
                onError={() => setHeroSrc('/images/RightSiteBanner.png')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
