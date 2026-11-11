'use client';
import Input from '@/components/share/Input';
import Select from '@/components/share/Select';
import ShareHero from '@/components/share/ShareHero';
import {
  Facebook, Instagram, Mail, CheckCircle2, X, Phone, MapPin, Clock4,
  Stethoscope, ScanLine, MessagesSquare, MoveRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const WHATSAPP_URL =
  'https://wa.me/8801743167963?text=Hello%20CNDL,%20I%20would%20like%20to%20discuss%20a%20dental%20case.';

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
    } catch (error) {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          Get in Touch with CNDL
          <br />
          Dental Laboratory.
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          We are here to support your practice and answer technical inquiries.
        </p>
      </ShareHero>

      {/* Quick-intent strip */}
      <section className="container -mb-2 sm:-mb-4 md:mb-0 mt-6 sm:mt-8 md:mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {INTENTS.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col rounded-[10px] md:rounded-[16px] lg:rounded-[20px] border border-[#1977C5]/15 bg-white/70 backdrop-blur-md p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1977C5]/40 hover:shadow-[0_14px_36px_-12px_rgba(25,119,197,0.35)]"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 shrink-0 rounded-[13px] bg-linear-to-br from-[#1977C5] to-[#3387CB] text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(25,119,197,0.5)]">
                  <item.icon size={20} strokeWidth={1.9} />
                </span>
                <h3 className="text-sm md:text-base font-bold secondary">{item.title}</h3>
              </div>
              <p className="text-[10px] md:text-xs lg:text-sm text-(--text-secondary) leading-relaxed flex-1">
                {item.desc}
              </p>
              <Link
                href={item.action.href}
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[#1977C5] group-hover:gap-2.5 transition-all"
              >
                {item.action.label}
                <MoveRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container my-8 sm:my-12 md:my-14 lg:my-16 xl:my-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-16 lg:gap-20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-[40%]">
              <Image
                src="/images/gallery-7.jpg"
                className="w-full h-[572px] object-cover rounded-2xl"
                alt=""
                width={250}
                height={572}
              />
            </div>
            <div className="w-full md:w-[60%]">
              <Image
                src="/images/gallery-5.png"
                className="w-full h-[572px] object-cover rounded-2xl"
                alt=""
                width={320}
                height={572}
              />
            </div>
          </div>

          <div className="space-y-6 col-span-1">
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary">
                Contact Information
              </h3>
              <p className="text-[10px] md:text-xs lg:text-base text-(--text-secondary) mt-1 md:mt-2 lg:mt-3">
                One-tap call or WhatsApp — you speak directly with the lab, never a call center.
              </p>
            </div>

            {/* Verified phone cards — one-tap Call & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PHONE_CARDS.map((card) => (
                <div
                  key={card.display}
                  className="rounded-[10px] md:rounded-[16px] border border-[#1977C5]/15 bg-[#EAF2FA]/60 p-4"
                >
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1977C5]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-base md:text-lg font-bold secondary whitespace-nowrap">
                    {card.display}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={card.tel}
                      className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1977C5] text-white text-[10px] md:text-xs font-bold px-3 hover:bg-[#1668ad] transition-colors"
                    >
                      <Phone size={13} /> Call
                    </a>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-white text-[10px] md:text-xs font-bold px-3 hover:brightness-105 transition-all"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Landmark address */}
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-[#1977C5]/10 text-[#1977C5] flex items-center justify-center">
                <MapPin size={18} />
              </span>
              <div>
                <p className="text-xs md:text-sm lg:text-base xl:text-lg font-medium">Lab Address</p>
                <p className="text-[10px] md:text-xs lg:text-base text-(--text-secondary)">
                  419/1/C Khilgaon — <span className="font-semibold text-(--text-primary)">West Side of Jorpukur Field</span>, Dhaka-1219, Bangladesh
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-[#65CD4C33] text-[#65CD4C] flex items-center justify-center">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-xs md:text-sm lg:text-base xl:text-lg font-medium">Email Address</p>
                <a
                  href="mailto:chistiyanizamiyad@gmail.com"
                  className="text-[10px] md:text-xs lg:text-base text-(--text-secondary) hover:text-[#1977C5] transition-colors"
                >
                  chistiyanizamiyad@gmail.com
                </a>
              </div>
            </div>

            {/* Fast response badge */}
            <div className="flex items-center gap-3 rounded-[10px] md:rounded-[14px] border border-[#88C845]/30 bg-[#88C845]/10 px-4 py-3">
              <Clock4 size={18} className="text-[#4d7220] shrink-0" />
              <p className="text-[10px] md:text-xs lg:text-sm text-[#4d7220] font-semibold">
                Direct communication with Senior Lab Technicians (Mon–Sat: 9:00 AM – 11:30 PM)
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs md:text-sm lg:text-base xl:text-lg font-medium">Social Media</p>
              <div className="flex flex-col gap-3 text-[10px] md:text-xs lg:text-base text-(--text-secondary)">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-[#65CD4C33] text-[#65CD4C] flex items-center justify-center">
                    <Mail />
                  </span>
                  <span>@cndlglobal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-[#2573D933] text-[#2573D9] flex items-center justify-center">
                    <Facebook />
                  </span>
                  <span>facebook.com/cndentallab</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-[#E8865E33] text-[#E8865E] flex items-center justify-center">
                    <Instagram />
                  </span>
                  <span>@cndlglobal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="contact-form" className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-16 lg:gap-20 mt-8 sm:mt-12 md:mt-14 lg:mt-16 xl:mt-20 scroll-mt-[100px]">
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary">
              Send us a Message
            </h3>

            <p className="text-[10px] md:text-xs lg:text-base text-(--text-secondary) mt-1 md:mt-2 lg:mt-3">
              Fill out the form and our team will get back to you shortly
            </p>

            <form
              className="mt-8 sm:mt-12 md:mt-14 lg:mt-16 xl:mt-20 space-y-6"
              onSubmit={handleSubmit}
            >
              <Input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <Select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                options={['General Inquiry', 'Support', 'Sales', 'Get Pricing']}
                placeholder="Select subject"
              />

              <Input
                type="textarea"
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-(--bg-muted) px-6 py-3 text-[10px] md:text-xs lg:text-base text-(--text-tertiary) font-medium hover:bg-(--bg-muted)/90 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="rounded-[10px] md:rounded-[18px] lg:rounded-[24px] bg-blue-50 p-4 sm:p-5 md:p-6 lg:p-8">
            <h4 className="text-base md:text-lg lg:text-xl xl:text-2xl font-semibold mb-4 md:mb-6">
              Schedule
            </h4>

            <ul className="text-xs md:text-sm lg:text-base xl:text-lg">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <li key={day} className="flex justify-between py-2.5 sm:py-3 md:py-4 border-b border-(--border-primary)">
                  <span className="text-(--text-secondary)">{day}</span>
                  <span>09:00 AM – 11:30 PM</span>
                </li>
              ))}
              <li className="flex justify-between py-2.5 sm:py-3 md:py-4 font-medium">
                <span className="text-(--text-secondary)">Sunday</span>
                <span>Closed</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Message Sent!</h3>
              <p className="text-gray-600">
                Thank you for reaching out to us. We have received your message and our team will get back to you shortly.
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-4 w-full rounded-full bg-(--bg-muted) px-6 py-3 text-base text-(--text-tertiary) font-medium hover:bg-(--bg-muted)/90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ContactPage;
