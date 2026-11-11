'use client';

import { useState } from 'react';
import {
  ScanLine, PenTool, Cog, Sparkles, X, ShieldCheck, Microscope,
  MonitorCheck, Boxes,
} from 'lucide-react';

const steps = [
  {
    id: '01',
    title: 'Automatic Case Identification',
    icon: ScanLine,
    protocol: 'Automatic Case ID & Digital Intake',
    summary:
      'The moment a case arrives it is registered, sanitized and issued a unique CNDL Case ID — the same ID your patient can track live on our Case Tracker.',
    clinical:
      'Every prescription, impression or intraoral scan is logged against the issuing clinician and restoration type before touching the production floor. STL files from Medit, 3Shape and iTero are ingested directly; physical impressions are photographed and disinfected at the intake bench.',
    equipment: [
      'Digital case intake form with scan upload (open STL architecture)',
      'Intake-bench disinfection & impression sanitization',
      'Automatic CNDL Case ID generation + SMS acknowledgement',
    ],
    standards: [
      'Zero paper-tag mixing — every case is digitally tracked end-to-end',
      'Same-day digital registration of all incoming cases',
      'Prescription completeness verified before design begins',
    ],
  },
  {
    id: '02',
    title: 'Digital Design & Planning',
    icon: PenTool,
    protocol: '3D CAD Design & Digital Preparation Check',
    summary:
      'Margins are traced under magnification and full anatomy is engineered in Exocad — with a digital preparation check that flags undercuts, blockers and insufficient reduction before anything is milled.',
    clinical:
      'Our designers mark margins on scanned geography, verify cement gap parameters per material, and simulate occlusion against opposing anatomy. Insertion axis, contact tightness and emergence profile are all locked digitally and archived with the case.',
    equipment: [
      'Exocad CAD platform with margin-mapping toolset',
      'High-accuracy lab scan workstations',
      'Digital preparation-check reports shared with the clinician when needed',
    ],
    standards: [
      'Material-specific cement gap (zirconia / E-Max) enforced in software',
      'Margin integrity re-verified at 100% of cases before release to milling',
      'Design archive retained for every case for reproducibility',
    ],
  },
  {
    id: '03',
    title: 'Precision Manufacturing',
    icon: Cog,
    protocol: '5-Axis Roland Sub-Micron Dry Milling',
    summary:
      'Restorations are milled in-house on Roland DGSHAPE 5-axis dry milling from authentic Aidite multilayer zirconia discs — never outsourced, never substituted.',
    clinical:
      'Multilayer discs are nested to preserve shade gradation from cervical to incisal. Dry milling eliminates cooling-related micro-fractures, and sprue placement is planned away from functional cusps to protect anatomy during finishing.',
    equipment: [
      'Roland DGSHAPE 5-axis dry milling unit',
      'Genuine Aidite Multilayer Zirconia discs (certified blanks only)',
      'UP3D high-temperature sintering furnaces',
    ],
    standards: [
      'Sub-micron marginal accuracy verified at every production stage',
      'Authentic blank traceability — certificate on request',
      'Sintering cycles logged per batch for full zirconia crystal integrity',
    ],
  },
  {
    id: '04',
    title: 'Quality Control & Finishing',
    icon: Sparkles,
    protocol: 'Shofu Natural Glazing & Microscopic Inspection',
    summary:
      'Each restoration receives authentic Shofu (Japan) glaze and a final microscopic marginal inspection before it is disinfected, packed and dispatched to your chamber within 3 working days.',
    clinical:
      'Glaze firing is calibrated for natural light dynamics and wear-friendliness against opposing enamel. Under the microscope we verify marginal fit, interproximal contacts and occlusal maps — a restoration that fails any check returns to finishing, never to the clinician.',
    equipment: [
      'Authentic Shofu (Japan) glaze & staining system',
      'Stereo-microscopic inspection stations',
      'Articulator-based occlusal verification',
    ],
    standards: [
      '100% microscopic marginal inspection — no batch sampling',
      'Disinfectant packing before dispatch',
      '3-day dedicated chamber rider delivery across Dhaka',
    ],
  },
];

