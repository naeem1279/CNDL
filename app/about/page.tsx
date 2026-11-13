import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/seo';
import SpotlightCard from '@/components/ui/SpotlightCard';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import LeadershipImage from '@/components/about/LeadershipImage';
import {
  Plane, Globe, Timer, ScanLine, Home, Award, Microscope, Truck,
  ArrowRight, MessageCircle, ShieldCheck, Quote, Sparkles, type LucideIcon,
} from 'lucide-react';

// G1 (2026-11-05): unique per-page metadata (was inheriting the homepage title).
export const metadata: Metadata = {
  title: 'About CNDL Global | Chishtia Nizamia Dental Laboratory, Dhaka',
  description:
    'From its Khilgaon, Dhaka origins to a fully digital 5-axis CAD/CAM workflow — meet the team, milestones and in-house technology behind CNDL Global.',
  alternates: { canonical: 'https://cndl-global.com/about' },
  openGraph: {
    title: 'About CNDL Global | Chishtia Nizamia Dental Laboratory, Dhaka',
    description:
      'From its Khilgaon, Dhaka origins to a fully digital 5-axis CAD/CAM workflow — meet the team, milestones and in-house technology behind CNDL Global.',
    url: 'https://cndl-global.com/about',
    images: [OG_IMAGE],
  },
};

const milestones = [
  {
    year: '2015',
    title: 'The Foundation',
    desc: 'Established in Khilgaon, Dhaka by Chairman M. Abdul Kadir as a precision crown and master denture workshop.',
  },
  {
    year: '2018',
    title: 'Digital Expansion',
    desc: 'Integrated CAD design and advanced flexible denture engineering.',
  },
  {
    year: '2022',
    title: 'CAD/CAM Milling Revolution',
    desc: 'Installed Roland DGSHAPE 5-axis dry milling & UP3D sintering furnaces.',
  },
  {
    year: '2024',
    title: 'Additive & Digital Prosthetics',
    desc: 'Deployed Phrozen 8K 3D printing and digital clear aligner workflows.',
  },
  {
    year: 'Present',
    title: 'Nationwide & Global Reach',
    desc: 'Trusted across Bangladesh for CAD/CAM Zirconia and hybrid Digital + Manual Dentures.',
  },
];

const pillars = [
  {
    icon: Home,
    title: '100% In-House Fabrication',
    desc: 'Zero outsourcing. Every case is designed, milled, sintered and finished under our own roof in Dhaka.',
  },
  {
    icon: Award,
    title: 'Authentic Certified Blanks',
    desc: 'Genuine Aidite Multilayer Zirconia discs and authentic Shofu (Japan) glaze — never substituted.',
  },
  {
    icon: Microscope,
    title: 'Microscopic Marginal Adaptation',
    desc: 'Sub-micron margin accuracy verified at every production stage for predictable chairside seating.',
  },
  {
    icon: Truck,
    title: '3-Day Dependable Logistics',
    desc: 'Dedicated chamber riders across Dhaka plus nationwide courier partners — on the clock, every case.',
  },
];

const WHATSAPP_URL = 'https://wa.me/8801743167963';

