'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import Input from '@/components/share/Input';
import Select from '@/components/share/Select';
import PageHeader from '@/components/ui/PageHeader';
import { Button, buttonClass } from '@/components/ui/Button';
import { Check, CheckCircle2, Loader2, Truck, UploadCloud } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type FormState = {
  dentalName: string;
  dentalPhone: string;
  patientName: string;
  service: string;
  toothNumber: string;
  shade: string;
  notes: string;
  files: File[];
  trialDate: string;
  insertionDate: string;
  agreed: boolean;
};

// Canonical lines from the official CNDL Physical Lab Prescription Slip.
// Kept 1:1 with LAB_SLIP_CATALOGUE titles (components/products/productsComponent.tsx)
// so /order-create?service=<title> prefills exactly.
const SERVICE_OPTIONS = [
  'Zirconia Crown / Bridge',
  'Zirconia Inlay / Onlay',
  'Zirconia Core / Repair',
  'Porcelain Veneers',
  'IPS E-Max Restorations',
  'Porcelain Crown Regular',
  'Porcelain Crown Special',
  'Porcelain Metal Bite / Facing',
  'Inlay / Onlay & Core / Repair',
  'Golden Crown / Bridge',
  'Removable Partial Dentures (PD)',
  'Full Dentures (Heat-Cure / Self-Cure / Mesh)',
  'Flexible Partial Dentures (Valplast Style)',
  'In-House Clear Aligners',
  'Orthodontic Appliances & Night/Mouth Guards',
];

const SHADE_OPTIONS = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'Bleach', '3D Master'];

const WHATSAPP_URL =
  'https://wa.me/8801743167963?text=Hello%20CNDL,%20I%20am%20a%20dentist%20and%20would%20like%20to%20send%20a%20dental%20case%20/%20STL%20scan.';

const steps = ['01', '02', '03', '04'] as const;
const STEP_TITLES = ['Clinic, Patient & Service', 'Upload Files', 'Dates', 'Review & Submit'];

const WHATSAPP_PATH =
  'M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z';

