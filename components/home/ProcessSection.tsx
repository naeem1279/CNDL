'use client';

import { useEffect, useState } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
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

  // Escape closes the protocol window.
  useEffect(() => {
    if (!protocolStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProtocolStep(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [protocolStep]);

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-24">
      <div className="container">
        <SectionHeader
          title={
            <>
              How We Deliver Quality <br />
              Restorations
            </>
          }
        />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-2" role="tablist" aria-label="Production steps">
            {steps.map((step) => {
              const isActive = activeStep.id === step.id;
              const StepIcon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStep(step)}
                  className={`flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors duration-150 md:px-5 md:py-4 ${
                    isActive
                      ? 'border-[#1977C5] bg-white'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className={`text-sm font-medium tabular-nums ${isActive ? 'text-[#1977C5]' : 'text-slate-400'}`}>
                    {step.id}
                  </span>
                  <span className="secondary flex-1 text-base font-semibold text-slate-900 md:text-lg">{step.title}</span>
                  <StepIcon
                    size={20}
                    className={`shrink-0 ${isActive ? 'text-[#1977C5]' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Active step detail panel */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 md:p-8" role="tabpanel">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                <ActiveIcon size={24} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-sm font-medium text-[#1668AD]">Step {activeStep.id}</span>
                <h3 className="secondary text-xl font-semibold leading-tight text-slate-900 md:text-2xl">
                  {activeStep.title}
                </h3>
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed text-slate-600">{activeStep.summary}</p>

            <ul className="mt-5 space-y-3">
              {activeStep.standards.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-slate-700">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1977C5]" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>

            <Button onClick={() => setProtocolStep(activeStep)} className="mt-8 w-full sm:w-fit">
              <Microscope size={16} aria-hidden="true" />
              Inspect Quality Protocol
            </Button>
          </div>
        </div>
      </div>

      {/* ================= QUALITY PROTOCOL MODAL ================= */}
      {protocolStep && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setProtocolStep(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="protocol-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                  <protocolStep.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#1668AD]">
                    Quality Protocol · Step {protocolStep.id}
                  </span>
                  <h3 id="protocol-title" className="secondary text-lg font-semibold leading-tight text-slate-900 md:text-xl">
                    {protocolStep.protocol}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProtocolStep(null)}
                aria-label="Close protocol"
                className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-600">{protocolStep.clinical}</p>

            <div className="space-y-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Boxes size={14} className="text-[#1977C5]" aria-hidden="true" /> Equipment &amp; Materials
                </p>
                <ul className="space-y-2">
                  {protocolStep.equipment.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1977C5]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <ShieldCheck size={14} className="text-[#1977C5]" aria-hidden="true" /> Quality Standards
                </p>
                <ul className="space-y-2">
                  {protocolStep.standards.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <MonitorCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
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
