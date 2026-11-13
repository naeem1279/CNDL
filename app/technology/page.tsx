import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/seo';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/Button';
import {
  Cog, Flame, Sparkles, Printer, ScanLine, CheckCircle2, ShieldCheck, ArrowRight, Cpu, Gauge, FileCheck2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'CAD/CAM Technology & Advanced Machinery | CN Dental Lab (CNDL)',
  description: 'Explore CNDL\'s industrial dental hardware: 5-axis Roland DGSHAPE dry milling (±5µm precision), UP3D 1530°C sintering furnace, authentic Japanese Shofu 900°C glaze, and Phrozen 8K 3D printing in Dhaka, Bangladesh.',
  keywords: [
    'Roland DGSHAPE Bangladesh',
    'dental CAD CAM technology Dhaka',
    '5 axis zirconia milling machine Bangladesh',
    'UP3D sintering furnace',
    'Shofu glaze dental lab Dhaka',
    'Phrozen 8K dental 3D printer',
    'Shining 3D DS EX Pro scanner',
    'digital dentistry laboratory Bangladesh',
  ],
  alternates: { canonical: 'https://cndl-global.com/technology' },
  openGraph: {
    type: 'website',
    url: 'https://cndl-global.com/technology',
    title: 'Advanced Dental CAD/CAM Technology & Precision Hardware | CNDL Global',
    description: 'Sub-micron precision zirconia milling and digital restorative dentistry hardware in Bangladesh.',
    images: [OG_IMAGE],
  },
};

const machines = [
  {
    id: 'roland-dwx52di',
    name: 'Roland DGSHAPE DWX-52Di Plus',
    origin: 'Engineered in Japan',
    role: '5-Axis Simultaneous Dental CNC Dry Milling',
    icon: Cog,
    accuracy: '±5 µm Marginal Precision',
    description:
      'The gold standard in dental CAD/CAM milling. Engineered for continuous industrial operation with an internal ionizer that neutralizes static electricity when milling zirconia blanks, ensuring ultra-smooth surfaces and razor-sharp margin adaptation.',
    specs: [
      { label: 'Axis Configuration', val: '5-Axis Simultaneous (X, Y, Z, A, B rotaries)' },
      { label: 'Tool Capacity', val: '10-Station Automatic Tool Changer (ATC)' },
      { label: 'Collet & Spindle', val: 'High-frequency 30,000 RPM precision spindle' },
      { label: 'Compatible Blanks', val: '98.5mm Discs (Aidite Multilayer Zirconia, PMMA, Wax, Hybrid Ceramic)' },
      { label: 'Air Pressure / Ionizer', val: 'Built-in compressed air ionizer preventing static dust cling' },
    ],
    clinicalBenefits: [
      'Zero micro-chipping on fragile feather-edge margins',
      'Flawless occlusal groove reproduction (down to 0.6mm burs)',
      'Sub-micron interproximal contact calibration for effortless seating',
    ],
  },
  {
    id: 'up3d-f20',
    name: 'UP3D F20 Sintering Furnace',
    origin: 'High-Temperature Thermal Engineering',
    role: 'Rapid Thermal Profiling & Zirconia Crystallization',
    icon: Flame,
    accuracy: '1530°C Precision Thermal Curve',
    description:
      'Controlled thermal crystallization furnace optimized for Aidite monolithic and multilayer zirconia blanks. Precise multi-segment heating schedules allow optimal light transmittance without compromising the 1200+ MPa flexural matrix.',
    specs: [
      { label: 'Maximum Temperature', val: '1530°C High-Purity Firing' },
      { label: 'Heating Elements', val: 'High-purity Silicon Carbide (SiC) clean rods' },
      { label: 'Atmosphere Control', val: 'Zero-greening, oxidation-resistant firing chamber' },
      { label: 'Tray Capacity', val: 'Up to 30 units per cycle with uniform heat dissipation' },
      { label: 'Microprocessor', val: 'PID intelligent temperature gradient control' },
    ],
    clinicalBenefits: [
      'True gradient shade transition mimicking natural human dentin and enamel',
      'Complete phase transformation preventing delayed intraoral fractures',
      'Uniform grain compaction with zero internal porosity',
    ],
  },
  {
    id: 'cameo-cfp200',
    name: 'Cameo CFP-200 Glaze & Porcelain Furnace',
    origin: 'Specialized Ceramic Finishing',
    role: 'Authentic Japanese Shofu Glaze (900°C Curve)',
    icon: Sparkles,
    accuracy: '900°C Vacuum Glaze Cycle',
    description:
      'Dedicated vacuum porcelain and stain/glaze furnace running calibrated heating profiles for authentic Japanese Shofu Vintage Art systems. Generates an enamel-like fluorescent luster that prevents opposing tooth abrasion.',
    specs: [
      { label: 'Firing Temperature', val: '900°C Controlled Vacuum Ramp' },
      { label: 'Vacuum Seal', val: 'Zero-void deep vacuum pump preventing cloudy glaze' },
      { label: 'Staining Medium', val: 'Authentic Shofu Vintage Art Porcelain Stains (Japan)' },
      { label: 'Cooling Stage', val: 'Linear cooling curve to avoid micro-crazing in porcelain' },
    ],
    clinicalBenefits: [
      'Lifelike optical vitality and light dispersion under natural daylight',
      'Ultra-smooth vitrified surface preventing plaque and calculus accumulation',
      'Kind to natural antagonist teeth (low abrasive wear coefficient)',
    ],
  },
  {
    id: 'phrozen-mighty8k',
    name: 'Phrozen Sonic Mighty 8K',
    origin: 'Advanced Additive Manufacturing',
    role: 'Ultra-High-Resolution 3D Model & Guide Printing',
    icon: Printer,
    accuracy: '28 µm XY Micro-Resolution',
    description:
      'High-speed mono LCD 3D printing system delivering 28-micron pixel resolution for intraoral model verification, working removable dies, orthodontic aligner staging models, and implant surgical guides.',
    specs: [
      { label: 'XY Resolution', val: '28 µm (7680 × 4320 pixels)' },
      { label: 'Light Engine', val: 'Linear Projection LED matrix with 405nm UV' },
      { label: 'Resin Compatibility', val: 'Medical-grade Biocompatible & High-impact Dental Resins' },
      { label: 'Build Envelope', val: '218 × 123 × 235 mm (multi-arch batch capability)' },
    ],
    clinicalBenefits: [
      'Removable die stability with exact frictional resistance',
      '100% in-house digital clear aligner staging in medical-grade PETG',
      'Implant drill guide precision within 0.1mm deviation',
    ],
  },
  {
    id: 'shining-dsexpro',
    name: 'Shining 3D DS-EX Pro',
    origin: 'Optical Digitization Platform',
    role: 'Micron-Accurate Optical Scanner for Models & Impressions',
    icon: ScanLine,
    accuracy: '< 10 µm Optical Digitization',
    description:
      'High-speed structured light scanner with multi-die scanning capability. Digitizes full arches, triple trays, and bite registrations in seconds with direct open-STL/OBJ pipeline export into exocad and 3Shape dental software.',
    specs: [
      { label: 'Scan Accuracy', val: '< 10 µm (ISO 12836 certified)' },
      { label: 'Scan Speed', val: '10 sec full arch, 12 sec all-in-one die plate' },
      { label: 'Light Technology', val: 'Structured blue-light LED with multi-camera triangulation' },
      { label: 'Data Output', val: 'Open STL, OBJ, and PLY with color texture' },
    ],
    clinicalBenefits: [
      'Eliminates volumetric impression shrinkage before milling starts',
      'Direct compatibility with intraoral scans from Medit, 3Shape, and iTero',
      'Complete bite relationship accuracy without distortion',
    ],
  },
];

