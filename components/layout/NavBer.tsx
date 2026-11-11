'use client';

import { useLanguage } from '@/context/LanguageContext';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, ChevronDown, Menu, Search, X, Phone, MapPin, Clock4,
  FileText, ScanSearch, Loader2, MessageCircle, Globe, Check,
} from 'lucide-react';
import Link from 'next/link';

import Image from 'next/image';
import { toast } from 'sonner';

type BlogHit = { title: string; slug: string; category: string };

const WHATSAPP_URL = 'https://wa.me/8801743167963';
const LAB_PHONE_DISPLAY = '+880 1743-167963';
const LAB_PHONE_TEL = 'tel:+8801743167963';

/** Service options for the pricing/quote enquiry */
const PRICING_SERVICES = [
  'Zirconia Crown/Bridge',
  'E-Max',
  'PFM',
  'Flexible Denture',
  'Clear Aligner',
  'Other',
];

// Bilingual dictionary is now imported from @/context/LanguageContext

export default function NavBer() {
  const [isOpen, setIsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t: globalT } = useLanguage();
  const t = {
    ...globalT.nav,
    nav: globalT.nav,
  };

  // Pricing / quotation enquiry form
  const [priceForm, setPriceForm] = useState({ name: '', phone: '', service: '', note: '' });
  const [callbackState, setCallbackState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const priceWhatsApp = async () => {
    const msg =
      `Hello CNDL Global, I would like a service price quotation.\n` +
      `Name: ${priceForm.name || '-'}\n` +
      `Phone/WhatsApp: ${priceForm.phone || '-'}\n` +
      `Service of Interest: ${priceForm.service || '-'}\n` +
      `Note: ${priceForm.note || '-'}`;
    // U7 (2026-11-05): capture WhatsApp-route pricing leads in the DB too —
    // best-effort only; the WhatsApp handoff must never be blocked by it.
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: priceForm.name.trim() || 'Pricing enquiry (WhatsApp route)',
          email: `pricing+${priceForm.phone.replace(/[^\d]/g, '') || 'unknown'}@cndl-global.com`,
          subject: `Get Pricing — ${priceForm.service || 'General'}`,
          message:
            `WhatsApp pricing enquiry.\n` +
            `Phone/WhatsApp: ${priceForm.phone || '-'}\n` +
            `Service of Interest: ${priceForm.service || '-'}\n` +
            `Note: ${priceForm.note || '-'}`,
        }),
      });
    } catch {
      // capture is best-effort — fall through to WhatsApp
    }
    window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  const requestCallBack = async () => {
    if (!priceForm.name.trim() || !priceForm.phone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }
    setCallbackState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: priceForm.name.trim(),
          email: `callback+${priceForm.phone.replace(/[^\d]/g, '')}@cndl-global.com`,
          subject: `Call Back Request — ${priceForm.service || 'General Pricing'}`,
          message:
            `Requesting a call back for service pricing.\n` +
            `Phone/WhatsApp: ${priceForm.phone}\n` +
            `Service of Interest: ${priceForm.service || '-'}\n` +
            `Note: ${priceForm.note || '-'}`,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setCallbackState('sent');
      toast.success('Call back requested — our lab specialists will phone you shortly.');
    } catch {
      setCallbackState('idle');
      toast.error(`Could not submit — please call us directly at ${LAB_PHONE_DISPLAY}.`);
    }
  };

  // Quick search
  const [searchQ, setSearchQ] = useState('');
  const [hits, setHits] = useState<BlogHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setIsOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const switchLang = (next: 'en' | 'bn') => {
    setLang(next);
    setLangOpen(false);
  };

  // Search dialog data (blog topics; empty q returns latest posts as suggestions)
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ.trim())}`);
        const data = await res.json();
        setHits(Array.isArray(data.blogs) ? data.blogs : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ, searchOpen]);

  // Close search dialog on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const openSearch = () => {
    setSearchOpen(true);
    setSearchQ('');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const looksLikeCaseId = /^[a-z0-9-]{4,}$/i.test(searchQ.trim()) && searchQ.trim().length >= 4;

  const navMenu = [
    { key: 'home' as const, href: '/' },
    { key: 'about' as const, href: '/about' },
    { key: 'products' as const, href: '/products' },
    { key: 'technology' as const, href: '/technology' },
    { key: 'tracker' as const, href: '/case-tracker' },
    { key: 'contact' as const, href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#E1ECF6] h-fit md:h-[50px] p-2 border border-[#E1ECF6] flex items-center justify-between">
        <div className="container flex items-center justify-center sm:justify-between flex-wrap gap-2  text-[10px] md:text-xs lg:text-base text-(--text-secondary)">
          <div className="flex items-center gap-3">
            <Link href="tel:+8801743167963" className="flex items-center gap-1.5">
              <Phone size={24} />
              01743-167963
            </Link>
            <span className="hidden lg:inline">/</span>
            <Link href="tel:+8801805976351" className="hidden lg:flex items-center gap-1.5">
              <Phone size={24} />
              01805-976351
            </Link>
            <hr className="w-[1px] h-[10px] bg-(--border-tertiary)" />
            <div className=" flex items-center gap-1.5">
              <MapPin size={24} />
              419/1/C Khilgaon, Dhaka-1219
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock4 size={24} />
            {t.topbarHours}
          </div>
        </div>
      </div>
      <div className="bg-(--bg-muted) text-(--text-tertiary)">
        <nav className="container flex items-center justify-between py-4">
          <Link href="/">
            <Image
              src="/icon/Logo.svg"
              alt="Logo"
              width={1000}
              height={1000}
              className="w-[120px] sm:w-[162px] h-[50px]"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navMenu.map((item) => (
              <div key={item.key} className="flex items-center gap-8">
                <Link
                  href={item.href}
                  className="whitespace-nowrap text-[10px] md:text-xs lg:text-base"
                >
                  {t.nav[item.key]}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-(--text-tertiary)">
            <button
              onClick={openSearch}
              aria-label="Search cases and articles"
              title="Search / খুঁজুন"
              className="px-2 text-[10px] md:text-xs lg:text-base hover:text-[#1977C5] transition-colors"
            >
              <Search size={24} />
            </button>

            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                aria-label="Switch language"
                title="Switch language / ভাষা পরিবর্তন করুন"
                className="px-2 text-[10px] md:text-xs lg:text-base flex items-center gap-1.5 hover:text-[#1977C5] transition-colors"
              >
                {lang === 'en' ? 'ENG' : 'বাংলা'}
                <ChevronDown size={24} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-[12px] shadow-xl border border-gray-100 py-2 z-20">
                    <p className="px-4 pb-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Language / ভাষা
                    </p>
                    <button
                      onClick={() => switchLang('en')}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-(--bg-muted) transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" />
                        ENG <span className="text-gray-400 text-xs">English</span>
                      </span>
                      {lang === 'en' && <Check size={15} className="text-[#1977C5]" />}
                    </button>
                    <button
                      onClick={() => switchLang('bn')}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-(--bg-muted) transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" />
                        বাংলা <span className="text-gray-400 text-xs">Bangla</span>
                      </span>
                      {lang === 'bn' && <Check size={15} className="text-[#1977C5]" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setPricingOpen(true)}
              className="hidden lg:flex p-3 border-[0.5px] border-(--border-primary) rounded-[64px] text-[10px] md:text-xs lg:text-base items-center gap-1.5 bg-(--bg-primary) text-(--text-primary) group hover:bg-(--bg-primary)/98 cursor-pointer"
            >
              {t.pricing}
              <ArrowRight size={24} className="group-hover:translate-x-2 transition" />
            </button>

            <button className="lg:hidden" onClick={() => setIsOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
          </div>
        </nav>

        <div
          className={"fixed inset-0 bg-black/40 transition-opacity duration-300 " + (isOpen ? 'opacity-100 visible' : 'opacity-0 invisible')}
          onClick={() => setIsOpen(false)}
        />

        <aside
          className={"fixed top-0 right-0 h-full w-[280px] bg-(--bg-muted) border-l border-(--border-secondary) transform transition-transform duration-300 ease-in-out " + (isOpen ? 'translate-x-0' : 'translate-x-full')}
        >
          <div className="flex items-center justify-between p-4 border-b border-(--border-secondary)">
            <Image
              src="/icon/Logo.svg"
              alt="Logo"
              width={162}
              height={50}
              className="w-[162px] h-[50px]"
            />
            <button onClick={() => setIsOpen(false)} aria-label="Close menu">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {navMenu.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-base"
              >
                {t.nav[item.key]}
              </Link>
            ))}

            <button
              onClick={() => {
                setIsOpen(false);
                setPricingOpen(true);
              }}
              className="flex p-3 border-[0.5px] border-(--border-primary) rounded-[64px] text-[10px] md:text-xs lg:text-base items-center justify-center gap-1.5 bg-(--bg-primary) text-(--text-primary) group hover:bg-(--bg-primary)/98 cursor-pointer"
            >
              {t.pricing}
              <ArrowRight size={24} className="group-hover:translate-x-2 transition" />
            </button>
          </div>
        </aside>
      </div>

      {/* ================= PRICING / SERVICE QUOTE MODAL ================= */}
      {pricingOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={() => setPricingOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_30px_90px_-20px_rgba(2,32,71,0.55)] p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1977C5]">
                  Service Quote
                </span>
                <h3 className="text-lg md:text-2xl font-bold secondary leading-tight mt-1">
                  Get Service Pricing &amp; Quotation
                </h3>
              </div>
              <button onClick={() => setPricingOpen(false)} aria-label="Close" className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mb-5">
              Tell us what you need and our lab specialists will assist you directly via Phone or
              WhatsApp.
            </p>

            <div className="space-y-3.5">
              <label className="block">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Your Name <span className="normal-case font-medium text-slate-400">(ডাক্তার / ক্লিনিক / রোগীর নাম)</span>
                </span>
                <input
                  type="text"
                  value={priceForm.name}
                  onChange={(e) => setPriceForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. Ayesha Rahman / Bright Smile Dental Care"
                  className="w-full h-11 px-4 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all"
                />
              </label>

              <label className="block">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Phone Number / WhatsApp
                </span>
                <input
                  type="tel"
                  value={priceForm.phone}
                  onChange={(e) => setPriceForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-11 px-4 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all"
                />
              </label>

              <label className="block">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Service of Interest
                </span>
                <select
                  value={priceForm.service}
                  onChange={(e) => setPriceForm((p) => ({ ...p, service: e.target.value }))}
                  className="w-full h-11 px-3 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all cursor-pointer"
                >
                  <option value="">Select a service…</option>
                  {PRICING_SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Short Note / Requirements
                </span>
                <textarea
                  value={priceForm.note}
                  onChange={(e) => setPriceForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g., 3-unit zirconia bridge, shades attached, needed before Eid…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all resize-none"
                />
              </label>
            </div>

            <button
              onClick={priceWhatsApp}
              className="mt-6 relative w-full inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-linear-to-b from-[#2EE073] to-[#1DA851] px-6 py-3.5 text-xs md:text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.65)] ring-1 ring-[#25D366]/40 transition-all min-h-[48px] hover:brightness-105 hover:shadow-[0_14px_32px_-8px_rgba(37,211,102,0.75)] active:scale-[0.99]"
            >
              <span className="absolute inset-x-4 top-0 h-px bg-white/50" aria-hidden="true" />
              <MessageCircle size={16} />
              Inquire via WhatsApp
              <ArrowRight size={15} />
            </button>

            <button
              onClick={requestCallBack}
              disabled={callbackState === 'sending' || callbackState === 'sent'}
              className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 px-6 py-3.5 text-xs md:text-sm font-bold text-slate-700 hover:border-[#1977C5]/50 hover:text-[#1977C5] transition-all min-h-[48px] disabled:opacity-60 cursor-pointer"
            >
              {callbackState === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting…
                </>
              ) : callbackState === 'sent' ? (
                <>
                  <Check size={16} />
                  Call Back Requested
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Request Call Back
                </>
              )}
            </button>

            <p className="mt-3.5 text-center text-[9px] md:text-[10px] text-slate-400">
              Your details go straight to our lab specialists — never shared or published.
            </p>

            <div className="mt-4 rounded-xl border border-[#1977C5]/20 bg-[#EAF2FA]/80 px-4 py-3 text-center">
              <p className="text-[10px] md:text-xs text-slate-600 leading-relaxed">
                Are you a dental lab seeking B2B CAD/CAM milling outsourcing? Contact our Lab
                Director directly at{' '}
                <a href={LAB_PHONE_TEL} className="font-bold text-[#1977C5] whitespace-nowrap">
                  {LAB_PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= GLOBAL QUICK SEARCH DIALOG ================= */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-[16px] md:rounded-[24px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full h-9 text-sm md:text-base focus:outline-none bg-transparent"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="p-1 rounded-full hover:bg-(--bg-muted) transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              {/* case tracking action */}
              {looksLikeCaseId && (
                <Link
                  href={`/case-tracker?q=${encodeURIComponent(searchQ.trim())}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-[#1977C5]/5 transition-colors group"
                >
                  <span className="w-9 h-9 rounded-[10px] bg-[#1977C5]/10 flex items-center justify-center shrink-0">
                    <ScanSearch size={17} className="text-[#1977C5]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-[#1977C5] truncate">
                      {t.search.trackCase} &ldquo;{searchQ.trim()}&rdquo;
                    </span>
                    <span className="block text-[10px] md:text-xs text-gray-400">
                      {t.search.openTimeline}
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-[#1977C5] group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              )}

              {/* blog results */}
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> {t.search.searching}
                </div>
              ) : hits.length > 0 ? (
                <>
                  <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {searchQ.trim() ? t.search.articles : t.search.popular}
                  </p>
                  {hits.map((hit) => (
                    <Link
                      key={hit.slug}
                      href={`/blog/${hit.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-(--bg-muted) transition-colors group"
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-(--bg-muted) flex items-center justify-center shrink-0">
                        <FileText size={17} className="text-(--text-muted)" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{hit.title}</span>
                        <span className="block text-[10px] md:text-xs text-[#1977C5] font-bold uppercase tracking-widest">
                          {hit.category}
                        </span>
                      </span>
                      <ArrowRight size={15} className="text-gray-300 group-hover:translate-x-1 group-hover:text-[#1977C5] transition-all shrink-0" />
                    </Link>
                  ))}
                </>
              ) : searchQ.trim() ? (
                <p className="px-3 py-6 text-center text-xs md:text-sm text-gray-400">
                  {t.search.noResults}
                  {looksLikeCaseId ? '' : t.search.hint}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
