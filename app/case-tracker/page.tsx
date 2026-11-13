'use client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, Check, Search, MessageCircle, ArrowRight, PackageCheck,
  Loader2, ScanSearch, Sparkles, ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const WHATSAPP_URL = 'https://wa.me/8801743167963';

const STEPS = [
  {
    key: 'Received',
    label: 'Received & Sanitized',
    minProgress: 10,
    detail: 'Case logged with a unique CNDL Case ID, impressions disinfected and digital intake verified.',
  },
  {
    key: 'Designing',
    label: 'CAD Margin Design (Exocad)',
    minProgress: 30,
    detail: 'Margins traced and full anatomy engineered in Exocad with a digital preparation check.',
  },
  {
    key: 'Milling',
    label: '5-Axis Roland Milling',
    minProgress: 60,
    detail: 'Sub-micron dry milling from authentic Aidite multilayer zirconia discs.',
  },
  {
    key: 'Quality Control',
    label: 'Shofu Glaze & Microscopic QC',
    minProgress: 85,
    detail: 'Shofu (Japan) natural glazing, sintering and microscopic marginal inspection.',
  },
  {
    key: 'Dispatched',
    label: 'Dispatched to Chamber',
    minProgress: 100,
    detail: 'Final polish, disinfectant packing and dispatch with our dedicated 3-day chamber rider.',
  },
];

function activeStepIndex(status: string, progress: number): number {
  const byStatus = STEPS.findIndex((s) => s.key === status);
  if (byStatus !== -1) return byStatus;
  // Legacy / unknown statuses (e.g. PENDING): derive from production progress.
  if (progress >= 100) return 4;
  if (progress >= 85) return 3;
  if (progress >= 60) return 2;
  if (progress >= 30) return 1;
  return 0;
}

/** Same convention as the admin console: "Work | Key: value | Key: value" segments. */
function clinicalChips(productType: string | null | undefined) {
  if (!productType) return [] as { label: string; value: string }[];
  const chips: { label: string; value: string }[] = [];
  for (const seg of productType.split(' | ')) {
    const m = seg.match(/^(Patient|Teeth|Shade|Notes|Trial|Insertion):\s*([\s\S]*)$/);
    if (m && m[2].trim()) chips.push({ label: m[1], value: m[2].trim() });
    else if (seg.trim()) chips.push({ label: 'Restoration', value: seg.trim() });
  }
  return chips;
}

/** The restoration line of a `Key: value | ...` productType string. */
function mainProduct(productType: string | null | undefined): string {
  if (!productType) return '—';
  const seg = productType
    .split(' | ')
    .find((s) => !/^(Patient|Teeth|Shade|Notes|Trial|Insertion):/.test(s.trim()));
  return seg?.trim() || '—';
}

/** Public, field-whitelisted case shape returned by GET /api/tracker. */
type TrackedCase = {
  id: string;
  caseId: string;
  customerName: string;
  productType: string | null;
  quantity: number;
  status: string;
  progress: number;
  deliveryDate: string | null;
  updatedAt: string;
};

function CaseTrackerPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState<TrackedCase | null>(null);
  const [cases, setCases] = useState<TrackedCase[]>([]);
  const [searched, setSearched] = useState(false);

  const track = async (raw: string) => {
    const q = raw.trim();
    if (!q) return toast.error('Please enter Case ID or Phone');
    setLoading(true);
    try {
      const res = await fetch(`/api/tracker?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body?.cases)) {
          // Phone search — one or many cases.
          setCases(body.cases);
          setCaseData(body.cases.length === 1 ? body.cases[0] : null);
        } else {
          setCases([]);
          setCaseData(body);
        }
      } else {
        setCases([]);
        setCaseData(null);
        if (res.status === 404) toast.error('Case not found — check the ID and try again');
        else toast.error('Search failed');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  // Allow the header quick-search dialog to deep-link: /case-tracker?q=CNDL-...
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setQuery(q);
      track(q);
    }
     
  }, []);

  const activeIdx = caseData ? activeStepIndex(caseData.status, caseData.progress ?? 0) : -1;
  const chips = caseData ? clinicalChips(caseData.productType) : [];
  const inquireUrl = caseData
    ? `${WHATSAPP_URL}?text=${encodeURIComponent(
        `Hello CNDL Global, I would like an update on case ${caseData.caseId} (Chamber: ${caseData.customerName}). Thank you.`
      )}`
    : WHATSAPP_URL;

  return (
    <section className="text-slate-900">
      <PageHeader
        title={
          <>
            Track Your Dental Case
            <br className="hidden sm:block" /> Status
          </>
        }
        lead="Follow your restoration through every production stage — from digital intake to your chamber door in 3 working days."
      />

      <div className="bg-slate-50 py-10 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* ============ SEARCH ============ */}
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                track(query);
              }}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
            >
              <label htmlFor="case-query" className="sr-only">
                Case ID or phone number
              </label>
              <div className="flex flex-1 items-center gap-3 rounded-xl px-3 focus-within:ring-4 focus-within:ring-[#1977C5]/15">
                <Search size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  id="case-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Case ID e.g. CNDL-LEGACY-001 or Phone"
                  autoComplete="off"
                  className="h-12 w-full min-w-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <Button type="submit" size="lg" disabled={loading} className="sm:px-8">
                {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <ScanSearch size={18} aria-hidden="true" />}
                {loading ? 'Searching…' : 'Track Case'}
              </Button>
            </form>

            {/* ============ MULTI-CASE PICKER (phone search) ============ */}
            {cases.length > 1 && !caseData && (
              <div className="reveal rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <p className="text-sm font-medium text-slate-500">Found {cases.length} cases for this number</p>
                <h2 className="secondary mt-1 text-2xl font-semibold text-slate-900">Your Active Cases</h2>
                <p className="mt-1 text-sm text-slate-600">Select a case to view its live production timeline.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {cases.map((c) => {
                    const idx = activeStepIndex(c.status, c.progress ?? 0);
                    const stage = c.status === 'PENDING' ? STEPS[idx].label : c.status;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCaseData(c)}
                        className="cursor-pointer rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#1977C5]/50 hover:bg-[#1977C5]/[0.03]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold text-[#1668AD]">{c.caseId}</span>
                          <StatusChip status={c.status} label={stage} />
                        </div>
                        <div className="mt-2 truncate text-sm font-semibold">Chamber: {c.customerName}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">{mainProduct(c.productType)}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Promised delivery: {c.deliveryDate ? fmtDate(c.deliveryDate) : '—'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ RESULT CARD ============ */}
            {caseData && (
              <div className="reveal space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10">
                {cases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCaseData(null)}
                    className="-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-2 text-sm font-medium text-[#1668AD] hover:bg-[#1977C5]/5"
                  >
                    <ArrowLeft size={16} aria-hidden="true" /> All {cases.length} cases
                  </button>
                )}
                {/* header */}
                <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">Case ID</p>
                    <h2 className="secondary break-all font-mono text-2xl font-semibold text-slate-900 md:text-3xl">{caseData.caseId}</h2>
                    <p className="mt-1 text-sm text-slate-600">Chamber: {caseData.customerName}</p>
                  </div>
                  <div className="md:text-right">
                    <StatusChip
                      status={caseData.status}
                      label={caseData.status === 'PENDING' ? STEPS[activeIdx].label : caseData.status}
                      large
                    />
                    <p className="mt-2 text-sm text-slate-500">Last update: {fmtDate(caseData.updatedAt)}</p>
                  </div>
                </div>

                {/* clinical summary */}
                <div>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Clinical Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {chips.length > 0 ? (
                      chips.map((chip, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                        >
                          <span className="text-xs font-medium uppercase tracking-wide text-[#1668AD]">{chip.label}</span>
                          <span className="font-medium text-slate-900">{chip.value}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Restoration details on file at the lab.</span>
                    )}
                    {typeof caseData.quantity === 'number' && caseData.quantity > 1 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#1668AD]">Units</span>
                        <span className="font-medium text-slate-900">{caseData.quantity}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span id="progress-label" className="font-medium text-slate-700">Production Progress</span>
                      <span className="font-semibold tabular-nums text-[#1668AD]">{caseData.progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-labelledby="progress-label"
                      aria-valuenow={caseData.progress ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className="h-full rounded-full bg-[#1977C5] transition-all duration-700"
                        style={{ width: `${Math.max(caseData.progress ?? 0, 4)}%` }}
                      />
                    </div>
                  </div>

                  <a
                    href={inquireUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#128C7E] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D] sm:w-auto"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    Inquire About This Case on WhatsApp
                  </a>
                </div>

                {/* ============ 5-STEP TIMELINE ============ */}
                <div>
                  <h3 className="mb-5 text-xs font-medium uppercase tracking-wide text-slate-500">Delivery Timeline</h3>
                  <ol>
                    {STEPS.map((step, index) => {
                      const isCompleted = index < activeIdx || (index === activeIdx && (caseData.progress ?? 0) >= 100);
                      const showActive = index === activeIdx && !isCompleted;
                      const reached = isCompleted || showActive;

                      return (
                        <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0" aria-current={showActive ? 'step' : undefined}>
                          {/* connector */}
                          {index < STEPS.length - 1 && (
                            <span
                              className={`absolute bottom-0 left-[19px] top-10 w-0.5 ${isCompleted ? 'bg-[#1977C5]' : 'bg-slate-200'}`}
                              aria-hidden="true"
                            />
                          )}

                          {/* node */}
                          <span
                            className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                              isCompleted
                                ? 'border-[#1977C5] bg-[#1977C5] text-white'
                                : showActive
                                  ? 'border-[#1977C5] bg-white text-[#1977C5] ring-4 ring-[#1977C5]/15'
                                  : 'border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            {isCompleted ? <Check size={18} strokeWidth={2.5} aria-label="Done" /> : index + 1}
                          </span>

                          {/* copy */}
                          <div className="pt-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className={`text-base font-semibold ${reached ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</h4>
                              {showActive && (
                                <span className="rounded-full bg-[#1977C5]/10 px-2.5 py-0.5 text-xs font-medium text-[#1668AD]">
                                  In Progress
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 max-w-xl text-sm leading-relaxed ${reached ? 'text-slate-600' : 'text-slate-500'}`}>
                              {step.detail}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            )}

            {/* ============ NOT FOUND ============ */}
            {searched && !caseData && cases.length <= 1 && !loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center md:p-12" role="status">
                <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Search size={22} aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-lg font-semibold">No case found for &ldquo;{query}&rdquo;</h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
                  Double-check the Case ID from your confirmation SMS, or search with the phone number used on the order form.
                </p>
              </div>
            )}

            {/* ============ EMPTY STATE ============ */}
            {!caseData && !searched && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center md:p-12">
                <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-brand-duo text-[#226AB4]">
                  <PackageCheck size={24} aria-hidden="true" />
                </span>
                <h2 className="secondary mb-3 text-xl font-semibold md:text-2xl">Live Case Visibility, Zero Guesswork</h2>
                <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600">
                  Every CNDL case is tracked through five verifiable production stages and dispatched within
                  <span className="font-semibold text-slate-900"> 3 working days</span>. Enter the Case ID from your confirmation SMS
                  (or the phone number on your order) to see exactly where your restoration is right now.
                </p>
                <div className="mt-6 inline-flex flex-col items-center gap-3 sm:flex-row">
                  <span className="text-sm text-slate-500">Try a sample ID</span>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('CNDL-LEGACY-001');
                      track('CNDL-LEGACY-001');
                    }}
                    className="font-mono"
                  >
                    CNDL-LEGACY-001
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-7 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <ShieldCheck size={16} className="shrink-0 text-accent-500" aria-hidden="true" />
                  Patient-identifiable data is never displayed publicly — only clinical essentials.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Production stage pill: green once dispatched, blue while in the lab. */
function StatusChip({ status, label, large = false }: { status: string; label: string; large?: boolean }) {
  const done = status === 'Dispatched' || status === 'Delivered';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${
        large ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-[#1977C5]/10 text-[#1668AD]'}`}
    >
      {large && <Sparkles size={14} aria-hidden="true" />}
      {label}
    </span>
  );
}

export default CaseTrackerPage;
