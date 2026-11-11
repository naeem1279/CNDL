"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  end: number,
  duration = 1500
): {
  ref: React.RefObject<HTMLDivElement | null>;
  value: number;
} {
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const startCounter = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const startTime = performance.now();

      const animate = (time: number) => {
        const progress = Math.min((time - startTime) / duration, 1);
        setValue(Math.floor(progress * end));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    const resetCounter = () => {
      startedRef.current = false;
      setValue(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounter();
        } else {
          resetCounter();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return { ref, value };
}
