'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Leadership visual with clean fallback if the WebP asset is unavailable. */
export default function LeadershipImage() {
  const [src, setSrc] = useState('/images/about/cad-design-station.webp');

  return (
    <Image
      src={src}
      alt="CAD design station at CNDL Global laboratory, Dhaka"
      width={800}
      height={600}
      className="h-[320px] w-full rounded-2xl object-cover md:h-[420px]"
      onError={() => setSrc('/images/WhyChooseIcon.png')}
    />
  );
}
