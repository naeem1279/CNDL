'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDialog } from './ModalShell';
import { IconButton } from './ui';

/**
 * Right-hand detail drawer. Full width on phones, 440px from `sm` up.
 * Escape and the backdrop close it; the page behind does not scroll.
 * Focus moves into the panel on open and back to the opener on close.
 */
export function SidePanel({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useDialog(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => opener?.focus?.();
  }, []);
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-zinc-900/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 focus:outline-none sm:w-[440px]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-title font-semibold text-zinc-900 [overflow-wrap:anywhere]">{title}</h2>
            {subtitle && <div className="mt-0.5 text-meta text-zinc-500">{subtitle}</div>}
          </div>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-1.5 shrink-0" />
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-zinc-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
