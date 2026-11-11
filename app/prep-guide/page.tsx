import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck, Printer, ArrowRight, FileText, CheckCircle2,
  AlertTriangle, Layers, Activity, Scissors, Sparkles, BookOpen,
  Microscope, Phone, MessageCircle
} from 'lucide-react';
import PrintPrepButton from '@/components/prep-guide/PrintPrepButton';

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
    badgeColor: 'bg-blue-500/10 text-[#1977C5] border-blue-500/20',
    occlusal: '1.0mm – 1.2mm (Anterior Incisal: 1.2mm)',
    axial: '0.8mm – 1.0mm',
    margin: 'Deep Chamfer (0.5mm – 0.8mm) with rounded internal line angles',
    taper: '6° – 8° Total Convergence',
    idealFor: 'Posterior crowns, multi-unit bridges, bruxers, minimal clearance',
  },
  {
    material: 'Porcelain-Fused-to-Metal (PFM / Co-Cr)',
    badge: 'Ceramic-Metal Hybrid',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-400/20',
    occlusal: '1.5mm – 2.0mm (0.5mm metal substructure + 1.0mm–1.5mm porcelain)',
    axial: '1.2mm – 1.5mm',
    margin: '90° Shoulder or Heavy Chamfer (1.0mm – 1.2mm)',
    taper: '6° – 10° Total Convergence',
    idealFor: 'High functional masticatory load, long-span bridges, economical tiers',
  },
  {
    material: 'IPS E-Max / Lithium Disilicate & Veneers',
    badge: 'High Aesthetics · Translucent',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
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
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    science:
      'Diamond milling tools on Japanese Roland 5-axis machines have a physical tip radius (smallest CNDL bur is 0.6mm). Sharp incisal angles or pointed transitions force the CAM software to "over-mill" the internal fitting surface to achieve seating, creating excessive cement gap and ceramic weakness.',
    action: 'Smooth all transition line angles and incisal edges with a fine football or torpedo finishing bur.',
    check: 'Ensure no razor-sharp line angles exist under 10x magnification or loupes.',
  },
  {
    num: '02',
    title: 'Zero Undercuts & 6°–8° Axial Taper',
    icon: Layers,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    science:
      'Rigid CAD/CAM sintered zirconia has zero flexure. Any undercut along the preparation walls creates an impossible path of insertion, forcing virtual software blockout that compromises retention and marginal fit.',
    action: 'Maintain a single, unambiguous path of draw with 6°–8° total occlusal taper (3°–4° per axial wall).',
    check: 'Verify visibility of all margin perimeters from direct occlusal viewing.',
  },
  {
    num: '03',
    title: 'Avoid Feather / Knife-Edge Margins',
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    science:
      'Knife-edge or indistinct bevels prevent milling tools from establishing a defined ceramic boundary, causing micro-chipping during pre-sintered green-state milling and leading to over-contoured margins in the mouth.',
    action: 'Always cut a crisp, continuous Deep Chamfer with at least 0.5mm–0.8mm distinct horizontal ledge.',
    check: 'Ensure the margin is clearly palpable with an explorer probe 360° around the tooth.',
  },
  {
    num: '04',
    title: 'Clear Occlusal Clearance (Centric & Excursive)',
    icon: Activity,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    science:
      'Inadequate reduction (< 1.0mm) forces our digital technicians to thin the zirconia disc during nesting, risking crown fracture under heavy masticatory load or necessitating chairside adjustments that strip glaze.',
    action: 'Verify 1.0mm–1.2mm clearance in centric occlusion AND during lateral/protrusive excursions.',
    check: 'Use a flexible 1.0mm clearance gauge or folded 200μm articulating foil to confirm space.',
  },
  {
    num: '05',
    title: 'Gingival Retraction Protocol (Double-Cord Technique)',
    icon: Scissors,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    science:
      '85% of remake requests across Bangladesh stem from indistinct subgingival margins caused by sulcular fluid or collapsed gingival tissue. Intraoral scanners and PVS silicone cannot read through blood or saliva.',
    action: 'Place size #00 cord first into sulcus floor, followed by size #1 or #2 soaked in aluminum chloride.',
    check: 'Remove top cord immediately before scanning/impression; verify 0.5mm exposed tooth structure apical to margin.',
  },
];

