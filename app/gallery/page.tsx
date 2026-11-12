'use client';

import ShareHero from '@/components/share/ShareHero';
import Image from 'next/image';
import { useState } from 'react';

const products = [
  {
    title: 'Zirconia Crowns & Bridges',
    image: '/images/gallery-1.jpg',
  },
  {
    title: 'E-max Veneers & Inlays',
    image: '/images/gallery-3.png',
  },
  {
    title: 'PFM & Metal Restorations',
    image: '/images/gallery-4.png',
  },
  {
    title: 'Cobalt-Chrome Framework',
    image: '/images/Services_3.png',
  },
  {
    title: 'Custom Abutment',
    image: '/images/Services_4.png',
  },
  {
    title: 'Malo Bridge',
    image: '/images/gallery-5.png',
  },

  {
    title: 'Zirconia Crowns & Bridges',
    image: '/images/gallery-6.jpg',
  },
  {
    title: 'E-max Veneers & Inlays',
    image: '/images/Services_1.png',
  },
  {
    title: 'PFM & Metal Restorations',
    image: '/images/gallery-7.jpg',
  },
  {
    title: 'Cobalt-Chrome Framework',
    image: '/images/Services_3.png',
  },
  {
    title: 'Custom Abutment',
    image: '/images/Services_4.png',
  },
  {
    title: 'Malo Bridge',
    image: '/images/Services_5.png',
  },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All Work');
  return (
    <section>
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          CNDL Work Gallery
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          Precision in Every Restoration
        </p>
        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          Explore our portfolio of high-quality Zirconia, E-max, and PFM restorations. Each <br />{' '}
          case represents our commitment to clinical excellence and aesthetic precision.
        </p>
      </ShareHero>
      <div className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="flex gap-2 md:gap-4 items-center flex-col md:flex-row w-full mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-14">
          {['All Work', 'Zirconia', 'E-max', 'PFM', 'Full Dentures'].map((item, index) => (
            <div
              key={index}
              onClick={() => setActiveFilter(item)}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-xs md:text-xs lg:text-base font-medium ${
                item === activeFilter
                  ? 'bg-(--bg-tertiary) hover:bg-(--bg-tertiary)/98 border-(--border-tertiary) text-(--text-tertiary)'
                  : 'border-(--border-primary) hover:bg-(--bg-tertiary)/98 hover:border-(--border-tertiary) hover:text-(--text-tertiary)'
              } transition duration-200 border-2  w-full cursor-pointer`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative h-[352px]">
                <div className="relative h-full w-full overflow-hidden rounded-[10px] md:rounded-[16px] lg:rounded-[24px]">
                  <div className="h-full w-full transition-transform duration-300 group-hover:scale-110">
                    <Image src={item.image} alt={item.title} fill className="object-container" />
                  </div>
                </div>
              </div>

              <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-medium mt-2 md:mt-[15px]">
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
