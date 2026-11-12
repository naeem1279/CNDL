'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';

const UPPER_TEETH = [
  // Upper Right (Quadrant 1): 18 down to 11
  '18', '17', '16', '15', '14', '13', '12', '11',
  // Upper Left (Quadrant 2): 21 up to 28
  '21', '22', '23', '24', '25', '26', '27', '28'
];

const LOWER_TEETH = [
  // Lower Right (Quadrant 4): 48 down to 41
  '48', '47', '46', '45', '44', '43', '42', '41',
  // Lower Left (Quadrant 3): 31 up to 38
  '31', '32', '33', '34', '35', '36', '37', '38'
];

const PRODUCTS_ZIRCONIA = [
  'Zirconia Crown / Bridge (Aidite Multilayer)',
  'Zirconia Inlay / Onlay',
  'Zirconia Core / Repair',
  'Porcelain Veneers (E-max / Feldspathic)',
  'IPS E-Max Restorations (Lithium Disilicate)',
];

const PRODUCTS_PFM = [
  'Porcelain Crown Regular (PFM)',
  'Porcelain Crown Special (Premium Layered PFM)',
  'Porcelain Metal Bite / Facing',
  'Inlay / Onlay & Core / Repair (Metal/PFM)',
  'Golden Crown / Bridge (Gold Alloy)',
];

const PRODUCTS_DENTURES = [
  'Removable Partial Dentures (PD - Cast/Acrylic)',
  'Full Dentures (Heat-Cure / Self-Cure / Mesh)',
  'Flexible Partial Dentures (Valplast Style)',
  'In-House Clear Aligners (8K Printed PETG)',
  'Orthodontic Appliances & Night/Mouth Guards',
];

const POPULAR_SHADES = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
  'BL1', 'BL2', 'BL3', 'BL4',
];

