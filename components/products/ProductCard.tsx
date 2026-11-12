'use client';

import Image from 'next/image';
import { ArrowRight, Package } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { ButtonLink } from '@/components/ui/Button';

/**
 * One product in the catalogue (home page and /products).
 * Image → one quiet meta line → title → short description → price + "Submit Case".
 * English mode shows only English, Bengali mode only Bengali (falling back to English
 * where a Bengali name is missing). Material and machine names stay as written.
 */
export type ProductCardData = {
  title: string;
  titleBn?: string | null;
  desc: string;
  /** Material / spec line, e.g. "Monolithic & Multilayer Aidite · …"; only the first part is shown. */
  tag?: string | null;
  image?: string | null;
  turnaroundDays?: number | null;
  warrantyYears?: number | null;
  basePrice?: string | null;
};

const TEXT = {
  en: {
    days: (n: string) => `${n}-day turnaround`,
    warranty: (n: string) => `${n}-yr warranty`,
    from: 'From',
    cta: 'Submit Case',
    ctaFor: (t: string) => `Submit Case: ${t}`,
  },
  bn: {
    days: (n: string) => `${n} দিনে ডেলিভারি`,
    warranty: (n: string) => `${n} বছরের ওয়ারেন্টি`,
    from: 'শুরু',
    cta: 'কেস জমা দিন',
    ctaFor: (t: string) => `কেস জমা দিন: ${t}`,
  },
};

export default function ProductCard({ item, sizes }: { item: ProductCardData; sizes?: string }) {
  const { lang } = useLanguage();
  const tx = TEXT[lang];
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  const num = (n: number) => n.toLocaleString(locale);

  const title = (lang === 'bn' && item.titleBn?.trim()) || item.title;
  const material = item.tag?.split(' · ')[0]?.trim();
  const meta = [
    material,
    item.turnaroundDays ? tx.days(num(item.turnaroundDays)) : null,
    item.warrantyYears && item.warrantyYears > 0 ? tx.warranty(num(item.warrantyYears)) : null,
  ].filter(Boolean) as string[];
  const price = Number(item.basePrice);
  const hasPrice = !!item.basePrice && Number.isFinite(price) && price > 0;
  const src = item.image;
  const unoptimized = !!src && (src.startsWith('/images/uploads') || /^https?:/.test(src));

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-2 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        {src ? (
          unoptimized ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={src}
              alt={item.title}
              fill
              sizes={sizes ?? '(min-width: 1024px) 400px, (min-width: 640px) 45vw, 90vw'}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package size={40} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
        {meta.length > 0 && (
          <p className="truncate text-xs text-slate-500" title={meta.join(' · ')}>
            {meta.join(' · ')}
          </p>
        )}
        <h3 className="secondary mt-1.5 text-lg font-semibold leading-snug tracking-[-0.01em] text-slate-900">{title}</h3>
        {item.desc && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          {hasPrice ? (
            <p className="leading-tight">
              <span className="block text-xs text-slate-500">{tx.from}</span>
              {/* ৳ keeps Noto Sans Bengali even in English: device fonts draw it small and thin next to Inter digits. */}
              <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">৳{num(price)}</span>
            </p>
          ) : (
            <span />
          )}
          <ButtonLink
            href={`/order-create?product=${encodeURIComponent(item.title)}`}
            aria-label={tx.ctaFor(title)}
            className="group/cta shrink-0 px-4"
          >
            {tx.cta}
            <ArrowRight size={16} className="transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
