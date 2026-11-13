'use client';

import { useEffect, useState } from 'react';
import { ScanLine, PenTool, Cog, Sparkles, X, ShieldCheck, Microscope, MonitorCheck, Boxes } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { useHomeCopy } from './HomeText';

const ICONS = [ScanLine, PenTool, Cog, Sparkles];
const IDS = ['01', '02', '03', '04'];

/** Production process (home page and /products). Copy lives in data/home-i18n.ts. */
export default function ProcessSection() {
  const c = useHomeCopy().process;
  const { lang } = useLanguage();
  const [active, setActive] = useState(1);
  const [protocolIdx, setProtocolIdx] = useState<number | null>(null);

  const step = c.steps[active];
  const ActiveIcon = ICONS[active];
  const id = (i: number) => (lang === 'bn' ? (i + 1).toLocaleString('bn-BD').padStart(2, '০') : IDS[i]);

  // Escape closes the protocol window.
  useEffect(() => {
    if (protocolIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProtocolIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [protocolIdx]);

  const protocol = protocolIdx === null ? null : c.steps[protocolIdx];
  const ProtocolIcon = protocolIdx === null ? null : ICONS[protocolIdx];

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="container">
        <Reveal>
          <SectionHeader eyebrow={c.eyebrow} title={c.title} />
        </Reveal>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-2" role="tablist" aria-label={c.tablist}>
            {c.steps.map((s, i) => {
              const isActive = active === i;
              const StepIcon = ICONS[i];
              return (
                <button
                  key={IDS[i]}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={`group flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-[background-color,border-color,box-shadow] duration-200 md:px-5 md:py-4 ${
                    isActive
                      ? 'border-[#1977C5]/60 bg-white shadow-lg shadow-[#1977C5]/10'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-colors ${
                      isActive ? 'bg-[#1977C5] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {id(i)}
                  </span>
                  <span className="secondary flex-1 text-base font-semibold text-slate-900 md:text-lg">{s.title}</span>
                  <StepIcon size={20} className={`shrink-0 ${isActive ? 'text-[#1977C5]' : 'text-slate-400'}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Active step detail panel (re-keyed so each step fades in) */}
          <div key={active} className="reveal flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8" role="tabpanel">
            <div className="mb-6 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className="h-full rounded-full bg-linear-to-r from-[#1977C5] to-sky-400 transition-[width] duration-700" style={{ width: `${((active + 1) / c.steps.length) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1977C5]/10 text-[#1668AD]">
                <ActiveIcon size={24} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-sm font-medium text-[#1668AD]">
                  {c.step} {id(active)}
                </span>
                <h3 className="secondary text-xl font-semibold leading-tight text-slate-900 md:text-2xl">{step.title}</h3>
              </div>
            </div>

            <p className="mt-5 text-base leading-relaxed text-slate-600">{step.summary}</p>

            <ul className="mt-5 space-y-3">
              {step.standards.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-slate-700">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent-500" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>

            <Button onClick={() => setProtocolIdx(active)} className="mt-8 w-full sm:w-fit">
              <Microscope size={16} aria-hidden="true" />
              {c.inspect}
            </Button>
          </div>
        </div>
      </div>

      {/* ================= QUALITY PROTOCOL MODAL ================= */}
      {protocol && ProtocolIcon && protocolIdx !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setProtocolIdx(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="protocol-title"
            className="reveal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                  <ProtocolIcon size={20} aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#1668AD]">
                    {c.protocol} · {c.step} {id(protocolIdx)}
                  </span>
                  <h3 id="protocol-title" className="secondary text-lg font-semibold leading-tight text-slate-900 md:text-xl">
                    {protocol.protocol}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProtocolIdx(null)}
                aria-label={c.close}
                className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-600">{protocol.clinical}</p>

            <div className="space-y-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Boxes size={14} className="text-[#1977C5]" aria-hidden="true" /> {c.equipmentLabel}
                </p>
                <ul className="space-y-2">
                  {protocol.equipment.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1977C5]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <ShieldCheck size={14} className="text-accent-500" aria-hidden="true" /> {c.standardsLabel}
                </p>
                <ul className="space-y-2">
                  {protocol.standards.map((item) => (
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
