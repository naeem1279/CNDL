'use client';
import SpotlightCard from '@/components/ui/SpotlightCard';
import Input from '@/components/share/Input';
import Select from '@/components/share/Select';
import PageHeader from '@/components/ui/PageHeader';
import { Button, buttonClass } from '@/components/ui/Button';
import {
  Facebook, Instagram, Mail, CheckCircle2, X, Phone, MapPin, Clock4,
  Stethoscope, ScanLine, MessagesSquare, ArrowRight, Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const WHATSAPP_URL =
  'https://wa.me/8801743167963?text=Hello%20CNDL,%20I%20would%20like%20to%20discuss%20a%20dental%20case.';

const ICON_TILE = 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]';

const PHONE_CARDS = [
  {
    display: '01743-167963',
    tel: 'tel:+8801743167963',
    label: 'Lab Director / Case Desk',
  },
  {
    display: '01805-976351',
    tel: 'tel:+8801805976351',
    label: 'Production & Delivery Desk',
  },
];

const INTENTS = [
  {
    icon: Stethoscope,
    title: 'Clinician Support',
    desc: 'Technical guidance, shade matching, prep questions and case status — straight from our senior technicians.',
    action: { label: 'Call the Lab', href: 'tel:+8801743167963' },
  },
  {
    icon: ScanLine,
    title: 'Case Dispatch',
    desc: 'Submit a 4-step online case or send STL/OBJ scans instantly via WhatsApp for confirmation.',
    action: { label: 'Submit a Case', href: '/order-create' },
  },
  {
    icon: MessagesSquare,
    title: 'General Inquiries',
    desc: 'Pricing requests, partnership proposals and B2B lab-to-lab outsourcing questions.',
    action: { label: 'Send a Message', href: '#contact-form' },
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
    </svg>
  );
}

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    subject: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ name: '', email: '', phone: '', message: '', subject: '' });
        setIsModalOpen(true);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Escape closes the confirmation window.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  return (
    <section>
      <PageHeader
        title={
          <>
            Get in Touch with CNDL
            <br className="hidden sm:block" /> Dental Laboratory.
          </>
        }
        lead="We are here to support your practice and answer technical inquiries."
      />

      {/* Quick-intent strip */}
      <section className="bg-white pt-12 md:pt-16">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          {INTENTS.map((item) => (
            <SpotlightCard key={item.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1977C5]/10 text-[#1668AD]">
                  <item.icon size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h2 className="secondary text-lg font-semibold text-slate-900">{item.title}</h2>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              <Link
                href={item.action.href}
                className="group -ml-2 mt-4 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-sm font-medium text-[#1668AD] hover:bg-[#1977C5]/5"
              >
                {item.action.label}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Lab photos: wide screens only, so phones reach the phone numbers first */}
          <div className="hidden min-h-[480px] gap-4 lg:flex" aria-hidden="true">
            <div className="relative w-[40%] overflow-hidden rounded-2xl bg-slate-100">
              <Image src="/images/gallery-7.jpg" alt="" fill sizes="260px" className="object-cover" />
            </div>
            <div className="relative w-[60%] overflow-hidden rounded-2xl bg-slate-100">
              <Image src="/images/gallery-5.png" alt="" fill sizes="390px" className="object-cover" />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">Contact Information</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
                One-tap call or WhatsApp — you speak directly with the lab, never a call center.
              </p>
            </div>

            {/* Verified phone cards — one-tap Call & WhatsApp */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PHONE_CARDS.map((card) => (
                <div key={card.display} className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="secondary mt-1 whitespace-nowrap text-xl font-semibold tabular-nums text-slate-900">{card.display}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <a href={card.tel} className={buttonClass('primary', 'md', 'flex-1 px-3')}>
                      <Phone size={16} aria-hidden="true" /> Call
                    </a>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#128C7E] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D]"
                    >
                      <WhatsAppIcon className="size-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <ul className="space-y-5">
              {/* Landmark address */}
              <li className="flex items-start gap-4">
                <span className={ICON_TILE}>
                  <MapPin size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-medium text-slate-900">Lab Address</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                    419/1/C Khilgaon — <span className="font-medium text-slate-900">West Side of Jorpukur Field</span>, Dhaka-1219, Bangladesh
                  </p>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-4">
                <span className={ICON_TILE}>
                  <Mail size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-medium text-slate-900">Email Address</p>
                  <a
                    href="mailto:chistiyanizamiyad@gmail.com"
                    className="inline-flex min-h-10 items-center break-all text-sm text-[#1668AD] hover:underline"
                  >
                    chistiyanizamiyad@gmail.com
                  </a>
                </div>
              </li>

              {/* Hours */}
              <li className="flex items-start gap-4">
                <span className={ICON_TILE}>
                  <Clock4 size={20} aria-hidden="true" />
                </span>
                <p className="pt-2.5 text-sm leading-relaxed text-slate-700">
                  Direct communication with Senior Lab Technicians (Mon–Sat: 9:00 AM – 11:30 PM)
                </p>
              </li>
            </ul>

            <div>
              <p className="mb-2 text-base font-medium text-slate-900">Social Media</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://www.facebook.com/cndentallab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass('secondary', 'md')}
                >
                  <Facebook size={18} aria-hidden="true" /> facebook.com/cndentallab
                </a>
                <a
                  href="https://instagram.com/cndlglobal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass('secondary', 'md')}
                >
                  <Instagram size={18} aria-hidden="true" /> @cndlglobal
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact-form" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 py-12 md:py-16">
        <div className="container grid grid-cols-1 items-start gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-3">
            <h2 className="secondary text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">Send us a Message</h2>
            <p className="mt-3 text-base text-slate-600">Fill out the form and our team will get back to you shortly</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  inputMode="tel"
                  placeholder="Phone Number"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <Select
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                options={['General Inquiry', 'Support', 'Sales', 'Get Pricing']}
                placeholder="Select subject"
              />

              <Input
                label="Message"
                type="textarea"
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />

              <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-2">
            <h2 className="secondary text-xl font-semibold text-slate-900">Schedule</h2>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="flex justify-between gap-4 py-3">
                  <dt className="text-slate-600">{day}</dt>
                  <dd className="tabular-nums text-slate-900">09:00 AM – 11:30 PM</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-3 font-medium">
                <dt className="text-slate-600">Sunday</dt>
                <dd className="text-slate-900">Closed</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sent-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center space-y-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} aria-hidden="true" />
              </span>
              <h3 id="sent-title" className="secondary text-2xl font-semibold text-slate-900">Message Sent!</h3>
              <p className="text-slate-600">
                Thank you for reaching out to us. We have received your message and our team will get back to you shortly.
              </p>
              <Button size="lg" onClick={() => setIsModalOpen(false)} className="mt-2 w-full">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ContactPage;