export default function OrderCreatePage() {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // On a step change, bring the top of the form back into view (phones end a step far down the page).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = cardRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const [form, setForm] = useState<FormState>({
    dentalName: '',
    dentalPhone: '',
    patientName: '',
    service: '',
    toothNumber: '',
    shade: '',
    notes: '',
    files: [],
    trialDate: '',
    insertionDate: '',
    agreed: false,
  });

    const [serviceOptions, setServiceOptions] = useState<string[]>(SERVICE_OPTIONS);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.services) && d.services.length > 0) {
          setServiceOptions(d.services.map((s: ServiceApiRow) => s.name));
        }
      })
      .catch(() => {});
  }, []);

  // Prefill product from /order-create?product=<name> or ?service=<name>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('product') || params.get('service');
    if (!q) return;
    const decoded = q.trim();
    const match =
      serviceOptions.find((o) => o.toLowerCase() === decoded.toLowerCase()) ??
      serviceOptions.find((o) => o.toLowerCase().startsWith(decoded.toLowerCase()));
    if (match) setForm((f) => ({ ...f, service: match }));
  }, [serviceOptions]);

  const next = () => {
    if (step === 1 && (!form.dentalName || !form.dentalPhone || !form.patientName || !form.service)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setForm({ ...form, files: Array.from(e.target.files) });
  };

  const handleSubmit = async () => {
    if (!form.agreed) return;

    // F1 (2026-11-05): files are actually uploaded now — reject oversized ones
    // client-side before wasting the request.
    const oversized = form.files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`File too large (max 10 MB): ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const clinical = [
        form.service,
        form.toothNumber && `Teeth: ${form.toothNumber}`,
        form.shade && `Shade: ${form.shade}`,
        form.notes && `Notes: ${form.notes}`,
        form.trialDate && `Trial: ${form.trialDate}`,
        form.insertionDate && `Insertion: ${form.insertionDate}`,
      ]
        .filter(Boolean)
        .join(' | ');

      // multipart/form-data — files are transmitted with the case (F1 fix).
      const fd = new FormData();
      fd.set('name', form.dentalName);
      fd.set('phone', form.dentalPhone);
      if (form.patientName) fd.set('patientName', form.patientName);
      fd.set('productType', clinical);
      fd.set('quantity', '1');
      form.files.forEach((f) => fd.append('files', f));

      const res = await fetch('/api/order', { method: 'POST', body: fd });

      if (res.ok) {
        toast.success('Order submitted successfully!');
        setStep(1);
        setForm({
          dentalName: '',
          dentalPhone: '',
          patientName: '',
          service: '',
          toothNumber: '',
          shade: '',
          notes: '',
          files: [],
          trialDate: '',
          insertionDate: '',
          agreed: false,
        });
      } else {
        toast.error('Failed to submit order.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <PageHeader
        title={
          <>
            Secure Online Dental Case
            <br className="hidden sm:block" /> Submission
          </>
        }
        lead="A precise, 4-step process for predictable restoration results."
      />
      <div className="bg-slate-50 py-10 md:py-16">
        <div className="container">
          <div ref={cardRef} className="mx-auto w-full max-w-xl scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            {/* Stepper */}
            <ol className="flex items-center" aria-label="Progress">
              {steps.map((s, index) => {
                const n = index + 1;
                const done = step > n;
                const current = step === n;
                return (
                  <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={current ? 'step' : undefined}>
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors ${
                        done
                          ? 'bg-[#1977C5] text-white'
                          : current
                            ? 'border-2 border-[#1977C5] bg-white text-[#1977C5]'
                            : 'border border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {done ? <Check size={18} strokeWidth={2.5} aria-label={`Step ${n} done`} /> : s}
                    </span>
                    {index !== steps.length - 1 && (
                      <span className={`mx-2 h-0.5 flex-1 rounded-full sm:mx-3 ${done ? 'bg-[#1977C5]' : 'bg-slate-200'}`} />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 border-b border-slate-100 pb-6">
              <p className="text-sm font-medium text-[#1668AD]">Step {step} of 4</p>
              <h2 className="secondary mt-1 text-2xl font-semibold text-slate-900">{STEP_TITLES[step - 1]}</h2>
            </div>

            <div className="mt-6">
              {step === 1 && (
                <div className="space-y-5">
                  <Input
                    label="Dental Clinic/Doctor Name"
                    placeholder="Enter dental clinic or doctor name"
                    type="text"
                    autoComplete="organization"
                    value={form.dentalName}
                    onChange={(e) => setForm({ ...form, dentalName: e.target.value })}
                  />

                  <Input
                    label="Dental Clinic Phone Number"
                    placeholder="Enter contact number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.dentalPhone}
                    onChange={(e) => setForm({ ...form, dentalPhone: e.target.value })}
                  />

                  <Input
                    label="Patient Name"
                    placeholder="Enter patient name"
                    type="text"
                    autoComplete="off"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  />

                  <Select
                    label="Select Dental Product"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    options={serviceOptions}
                    placeholder="Select dental product"
                  />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label="Tooth Number(s) — FDI Notation"
                      placeholder="e.g., 16, 17 (upper right quadrant)"
                      type="text"
                      value={form.toothNumber}
                      onChange={(e) => setForm({ ...form, toothNumber: e.target.value })}
                    />

                    <Select
                      label="Shade Selection"
                      value={form.shade}
                      onChange={(e) => setForm({ ...form, shade: e.target.value })}
                      options={SHADE_OPTIONS}
                      placeholder="Select shade"
                    />
                  </div>

                  <Input
                    label="Clinical Case Notes / Special Instructions"
                    placeholder="Occlusion, contacts, margin design, special requests..."
                    type="textarea"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-[#1977C5]/60 hover:bg-[#1977C5]/5 focus-within:border-[#1977C5] focus-within:ring-4 focus-within:ring-[#1977C5]/15">
                    <input
                      type="file"
                      multiple
                      accept=".stl,.obj,.dcm,.pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={onFileChange}
                    />
                    <span className="flex size-12 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                      <UploadCloud size={24} aria-hidden="true" />
                    </span>
                    <span className="mt-4 text-lg font-semibold text-slate-900">Upload Digital Files</span>
                    <span className="mt-1 text-sm text-slate-500">RX / Scan / Photos (STL, OBJ, DCM, PDF, JPG, PNG)</span>
                    <span className={buttonClass('secondary', 'md', 'mt-5 pointer-events-none')}>Choose Files</span>
                  </label>

                  {form.files.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        {form.files.length} files selected
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-emerald-900/80">
                        {form.files.map((f) => (
                          <li key={f.name + f.size} className="flex justify-between gap-3">
                            <span className="truncate">{f.name}</span>
                            <span className="shrink-0 tabular-nums">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-600">
                    <p>
                      Have large intraoral scan files (STL/OBJ/DICOM)? You can also dispatch them directly
                      to our lab WhatsApp at <span className="whitespace-nowrap font-semibold text-slate-900">+880 1743-167963</span> for
                      instant confirmation.
                    </p>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-[#128C7E] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D]"
                    >
                      <svg viewBox="0 0 32 32" fill="currentColor" className="size-4" aria-hidden="true">
                        <path d={WHATSAPP_PATH} />
                      </svg>
                      Dispatch via WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <Input
                    label="Trial/Insertion Date"
                    type="date"
                    value={form.trialDate}
                    onChange={(e) => setForm({ ...form, trialDate: e.target.value })}
                  />
                  <p className="flex gap-2 rounded-xl bg-[#1977C5]/5 p-4 text-sm leading-relaxed text-slate-700">
                    <Truck size={18} className="mt-0.5 shrink-0 text-[#1977C5]" aria-hidden="true" />
                    Standard turnaround: 3 working days in Dhaka, 3–4 working days nationwide. Plan your insertion date accordingly.
                  </p>
                  <Input
                    label="Insertion Date"
                    type="date"
                    value={form.insertionDate}
                    onChange={(e) => setForm({ ...form, insertionDate: e.target.value })}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
                    <Row label="Clinic/Doctor" value={form.dentalName} />
                    <Row label="Patient" value={form.patientName} />
                    <Row label="Restoration" value={form.service} />
                    <Row label="Teeth" value={form.toothNumber || '—'} />
                    <Row label="Shade" value={form.shade || '—'} />
                    {form.notes && <Row label="Notes" value={form.notes} />}
                    <Row label="Files" value={form.files.length + ' uploaded'} />
                  </dl>

                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.agreed}
                      onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#1977C5]"
                    />
                    I agree to CNDL’s terms and 3–4 working day lead time policy
                  </label>
                </div>
              )}
            </div>

            <div className="mt-8 flex w-full gap-3">
              <Button variant="secondary" size="lg" onClick={back} disabled={step === 1 || loading} className="flex-1">
                Back
              </Button>

              {step < 4 ? (
                <Button size="lg" onClick={next} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button size="lg" onClick={handleSubmit} disabled={!form.agreed || loading} className="flex-1">
                  {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
