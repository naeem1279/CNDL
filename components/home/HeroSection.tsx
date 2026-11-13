'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Crosshair, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { buttonClass } from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useHomeCopy } from './HomeText';

/** Average of approved testimonials (app/page.tsx). Shown from MIN_REVIEWS up; one or two reviews read as weak proof. */
const MIN_REVIEWS = 3;
export type RatingSummary = { average: number; count: number } | null;

export default function HeroSection({ rating = null }: { rating?: RatingSummary }) {
  const [heroSrc, setHeroSrc] = useState('/images/hero-dental-cadcam.webp');
  const { lang } = useLanguage();
  const c = useHomeCopy();
  const num = (n: number, digits = 0) =>
    n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200/70 bg-mesh-light">
      <div className="bg-grid-fade pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <div className="container grid grid-cols-1 items-center gap-12 pb-12 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-10 lg:pb-16 lg:pt-20 xl:gap-16">
        {/* ── Copy ── */}
        <div className="lg:col-span-6">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 py-1 pl-1 pr-3 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5 backdrop-blur">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1977C5] text-white">
              <ShieldCheck size={14} aria-hidden="true" />
            </span>
            <span className="min-w-0">{c.hero.eyebrow}</span>
          </p>

          <h1 className="secondary mt-6 text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            <span className="block">{c.hero.titleA}</span>
            <span className="mt-1 block bg-linear-to-r from-[#1668AD] via-[#1977C5] to-sky-500 bg-clip-text pb-1 text-transparent">
              {c.hero.titleB}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{c.hero.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/order-create"
              className={buttonClass(
                'primary',
                'lg',
                'group shadow-lg shadow-[#1977C5]/25 ring-1 ring-inset ring-white/20 hover:-translate-y-px hover:shadow-xl hover:shadow-[#1977C5]/30 transition-[background-color,transform,box-shadow]',
              )}
            >
              {c.hero.primary}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href="/contact#contact-form"
              className={buttonClass('secondary', 'lg', 'bg-white/70 backdrop-blur hover:bg-white')}
            >
              {c.hero.secondary}
            </Link>
            <Link
              href="/case-tracker"
              className="group inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-4 text-base font-medium text-slate-700 transition-colors hover:text-[#1668AD] sm:justify-start"
            >
              {c.hero.tertiary}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-8 flex flex-col gap-x-6 gap-y-2.5 text-sm text-slate-700 sm:flex-row sm:flex-wrap">
            {c.hero.points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-accent-500" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>

          {rating && rating.count >= MIN_REVIEWS && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/70 py-1.5 pl-3 pr-4 text-sm text-slate-700 backdrop-blur">
              <span className="flex gap-0.5" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.round(rating.average) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                  />
                ))}
              </span>
              <span>{c.hero.rating(num(rating.average, 1), num(rating.count), rating.count)}</span>
            </div>
          )}
        </div>

        {/* ── Visual ── */}
        <div className="relative lg:col-span-6">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-linear-to-tr from-[#1977C5]/20 via-sky-300/15 to-transparent blur-2xl" aria-hidden="true" />
          <div className="rounded-[1.75rem] border border-white/70 bg-white/50 p-2 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
              <Image
                src={heroSrc}
                alt={c.hero.imageAlt}
                fill
                sizes="(min-width: 1440px) 640px, (min-width: 1024px) 48vw, 90vw"
                className="object-cover"
                priority
                onError={() => setHeroSrc('/images/RightSiteBanner.png')}
              />
            </div>
          </div>

          <FloatCard
            className="animate-float -left-3 bottom-8 sm:-left-6"
            icon={<Crosshair size={18} aria-hidden="true" />}
            value={c.hero.floatA.value}
            label={c.hero.floatA.label}
          />
          <FloatCard
            className="animate-float-delayed -right-2 top-8 sm:-right-5"
            icon={<Truck size={18} aria-hidden="true" />}
            value={c.hero.floatB.value}
            label={c.hero.floatB.label}
          />
        </div>
      </div>

      {/* ── Proof: key figures ── */}
      <div className="container pb-10 lg:pb-14">
        <Reveal>
          {/* gap-px over a slate background draws the hairlines between cells */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/80 lg:grid-cols-4">
            {c.stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1 bg-white/85 px-5 py-5 backdrop-blur sm:px-6 sm:py-6">
                <dt className="text-sm leading-snug text-slate-600">{s.label}</dt>
                <dd className="secondary text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── Proof: hardware, materials and scanner compatibility ── */}
        <div className="mt-8">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">{c.tech.label}</p>
          <div className="marquee-mask mt-4 overflow-hidden" aria-label={c.tech.items.join(', ')} role="img">
            <div className="animate-marquee flex w-max gap-3" aria-hidden="true">
              {[...c.tech.items, ...c.tech.items].map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="whitespace-nowrap rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatCard({ className, icon, value, label }: { className: string; icon: React.ReactNode; value: string; label: string }) {
  return (
    <div
      className={`absolute hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/80 py-2.5 pl-2.5 pr-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur-md sm:flex ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#1977C5] text-white">{icon}</span>
      <span className="leading-tight">
        <span className="block text-base font-semibold text-slate-900">{value}</span>
        <span className="block text-xs text-slate-600">{label}</span>
      </span>
    </div>
  );
}
