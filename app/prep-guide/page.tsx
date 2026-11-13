import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck, ArrowRight, FileText, CheckCircle2, AlertTriangle, Layers, Activity, Scissors, Sparkles, Microscope,
} from 'lucide-react';
import PrintPrepButton from '@/components/prep-guide/PrintPrepButton';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Clinical Tooth Preparation & Margin Protocols for CAD/CAM | CNDL Global',
  description:
    'Comprehensive clinical tooth reduction matrix and margin design guidelines for Monolithic Zirconia, PFM, and E-max veneers. Japanese Roland 5-axis CAD/CAM standards from CNDL Global.',
  keywords: [
    'tooth preparation guide',
    'CAD CAM tooth reduction dental',
    'Zirconia crown preparation depth',
    'E-max veneer prep protocol',
    'PFM margin chamfer shoulder',
    'dental lab Khilgaon Dhaka',
    'dental remake prevention protocols',
    'Roland 5-axis milling tooth prep'
  ],
  alternates: {
    canonical: 'https://cndl-global.com/prep-guide',
  },
  openGraph: {
    title: 'Clinical Tooth Preparation & Margin Protocols | CNDL Global',
    description:
      'Official tooth reduction matrix and 5 critical remake prevention rules for CAD/CAM Zirconia, PFM, and E-max restorations.',
    url: 'https://cndl-global.com/prep-guide',
    type: 'article',
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  '@id': 'https://cndl-global.com/prep-guide#webpage',
  name: 'Clinical Tooth Preparation & Margin Protocols for CAD/CAM Restorations',
  url: 'https://cndl-global.com/prep-guide',
  description:
    'Authoritative clinical guidelines for tooth reduction depths, margin geometry, and impression protocols for dental clinicians fabricating restorations at CNDL Global.',
  inLanguage: 'en-US',
  publisher: {
    '@type': 'DentalLaboratory',
    name: 'CN Dental Lab (CNDL Global)',
    url: 'https://cndl-global.com/',
  },
  audience: {
    '@type': 'MedicalAudience',
    audienceType: ['Dentists', 'Prosthodontists', 'Dental Surgeons'],
  },
  about: [
    {
      '@type': 'MedicalProcedure',
      name: 'Tooth Preparation for CAD/CAM Zirconia Crowns',
    },
    {
      '@type': 'MedicalProcedure',
      name: 'Tooth Preparation for IPS E-Max Veneers',
    },
    {
      '@type': 'MedicalProcedure',
      name: 'Tooth Preparation for Porcelain-Fused-to-Metal (PFM) Restorations',
    },
  ],
};

const REDUCTION_MATRIX = [
  {
    material: 'Monolithic & Multilayer Zirconia (Aidite 3D Pro)',
    badge: 'High-Strength Ceramic · Roland 5-Axis',
    occlusal: '1.0mm – 1.2mm (Anterior Incisal: 1.2mm)',
    axial: '0.8mm – 1.0mm',
    margin: 'Deep Chamfer (0.5mm – 0.8mm) with rounded internal line angles',
    taper: '6° – 8° Total Convergence',
    idealFor: 'Posterior crowns, multi-unit bridges, bruxers, minimal clearance',
  },
  {
    material: 'Porcelain-Fused-to-Metal (PFM / Co-Cr)',
    badge: 'Ceramic-Metal Hybrid',
    occlusal: '1.5mm – 2.0mm (0.5mm metal substructure + 1.0mm–1.5mm porcelain)',
    axial: '1.2mm – 1.5mm',
    margin: '90° Shoulder or Heavy Chamfer (1.0mm – 1.2mm)',
    taper: '6° – 10° Total Convergence',
    idealFor: 'High functional masticatory load, long-span bridges, economical tiers',
  },
  {
    material: 'IPS E-Max / Lithium Disilicate & Veneers',
    badge: 'High Aesthetics · Translucent',
    occlusal: 'Veneers: 1.0mm Incisal Overlap / Butt Joint | Full Crowns: 1.5mm',
    axial: 'Veneers: 0.5mm – 0.7mm Facial | Full Crowns: 1.0mm',
    margin: 'Light Chamfer / Rounded Shoulder (0.3mm – 0.5mm)',
    taper: '6° – 8° Total Convergence',
    idealFor: 'Anterior cosmetic smile designs, single units, inlays/onlays',
  },
];

