'use client';

import type { PointerEvent, ReactNode } from 'react';

/**
 * Card with a soft light that follows the pointer (mouse / pen only; touch is left alone).
 * The glow itself is the .spotlight / .spotlight-dark class in globals.css.
 */
export default function SpotlightCard({
  dark = false,
  className = '',
  children,
}: {
  dark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <div onPointerMove={onMove} className={`${dark ? 'spotlight-dark' : 'spotlight'} ${className}`}>
      {children}
    </div>
  );
}
