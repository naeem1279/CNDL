import type { ReactNode } from 'react';

/**
 * Top of an inner public page: white-to-slate band with the page's h1.
 * Replaces the blue ShareHero banner (pages migrate one phase at a time).
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
    <section className="border-b border-slate-200 bg-linear-to-b from-white to-slate-50">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {eyebrow}
            </p>
          )}
          <h1 className="secondary text-3xl font-semibold leading-[1.15] text-slate-900 sm:text-4xl lg:text-5xl">{title}</h1>
          {lead && <div className="mt-5 space-y-3 text-base leading-relaxed text-slate-600 md:text-lg">{lead}</div>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
