import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Public-site button. One look everywhere:
 * - primary: solid CNDL blue, for the one main action in a section
 * - secondary: white with a slate border, for the alternative action
 * - ghost: text only, for low-emphasis actions
 * Sizes keep every target at least 44px tall (touch guideline).
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';
type Size = 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1977C5]/40 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-[#1977C5] text-white hover:bg-[#1668AD] active:bg-[#13558C]',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  /** White button for use on a blue or dark band. */
  inverse: 'bg-white text-[#13558C] hover:bg-slate-100 active:bg-slate-200',
};
const SIZE: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${extra}`.trim();
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({ variant, size, className, children, type = 'button', ...rest }: Common & ComponentProps<'button'>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
