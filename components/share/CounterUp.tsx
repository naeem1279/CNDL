'use client';

import { useEffect, useRef, useState } from 'react';
import CountUp from 'react-countup';

export default function Counter({ end, duration = 1.5 }: { end: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStart(true);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {start && <CountUp end={end} duration={duration} />}
    </div>
  );
}
