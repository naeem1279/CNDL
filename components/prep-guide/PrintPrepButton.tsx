'use client';

import { Printer } from 'lucide-react';

export default function PrintPrepButton({ className }: { className?: string }) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={
        className ||
        'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1977C5] px-6 text-base font-medium text-white transition-colors hover:bg-[#1668AD]'
      }
    >
      <Printer size={18} aria-hidden="true" />
      Print Prep Spec Sheet
    </button>
  );
}