export default function PrepGuidePage() {
  return (
    <div className="bg-(--bg-primary) text-(--text-primary) py-8 sm:py-12 md:py-16">
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* ================= HERO SECTION ================= */}
        <div className="bg-(--bg-secondary) border border-(--border-muted) rounded-[20px] md:rounded-[32px] p-6 sm:p-10 md:p-12 mb-10 md:mb-14 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-[11px] font-bold text-[#1977C5] uppercase tracking-wider">
                <ShieldCheck size={14} />
                ESTD. 2015 · CNDL CLINICAL PROTOCOLS
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black secondary leading-tight tracking-tight">
                Clinical Tooth Preparation &amp; Margin Protocols for CAD/CAM Restorations
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-(--text-secondary) leading-relaxed">
                Essential biological reduction depths, margin geometries, and chairside protocols engineered to guarantee sub-micron marginal adaptation, zero remakes, and predictable seating with Japanese Roland 5-axis milling.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 print:hidden">
              <PrintPrepButton />
              <Link
                href="/lab-slip"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1977C5] bg-white px-6 py-3 text-xs md:text-sm font-bold text-[#1977C5] hover:bg-[#1977C5] hover:text-white transition-all text-center shadow-xs"
              >
                <FileText size={16} />
                Download Lab Slip (PDF)
              </Link>
            </div>
          </div>
        </div>

        {/* ================= SECTION 1: REDUCTION MATRIX TABLE ================= */}
        <section className="mb-12 md:mb-16">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1977C5] block mb-1">
              Standardized Guidelines
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black secondary">
              1. Core Reduction Matrix by Material
            </h2>
            <p className="text-xs sm:text-sm text-(--text-secondary) mt-1">
              Calibrated specifically for Roland DGSHAPE 5-axis milling burs and Aidite monolithic sintering parameters.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[16px] md:rounded-[20px] border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Material &amp; Restoration</th>
                  <th className="py-4 px-4">Occlusal / Incisal</th>
                  <th className="py-4 px-4">Axial Reduction</th>
                  <th className="py-4 px-4">Margin Geometry</th>
                  <th className="py-4 px-4 sm:px-6">Taper &amp; Line Angles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {REDUCTION_MATRIX.map((row) => (
                  <tr key={row.material} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 sm:px-6 align-top">
                      <div className="font-bold text-slate-900">{row.material}</div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-sm border ${row.badgeColor}`}>
                        {row.badge}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">{row.idealFor}</p>
                    </td>
                    <td className="py-4 px-4 align-top font-semibold text-slate-800">
                      {row.occlusal}
                    </td>
                    <td className="py-4 px-4 align-top font-semibold text-slate-800">
                      {row.axial}
                    </td>
                    <td className="py-4 px-4 align-top text-slate-700">
                      <span className="font-bold text-[#1977C5] block">{row.margin}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 align-top text-slate-600 font-mono text-xs">
                      {row.taper}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= SECTION 2: 5 REMAKE PREVENTION RULES ================= */}
        <section className="mb-12 md:mb-16">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1977C5] block mb-1">
              Zero-Remake Protocol
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black secondary">
              2. Five Critical Remake Prevention Rules
            </h2>
            <p className="text-xs sm:text-sm text-(--text-secondary) mt-1">
              Avoid the most frequent causes of restoration rocking, marginal discrepancies, and chairside delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REMAKE_RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.num}
                  className="rounded-[16px] md:rounded-[24px] bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#1977C5]/40 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-[#1977C5] transition-colors">
                        RULE {rule.num}
                      </span>
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rule.color}`}>
                        <Icon size={20} />
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold secondary leading-snug">
                      {rule.title}
                    </h3>

                    <div className="space-y-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                      <p>
                        <strong className="text-slate-800">The Mechanical Science:</strong> {rule.science}
                      </p>
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                        <strong className="text-emerald-700 block text-[11px] uppercase tracking-wider mb-0.5 font-black">
                          ✓ Recommended Clinical Action:
                        </strong>
                        {rule.action}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <CheckCircle2 size={13} className="text-[#1977C5] shrink-0" />
                    <span>{rule.check}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= SECTION 3: IMPRESSION & SCAN TIPS ================= */}
        <section className="mb-12 md:mb-16 bg-(--bg-secondary) border border-(--border-muted) rounded-[20px] md:rounded-[28px] p-6 sm:p-8 md:p-10">
          <div className="flex items-start gap-4 mb-6">
            <span className="w-12 h-12 rounded-2xl bg-[#1977C5]/10 text-[#1977C5] flex items-center justify-center shrink-0">
              <Microscope size={24} />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-bold secondary">
                Impression &amp; Intraoral Scan (IOS) Best Practices
              </h3>
              <p className="text-xs sm:text-sm text-(--text-secondary) mt-1">
                Whether sending digital STL/OBJ scans or physical PVS rubber base impressions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm text-(--text-secondary)">
            <div className="space-y-1.5 p-4 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block font-bold">1. Digital Scanners (STL/OBJ):</strong>
              <p className="leading-relaxed">
                Disable AI teeth-cleaner before margin capture. Verify there are zero mesh holes along the finish line before patient dismissal.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block font-bold">2. Conventional PVS / Polyether:</strong>
              <p className="leading-relaxed">
                Always use a rigid metal or custom tray. Use double-mix one-step technique; inspect margins for zero drags, bubbles or tray impingement.
              </p>
            </div>
            <div className="space-y-1.5 p-4 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block font-bold">3. Stump / Prep Shade Photography:</strong>
              <p className="leading-relaxed">
                For anterior E-max or multilayer zirconia, photograph the prepared stump with a shade tab (ND1–ND9) in the same focal plane under 5500K daylight.
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 4: DOCTOR CTA CARD ================= */}
        <div className="rounded-[24px] md:rounded-[32px] bg-linear-to-r from-slate-900 via-[#13324d] to-slate-900 border border-blue-500/20 p-8 sm:p-10 md:p-12 text-white shadow-xl text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6 print:hidden">
          <div className="max-w-xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-[11px] font-bold text-blue-300">
              <ShieldCheck size={13} />
              Partner with Bangladesh&apos;s #1 CAD/CAM Laboratory
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              Ready to Send Your Case with Guaranteed Precision?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Experience zero-remake prosthetic predictability. Submit cases online in 4 steps or download our official A4 prescription slip.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 justify-center">
            <Link
              href="/order-create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1977C5] hover:bg-[#1668ad] text-white px-6 py-3.5 text-xs sm:text-sm font-bold transition-all shadow-lg text-center"
            >
              Submit Case Online
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/lab-slip"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 text-xs sm:text-sm font-bold transition-all text-center backdrop-blur-sm"
            >
              <FileText size={15} />
              Download Lab Slip (PDF)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