export default function ProcessSection() {
  const [activeStep, setActiveStep] = useState(steps[1]);
  const [protocolStep, setProtocolStep] = useState<(typeof steps)[number] | null>(null);
  const ActiveIcon = activeStep.icon;

  return (
    <section className="py-7 sm:py-10 md:py-20 bg-(--bg-primary)">
      <div className="container ">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary mb-10">
          How We Deliver Quality <br />
          Restorations
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="flex flex-row lg:flex-col items-center justify-center flex-wrap lg:flex-nowrap gap-4 lg:gap-0">
            {steps.map((step) => {
              const isActive = activeStep.id === step.id;
              const StepIcon = step.icon;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step)}
                  className={`flex items-center gap-4 px-4 py-2 sm:px-3 sm:py-7 md:px-6 md:py-5 xl:px-7 xl:py-8 text-left transition border-2 lg:border-l-2 lg:border-0 cursor-pointer rounded-[12px]  lg:rounded-none w-fit lg:w-full ${
                    isActive
                      ? 'lg:border-l-4 bg-(--bg-muted)/10 border-(--border-secondary) lg:rounded-r-[24px]'
                      : 'border-(--border-primary)'
                  }`}
                >
                  <span className="text-sm md:text-base lg:text-lg xl:text-xl text-(--text-secondary)">
                    {step.id}
                  </span>

                  <span className="font-bold secondary text-base md:text-lg lg:text-xl xl:text-2xl">
                    {step.title}
                  </span>
                  <StepIcon
                    size={18}
                    className={`ml-auto hidden lg:block shrink-0 ${isActive ? 'text-[#1977C5]' : 'text-(--text-muted)'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Active step detail panel (replaces legacy dead video block) */}
          <div className="relative rounded-[10px] md:rounded-[16px] lg:rounded-[24px] overflow-hidden shadow-lg bg-linear-to-br from-[#226AB4] to-[#3387CB] p-7 md:p-10 text-white min-h-[360px] flex flex-col">
            <div className="flex items-center gap-4 mb-5">
              <span className="w-14 h-14 rounded-[16px] bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <ActiveIcon size={26} />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block">
                  Step {activeStep.id}
                </span>
                <h3 className="text-lg md:text-2xl font-bold leading-tight">{activeStep.title}</h3>
              </div>
            </div>

            <p className="text-xs md:text-sm lg:text-base text-white/90 leading-relaxed mb-4">
              {activeStep.summary}
            </p>

            <ul className="space-y-2 mb-7">
              {activeStep.standards.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[11px] md:text-sm text-white/85">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-white" />
                  {s}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setProtocolStep(activeStep)}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs md:text-sm font-bold text-[#1977C5] shadow-lg hover:shadow-xl transition-all group w-full sm:w-fit min-h-[48px]"
            >
              <Microscope size={16} />
              Inspect Quality Protocol
            </button>
          </div>
        </div>
      </div>

      {/* ================= QUALITY PROTOCOL MODAL ================= */}
      {protocolStep && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setProtocolStep(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[16px] md:rounded-[24px] shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-[14px] bg-(--bg-muted) flex items-center justify-center shrink-0">
                  <protocolStep.icon size={21} className="text-[#1977C5]" />
                </span>
                <div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1977C5] block">
                    Quality Protocol · Step {protocolStep.id}
                  </span>
                  <h3 className="text-base md:text-xl font-bold secondary leading-tight">
                    {protocolStep.protocol}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setProtocolStep(null)}
                aria-label="Close protocol"
                className="p-1.5 rounded-full hover:bg-(--bg-muted) transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs md:text-sm text-(--text-secondary) leading-relaxed mb-6">
              {protocolStep.clinical}
            </p>

            <div className="space-y-5">
              <div>
                <p className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <Boxes size={12} className="text-[#1977C5]" /> Equipment &amp; Materials
                </p>
                <ul className="space-y-1.5">
                  {protocolStep.equipment.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs md:text-sm text-(--text-secondary)">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1977C5] mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <ShieldCheck size={12} className="text-[#88C845]" /> Quality Standards
                </p>
                <ul className="space-y-1.5">
                  {protocolStep.standards.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs md:text-sm text-(--text-secondary)">
                      <MonitorCheck size={14} className="mt-0.5 shrink-0 text-[#88C845]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
