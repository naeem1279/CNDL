import Link from 'next/link';
import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/seo';
import ShareHero from '@/components/share/ShareHero';
import LeadershipImage from '@/components/about/LeadershipImage';
import {
  Plane, Globe, Timer, ScanLine, Home, Award, Microscope, Truck,
  ArrowRight, MessageCircle, ShieldCheck, Quote, Sparkles
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
      <ShareHero>
        <div className="container px-4 sm:px-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-xs md:text-xs font-semibold uppercase tracking-widest text-(--text-tertiary) mb-3 md:mb-4">
            <ShieldCheck size={13} />
            Pioneering Digital Dental Artistry in Bangladesh
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-semibold leading-tight text-(--text-tertiary) max-w-3xl">
            Crafting World-Class Smiles with Precision, Passion &amp; Purpose
          </h1>
          <p className="text-xs md:text-sm lg:text-base mt-2 md:mt-4 max-w-2xl text-(--text-tertiary)/90">
            Founded in 2015, CNDL Global combines Japanese 5-axis milling, master-crafted manual prosthetics, authentic Aidite &amp;
            Shofu materials, and an unwavering commitment to affordable excellence for clinicians
            across Bangladesh and visiting global patients.
          </p>
        </div>
      </ShareHero>

      {/* ================= 2015 GENESIS & DOMESTIC MISSION ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-8 lg:gap-16 items-start">
          <div>
            <span className="text-xs md:text-xs lg:text-base text-(--text-secondary) mb-2 md:mb-3 block uppercase tracking-widest font-semibold secondary">
              Our Story — Since 2015
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-semibold secondary leading-tight">
              The 2015 Genesis &amp; Our Domestic Mission
            </h2>
          </div>
          <div className="space-y-4 md:space-y-5 text-sm md:text-base lg:text-lg text-(--text-secondary) leading-relaxed">
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
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="bg-(--bg-secondary) border border-(--border-muted) rounded-[16px] md:rounded-[24px] lg:rounded-[32px] p-6 sm:p-10 md:p-14">
          <div className="max-w-3xl mb-8 md:mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1977C5]/10 border border-[#1977C5]/20 px-3.5 py-1 text-xs md:text-xs font-semibold uppercase tracking-wider text-[#1977C5]">
                <Sparkles size={12} />
                Dual-Workflow Denture Wing · Since 2015
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs md:text-xs font-semibold text-emerald-700">
                Dual Digital &amp; Manual Workflows
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs md:text-xs font-semibold text-blue-700">
                High Patient Adaptation Rate
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3.5 py-1 text-xs md:text-xs font-semibold text-purple-700">
                Unbreakable Flexible Resin
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-semibold secondary leading-tight">
              Digital CAD/CAM + Master Manual Denture Craftsmanship
            </h2>
            <p className="mt-3 text-xs md:text-sm lg:text-base text-(--text-secondary) leading-relaxed">
              While conventional labs treat removable prosthetics as a secondary craft, CNDL champions a dedicated Dual-Workflow Denture Wing with 11+ years of refinement. We pair micron-accurate digital scan architecture and 3D printing with master dental technicians&rsquo; manual articulatory contouring — delivering superior retention, biological occlusal balance, and effortless adaptation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Dentures Card */}
            <div className="rounded-[14px] md:rounded-[20px] bg-(--bg-primary) border border-(--border-primary) p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-xs font-semibold uppercase tracking-wider text-[#1977C5]">Complete Removable Prosthetics</span>
                  <span className="rounded-full bg-blue-50 text-[#1977C5] px-3 py-0.5 text-xs md:text-xs font-semibold">Digital CAD + Heat-Cure</span>
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">Full Dentures</h3>
                <p className="text-xs md:text-sm lg:text-base text-(--text-secondary) leading-relaxed">
                  High-impact heat-cure acrylic &amp; digital 3D-milled precision bases. Engineered with bilateral balanced occlusion, physiological post-palatal seal, and optional internal mesh reinforcement to eliminate fracture risk under heavy masticatory load.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-(--border-muted) flex items-center justify-between text-xs md:text-xs text-(--text-secondary)">
                <span>Turnaround: 3-4 Working Days</span>
                <span className="text-[#1977C5] font-semibold">Zero-Porosity Polymerization</span>
              </div>
            </div>

            {/* Flexible Partial Dentures Card */}
            <div className="rounded-[14px] md:rounded-[20px] bg-(--bg-primary) border border-(--border-primary) p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs md:text-xs font-semibold uppercase tracking-wider text-emerald-600">Aesthetic Removable Partials</span>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-0.5 text-xs md:text-xs font-semibold">Valplast-Style Nylon</span>
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">Flexible Partial Dentures</h3>
                <p className="text-xs md:text-sm lg:text-base text-(--text-secondary) leading-relaxed">
                  Unbreakable Valplast-style nylon resin with anatomical gingival blending. Invisible tissue-colored clasps eliminate unsightly metal clasps, distributing functional loads gently while preserving natural abutment teeth without irritation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-(--border-muted) flex items-center justify-between text-xs md:text-xs text-(--text-secondary)">
                <span>Turnaround: 3-4 Working Days</span>
                <span className="text-emerald-600 font-semibold">100% Monomer-Free Biocompatible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DENTAL TOURISM & NRB FAST-TRACK ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="relative rounded-[16px] md:rounded-[24px] lg:rounded-[32px] overflow-hidden bg-linear-to-br from-[#226AB4] to-[#3387CB] p-6 sm:p-10 md:p-14 text-white shadow-xl">
          <div className="max-w-3xl mb-8 md:mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 text-xs md:text-xs font-semibold uppercase tracking-widest mb-4">
              <Plane size={13} />
              Dental Tourism &amp; NRB Fast-Track
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight">
              World-Class Dental Restorations for Visiting Expatriates &amp; Global Dental Tourists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-[16px] md:rounded-[24px] bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center mb-4">
                <Globe size={22} />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">The Reality Abroad</h3>
              <p className="text-xs md:text-sm lg:text-base text-white/85 leading-relaxed">
                A single crown or veneer in North America, Europe, Australia or the Middle East
                routinely costs <span className="font-semibold text-white">$1,500 – $2,500</span> —
                placing world-class restorative care out of reach for many families.
              </p>
            </div>

            <div className="rounded-[16px] md:rounded-[24px] bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center mb-4">
                <Plane size={22} />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">The CNDL Solution</h3>
              <p className="text-xs md:text-sm lg:text-base text-white/85 leading-relaxed">
                Overseas Bangladeshis visiting home can partner with top local dental surgeons to
                receive flawless Aidite Monolithic Zirconia, E-Max, or Clear Aligners at an{' '}
                <span className="font-semibold text-white">80%+ cost advantage</span> — without
                compromise on materials or precision.
              </p>
            </div>

            <div className="rounded-[16px] md:rounded-[24px] bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center mb-4">
                <Timer size={22} />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">3-Day Express Guarantee</h3>
              <p className="text-xs md:text-sm lg:text-base text-white/85 leading-relaxed">
                Our fast-track production allows visiting patients to receive and seat their final
                restorations within a short holiday schedule — no multiple follow-up visits, no
                extended stays.
              </p>
            </div>

            <div className="rounded-[16px] md:rounded-[24px] bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center mb-4">
                <ScanLine size={22} />
              </div>
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2">Open STL Architecture</h3>
              <p className="text-xs md:text-sm lg:text-base text-white/85 leading-relaxed">
                Expat patients or overseas clinicians can digitally transmit intraoral scans (Medit,
                3Shape, iTero) before arrival — so design work starts before the patient lands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MILESTONE TIMELINE 2015 – PRESENT ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="text-xs md:text-xs lg:text-base text-(--text-secondary) uppercase tracking-widest font-semibold secondary block mb-2">
            Our Journey
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold secondary leading-tight">
            From Khilgaon Workshop to Global Digital Lab
          </h2>
        </div>

        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-[2px] bg-(--background-muted)/30" />
          <div className="space-y-8 md:space-y-10">
            {milestones.map((m) => (
              <div key={m.year} className="relative pl-16 md:pl-20">
                <div className="absolute left-0 top-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-(--background-muted) text-white font-semibold text-xs md:text-xs flex items-center justify-center shadow-lg">
                  {m.year === 'Present' ? (
                    <Globe size={18} />
                  ) : (
                    <span className="text-xs md:text-xs">{m.year}</span>
                  )}
                </div>
                <div className="bg-(--bg-secondary) border border-(--border-muted) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] p-5 md:p-7">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs md:text-xs font-semibold secondary uppercase tracking-widest">
                      {m.year}
                    </span>
                    <span className="text-xs md:text-xs text-(--text-secondary)">·</span>
                    <h3 className="text-sm md:text-base lg:text-lg font-semibold">{m.title}</h3>
                  </div>
                  <p className="text-xs md:text-sm lg:text-base text-(--text-secondary) leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= LEADERSHIP & INSTITUTIONAL VISION ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 sm:gap-10 md:gap-16">
          <LeadershipImage />
          <div>
            <span className="text-xs md:text-xs lg:text-base text-(--text-secondary) mb-2 md:mb-3 block uppercase tracking-widest font-semibold secondary">
              Leadership
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-semibold secondary leading-tight">
              Leadership &amp; Commitment to Dental Excellence
            </h2>
            <div className="mt-4 md:mt-6 border-l-[3px] border-(--background-muted) pl-4 md:pl-6">
              <Quote size={20} className="text-(--background-muted) mb-2" />
              <p className="text-sm md:text-base lg:text-lg text-(--text-secondary) italic leading-relaxed">
                At CNDL, we practice restorative dentistry as a matter of medical ethics — every
                restoration carries a patient&rsquo;s trust. Since establishing our laboratory in 2015, I hold our technicians to the standard
                of master craftsmen, and we reinvest continuously in cutting-edge digital
                technology, from 5-axis Japanese milling to in-house clear aligner planning and precision dentures, so
                that world-class care is made in Bangladesh, priced for Bangladesh, and trusted
                by Bangladeshi families everywhere in the world.
              </p>
              <footer className="mt-3 md:mt-4 text-xs md:text-sm lg:text-base font-semibold secondary">
                — M. Abdul Kadir, Chairman, CN Dental Lab (CNDL Global)
              </footer>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4 UNCOMPROMISING LAB PILLARS ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="text-xs md:text-xs lg:text-base text-(--text-secondary) uppercase tracking-widest font-semibold secondary block mb-2">
            Why CNDL
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold secondary leading-tight">
            The 4 Uncompromising Lab Pillars
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-(--bg-secondary) border border-(--border-muted) rounded-[10px] md:rounded-[16px] lg:rounded-[24px] p-6 md:p-8 transition-all duration-300 hover:scale-105"
            >
              <div className="w-14 h-14 rounded-[16px] bg-(--background-muted) flex items-center justify-center shadow text-white mb-5">
                <pillar.icon size={26} strokeWidth={1.75} />
              </div>
              <h3 className="text-sm md:text-base lg:text-lg font-semibold text-(--text-primary) mb-2">
                {pillar.title}
              </h3>
              <p className="text-xs md:text-sm text-(--text-secondary) leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        <div className="relative rounded-[16px] md:rounded-[24px] lg:rounded-[32px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/CTA.jpg')" }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#226AB4E6] to-[#3387CBCC]" />
          <div className="relative z-10 px-6 py-12 md:py-16 text-center text-white">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight max-w-3xl mx-auto">
              Partner with Bangladesh&rsquo;s Premier Dental Lab
            </h2>
            <p className="text-xs md:text-sm lg:text-base text-white/85 mt-3 max-w-xl mx-auto">
              Submit your next case online or dispatch an intraoral scan directly to our lab team —
              guaranteed 3-4 working day turnaround.
            </p>
            <div className="mt-7 md:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/order-create"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs md:text-sm lg:text-base font-semibold text-[#1977C5] shadow-lg hover:shadow-xl transition-all group w-full sm:w-auto min-h-[48px]"
              >
                Submit a Case Online
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/70 px-7 py-3.5 text-xs md:text-sm lg:text-base font-semibold text-white hover:bg-white/10 transition-all w-full sm:w-auto min-h-[48px]"
              >
                <MessageCircle size={17} />
                WhatsApp: +880 1743-167963
              </a>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default AboutPage;