function AboutPage() {
  return (
    <section>
      <PageHeader
        eyebrow={
          <>
            <ShieldCheck size={14} className="shrink-0 text-accent-500" aria-hidden="true" />
            <span className="min-w-0">Pioneering Digital Dental Artistry in Bangladesh</span>
          </>
        }
        title="Crafting World-Class Smiles with Precision, Passion & Purpose"
        lead="Founded in 2015, CNDL Global combines Japanese 5-axis milling, master-crafted manual prosthetics, authentic Aidite & Shofu materials, and an unwavering commitment to affordable excellence for clinicians across Bangladesh and visiting global patients."
      />

      {/* ================= 2015 GENESIS & DOMESTIC MISSION ================= */}
      <section className="bg-white py-16 md:py-24">
        <div className="container grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div>
            <p className="mb-3 text-sm font-medium text-[#1668AD]">Our Story — Since 2015</p>
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              The 2015 Genesis &amp; Our Domestic Mission
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-slate-600 md:text-lg">
            <p>
              CNDL — the Chishtiya Nizamia Dental Lab — began in 2015 in a modest workshop in
              Khilgaon, Dhaka, with a single conviction: no patient in Bangladesh should receive a
              compromised restoration when world-class dental engineering exists. With 11+ years of
              trusted clinical heritage, we bridge master dental craftsmanship with modern digital innovation.
            </p>
            <p>
              Where pressed-metal crowns and hand-carved temporaries were the norm, we invested in
              high-accuracy CAD design and advanced flexible denture engineering from our early days — because precision is
              not a luxury, it is the baseline of ethical dentistry.
            </p>
            <p>
              Our commitment to the people of Bangladesh remains unchanged: to deliver the same
              sub-micron precision and prosthetic excellence found in the top laboratories of Europe, America and East Asia —
              at accessible, reasonable domestic pricing that local clinicians and their patients
              can actually afford.
            </p>
          </div>
        </div>
      </section>

      {/* ================= DUAL-WORKFLOW DENTURE WING ================= */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1977C5]/10 px-3 py-1 text-xs font-medium text-[#1668AD]">
                <Sparkles size={14} aria-hidden="true" />
                Dual-Workflow Denture Wing · Since 2015
              </span>
              {['Dual Digital & Manual Workflows', 'High Patient Adaptation Rate', 'Unbreakable Flexible Resin'].map((chip) => (
                <span key={chip} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {chip}
                </span>
              ))}
            </div>
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Digital CAD/CAM + Master Manual Denture Craftsmanship
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
              While conventional labs treat removable prosthetics as a secondary craft, CNDL champions a dedicated Dual-Workflow Denture Wing with 11+ years of refinement. We pair micron-accurate digital scan architecture and 3D printing with master dental technicians&rsquo; manual articulatory contouring — delivering superior retention, biological occlusal balance, and effortless adaptation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            {[
              {
                kicker: 'Complete Removable Prosthetics',
                chip: 'Digital CAD + Heat-Cure',
                title: 'Full Dentures',
                body: 'High-impact heat-cure acrylic & digital 3D-milled precision bases. Engineered with bilateral balanced occlusion, physiological post-palatal seal, and optional internal mesh reinforcement to eliminate fracture risk under heavy masticatory load.',
                note: 'Zero-Porosity Polymerization',
              },
              {
                kicker: 'Aesthetic Removable Partials',
                chip: 'Valplast-Style Nylon',
                title: 'Flexible Partial Dentures',
                body: 'Unbreakable Valplast-style nylon resin with anatomical gingival blending. Invisible tissue-colored clasps eliminate unsightly metal clasps, distributing functional loads gently while preserving natural abutment teeth without irritation.',
                note: '100% Monomer-Free Biocompatible',
              },
            ].map((card) => (
              <SpotlightCard key={card.title} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#1668AD]">{card.kicker}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">{card.chip}</span>
                  </div>
                  <h3 className="secondary mb-2 text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="text-base leading-relaxed text-slate-600">{card.body}</p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span>Turnaround: 3-4 Working Days</span>
                  <span className="font-medium text-slate-900">{card.note}</span>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DENTAL TOURISM & NRB FAST-TRACK ================= */}
      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#1668AD]">
              <Plane size={16} aria-hidden="true" />
              Dental Tourism &amp; NRB Fast-Track
            </p>
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              World-Class Dental Restorations for Visiting Expatriates &amp; Global Dental Tourists
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            <TourismCard icon={Globe} title="The Reality Abroad">
              A single crown or veneer in North America, Europe, Australia or the Middle East
              routinely costs <span className="font-semibold text-slate-900">$1,500 – $2,500</span> —
              placing world-class restorative care out of reach for many families.
            </TourismCard>
            <TourismCard icon={Plane} title="The CNDL Solution">
              Overseas Bangladeshis visiting home can partner with top local dental surgeons to
              receive flawless Aidite Monolithic Zirconia, E-Max, or Clear Aligners at an{' '}
              <span className="font-semibold text-slate-900">80%+ cost advantage</span> — without
              compromise on materials or precision.
            </TourismCard>
            <TourismCard icon={Timer} title="3-Day Express Guarantee">
              Our fast-track production allows visiting patients to receive and seat their final
              restorations within a short holiday schedule — no multiple follow-up visits, no
              extended stays.
            </TourismCard>
            <TourismCard icon={ScanLine} title="Open STL Architecture">
              Expat patients or overseas clinicians can digitally transmit intraoral scans (Medit,
              3Shape, iTero) before arrival — so design work starts before the patient lands.
            </TourismCard>
          </div>
        </div>
      </section>

      {/* ================= MILESTONE TIMELINE 2015 – PRESENT ================= */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-24">
        <div className="container">
          <SectionHeader align="center" eyebrow="Our Journey" title="From Khilgaon Workshop to Global Digital Lab" />

          <ol className="relative mx-auto max-w-3xl">
            <span className="absolute bottom-2 left-[23px] top-2 w-0.5 bg-[#1977C5]/20" aria-hidden="true" />
            {milestones.map((m) => (
              <li key={m.year} className="relative pb-6 pl-16 last:pb-0 md:pl-20">
                <span className="absolute left-0 top-0 flex size-12 items-center justify-center rounded-full border-4 border-slate-50 bg-[#1977C5] text-xs font-semibold text-white">
                  {m.year === 'Present' ? <Globe size={18} aria-label="Present" /> : m.year}
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                  <p className="text-sm font-medium text-[#1668AD]">{m.year}</p>
                  <h3 className="mt-0.5 text-lg font-semibold text-slate-900">{m.title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-600">{m.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= LEADERSHIP & INSTITUTIONAL VISION ================= */}
      <section className="bg-white py-16 md:py-24">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <LeadershipImage />
          <div>
            <p className="mb-3 text-sm font-medium text-[#1668AD]">Leadership</p>
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Leadership &amp; Commitment to Dental Excellence
            </h2>
            <figure className="mt-6 border-l-2 border-[#1977C5] pl-5 md:pl-6">
              <Quote size={20} className="mb-2 text-[#1977C5]" aria-hidden="true" />
              <blockquote className="text-base italic leading-relaxed text-slate-600 md:text-lg">
                At CNDL, we practice restorative dentistry as a matter of medical ethics — every
                restoration carries a patient&rsquo;s trust. Since establishing our laboratory in 2015, I hold our technicians to the standard
                of master craftsmen, and we reinvest continuously in cutting-edge digital
                technology, from 5-axis Japanese milling to in-house clear aligner planning and precision dentures, so
                that world-class care is made in Bangladesh, priced for Bangladesh, and trusted
                by Bangladeshi families everywhere in the world.
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-slate-900">
                — M. Abdul Kadir, Chairman, CN Dental Lab (CNDL Global)
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ================= 4 UNCOMPROMISING LAB PILLARS ================= */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 md:py-24">
        <div className="container">
          <SectionHeader align="center" eyebrow="Why CNDL" title="The 4 Uncompromising Lab Pillars" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
            {pillars.map((pillar) => (
              <SpotlightCard key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-brand-duo text-[#226AB4]">
                  <pillar.icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="secondary mb-2 text-lg font-semibold text-slate-900">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{pillar.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION: the page's one blue band ================= */}
      <section className="bg-slate-50 pb-16 md:pb-24">
        <div className="container">
          <div className="rounded-2xl bg-[#1977C5] px-6 py-12 text-center text-white md:py-16">
            <h2 className="secondary mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
              Partner with Bangladesh&rsquo;s Premier Dental Lab
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              Submit your next case online or dispatch an intraoral scan directly to our lab team —
              guaranteed 3-4 working day turnaround.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/order-create" variant="inverse" size="lg" className="group">
                Submit a Case Online
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </ButtonLink>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-6 text-base font-medium text-white transition-colors duration-150 hover:bg-white/10"
              >
                <MessageCircle size={18} aria-hidden="true" />
                WhatsApp: +880 1743-167963
              </a>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function TourismCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-duo text-[#226AB4]">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="secondary mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="text-base leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export default AboutPage;
