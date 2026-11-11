'use client';
/**
 * CNDL admin UI kit — the only place admin controls get their look.
 * Neutrals: zinc. Interactive accent: brand (CNDL blue). State colours
 * (emerald / amber / rose) are for meaning, never decoration.
 * Type tokens (globals.css): text-meta 12 · text-table 13 · text-body 14 ·
 * text-title 16 · text-page 20 · text-kpi 28.
 */
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Icon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border border-brand-600 hover:border-brand-700',
  secondary: 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300',
  ghost: 'text-zinc-600 border border-transparent hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 hover:border-rose-700',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 gap-1.5 text-table',
  md: 'h-9 px-3.5 gap-2 text-body',
};
const BASE =
  'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', extra?: string) {
  return cx(BASE, VARIANT[variant], SIZE[size], extra);
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: Icon }
>(function Button({ variant = 'secondary', size = 'md', icon: I, className, children, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {I && <I size={size === 'sm' ? 14 : 16} className="shrink-0" />}
      {children}
    </button>
  );
});

/** Square icon-only button; `label` becomes the accessible name and tooltip. */
export function IconButton({
  icon: I,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: Icon; label: string; variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(BASE, VARIANT[variant], size === 'sm' ? 'h-8 w-8' : 'h-9 w-9', className)}
      {...rest}
    >
      <I size={16} />
    </button>
  );
}

/* ------------------------------------------------------------------- Menu */

export type MenuItem = { label: string; icon?: Icon; onSelect: () => void; hint?: string };

/** Button that opens a small action menu (Escape / outside click closes). */
export function MenuButton({
  label,
  icon,
  items,
  variant = 'primary',
  align = 'end',
}: {
  label: string;
  icon?: Icon;
  items: MenuItem[];
  variant?: Variant;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div ref={ref} className="relative">
      <Button
        variant={variant}
        icon={icon}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown size={14} className="-mr-1 opacity-80" />
      </Button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cx(
            'absolute z-30 mt-1.5 min-w-[220px] rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/5',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:bg-zinc-100 focus-visible:outline-none"
            >
              {it.icon && <it.icon size={16} className="shrink-0 text-zinc-400" />}
              <span className="flex-1">{it.label}</span>
              {it.hint && <span className="text-meta text-zinc-400">{it.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Panel */

/** The one surface: white, 1px zinc border, 8px corners, no shadow. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx('rounded-lg border border-zinc-200 bg-white', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-title font-semibold text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-meta text-zinc-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cx('px-4 py-3 sm:px-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ Badge */

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const TONE: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-rose-50 text-rose-700',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-meta font-medium whitespace-nowrap', TONE[tone], className)}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Stat tile */

export type StatProps = {
  label: string;
  value: React.ReactNode;
  /** Small line under the value, e.g. "৳14,760 today". */
  sub?: React.ReactNode;
  /** Colours the sub line only; the value stays neutral. */
  subTone?: 'neutral' | 'up' | 'down';
  icon?: Icon;
  href?: string;
};

const SUB_TONE = { neutral: 'text-zinc-500', up: 'text-emerald-700', down: 'text-rose-700' } as const;

export function Stat({ label, value, sub, subTone = 'neutral', icon: I, href }: StatProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-meta font-medium text-zinc-500">{label}</span>
        {I && <I size={16} className="hidden shrink-0 text-zinc-400 sm:block" />}
      </div>
      <div
        className="mt-2 truncate text-[1.375rem] leading-7 font-semibold tracking-tight text-zinc-900 tabular-nums sm:text-kpi"
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </div>
      {sub && <div className={cx('mt-1 truncate text-meta tabular-nums', SUB_TONE[subTone])}>{sub}</div>}
    </>
  );
  const cls = 'block rounded-lg border border-zinc-200 bg-white p-4 min-w-0';
  return href ? (
    <Link href={href} className={cx(cls, 'transition-colors hover:border-zinc-300 hover:bg-zinc-50/60')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------------------------------------- List rows */

/** A clickable row inside a Panel list (title, secondary line, right-hand value). */
export function ListRow({
  title,
  sub,
  value,
  valueSub,
  href,
  onClick,
  leading,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  value?: React.ReactNode;
  valueSub?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  leading?: React.ReactNode;
}) {
  const inner = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{title}</div>
        {sub && <div className="line-clamp-2 text-meta text-zinc-500">{sub}</div>}
      </div>
      {(value || valueSub) && (
        <div className="shrink-0 text-right">
          {value && <div className="text-body font-medium text-zinc-900 tabular-nums">{value}</div>}
          {valueSub && <div className="text-meta text-zinc-500 tabular-nums">{valueSub}</div>}
        </div>
      )}
      {(href || onClick) && <ChevronRight size={16} className="shrink-0 text-zinc-300 group-hover:text-zinc-500" />}
    </>
  );
  const cls = 'group -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5';
  if (href) return <Link href={href} className={cx(cls, 'hover:bg-zinc-50')}>{inner}</Link>;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx(cls, 'w-[calc(100%+1rem)] text-left hover:bg-zinc-50')}>
        {inner}
      </button>
    );
  return <div className={cls}>{inner}</div>;
}

/* ------------------------------------------------------------ Empty, skeleton */

export function EmptyState({ icon: I, title, children }: { icon?: Icon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      {I && <I size={20} className="mb-2 text-zinc-300" />}
      <p className="text-body font-medium text-zinc-700">{title}</p>
      {children && <p className="mt-1 max-w-sm text-meta text-zinc-500">{children}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-md bg-zinc-100', className)} />;
}

/* ------------------------------------------------------------------ Fields */

/** Label + control + hint/error. Pass the control as children with the given id. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-table font-medium text-zinc-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-meta text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-meta text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'block w-full rounded-lg border bg-white px-3 text-body text-zinc-900 placeholder:text-zinc-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:bg-zinc-50 disabled:text-zinc-500';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ invalid, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && rest.id ? `${rest.id}-error` : rest['aria-describedby']}
        className={cx(CONTROL, 'h-9', invalid ? 'border-rose-400' : 'border-zinc-200', className)}
        {...rest}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ invalid, className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(CONTROL, 'h-9 pr-8', invalid ? 'border-rose-400' : 'border-zinc-200', className)}
        {...rest}
      >
        {children}
      </select>
    );
  }
);

/* ------------------------------------------------------------ Segmented */

/** Two-to-four way view switch (e.g. Table / Board). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: Icon }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors',
              on ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            {o.icon && <o.icon size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
