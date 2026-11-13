import { ArrowRight, MessageCircle } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';

/**
 * Closing call to action for inner pages: the same brand-blue mesh band as the home page.
 * Use once per page, as its one blue band.
 */
export default function CtaBand({
  title,
  lead,
  primaryLabel = 'Order Online',
  primaryHref = '/order-create',
}: {
  title: string;
  lead: string;
  primaryLabel?: string;
  primaryHref?: string;
}) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container">
        <Reveal className="bg-mesh-brand relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white shadow-2xl shadow-[#1977C5]/20 sm:px-10 md:py-20">
          <div className="bg-grid-fade-dark pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto max-w-3xl">
            <h2 className="secondary text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">{title}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{lead}</p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={primaryHref} variant="inverse" size="lg" className="group shadow-lg shadow-slate-900/20">
                {primaryLabel}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </ButtonLink>
              <a
                href="https://wa.me/8801743167963"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-base font-medium text-white backdrop-blur transition-colors duration-150 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1977C5]"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
