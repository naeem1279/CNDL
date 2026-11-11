import type { Metadata } from 'next';
import ShareHero from '@/components/share/ShareHero';

// G1 (2026-11-05): unique per-page metadata (was inheriting the homepage title).
export const metadata: Metadata = {
  title: 'Terms & Conditions | CNDL Global',
  description:
    'CNDL Global terms covering online case submission, billing cycles, warranty policy and lead-time commitments for dental restoration orders.',
  alternates: { canonical: 'https://cndl-global.com/terms-conditions' },
};

export default function TermsConditionsPage() {
  return (
    <section>
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          Secure Online Dental Case
          <br />
          Submission
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          A precise, 4-step process for predictable restoration results.
        </p>
      </ShareHero>
      <div className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="flex flex-col items-center mb-6 md:mb-8 lg:mb-10">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] text-center font-bold mb-2 md:mb-3 lg:mb-4">
            Terms & Conditions and Lab Policies
          </div>
          <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-secondary) text-center">
            Clear and transparent guidelines for a seamless partnership.
          </p>
        </div>
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xs md:text-sm lg:text-base xl:text-lg font-semibold">
            Payment Terms
          </h2>
          <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
            Advance requirement, Billing cycles, Warranty Policy (e.g., 5-year guarantee on Zirconia), Lead Time Policy (15 Working Day details).
          </p>
        </div>
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xs md:text-sm lg:text-base xl:text-lg font-semibold">
            Payment Terms
          </h2>
          <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
            Advance requirement, Billing cycles, Warranty Policy (e.g., 5-year guarantee on Zirconia), Lead Time Policy (15 Working Day details).
          </p>
        </div>
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xs md:text-sm lg:text-base xl:text-lg font-semibold">
            Payment Terms
          </h2>
          <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
            Advance requirement, Billing cycles, Warranty Policy (e.g., 5-year guarantee on Zirconia), Lead Time Policy (15 Working Day details).
          </p>
        </div>
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xs md:text-sm lg:text-base xl:text-lg font-semibold">
            Payment Terms
          </h2>
          <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
            Advance requirement, Billing cycles, Warranty Policy (e.g., 5-year guarantee on Zirconia), Lead Time Policy (15 Working Day details).
          </p>
        </div>
      </div>
    </section>
  );
}
