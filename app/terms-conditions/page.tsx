import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { OG_IMAGE } from '@/lib/seo';

// G1 (2026-11-05): unique per-page metadata (was inheriting the homepage title).
export const metadata: Metadata = {
  title: 'Terms & Conditions | CNDL Global',
  description:
    'CNDL Global terms covering online case submission, billing cycles, warranty policy and lead-time commitments for dental restoration orders.',
  alternates: { canonical: 'https://cndl-global.com/terms-conditions' },
  openGraph: { images: [OG_IMAGE] },
};

/**
 * Every statement here repeats a commitment made elsewhere on the site
 * (order form, FAQ, process, case tracker, catalogue). Keep them in sync.
 */
const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'case-submission',
    title: 'Case submission',
    body: (
      <>
        <p>
          Cases can be submitted through our 4-step{' '}
          <Link href="/order-create" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">online order form</Link>,
          by WhatsApp at +880 1743-167963, or with a printed{' '}
          <Link href="/lab-slip" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">lab prescription slip</Link>{' '}
          sent with a physical impression.
        </p>
        <p>
          Each case needs the clinic or doctor name, a contact phone number, the patient name and the restoration type.
          Tooth numbers (FDI notation), shade and clinical notes help us get it right first time.
        </p>
        <p>
          The online form accepts STL, OBJ, DCM, PDF, JPG and PNG files up to 10 MB each. Larger scan files can be sent to
          the lab WhatsApp instead.
        </p>
        <p>
          Every case is registered with a unique CNDL Case ID, which you can use on our{' '}
          <Link href="/case-tracker" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">case tracker</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'turnaround',
    title: 'Turnaround and delivery',
    body: (
      <>
        <p>
          Standard turnaround is 3 working days inside Dhaka and 3–4 working days nationwide. Working days are Monday to
          Saturday.
        </p>
        <p>
          Inside Dhaka, cases are delivered to your chamber by our own lab riders and Pathao logistics. Outside Dhaka, cases
          travel by courier, and we confirm each dispatch.
        </p>
        <p>
          We check every prescription for completeness before design begins. If information is missing, or margins or
          reduction cannot be read from the scan or impression, we will contact you before production starts.
        </p>
      </>
    ),
  },
  {
    id: 'preparation',
    title: 'Preparation and impressions',
    body: (
      <p>
        Fit depends on the preparation and the impression or scan we receive. Please follow our{' '}
        <Link href="/prep-guide" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">clinical preparation guide</Link>{' '}
        for reduction depths, margin design and scanning or impression technique.
      </p>
    ),
  },
  {
    id: 'warranty',
    title: 'Warranty',
    body: (
      <p>
        Where a product carries a warranty, its length is shown with that product in our{' '}
        <Link href="/products" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">product catalogue</Link>.
        Products listed without a warranty period do not carry one.
      </p>
    ),
  },
  {
    id: 'pricing',
    title: 'Pricing and payment',
    body: (
      <>
        <p>
          Where a starting price is published, it is shown in the product catalogue. For a full price list, request
          pricing through our{' '}
          <Link href="/contact#contact-form" className="font-medium text-[#1668AD] underline-offset-2 hover:underline">contact form</Link>{' '}
          or call the lab.
        </p>
        <p>Advance and billing arrangements are agreed directly with the lab before your first case.</p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Patient data and privacy',
    body: (
      <>
        <p>
          The public case tracker shows clinical essentials only. Patient-identifiable data is never displayed publicly.
        </p>
        <p>Cases from partner laboratories are handled in strict confidence.</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        CN Dental Lab (CNDL Global), 419/1/C Khilgaon (West Side of Jorpukur Field), Dhaka-1219, Bangladesh. Phone
        +880 1743-167963 or +880 1805-976351, email{' '}
        <a href="mailto:chistiyanizamiyad@gmail.com" className="break-all font-medium text-[#1668AD] underline-offset-2 hover:underline">
          chistiyanizamiyad@gmail.com
        </a>
        . Open Monday to Saturday, 9:00 AM – 11:30 PM.
      </p>
    ),
  },
];

export default function TermsConditionsPage() {
  return (
    <section>
      <PageHeader
        title="Terms & Conditions and Lab Policies"
        lead="Clear and transparent guidelines for a seamless partnership."
      />
      <div className="container grid grid-cols-1 gap-10 py-12 md:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-32">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">On this page</p>
            <ul className="space-y-1 border-l border-slate-200">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px flex min-h-10 items-center border-l border-transparent pl-4 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="max-w-3xl">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-32 border-b border-slate-200 py-8 first:pt-0 last:border-0">
              <h2 className="secondary text-2xl font-semibold text-slate-900">
                <span className="mr-2 tabular-nums text-slate-400">{i + 1}.</span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-600">{s.body}</div>
            </section>
          ))}
          <p className="mt-4 text-sm text-slate-500">Last updated: 12 November 2026</p>
        </div>
      </div>
    </section>
  );
}
