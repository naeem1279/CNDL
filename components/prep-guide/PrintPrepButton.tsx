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
        'inline-flex items-center justify-center gap-2 rounded-full bg-[#1977C5] hover:bg-[#1668ad] text-white px-6 py-3 text-xs md:text-sm font-bold transition-all shadow-md active:scale-95'
      }
    >
      <Printer size={16} />
      Print Prep Spec Sheet
    </button>
  );
}