const comparisonData = [
  {
    metric: 'Marginal Adaptation',
    cndl: '≤ 5 to 15 µm (Sub-micron 5-Axis Roland CNC)',
    analog: '80 to 120 µm (Manual hand-wax & lost-wax casting)',
    impact: 'Virtually eliminates cement line dissolution, micro-leakage, and secondary caries.',
  },
  {
    metric: 'Turnaround Time',
    cndl: '3 to 4 Working Days (Direct CAD toolpath)',
    analog: '7 to 10 Days (Multiple burnout, casting & finishing steps)',
    impact: 'Rapid delivery across Dhaka with predictable patient seat dates.',
  },
  {
    metric: 'Internal Void & Porosity',
    cndl: 'Zero Porosity (Solid Aidite isostatic blank)',
    analog: 'Frequent casting porosity, air pockets & alloy shrinkage',
    impact: 'Extreme flexural strength (>1200 MPa) preventing crown fracture.',
  },
  {
    metric: 'Occlusal Anatomy & Contact',
    cndl: 'Digital virtual articulator calibrated to patient bite',
    analog: 'Subjective manual carving with uneven wear',
    impact: 'Minimal chairside grinding needed; seats in under 5 minutes.',
  },
  {
    metric: 'Re-Milling & Digital Archiving',
    cndl: 'Instant 1-click re-milling from cloud STL file',
    analog: 'Requires patient recall & complete re-impression',
    impact: 'Lifelong digital archive for every patient case.',
  },
];

const metrics = [
  { value: '±5 µm', label: 'Marginal Adaptation' },
  { value: '5-Axis', label: 'Simultaneous CNC Milling' },
  { value: '1530°C', label: 'Zirconia Sintering' },
  { value: '28 µm', label: '3D Print Resolution' },
  { value: '3-4 Days', label: 'Guaranteed Delivery' },
];