const REMAKE_RULES = [
  {
    num: '01',
    title: 'Round All Sharp Angles & Line Transitions',
    icon: Sparkles,
    science:
      'Diamond milling tools on Japanese Roland 5-axis machines have a physical tip radius (smallest CNDL bur is 0.6mm). Sharp incisal angles or pointed transitions force the CAM software to "over-mill" the internal fitting surface to achieve seating, creating excessive cement gap and ceramic weakness.',
    action: 'Smooth all transition line angles and incisal edges with a fine football or torpedo finishing bur.',
    check: 'Ensure no razor-sharp line angles exist under 10x magnification or loupes.',
  },
  {
    num: '02',
    title: 'Zero Undercuts & 6°–8° Axial Taper',
    icon: Layers,
    science:
      'Rigid CAD/CAM sintered zirconia has zero flexure. Any undercut along the preparation walls creates an impossible path of insertion, forcing virtual software blockout that compromises retention and marginal fit.',
    action: 'Maintain a single, unambiguous path of draw with 6°–8° total occlusal taper (3°–4° per axial wall).',
    check: 'Verify visibility of all margin perimeters from direct occlusal viewing.',
  },
  {
    num: '03',
    title: 'Avoid Feather / Knife-Edge Margins',
    icon: AlertTriangle,
    science:
      'Knife-edge or indistinct bevels prevent milling tools from establishing a defined ceramic boundary, causing micro-chipping during pre-sintered green-state milling and leading to over-contoured margins in the mouth.',
    action: 'Always cut a crisp, continuous Deep Chamfer with at least 0.5mm–0.8mm distinct horizontal ledge.',
    check: 'Ensure the margin is clearly palpable with an explorer probe 360° around the tooth.',
  },
  {
    num: '04',
    title: 'Clear Occlusal Clearance (Centric & Excursive)',
    icon: Activity,
    science:
      'Inadequate reduction (< 1.0mm) forces our digital technicians to thin the zirconia disc during nesting, risking crown fracture under heavy masticatory load or necessitating chairside adjustments that strip glaze.',
    action: 'Verify 1.0mm–1.2mm clearance in centric occlusion AND during lateral/protrusive excursions.',
    check: 'Use a flexible 1.0mm clearance gauge or folded 200μm articulating foil to confirm space.',
  },
  {
    num: '05',
    title: 'Gingival Retraction Protocol (Double-Cord Technique)',
    icon: Scissors,
    science:
      '85% of remake requests across Bangladesh stem from indistinct subgingival margins caused by sulcular fluid or collapsed gingival tissue. Intraoral scanners and PVS silicone cannot read through blood or saliva.',
    action: 'Place size #00 cord first into sulcus floor, followed by size #1 or #2 soaked in aluminum chloride.',
    check: 'Remove top cord immediately before scanning/impression; verify 0.5mm exposed tooth structure apical to margin.',
  },
];

