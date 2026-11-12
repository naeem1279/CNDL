const WHATSAPP_URL =
  'https://wa.me/8801743167963?text=Hello%20CNDL,%20I%20am%20a%20dentist%20and%20would%20like%20to%20send%20a%20dental%20case%20/%20STL%20scan.';

const PHONE_URL = 'tel:+8801743167963';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
    </svg>
  );
}

export default function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 group/fab print:hidden">
      {/* Direct call option — revealed on hover/focus */}
      <a
        href={PHONE_URL}
        aria-label="Call CNDL Global"
        className="flex items-center gap-2 h-11 rounded-full bg-[#1977C5] text-white shadow-lg shadow-slate-900/15 pl-4 pr-5 opacity-0 translate-y-2 pointer-events-none group-hover/fab:opacity-100 group-hover/fab:translate-y-0 group-hover/fab:pointer-events-auto group-focus-within/fab:opacity-100 group-focus-within/fab:translate-y-0 group-focus-within/fab:pointer-events-auto transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span className="text-xs md:text-xs font-medium whitespace-nowrap">Call the Lab</span>
      </a>

      {/* Primary WhatsApp trigger */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Send STL Scan / Order via WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-lg shadow-slate-900/15 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="relative w-7 h-7 md:w-8 md:h-8" />

        {/* Quick tooltip */}
        <span className="absolute right-full mr-3 hidden md:flex items-center whitespace-nowrap rounded-full bg-slate-900 text-white text-xs lg:text-xs font-medium px-4 py-2 opacity-0 translate-x-2 group-hover/fab:opacity-100 group-hover/fab:translate-x-0 transition-all duration-300 pointer-events-none">
          Send STL Scan / Order via WhatsApp
        </span>
      </a>
    </div>
  );
}