export default function TechnologyPage() {
  return (
    <div className="bg-white text-slate-900">
      <PageHeader
        eyebrow={
          <>
            <Cpu size={14} className="shrink-0 text-[#1977C5]" aria-hidden="true" />
            <span className="min-w-0">Certified Digital Hardware Architecture</span>
          </>
        }
        title="Industrial CAD/CAM Machinery & Sub-Micron Precision"
        lead="Every restoration at CNDL is manufactured 100% in-house on authentic Japanese and global digital dentistry hardware. We never outsource or use unverified domestic casting centers."
      />

      {/* Metrics Strip */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="container">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5">
            {metrics.map((m, i) => (
              <div key={m.label} className={`text-center ${i === metrics.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}>
                <dt className="sr-only">{m.label}</dt>
                <dd className="secondary text-3xl font-semibold text-slate-900 md:text-4xl">{m.value}</dd>
                <dd className="mt-1 text-sm text-slate-600">{m.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Core Machines Showcase */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container">
          <SectionHeader
            align="center"
            title="Our 5 Pillars of Manufacturing Excellence"
            lead="Explore the dedicated machines powering our restorative production in Khilgaon, Dhaka."
          />

          <div className="space-y-6">
            {machines.map((m) => {
              const Icon = m.icon;
              return (
                <article key={m.id} id={m.id} className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-6 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                        <Icon size={24} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {m.origin}
                          </span>
                          <span className="rounded-full bg-[#1977C5]/10 px-2.5 py-0.5 text-xs font-medium text-[#1668AD]">
                            {m.accuracy}
                          </span>
                        </div>
                        <h3 className="secondary mt-2 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">{m.name}</h3>
                        <p className="mt-1 text-sm font-medium text-[#1668AD]">{m.role}</p>
                      </div>
                    </div>

                    <ButtonLink href="/order-create" variant="secondary" className="self-start lg:self-center">
                      Send Case on this Tech
                      <ArrowRight size={16} aria-hidden="true" />
                    </ButtonLink>
                  </div>

                  <p className="py-6 text-base leading-relaxed text-slate-600">{m.description}</p>

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Specifications List */}
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <Gauge size={14} aria-hidden="true" /> Technical Specifications
                      </h4>
                      <dl className="divide-y divide-slate-100">
                        {m.specs.map((s) => (
                          <div key={s.label} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:justify-between sm:gap-6">
                            <dt className="shrink-0 text-slate-500">{s.label}</dt>
                            <dd className="font-medium text-slate-900 sm:text-right">{s.val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    {/* Clinical Benefits */}
                    <div>
                      <h4 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <ShieldCheck size={14} aria-hidden="true" /> Clinical Benefits for Clinicians
                      </h4>
                      <ul className="space-y-3">
                        {m.clinicalBenefits.map((b) => (
                          <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison: CAD/CAM vs Analog */}
      <section className="border-t border-slate-200 bg-white py-16 md:py-24">
        <div className="container">
          <SectionHeader
            align="center"
            eyebrow="Clinical Precision Comparison"
            title="Why Dentists Switch from Analog Casting to CNDL"
            lead="A side-by-side comparison between CNDL's automated 5-axis digital workflow and conventional manual dental laboratories."
          />

          {/* Phones and tablets: one card per parameter */}
          <div className="space-y-4 lg:hidden">
            {comparisonData.map((row) => (
              <div key={row.metric} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold text-slate-900">{row.metric}</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[#1668AD]">CNDL 5-Axis Digital CAD/CAM</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{row.cndl}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Traditional Analog Lab</dt>
                    <dd className="mt-0.5 text-slate-600">{row.analog}</dd>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Chairside Clinical Impact</dt>
                    <dd className="mt-0.5 text-slate-700">{row.impact}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop: full table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th scope="col" className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Restoration Parameter</th>
                  <th scope="col" className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-[#1668AD]">CNDL 5-Axis Digital CAD/CAM</th>
                  <th scope="col" className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Traditional Analog Lab</th>
                  <th scope="col" className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-slate-500">Chairside Clinical Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonData.map((row) => (
                  <tr key={row.metric}>
                    <th scope="row" className="px-5 py-4 font-semibold text-slate-900">{row.metric}</th>
                    <td className="bg-[#1977C5]/[0.03] px-5 py-4 font-medium text-slate-900">{row.cndl}</td>
                    <td className="px-5 py-4 text-slate-600">{row.analog}</td>
                    <td className="px-5 py-4 text-slate-700">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Direct Open STL Acceptance Banner: the page's one blue band */}
      <section className="bg-white pb-16 md:pb-24">
        <div className="container">
          <div className="flex flex-col justify-between gap-8 bg-mesh-brand rounded-[2rem] p-8 text-white shadow-2xl shadow-[#1977C5]/20 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-white/80">Open Scan Protocol</p>
              <h2 className="secondary mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                Direct Integration with Any Intraoral Scanner
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/85">
                Accepting open STL, OBJ, and PLY files from <strong className="font-semibold text-white">3Shape TRIOS, Medit, iTero, Carestream</strong>, and Shining 3D. Send digital files 24/7 with zero physical transit delay.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink href="/order-create" variant="inverse" size="lg">
                <FileCheck2 size={18} aria-hidden="true" /> Submit Digital Case
              </ButtonLink>
              <a
                href="https://wa.me/8801743167963"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 px-6 text-base font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1977C5]"
              >
                Discuss Clinical Tech
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
