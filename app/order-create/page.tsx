'use client';
import type { ServiceApiRow } from '@/lib/service-types';

import Input from '@/components/share/Input';
import Select from '@/components/share/Select';
import ShareHero from '@/components/share/ShareHero';
import uploadIcon from '@/public/images/upload_icon.png';
import Image from 'next/image';
import { ChangeEvent, useEffect, useState } from 'react';
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

export default function OrderCreatePage() {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

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
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          Secure Online Dental Case
          <br />
          Submission
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          A precise, 4-step process for predictable restoration results.
        </p>
      </ShareHero>
      <div className="container my-5 sm:my-10 md:my-12 lg:my-16 xl:my-20 bg-white flex items-center justify-center">
        <div className="w-full max-w-[508px] mx-auto">
          <h2 className=" text-sm md:text-base lg:text-lg xl:text-xl text-center font-semibold secondary mb-1 md:mb-2 xl:mb-3">
            Step {step} of 4: Details
          </h2>
          <p className="text-center text-xs md:text-xs lg:text-base text-(--text-secondary) mb-8">
            {step === 1 ? 'Clinic, Patient & Service' : step === 2 ? 'Upload Files' : step === 3 ? 'Dates' : 'Review & Submit'}
          </p>

          <div className="flex items-center w-full">
            {steps.map((s, index) => {
              const active = step >= index + 1;

              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={"flex items-center justify-center rounded-full font-medium w-8 h-8 md:w-10 md:h-10 lg:w-12.5 lg:h-12.5 text-xs md:text-xs lg:text-base " + (active ? 'bg-[#96CF5A] text-(--text-tertiary)' : 'bg-(--bg-secondary) text-(--text-primary)')}
                  >
                    {s}
                  </div>

                  {index !== steps.length - 1 && (
                    <div className="flex-1 h-px mx-3 md:mx-4 bg-gray-300" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 md:mt-8 lg:mt-10">
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Dental Clinic/Doctor Name"
                  placeholder="Enter dental clinic or doctor name"
                  type="text"
                  value={form.dentalName}
                  onChange={(e) => setForm({ ...form, dentalName: e.target.value })}
                />
                
                <Input
                  label="Dental Clinic Phone Number"
                  placeholder="Enter contact number"
                  type="text"
                  value={form.dentalPhone}
                  onChange={(e) => setForm({ ...form, dentalPhone: e.target.value })}
                />

                <Input
                  label="Patient Name"
                  placeholder="Enter patient name"
                  type="text"
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
              <div className="bg-(--bg-muted) text-(--text-tertiary) rounded-[10px] md:rounded-[16px] p-5 mb-5 text-xs md:text-xs lg:text-base">
                <p>
                  Have large intraoral scan files (STL/OBJ/DICOM)? You can also dispatch them directly
                  to our lab WhatsApp at <span className="font-semibold whitespace-nowrap">+880 1743-167963</span> for
                  instant confirmation.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-medium text-white hover:scale-105 transition-transform"
                >
                  <svg viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
                  </svg>
                  Dispatch via WhatsApp
                </a>
              </div>
            )}
            {step === 2 && (
              <div className="border-2 border-dashed border-(--border-primary) h-[262px] flex items-center justify-center flex-col rounded-lg p-10 text-center">
                <Image
                  width={48}
                  height={48}
                  src={uploadIcon}
                  alt="upload"
                  className="w-12 h-12 mb-2 md:mb-[18px]"
                />
                <p className="text-sm md:text-base lg:text-lg xl:text-xl font-medium mb-2 md:mb-[17px]">
                  Upload Digital Files
                </p>
                <p className="text-xs md:text-xs lg:text-base text-(--text-secondary) mb-2 md:mb-[18px]">
                  RX / Scan / Photos (STL, OBJ, DCM, PDF, JPG, PNG)
                </p>

                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    accept=".stl,.obj,.dcm,.pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={onFileChange}
                  />
                  <span className="px-6 py-2.5 bg-[#96CF5A] text-(--text-tertiary) rounded-[8px] text-xs md:text-xs lg:text-base cursor-pointer">
                    Choose Files
                  </span>
                </label>
                {form.files.length > 0 && <p className="mt-2 text-xs text-green-600">{form.files.length} files selected</p>}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <Input
                  label="Trial/Insertion Date"
                  type="date"
                  value={form.trialDate}
                  onChange={(e) => setForm({ ...form, trialDate: e.target.value })}
                />
                <p className="text-xs md:text-xs lg:text-base text-(--text-secondary)">
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
                <div className="bg-(--bg-muted)/20 rounded-[24px] px-6 py-10 text-sm">        
                  <Row label="Clinic/Doctor" value={form.dentalName} />
                  <Row label="Patient" value={form.patientName} />
                  <Row label="Restoration" value={form.service} />
                  <Row label="Teeth" value={form.toothNumber || '—'} />
                  <Row label="Shade" value={form.shade || '—'} />
                  {form.notes && <Row label="Notes" value={form.notes} />}
                  <Row label="Files" value={form.files.length + " uploaded"} />
                </div>

                <label className="flex items-center gap-2 text-xs md:text-xs lg:text-base text-(--text-secondary)">
                  <input
                    type="checkbox"
                    checked={form.agreed}
                    onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                    className="w-6 h-6 accent-(--primary) border border-(--border-primary) rounded-[8px]! outline-none"
                  />
                  I agree to CNDL’s terms and 3–4 working day lead time policy
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 md:mt-8 lg:mt-10 w-full gap-2.5">
            <button
              onClick={back}
              disabled={step === 1 || loading}
              className="w-full border rounded-[8px] border-(--border-primary) py-2 text-xs md:text-xs lg:text-base font-semibold disabled:opacity-40 cursor-pointer hover:scale-105 transition-transform"
            >
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={next}
                className="w-full bg-(--bg-muted) text-(--text-tertiary) border rounded-[8px] border-(--border-primary) py-2 text-xs md:text-xs lg:text-base font-semibold cursor-pointer hover:scale-105 transition-transform"
              >
                Next
              </button>
            ) : (
              <button
                disabled={!form.agreed || loading}
                onClick={handleSubmit}
                className="w-full bg-(--bg-muted) text-white border rounded-[8px] border-(--border-primary) py-2 text-xs md:text-xs lg:text-base font-semibold disabled:opacity-40 cursor-pointer hover:scale-105 transition-transform"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-xs md:text-xs lg:text-base">
      <span className="text-(--text-secondary)">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}