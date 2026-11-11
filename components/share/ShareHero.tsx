'use client';

import Image from 'next/image';

export default function ShareHero({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-(--bg-muted)">
      <div className="container relative h-[300px] md:h-[400px]">
        <div className="w-full h-full md:h-[400px] flex items-center justify-center">
          <Image
            src="/images/PattranBanner.png"
            alt="Dental Model"
            width={1000}
            height={1000}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <div className="absolute inset-0 h-full w-full flex flex-col justify-center ">
          {children}
        </div>
      </div>
    </section>
  );
}
