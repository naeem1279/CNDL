'use client';

import { ArrowDownRight, MoveRight, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function FAQSection({ cta = true }: { cta?: boolean }) {
  const [active, setActive] = useState<number>(1);

  const faqs = [
    {
      id: 1,
      question: 'What specific Zirconia blanks and milling technology does CNDL utilize?',
      answer:
        'We mill exclusively on authentic Aidite multilayer zirconia discs using Japanese Roland DGSHAPE 5-axis technology, then fire each restoration with authentic Shofu (Japan) natural glaze at 900°C. This combination produces lifelike fluorescence, graduate translucency across the layers, and wear-compatibility that is gentle on opposing natural dentition.',
    },
    {
      id: 2,
      question: 'What is the guaranteed delivery turnaround time across Dhaka and regional districts?',
      answer:
        'We guarantee 3 working days delivery directly to your dental chamber inside Dhaka via our dedicated in-house lab riders and Pathao logistics. Nationwide cases reach regional districts within 3–4 working days through reliable courier partners, with dispatch confirmation shared at every stage.',
    },
    {
      id: 3,
      question: 'How does CNDL accept digital intraoral scan files (STL/OBJ)?',
      answer:
        'CNDL runs a fully open digital architecture. Send scans via direct cloud integration with Medit Link or 3Shape Communicate, export from iTero, upload through our online order portal at /order-create, or dispatch large STL/OBJ files straight to the lab WhatsApp at +880 1743-167963 for instant confirmation by our CAD team.',
    },
    {
      id: 4,
      question: 'What tooth preparation guidelines are recommended for CNDL Zirconia crowns?',
      answer:
        'For optimal CAD/CAM milling adaptation we recommend a 0.8 mm–1.0 mm chamfer or rounded shoulder margin, 1.2 mm–1.5 mm occlusal reduction, and smooth transitions with no sharp line angles or undercuts. These parameters give the digital scanner clean margins and the 5-axis mill uninterrupted tool paths, ensuring accurate, void-free seatings.',
    },
    {
      id: 5,
      question: 'Does CNDL support Non-Resident Bangladeshi (NRB) and dental tourism fast-track cases?',
      answer:
        'Yes. We operate an express 3-day smile restoration workflow purpose-built for overseas Bangladeshi patients and dental tourists: scans or impressions are taken by the partnering local surgeon, we design, mill and glaze in-house, and the restoration is seated before the patient flies home — all coordinated directly between CNDL and the treating clinician.',
    },
    {
      id: 6,
      question: 'Can other dental laboratories outsource CAD/CAM milling to CNDL?',
      answer:
        'Absolutely. CNDL runs B2B lab-to-lab milling partnerships for dental laboratories without in-house 5-axis milling or sintering setups. Partner labs send digital designs or scans; we return milled, sintered and glaze-finished frameworks and anatomies under strict confidentiality, with volume pricing arranged directly with our Lab Director at +880 1743-167963.',
    },
  ];

  return (
    <section className="py-7 sm:py-10 md:py-20">
      <div className="container">
        {cta ? (
          <div className="relative overflow-hidden rounded-[10px] md:rounded-[16px] lg:rounded-[24px] xl:rounded-[32px] bg-(--bg-muted) px-6 sm:px-10 py-16 text-center text-white mb-5 sm:mb-10 md:mb-12 lg:mb-16 xl:mb-20">
            <div className="absolute inset-0 opacity-30">
              <Image
                src="/images/CTA.jpg"
                alt="wave"
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">
                Ready to elevate your practice with precision CAD/CAM restorations?
              </h2>

              <p className="mt-4 text-sm sm:text-base text-white/80">
                Partner with CNDL today. Dispatch your digital STL scan or physical impression and
                experience guaranteed 3-day chamber delivery.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/order-create"
                  className="inline-flex items-center gap-2 border-2 border-(--border-muted) rounded-full bg-(--bg-primary) px-6 py-3 text-xs md:text-sm lg:text-base xl:text-lg font-medium text-(--text-primary) hover:bg-(--bg-primary)/98 transition group"
                >
                  Submit Case Online{' '}
                  <MoveRight size={24} className="group-hover:translate-x-2 transition" />
                </Link>

                <a
                  href="https://wa.me/8801743167963"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-(--border-muted) px-6 py-3 text-xs md:text-sm lg:text-base xl:text-lg font-medium text-(--text-tertiary) hover:text-(--text-primary) hover:bg-(--bg-primary) transition group"
                >
                  <MessageCircle size={20} />
                  Chat with Senior Technician
                </a>
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 lg:gap-16 xl:gap-[86px] items-start">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium secondary pb-8 sm:pb-10 md:pb-12">
              Clinical Questions from Dental Surgeons, Answered
            </h2>
            <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
              Technical answers on materials, milling, prep guidelines and turnaround — for
              clinicians, NRB patients and partner labs.
            </p>
          </div>

          <div className="space-y-2 md:space-y-4 col-span-2">
            {faqs.map((item) => {
              const isOpen = active === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-(--bg-primary) border-b-[.5px] border-(--border-primary)"
                >
                  <button
                    onClick={() => setActive(isOpen ? 0 : item.id)}
                    className="w-full flex items-start justify-between px-4 py-2 md:px-6 md:py-5 text-left cursor-pointer"
                  >
                    <div className="text-sm md:text-base lg:text-lg xl:text-xl font-medium secondary">
                      {item.question}
                    </div>

                    <ArrowDownRight
                      className={`transition-transform  text-(--text-secondary) ${
                        isOpen ? '-rotate-90' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out 
                 ${
                   isOpen
                     ? 'grid-rows-[1fr] opacity-100 border-t-[.5px] border-(--border-primary) px-4 py-2 md:px-6 md:py-5'
                     : 'grid-rows-[0fr] opacity-0'
                 }`}
                  >
                    <div className="overflow-hidden text-left text-xs md:text-xs lg:text-base text-(--text-secondary)">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