export default function PrepGuidePage() {
  return (
    <div className="bg-white text-slate-900">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        eyebrow={
          <>
            <ShieldCheck size={14} className="shrink-0 text-accent-500" aria-hidden="true" />
            <span className="min-w-0">ESTD. 2015 · CNDL CLINICAL PROTOCOLS</span>
          </>
        }
        title="Clinical Tooth Preparation & Margin Protocols for CAD/CAM Restorations"
        lead="Essential biological reduction depths, margin geometries, and chairside protocols engineered to guarantee sub-micron marginal adaptation, zero remakes, and predictable seating with Japanese Roland 5-axis milling."
      >
        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <PrintPrepButton className={buttonClass('primary', 'lg')} />
          <ButtonLink href="/lab-slip" target="_blank" variant="secondary" size="lg">
            <FileText size={18} aria-hidden="true" />
            Download Lab Slip (PDF)
          </ButtonLink>
        </div>
      </PageHeader>

      {/* ================= SECTION 1: REDUCTION MATRIX ================= */}
      <section className="py-16 md:py-20 print:py-6">
        <div className="container">
          <SectionHeader
            eyebrow="Standardized Guidelines"
            title="1. Core Reduction Matrix by Material"
            lead="Calibrated specifically for Roland DGSHAPE 5-axis milling burs and Aidite monolithic sintering parameters."
          />

          {/* Phones and tablets: one card per material */}
          <div className="space-y-4 lg:hidden print:hidden">
            {REDUCTION_MATRIX.map((row) => (
              <div key={row.material} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-900">{row.material}</h3>
                <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {row.badge}
                </span>
                <p className="mt-2 text-sm text-slate-500">{row.idealFor}</p>
                <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                  {[
                    ['Occlusal / Incisal', row.occlusal],
                    ['Axial Reduction', row.axial],
                    ['Margin Geometry', row.margin],
                    ['Taper & Line Angles', row.taper],
                  ].map(([k, v]) => (
                    <div key={k} className="py-2.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
                      <dd className={`mt-0.5 font-medium ${k === 'Margin Geometry' ? 'text-[#1668AD]' : 'text-slate-900'}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop and print: full table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block print:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th scope="col" className="font-medium px-5 py-4">Material &amp; Restoration</th>
                  <th scope="col" className="font-medium px-4 py-4">Occlusal / Incisal</th>
                  <th scope="col" className="font-medium px-4 py-4">Axial Reduction</th>
                  <th scope="col" className="font-medium px-4 py-4">Margin Geometry</th>
                  <th scope="col" className="font-medium px-5 py-4">Taper &amp; Line Angles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REDUCTION_MATRIX.map((row) => (
                  <tr key={row.material}>
                    <th scope="row" className="px-5 py-4 align-top font-normal">
                      <div className="font-semibold text-slate-900">{row.material}</div>
                      <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {row.badge}
                      </span>
                      <p className="mt-1.5 text-xs text-slate-500">{row.idealFor}</p>
                    </th>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">{row.occlusal}</td>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">{row.axial}</td>
                    <td className="px-4 py-4 align-top font-medium text-[#1668AD]">{row.margin}</td>
                    <td className="px-5 py-4 align-top text-slate-700">{row.taper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: 5 REMAKE PREVENTION RULES ================= */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-20 print:border-0 print:bg-white print:py-6">
        <div className="container">
          <SectionHeader
            eyebrow="Zero-Remake Protocol"
            title="2. Five Critical Remake Prevention Rules"
            lead="Avoid the most frequent causes of restoration rocking, marginal discrepancies, and chairside delays."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            {REMAKE_RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.num} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 print:break-inside-avoid">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums text-slate-400">RULE {rule.num}</span>
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-duo text-[#226AB4]">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                    </div>

                    <h3 className="secondary text-lg font-semibold leading-snug text-slate-900">{rule.title}</h3>

                    <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                      <p>
                        <strong className="font-semibold text-slate-900">The Mechanical Science:</strong> {rule.science}
                      </p>
                      <p className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-slate-700">
                        <strong className="mb-0.5 block text-xs font-medium uppercase tracking-wide text-emerald-700">
                          ✓ Recommended Clinical Action:
                        </strong>
                        {rule.action}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-500" aria-hidden="true" />
                    <span>{rule.check}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: IMPRESSION & SCAN TIPS ================= */}
      <section className="py-16 md:py-20 print:py-6">
        <div className="container">
          <div className="mb-8 flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-duo text-[#226AB4]">
              <Microscope size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="secondary text-2xl font-semibold text-slate-900 md:text-3xl">
                Impression &amp; Intraoral Scan (IOS) Best Practices
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Whether sending digital STL/OBJ scans or physical PVS rubber base impressions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-3 lg:gap-6">
            {[
              ['1. Digital Scanners (STL/OBJ):', 'Disable AI teeth-cleaner before margin capture. Verify there are zero mesh holes along the finish line before patient dismissal.'],
              ['2. Conventional PVS / Polyether:', 'Always use a rigid metal or custom tray. Use double-mix one-step technique; inspect margins for zero drags, bubbles or tray impingement.'],
              ['3. Stump / Prep Shade Photography:', 'For anterior E-max or multilayer zirconia, photograph the prepared stump with a shade tab (ND1–ND9) in the same focal plane under 5500K daylight.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h3>
                <p className="leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: DOCTOR CTA — the page's one blue band ================= */}
      <section className="pb-16 md:pb-24 print:hidden">
        <div className="container">
          <div className="flex flex-col gap-8 rounded-2xl bg-[#1977C5] p-8 text-white sm:p-10 md:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80">
                <ShieldCheck size={16} aria-hidden="true" />
                Partner with Bangladesh&apos;s #1 CAD/CAM Laboratory
              </p>
              <h2 className="secondary mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                Ready to Send Your Case with Guaranteed Precision?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/85">
                Experience zero-remake prosthetic predictability. Submit cases online in 4 steps or download our official A4 prescription slip.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink href="/order-create" variant="inverse" size="lg">
                Submit Case Online
                <ArrowRight size={18} aria-hidden="true" />
              </ButtonLink>
              <Link
                href="/lab-slip"
                target="_blank"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                <FileText size={18} aria-hidden="true" />
                Download Lab Slip (PDF)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
