import type { ReactNode } from 'react';
import Reveal from '@/components/ui/Reveal';

/**
 * Top of every inner public page: the same soft mesh and faded grid as the home hero,
 * with the eyebrow, h1, lead and actions fading in one after another.
 */
type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons or links under the lead. */
  children?: ReactNode;
};

export default function PageHeader({ eyebrow, title, lead, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 bg-mesh-light">
      <div aria-hidden className="bg-grid-fade pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="bar-brand absolute inset-x-0 bottom-0 h-1" />
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          {eyebrow && (
            <Reveal>
              <p className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent-400" />
                {eyebrow}
              </p>
            </Reveal>
          )}
          <Reveal delay={60}>
            <h1 className="secondary text-3xl font-semibold leading-[1.15] text-slate-900 sm:text-4xl lg:text-5xl">{title}</h1>
          </Reveal>
          {lead && (
            <Reveal delay={120}>
              <div className="mt-5 space-y-3 text-base leading-relaxed text-slate-600 md:text-lg">{lead}</div>
            </Reveal>
          )}
          {children && (
            <Reveal delay={180}>
              <div className="mt-8">{children}</div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