export default function LabSlipPage() {
  const [selectedTeeth, setSelectedTeeth] = useState<Record<string, boolean>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [selectedShade, setSelectedShade] = useState<string>('A2');
  const [ponticDesign, setPonticDesign] = useState<string>('Modified Ridge Lap');
  const [marginType, setMarginType] = useState<string>('Deep Chamfer');
  const [occlusion, setOcclusion] = useState<string>('In Occlusion');

  const toggleTooth = (t: string) => {
    setSelectedTeeth((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-900 font-sans print:m-0 print:p-0">
      {/* ================= TOP ACTION BAR (Hidden on Print) ================= */}
      <div className="print:hidden sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to Website
            </Link>
            <span className="h-4 w-px bg-slate-700 hidden sm:inline" />
            <h1 className="text-xs font-medium text-slate-300 sm:text-sm">
              Official Physical Lab Prescription Slip<span className="hidden sm:inline"> · Single Page A4</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1977C5] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1668AD]"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* ================= PRINT CONTAINER (CALIBRATED FOR A4) ================= */}
      <div className="py-6 print:py-0">
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white p-6 sm:p-8 print:p-0 print:max-w-none print:shadow-none shadow-xl border border-slate-200 print:border-none flex flex-col justify-between text-[11px] leading-tight">
          
          <div>
            {/* ── 1. HEADER ── */}
            <header className="border-b-2 border-slate-900 pb-3 mb-3">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      CNDL GLOBAL
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-900 text-white uppercase tracking-widest">
                      ESTD. 2015
                    </span>
                  </div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#1977C5]">
                    Chishtiya Nizamia Dental Laboratory · Khilgaon, Dhaka
                  </div>
                  <p className="text-[9.5px] text-slate-600 max-w-md leading-normal">
                    419/1/C Khilgaon (West Side of Jorpukur Field), Dhaka-1219, Bangladesh
                    <br />
                    <strong>Hotline:</strong> +880 1743-167963 / +880 1805-976351 &nbsp;|&nbsp; <strong>Web:</strong> cndl-global.com
                  </p>
                </div>

                <div className="text-right border border-slate-900 p-2 rounded-sm bg-slate-50 min-w-[170px]">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-1 text-center">
                    LAB PRESCRIPTION SLIP
                  </div>
                  <div className="text-[10px] space-y-1 text-left font-mono">
                    <div><strong>RX NO:</strong> CNDL-__________</div>
                    <div><strong>DATE:</strong> ____ / ____ / {new Date().getFullYear()}</div>
                  </div>
                </div>
              </div>
            </header>

            {/* ── 2. CLINICAL INTAKE GRID ── */}
            <section className="border border-slate-900 rounded-sm mb-3 overflow-hidden">
              <div className="bg-slate-900 text-white px-2 py-1 text-[9.5px] font-black uppercase tracking-wider">
                1. Clinical Intake &amp; Clinician Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-300 text-[10px]">
                <div className="p-1.5 col-span-2 sm:col-span-2">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Doctor&apos;s Name:</span>
                  <span className="font-semibold text-slate-800">Dr. ____________________________________</span>
                </div>
                <div className="p-1.5 col-span-2 sm:col-span-2">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Dental Clinic / Hospital:</span>
                  <span className="font-semibold text-slate-800">__________________________________________</span>
                </div>
                <div className="p-1.5">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Doctor&apos;s Phone:</span>
                  <span className="font-semibold text-slate-800">+880 ________________</span>
                </div>
                <div className="p-1.5">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Required Delivery Date:</span>
                  <span className="font-semibold text-slate-800">____/____/{new Date().getFullYear()}</span>
                </div>
                <div className="p-1.5">
                  <span className="font-bold text-slate-500 block text-[9px] uppercase">Patient Name:</span>
                  <span className="font-semibold text-slate-800">______________________</span>
                </div>
                <div className="p-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-500 block text-[9px] uppercase">Age / Gender:</span>
                    <span className="font-semibold text-slate-800">____ Yrs</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-700 flex gap-1.5">
                    <span>[ ] M</span>
                    <span>[ ] F</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 3. INTERACTIVE / PRINTABLE FDI TOOTH CHART ── */}
            <section className="border border-slate-900 rounded-sm mb-3">
              <div className="bg-slate-900 text-white px-2 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center justify-between">
                <span>2. Anatomical FDI Tooth Chart (Circle or Click to Select Restorations)</span>
                <span className="text-[8.5px] font-normal text-slate-300 print:hidden">Click numbers to highlight</span>
              </div>

              <div className="p-2 bg-slate-50/50">
                {/* Upper Jaw (Maxillary) */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1 mb-1">
                    <span>RIGHT (UR - Q1)</span>
                    <span className="font-black text-slate-700 tracking-wider">UPPER JAW (MAXILLARY)</span>
                    <span>LEFT (UL - Q2)</span>
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-[repeat(16,minmax(0,1fr))] gap-1 border border-slate-300 p-1 rounded-sm bg-white">
                    {UPPER_TEETH.map((tooth, idx) => {
                      const isSelected = !!selectedTeeth[tooth];
                      return (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          className={`aspect-square min-h-[26px] flex items-center justify-center font-bold text-[10px] rounded-sm border transition-all ${
                            idx === 7 ? 'border-r-2 border-r-slate-900' : ''
                          } ${
                            isSelected
                              ? 'bg-[#1977C5] text-white border-[#1977C5] print:bg-slate-900 print:border-slate-900 ring-2 ring-[#1977C5]/30'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 print:border-slate-400'
                          }`}
                        >
                          {tooth}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lower Jaw (Mandibular) */}
                <div>
                  <div className="grid grid-cols-8 sm:grid-cols-[repeat(16,minmax(0,1fr))] gap-1 border border-slate-300 p-1 rounded-sm bg-white">
                    {LOWER_TEETH.map((tooth, idx) => {
                      const isSelected = !!selectedTeeth[tooth];
                      return (
                        <button
                          key={tooth}
                          type="button"
                          onClick={() => toggleTooth(tooth)}
                          className={`aspect-square min-h-[26px] flex items-center justify-center font-bold text-[10px] rounded-sm border transition-all ${
                            idx === 7 ? 'border-r-2 border-r-slate-900' : ''
                          } ${
                            isSelected
                              ? 'bg-[#1977C5] text-white border-[#1977C5] print:bg-slate-900 print:border-slate-900 ring-2 ring-[#1977C5]/30'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 print:border-slate-400'
                          }`}
                        >
                          {tooth}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1 mt-1">
                    <span>RIGHT (LR - Q4)</span>
                    <span className="font-black text-slate-700 tracking-wider">LOWER JAW (MANDIBULAR)</span>
                    <span>LEFT (LL - Q3)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 4. 15 DENTAL PRODUCTS (CANONICAL DATABASE CATALOGUE) ── */}
            <section className="border border-slate-900 rounded-sm mb-3">
              <div className="bg-slate-900 text-white px-2 py-1 text-[9.5px] font-black uppercase tracking-wider">
                3. Prescribed Dental Product &amp; Material Selection (15 Laboratory Lines)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 p-2 text-[9.5px]">
                {/* Category 1 */}
                <div className="space-y-1.5 pr-2">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-1 text-[10px] uppercase text-[#1977C5]">
                    A. Zirconia &amp; All-Ceramic
                  </div>
                  {PRODUCTS_ZIRCONIA.map((p) => (
                    <label key={p} className="flex items-start gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedProducts[p]}
                        onChange={() => toggleProduct(p)}
                        className="mt-0.5 rounded-xs accent-[#1977C5] print:accent-black shrink-0"
                      />
                      <span className="text-slate-800 font-medium leading-tight">{p}</span>
                    </label>
                  ))}
                </div>

                {/* Category 2 */}
                <div className="space-y-1.5 px-0 sm:px-2 pt-2 sm:pt-0">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-1 text-[10px] uppercase text-[#1977C5]">
                    B. Porcelain (PFM &amp; Metal)
                  </div>
                  {PRODUCTS_PFM.map((p) => (
                    <label key={p} className="flex items-start gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedProducts[p]}
                        onChange={() => toggleProduct(p)}
                        className="mt-0.5 rounded-xs accent-[#1977C5] print:accent-black shrink-0"
                      />
                      <span className="text-slate-800 font-medium leading-tight">{p}</span>
                    </label>
                  ))}
                </div>

                {/* Category 3 */}
                <div className="space-y-1.5 pl-0 sm:pl-2 pt-2 sm:pt-0">
                  <div className="font-black text-slate-900 border-b border-slate-200 pb-1 text-[10px] uppercase text-[#1977C5]">
                    C. Dentures &amp; Orthodontics
                  </div>
                  {PRODUCTS_DENTURES.map((p) => (
                    <label key={p} className="flex items-start gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedProducts[p]}
                        onChange={() => toggleProduct(p)}
                        className="mt-0.5 rounded-xs accent-[#1977C5] print:accent-black shrink-0"
                      />
                      <span className="text-slate-800 font-medium leading-tight">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 5. TECHNICAL SPECIFICATIONS & SHADE SELECTION ── */}
            <section className="border border-slate-900 rounded-sm mb-3">
              <div className="bg-slate-900 text-white px-2 py-1 text-[9.5px] font-black uppercase tracking-wider">
                4. Prosthetic Engineering &amp; Aesthetic Specifications
              </div>

              <div className="p-2 space-y-2 text-[9.5px]">
                {/* Shade Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 uppercase">Shade Selection (Vita Classical / Bleach):</span>
                    <span className="font-semibold text-slate-500">Stump / Prep Shade: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_SHADES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedShade(s)}
                        className={`px-1.5 py-0.5 rounded-xs border text-[9px] font-bold ${
                          selectedShade === s
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <span className="text-[9px] font-medium text-slate-600 pl-2 self-center">
                      Other / 3D Master: [ ________________ ]
                    </span>
                  </div>
                </div>

                {/* Pontic, Margin & Occlusion */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Pontic Design:</span>
                    <div className="space-y-0.5 text-[9px]">
                      {['Modified Ridge Lap', 'Sanitary (Hygienic)', 'Ovate (Aesthetic)', 'Bullet / Conical'].map((d) => (
                        <label key={d} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="pontic"
                            checked={ponticDesign === d}
                            onChange={() => setPonticDesign(d)}
                            className="accent-slate-900"
                          />
                          <span>{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Margin Design:</span>
                    <div className="space-y-0.5 text-[9px]">
                      {['Deep Chamfer', 'Shoulder (90° Porcelain Margin)', 'Knife Edge / Feather', 'Subgingival 0.5mm'].map((m) => (
                        <label key={m} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="margin"
                            checked={marginType === m}
                            onChange={() => setMarginType(m)}
                            className="accent-slate-900"
                          />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Occlusal Clearance:</span>
                    <div className="space-y-0.5 text-[9px]">
                      {['In Occlusion (Tight Centric)', 'Light Occlusion (Foil Relief)', 'Out of Occlusion (0.5mm Relief)', 'Follow Opposing Guide'].map((o) => (
                        <label key={o} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="occlusion"
                            checked={occlusion === o}
                            onChange={() => setOcclusion(o)}
                            className="accent-slate-900"
                          />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Instructions Lines */}
                <div className="pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">
                    Special Clinical Instructions / Case Notes:
                  </span>
                  <div className="border border-slate-300 rounded-sm p-1.5 bg-slate-50 min-h-[46px] text-slate-500 font-mono text-[9px]">
                    <div className="border-b border-dotted border-slate-300 pb-1.5 mb-1.5 h-4"></div>
                    <div className="border-b border-dotted border-slate-300 pb-1.5 mb-1.5 h-4"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── 6. SIGNATURES & QUALITY CONTROL GUARANTEE ── */}
          <footer className="border-t-2 border-slate-900 pt-2 mt-2">
            <div className="grid grid-cols-2 gap-8 text-[9.5px]">
              <div>
                <span className="font-bold text-slate-500 block text-[8.5px] uppercase mb-6">
                  Prescribing Doctor&apos;s Signature &amp; BMDC Reg. No:
                </span>
                <div className="border-t border-slate-800 pt-1 flex justify-between">
                  <span className="font-bold text-slate-800">Signature: _______________________</span>
                  <span className="font-bold text-slate-800">Date: ____/____/{new Date().getFullYear()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 block text-[8.5px] uppercase mb-6 text-right">
                  CNDL Quality Assurance &amp; Lab Release Stamp:
                </span>
                <div className="border-t border-slate-800 pt-1 flex justify-between">
                  <span className="text-[9px] text-slate-600 font-medium">Warranty-Backed · Roland 5-Axis Milling</span>
                  <span className="font-bold text-[#1977C5]">QA Approved [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                </div>
              </div>
            </div>

            <div className="mt-2 text-center text-[8px] text-slate-400 font-mono uppercase tracking-wider">
              CNDL Global Dental Laboratory · Official Clinical RX Slip · Single Source of Truth
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
