'use client';
import ShareHero from '@/components/share/ShareHero';
import {
  Check, Search, MessageCircle, ArrowRight, PackageCheck,
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
    <section className="text-black bg-(--bg-muted)">
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          Track Your Dental Case<br />Status
        </h1>
        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 max-w-3xl text-(--text-tertiary)">
          Follow your restoration through every production stage — from digital intake to your chamber door in 3 working days.
        </p>
      </ShareHero>

      <div className="container py-14 md:py-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ============ SEARCH ============ */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white p-2 rounded-[16px] md:rounded-[24px] shadow-lg border border-gray-100">
            <div className="flex items-center flex-1 gap-3 px-4">
              <Search size={20} className="text-(--text-muted) shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && track(query)}
                placeholder="Enter Case ID e.g. CNDL-LEGACY-001 or Phone"
                className="w-full h-14 focus:outline-none text-sm md:text-base lg:text-lg bg-transparent"
              />
            </div>
            <button
              onClick={() => track(query)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] md:rounded-[16px] px-8 h-14 font-bold bg-[#1977C5] text-white hover:brightness-110 transition-all disabled:opacity-50 text-sm md:text-base"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ScanSearch size={18} />}
              {loading ? 'Searching…' : 'Track Case'}
            </button>
          </div>

          {/* ============ MULTI-CASE PICKER (phone search) ============ */}
          {cases.length > 1 && !caseData && (
            <div className="reveal mt-10 bg-white p-6 sm:p-8 rounded-[16px] md:rounded-[24px] shadow-lg border border-gray-100">
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                Found {cases.length} cases for this number
              </p>
              <h2 className="text-xl md:text-2xl font-black text-[#1977C5]">Your Active Cases</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Select a case to view its live production timeline.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {cases.map((c) => {
                  const idx = activeStepIndex(c.status, c.progress ?? 0);
                  const stage = c.status === 'PENDING' ? STEPS[idx].label : c.status;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCaseData(c)}
                      className="text-left rounded-2xl border-2 border-gray-100 hover:border-[#1977C5]/50 hover:shadow-md p-4 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-sm text-[#1977C5]">{c.caseId}</span>
                        <span className="inline-flex items-center rounded-full bg-[#88C845]/15 text-[#5a9424] border border-[#88C845]/30 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                          {stage}
                        </span>
                      </div>
                      <div className="text-sm font-bold mt-2 truncate">Chamber: {c.customerName}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">{mainProduct(c.productType)}</div>
                      <div className="text-[11px] text-gray-400 mt-2 font-semibold">
                        Promised delivery: {c.deliveryDate
                          ? new Date(c.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ RESULT CARD ============ */}
          {caseData && (
            <div className="reveal mt-10 space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-[16px] md:rounded-[24px] lg:rounded-[32px] shadow-xl border border-gray-100">
              {cases.length > 1 && (
                <button
                  onClick={() => setCaseData(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1977C5] hover:underline min-h-[36px]"
                >
                  ← All {cases.length} cases
                </button>
              )}
              {/* header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Case ID</p>
                  <h2 className="text-2xl md:text-3xl font-black text-[#1977C5]">{caseData.caseId}</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">
                    Chamber: {caseData.customerName}
                  </p>
                </div>
                <div className="md:text-right">
                  <span className="inline-flex items-center gap-2 bg-[#88C845]/15 text-[#5a9424] px-4 py-2 rounded-full font-black text-[10px] md:text-xs tracking-widest border border-[#88C845]/30 uppercase">
                    <Sparkles size={13} />
                    {caseData.status === 'PENDING' ? STEPS[activeIdx].label : caseData.status}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">
                    Last update: {new Date(caseData.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* clinical summary */}
              <div>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Clinical Summary</p>
                <div className="flex flex-wrap gap-2">
                  {chips.length > 0 ? (
                    chips.map((chip, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-(--bg-muted) border border-gray-200 rounded-full px-3.5 py-1.5 text-xs md:text-sm"
                      >
                        <span className="font-black text-[#1977C5] uppercase text-[9px] md:text-[10px] tracking-widest">{chip.label}</span>
                        <span className="font-semibold">{chip.value}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs md:text-sm text-gray-400">Restoration details on file at the lab.</span>
                  )}
                  {typeof caseData.quantity === 'number' && caseData.quantity > 1 && (
                    <span className="inline-flex items-center gap-1.5 bg-(--bg-muted) border border-gray-200 rounded-full px-3.5 py-1.5 text-xs md:text-sm">
                      <span className="font-black text-[#1977C5] uppercase text-[9px] md:text-[10px] tracking-widest">Units</span>
                      <span className="font-semibold">{caseData.quantity}</span>
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                    <span>Production Progress</span>
                    <span className="text-[#1977C5] text-sm md:text-base">{caseData.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#1977C5] to-[#3387CB] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(caseData.progress ?? 0, 4)}%` }}
                    />
                  </div>
                </div>

                <a
                  href={inquireUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-xs md:text-sm font-bold text-white shadow-md hover:brightness-105 transition-all min-h-[44px] w-full sm:w-auto"
                >
                  <MessageCircle size={16} />
                  Inquire About This Case on WhatsApp
                  <ArrowRight size={15} />
                </a>
              </div>

              {/* ============ 5-STEP TIMELINE ============ */}
              <div className="pt-2">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Delivery Timeline</p>
                <div className="relative">
                  {STEPS.map((step, index) => {
                    const isCompleted = index < activeIdx || (index === activeIdx && (caseData.progress ?? 0) >= 100);
                    const showActive = index === activeIdx;

                    return (
                      <div key={step.key} className="relative flex gap-4 md:gap-5 pb-6 md:pb-8 last:pb-0">
                        {/* connector */}
                        {index < STEPS.length - 1 && (
                          <div
                            className={`absolute left-[19px] md:left-[23px] top-10 md:top-12 bottom-0 w-[2px] ${isCompleted ? 'bg-[#1977C5]' : 'bg-gray-100'}`}
                          />
                        )}

                        {/* node */}
                        <div
                          className={`relative z-10 w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isCompleted
                              ? 'bg-[#1977C5] border-[#1977C5] text-white shadow-lg shadow-blue-100'
                              : showActive
                                ? 'bg-white border-[#1977C5] text-[#1977C5] shadow-lg shadow-blue-100'
                                : 'bg-white border-gray-200 text-gray-300'
                          }`}
                        >
                          {isCompleted ? (
                            <Check size={20} strokeWidth={3} />
                          ) : (
                            <span className={`font-black text-[10px] md:text-xs ${showActive ? 'text-[#1977C5]' : 'text-gray-300'}`}>
                              {index + 1}
                            </span>
                          )}
                          {showActive && !isCompleted && (
                            <span className="absolute inset-0 rounded-full border-2 border-[#1977C5]/40 animate-ping" />
                          )}
                        </div>

                        {/* copy */}
                        <div className="pt-1 md:pt-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`text-sm md:text-base lg:text-lg font-bold ${isCompleted || showActive ? 'text-(--text-primary)' : 'text-gray-400'}`}>
                              {step.label}
                            </h3>
                            {showActive && (
                              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-[#1977C5] text-white rounded-full px-2.5 py-1">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className={`text-xs md:text-sm mt-1 leading-relaxed max-w-xl ${isCompleted || showActive ? 'text-(--text-secondary)' : 'text-gray-300'}`}>
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============ NOT FOUND ============ */}
          {searched && !caseData && !loading && (
            <div className="mt-10 bg-white p-8 md:p-12 rounded-[16px] md:rounded-[24px] shadow-lg border border-gray-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Search size={24} className="text-red-400" />
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2">No case found for &ldquo;{query}&rdquo;</h3>
              <p className="text-xs md:text-sm text-(--text-secondary) max-w-md mx-auto">
                Double-check the Case ID from your confirmation SMS, or search with the phone number used on the order form.
              </p>
            </div>
          )}

          {/* ============ EMPTY STATE ============ */}
          {!caseData && !searched && (
            <div className="mt-10 bg-white p-8 md:p-12 rounded-[16px] md:rounded-[24px] lg:rounded-[32px] shadow-lg border border-gray-100 text-center">
              <div className="w-16 h-16 mx-auto rounded-[20px] bg-(--bg-muted) flex items-center justify-center mb-5">
                <PackageCheck size={30} className="text-[#1977C5]" />
              </div>
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold secondary mb-3">Live Case Visibility, Zero Guesswork</h3>
              <p className="text-xs md:text-sm lg:text-base text-(--text-secondary) leading-relaxed max-w-xl mx-auto">
                Every CNDL case is tracked through five verifiable production stages and dispatched within
                <span className="font-bold text-[#1977C5]"> 3 working days</span>. Enter the Case ID from your confirmation SMS
                (or the phone number on your order) to see exactly where your restoration is right now.
              </p>
              <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Try a sample ID</span>
                <button
                  onClick={() => {
                    setQuery('CNDL-LEGACY-001');
                    track('CNDL-LEGACY-001');
                  }}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#1977C5]/30 bg-[#1977C5]/5 px-5 py-2.5 font-mono text-xs md:text-sm font-bold text-[#1977C5] hover:bg-[#1977C5]/10 transition-all"
                >
                  CNDL-LEGACY-001
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="mt-7 flex items-center justify-center gap-2 text-[10px] md:text-xs text-gray-400">
                <ShieldCheck size={14} className="text-[#88C845]" />
                Patient-identifiable data is never displayed publicly — only clinical essentials.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CaseTrackerPage;
