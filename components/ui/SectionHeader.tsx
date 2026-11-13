import type { ReactNode } from 'react';

/**
 * Public-site section heading: optional eyebrow, an h2 and an optional lead.
 * One scale everywhere so every section reads the same way:
 * eyebrow 14/500 blue · title 30→36px/600 · lead 16→18px slate-600.
 */
type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  /** Right-hand slot on wide screens (e.g. a "view all" button). */
  action?: ReactNode;
  className?: string;
};

export default function SectionHeader({ eyebrow, title, lead, align = 'left', action, className = '' }: Props) {
  const centered = align === 'center';
  return (
    <div
      className={`mb-10 flex flex-col gap-6 md:mb-12 ${
        action ? 'lg:flex-row lg:items-end lg:justify-between' : ''
      } ${centered ? 'items-center text-center' : ''} ${className}`}
    >
      <div className={centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#1668AD]">
            <span aria-hidden className="bar-brand h-1 w-8 shrink-0 rounded-full" />
            {eyebrow}
          </p>
        )}
        <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">{title}</h2>
        {lead && <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
