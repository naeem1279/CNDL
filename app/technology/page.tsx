import type { Metadata } from 'next';
import Link from 'next/link';
import ShareHero from '@/components/share/ShareHero';
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
  openGraph: {
    type: 'website',
    url: 'https://cndl-global.com/technology',
    title: 'Advanced Dental CAD/CAM Technology & Precision Hardware | CNDL Global',
    description: 'Sub-micron precision zirconia milling and digital restorative dentistry hardware in Bangladesh.',
    images: [{ url: '/images/CTA.jpg', width: 1200, height: 630, alt: 'CNDL Digital Dental Machinery' }],
  },
};

const machines = [
  {
    id: 'roland-dwx52di',
    name: 'Roland DGSHAPE DWX-52Di Plus',
    origin: 'Engineered in Japan',
    role: '5-Axis Simultaneous Dental CNC Dry Milling',
    icon: Cog,
    accent: '#1977C5',
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
    accent: '#E65100',
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
    accent: '#8E24AA',
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
    accent: '#00897B',
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
    accent: '#1E88E5',
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

export default function TechnologyPage() {
  return (
    <div className="bg-(--bg-primary) text-(--text-primary)">
      {/* Hero Banner */}
      <ShareHero>
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1977C5]/10 border border-[#1977C5]/20 text-[#1977C5] text-xs font-bold uppercase tracking-wider">
            <Cpu size={14} /> Certified Digital Hardware Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[50px] font-bold leading-tight secondary text-(--text-tertiary)">
            Industrial CAD/CAM Machinery &amp; Sub-Micron Precision
          </h1>
          <p className="text-xs md:text-sm lg:text-base text-(--text-tertiary)/90 leading-relaxed">
            Every restoration at CNDL is manufactured 100% in-house on authentic Japanese and global digital dentistry hardware. We never outsource or use unverified domestic casting centers.
          </p>
        </div>
      </ShareHero>

      {/* Metrics Strip */}
      <section className="border-y border-(--border-primary) bg-(--bg-secondary) py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="p-3">
              <div className="text-2xl md:text-4xl font-extrabold text-[#1977C5]">±5 µm</div>
              <div className="text-xs font-semibold text-(--text-secondary) mt-1">Marginal Adaptation</div>
            </div>
            <div className="p-3">
              <div className="text-2xl md:text-4xl font-extrabold text-[#1977C5]">5-Axis</div>
              <div className="text-xs font-semibold text-(--text-secondary) mt-1">Simultaneous CNC Milling</div>
            </div>
            <div className="p-3">
              <div className="text-2xl md:text-4xl font-extrabold text-[#E65100]">1530°C</div>
              <div className="text-xs font-semibold text-(--text-secondary) mt-1">Zirconia Sintering</div>
            </div>
            <div className="p-3">
              <div className="text-2xl md:text-4xl font-extrabold text-[#00897B]">28 µm</div>
              <div className="text-xs font-semibold text-(--text-secondary) mt-1">3D Print Resolution</div>
            </div>
            <div className="col-span-2 md:col-span-1 p-3">
              <div className="text-2xl md:text-4xl font-extrabold text-[#88C845]">3-4 Days</div>
              <div className="text-xs font-semibold text-(--text-secondary) mt-1">Guaranteed Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Machines Showcase */}
      <section className="py-14 md:py-20">
        <div className="container space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold secondary">
              Our 5 Pillars of Manufacturing Excellence
            </h2>
            <p className="text-xs md:text-sm text-(--text-secondary)">
              Explore the dedicated machines powering our restorative production in Khilgaon, Dhaka.
            </p>
          </div>

          <div className="space-y-12">
            {machines.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className="rounded-[20px] md:rounded-[28px] border border-(--border-primary) bg-(--bg-secondary) p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-(--border-primary)">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                        style={{ backgroundColor: m.accent }}
                      >
                        <Icon size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {m.origin}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1977C5]">
                            {m.accuracy}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1.5 secondary">
                          {m.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-[#1977C5] mt-0.5">
                          {m.role}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/order-create"
                      className="self-start lg:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1977C5] text-white text-xs font-bold hover:bg-[#1668ad] transition-colors shadow-sm"
                    >
                      Send Case on this Tech <ArrowRight size={14} />
                    </Link>
                  </div>

                  <p className="py-6 text-xs sm:text-sm md:text-base text-(--text-secondary) leading-relaxed">
                    {m.description}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    {/* Specifications List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Gauge size={14} /> Technical Specifications
                      </h4>
                      <div className="space-y-2">
                        {m.specs.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-(--bg-muted)/40 text-xs gap-1 border border-(--border-primary)/50"
                          >
                            <span className="font-bold text-(--text-secondary)">{s.label}</span>
                            <span className="font-semibold text-(--text-primary) sm:text-right">{s.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Benefits */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <ShieldCheck size={14} /> Clinical Benefits for Clinicians
                      </h4>
                      <div className="space-y-2.5">
                        {m.clinicalBenefits.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs"
                          >
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-emerald-950 font-medium leading-relaxed">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table: CAD/CAM vs Analog */}
      <section className="py-14 md:py-20 bg-(--bg-secondary) border-t border-(--border-primary)">
        <div className="container space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#88C845]/15 text-[#4d7220] text-xs font-bold uppercase tracking-wider">
              Clinical Precision Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold secondary">
              Why Dentists Switch from Analog Casting to CNDL
            </h2>
            <p className="text-xs md:text-sm text-(--text-secondary)">
              A side-by-side comparison between CNDL&apos;s automated 5-axis digital workflow and conventional manual dental laboratories.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[20px] border border-(--border-primary) bg-(--bg-primary) shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-(--border-primary) bg-(--bg-muted) text-(--text-tertiary)">
                  <th className="py-4 px-5 font-bold uppercase text-[11px] tracking-wider">Restoration Parameter</th>
                  <th className="py-4 px-5 font-bold uppercase text-[11px] tracking-wider text-[#1977C5]">CNDL 5-Axis Digital CAD/CAM</th>
                  <th className="py-4 px-5 font-bold uppercase text-[11px] tracking-wider text-slate-400">Traditional Analog Lab</th>
                  <th className="py-4 px-5 font-bold uppercase text-[11px] tracking-wider text-emerald-600">Chairside Clinical Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-primary)">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 font-bold text-(--text-primary)">{row.metric}</td>
                    <td className="py-4 px-5 font-semibold text-[#1977C5] bg-blue-50/20">{row.cndl}</td>
                    <td className="py-4 px-5 text-(--text-secondary)">{row.analog}</td>
                    <td className="py-4 px-5 font-medium text-emerald-800">{row.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Direct Open STL Acceptance Banner */}
      <section className="py-12 border-t border-(--border-primary) bg-(--bg-primary)">
        <div className="container">
          <div className="rounded-[24px] bg-[#0A2540] text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-xl">
            <div className="space-y-3 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#88C845] bg-[#88C845]/20 px-3 py-1 rounded-full">
                Open Scan Protocol
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold secondary leading-tight">
                Direct Integration with Any Intraoral Scanner
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Accepting open STL, OBJ, and PLY files from <strong>3Shape TRIOS, Medit, iTero, Carestream</strong>, and Shining 3D. Send digital files 24/7 with zero physical transit delay.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href="/order-create"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#1977C5] text-white font-bold text-xs sm:text-sm hover:bg-[#1668ad] transition-all shadow-md"
              >
                <FileCheck2 size={16} /> Submit Digital Case
              </Link>
              <a
                href="https://wa.me/8801743167963"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/30 text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-all"
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
