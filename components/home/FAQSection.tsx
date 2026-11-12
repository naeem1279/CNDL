'use client';

import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { useHomeCopy } from './HomeText';

/**
 * Clinical FAQ (home and /products) with an optional closing call to action.
 * The FAQPage structured data in app/page.tsx is separate and stays English + its own Bengali entries.
 */
export default function FAQSection({ cta = true }: { cta?: boolean }) {
  const copy = useHomeCopy();
  const [active, setActive] = useState<number>(0);

  // Slate on the home page; white where it follows the slate Process section (/products).
  return (
    <section className={`py-20 md:py-28 ${cta ? 'border-y border-slate-200 bg-slate-50' : 'bg-white'}`}>
      <div className="container">
        {cta ? (
          // The page's one blue band: the closing call to action.
          <Reveal className="bg-mesh-brand relative isolate mb-20 overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white shadow-2xl shadow-[#1977C5]/20 sm:px-10 md:mb-28 md:py-20">
            <div className="bg-grid-fade-dark pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
            <div className="mx-auto max-w-3xl">
              <h2 className="secondary text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">{copy.cta.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{copy.cta.lead}</p>

              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/order-create" variant="inverse" size="lg" className="group shadow-lg shadow-slate-900/20">
                  {copy.cta.primary}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </ButtonLink>

                <a
                  href="https://wa.me/8801743167963"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-base font-medium text-white backdrop-blur transition-colors duration-150 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1977C5]"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  {copy.cta.secondary}
                </a>
              </div>
            </div>
          </Reveal>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-16">
          <Reveal className="lg:sticky lg:top-32">
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">{copy.faq.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{copy.faq.lead}</p>
          </Reveal>

          <Reveal delay={80} className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white lg:col-span-2">
            {copy.faq.items.map((item, i) => {
              const isOpen = active === i;
              const panelId = `faq-panel-${i + 1}`;
              return (
                <div key={panelId} className={`transition-colors ${isOpen ? 'bg-slate-50/60' : ''}`}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setActive(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex min-h-14 w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                    >
                      <span className="secondary text-base font-medium text-slate-900 md:text-lg">{item.q}</span>
                      <span
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-300 ${
                          isOpen ? 'rotate-180 border-[#1977C5] bg-[#1977C5] text-white' : 'border-slate-200 text-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-base leading-relaxed text-slate-600 md:px-6 md:pb-6">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
