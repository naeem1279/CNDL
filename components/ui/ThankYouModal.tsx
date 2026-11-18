'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Confirmation shown after a public form is submitted successfully. */
export default function ThankYouModal({
  message,
  onClose,
  children,
}: {
  message: string;
  onClose: () => void;
  /** Optional extra content, shown between the message and the Done button. */
  children?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thank-you-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="flex flex-col items-center space-y-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-50 text-accent-500">
            <CheckCircle2 size={28} aria-hidden="true" />
          </span>
          <h2 id="thank-you-title" className="secondary text-2xl font-semibold text-slate-900">
            Thank You!
          </h2>
          <p className="text-slate-600">{message}</p>
          {children}
          <Button size="lg" onClick={onClose} className="mt-2 w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
