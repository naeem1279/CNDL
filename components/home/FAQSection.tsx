'use client';

import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
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
    <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-24">
      <div className="container">
        {cta ? (
          // The page's one blue band: the closing call to action.
          <div className="mb-16 rounded-2xl bg-[#1977C5] px-6 py-12 text-center text-white sm:px-10 md:mb-24 md:py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="secondary text-3xl font-semibold leading-tight md:text-4xl">
                Ready to elevate your practice with precision CAD/CAM restorations?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg">
                Partner with CNDL today. Dispatch your digital STL scan or physical impression and
                experience guaranteed 3-day chamber delivery.
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/order-create" variant="inverse" size="lg" className="group">
                  Submit Case Online
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </ButtonLink>

                <a
                  href="https://wa.me/8801743167963"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-6 text-base font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1977C5]"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  Chat with Senior Technician
                </a>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-16">
          <div className="lg:sticky lg:top-32">
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Clinical Questions from Dental Surgeons, Answered
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              Technical answers on materials, milling, prep guidelines and turnaround — for
              clinicians, NRB patients and partner labs.
            </p>
          </div>

          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white lg:col-span-2">
            {faqs.map((item) => {
              const isOpen = active === item.id;
              const panelId = `faq-panel-${item.id}`;

              return (
                <div key={item.id}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setActive(isOpen ? 0 : item.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex min-h-14 w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                    >
                      <span className="secondary text-base font-medium text-slate-900 md:text-lg">{item.question}</span>
                      <ChevronDown
                        size={20}
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1977C5]' : ''}`}
                      />
                    </button>
                  </h3>

                  <div
                    id={panelId}
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-base leading-relaxed text-slate-600 md:px-6 md:pb-6">{item.answer}</p>
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
