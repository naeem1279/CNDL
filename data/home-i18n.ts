/**
 * Home page copy in English and Bengali (also used by the Process and FAQ sections on /products).
 *
 * Rules: every figure here is one the site already states elsewhere (founded 2015, 15 canonical
 * product lines, 3–4 working days, ±5 µm, Roland / Aidite / Shofu …) — never add invented stats.
 * Product, material and machine names stay in English in both languages, as clinicians use them.
 * The FAQ structured data in app/page.tsx is separate and intentionally unchanged.
 */
export type HomeCopy = typeof en;

const en = {
  hero: {
    eyebrow: 'Digital CAD/CAM dental lab · Dhaka, since 2015',
    titleA: 'Zirconia, E-max, PFM & Flexible Dentures',
    titleB: 'Precision You Can Trust.',
    subtitle:
      'Leading provider of Zirconia, E-max, PFM, and Flexible Dentures with guaranteed 3-4 working days turnaround.',
    primary: 'Submit a Case',
    secondary: 'Get Pricing',
    tertiary: 'Track a case',
    points: ['3–4 working day delivery', 'Roland 5-axis milling (Japan)', 'Authentic Aidite & Shofu'],
    rating: (avg: string, n: string, count: number) => `${avg}/5 from ${n} dentist review${count === 1 ? '' : 's'}`,
    floatA: { value: '±5 µm', label: 'Marginal precision' },
    floatB: { value: '3 days', label: 'Chamber delivery in Dhaka' },
    imageAlt: 'CNDL Digital CAD/CAM Dental Laboratory',
  },
  stats: [
    { value: '2015', label: 'Serving dental surgeons since' },
    { value: '15', label: 'Lab product lines, all in-house' },
    { value: '3–4', label: 'Working days to your chamber' },
    { value: '±5 µm', label: 'Marginal adaptation' },
  ],
  tech: {
    label: 'Built on authentic hardware & materials · Accepts scans from every major system',
    items: ['Roland DGSHAPE', 'Aidite Multilayer', 'Shofu Japan', 'UP3D', 'Phrozen 8K', 'Shining 3D', 'Exocad', 'Medit', '3Shape', 'iTero', 'Carestream'],
  },
  why: {
    eyebrow: 'Why CNDL',
    title: 'Why Choose CNDL for Your Restorations?',
    lead: 'Four reasons dental surgeons across Dhaka and nationwide trust our fully digital workflow — from scan intake to chamber delivery.',
    features: [
      {
        eyebrow: 'CAD/CAM Milling',
        title: '5-Axis Sub-Micron Accuracy',
        desc: 'Roland DWX-52Di Plus wet milling delivers razor-sharp margins and repeatable, micron-level fit.',
        stat: 'DWX-52Di Plus',
      },
      {
        eyebrow: 'Materials',
        title: 'Certified Authentic Blanks',
        desc: 'Aidite Multilayer zirconia and Shofu (Japan) ceramics — batch-traceable, never generic discs.',
        stat: 'Aidite · Shofu Japan',
      },
      {
        eyebrow: 'Logistics',
        title: '3-Day Turnaround to Chamber',
        desc: 'Dedicated lab riders and Pathao logistics across Dhaka — from impression to chair in 72 hours.',
        stat: '72 Hours',
      },
      {
        eyebrow: 'Digital Workflow',
        title: 'Open Digital Scan Integration',
        desc: 'Send direct STL/OBJ files from Medit, 3Shape or iTero — no physical impressions required.',
        stat: 'STL / OBJ Ready',
      },
    ],
  },
  services: {
    eyebrow: 'Product Catalogue',
    title: 'Our Dental Products & Restorations',
    lead: 'Single Source of Truth: Directly synchronized with our active laboratory database — Zirconia & All-Ceramic, Porcelain (PFM), and Dentures & Orthodontics.',
    delivery: '3-Day Rider Delivery across Dhaka',
    viewAll: 'View Full Products Catalogue',
    order: 'Order / Submit Case',
    warranty: (n: number) => `${n}y Warranty`,
  },
  equipment: {
    eyebrow: 'Technology',
    title: 'Advanced Equipment, Certified Quality',
    lead: 'We invest in authentic Japanese and global digital dentistry hardware so every case is designed, milled and finished in-house with sub-micron precision.',
    machines: [
      { tag: 'Made in Japan', desc: '5-axis dry dental milling with sub-micron marginal adaptation for monolithic and multilayer zirconia.' },
      { tag: 'Zirconia Sintering', desc: 'High-translucency precision temperature profiling for ultra-aesthetic restorations.' },
      { tag: 'Shofu Glaze, Japan', desc: 'Authentic Japanese Shofu glaze with a 900°C curve for natural vitality, enamel-like fluorescence and wear resistance.' },
      { tag: '3D Printing', desc: 'In-house ultra-high resolution models, working dies and surgical guides.' },
      { tag: 'Digitization', desc: 'Micron-accurate digitization of physical models and impressions.' },
    ],
    badges: [
      { title: '3 - 4 Working Days Turnaround', desc: 'Fast, dependable delivery across Dhaka and nationwide.' },
      { title: '100% In-House Digital Production', desc: 'CAD design, CAM milling, 3D printing and staining/glazing under one roof.' },
      { title: 'Open STL / Digital Scan Acceptance', desc: 'Direct integration with Medit, 3Shape, iTero and Carestream.' },
    ],
    strip: 'Every restoration crafted in-house on certified digital hardware.',
    more: 'Explore our technology',
  },
  process: {
    eyebrow: 'Our Process',
    title: 'How We Deliver Quality Restorations',
    step: 'Step',
    inspect: 'Inspect Quality Protocol',
    protocol: 'Quality Protocol',
    equipmentLabel: 'Equipment & Materials',
    standardsLabel: 'Quality Standards',
    close: 'Close protocol',
    tablist: 'Production steps',
    steps: [
      {
        title: 'Automatic Case Identification',
        protocol: 'Automatic Case ID & Digital Intake',
        summary:
          'The moment a case arrives it is registered, sanitized and issued a unique CNDL Case ID — the same ID your patient can track live on our Case Tracker.',
        clinical:
          'Every prescription, impression or intraoral scan is logged against the issuing clinician and restoration type before touching the production floor. STL files from Medit, 3Shape and iTero are ingested directly; physical impressions are photographed and disinfected at the intake bench.',
        equipment: [
          'Digital case intake form with scan upload (open STL architecture)',
          'Intake-bench disinfection & impression sanitization',
          'Automatic CNDL Case ID generation + SMS acknowledgement',
        ],
        standards: [
          'Zero paper-tag mixing — every case is digitally tracked end-to-end',
          'Same-day digital registration of all incoming cases',
          'Prescription completeness verified before design begins',
        ],
      },
      {
        title: 'Digital Design & Planning',
        protocol: '3D CAD Design & Digital Preparation Check',
        summary:
          'Margins are traced under magnification and full anatomy is engineered in Exocad — with a digital preparation check that flags undercuts, blockers and insufficient reduction before anything is milled.',
        clinical:
          'Our designers mark margins on scanned geography, verify cement gap parameters per material, and simulate occlusion against opposing anatomy. Insertion axis, contact tightness and emergence profile are all locked digitally and archived with the case.',
        equipment: [
          'Exocad CAD platform with margin-mapping toolset',
          'High-accuracy lab scan workstations',
          'Digital preparation-check reports shared with the clinician when needed',
        ],
        standards: [
          'Material-specific cement gap (zirconia / E-Max) enforced in software',
          'Margin integrity re-verified at 100% of cases before release to milling',
          'Design archive retained for every case for reproducibility',
        ],
      },
      {
        title: 'Precision Manufacturing',
        protocol: '5-Axis Roland Sub-Micron Dry Milling',
        summary:
          'Restorations are milled in-house on Roland DGSHAPE 5-axis dry milling from authentic Aidite multilayer zirconia discs — never outsourced, never substituted.',
        clinical:
          'Multilayer discs are nested to preserve shade gradation from cervical to incisal. Dry milling eliminates cooling-related micro-fractures, and sprue placement is planned away from functional cusps to protect anatomy during finishing.',
        equipment: [
          'Roland DGSHAPE 5-axis dry milling unit',
          'Genuine Aidite Multilayer Zirconia discs (certified blanks only)',
          'UP3D high-temperature sintering furnaces',
        ],
        standards: [
          'Sub-micron marginal accuracy verified at every production stage',
          'Authentic blank traceability — certificate on request',
          'Sintering cycles logged per batch for full zirconia crystal integrity',
        ],
      },
      {
        title: 'Quality Control & Finishing',
        protocol: 'Shofu Natural Glazing & Microscopic Inspection',
        summary:
          'Each restoration receives authentic Shofu (Japan) glaze and a final microscopic marginal inspection before it is disinfected, packed and dispatched to your chamber within 3 working days.',
        clinical:
          'Glaze firing is calibrated for natural light dynamics and wear-friendliness against opposing enamel. Under the microscope we verify marginal fit, interproximal contacts and occlusal maps — a restoration that fails any check returns to finishing, never to the clinician.',
        equipment: [
          'Authentic Shofu (Japan) glaze & staining system',
          'Stereo-microscopic inspection stations',
          'Articulator-based occlusal verification',
        ],
        standards: [
          '100% microscopic marginal inspection — no batch sampling',
          'Disinfectant packing before dispatch',
          '3-day dedicated chamber rider delivery across Dhaka',
        ],
      },
    ],
  },
  reviews: {
    eyebrow: 'Testimonials',
    title: 'Trusted by Top Dental Practitioners.',
    lead: 'Real stories from dentists across Bangladesh who trust CNDL with their cases',
    of5: (n: number) => `${n} out of 5`,
  },
  cta: {
    title: 'Ready to elevate your practice with precision CAD/CAM restorations?',
    lead: 'Partner with CNDL today. Dispatch your digital STL scan or physical impression and experience guaranteed 3-day chamber delivery.',
    primary: 'Submit Case Online',
    secondary: 'Chat with Senior Technician',
  },
  faq: {
    title: 'Clinical Questions from Dental Surgeons, Answered',
    lead: 'Technical answers on materials, milling, prep guidelines and turnaround — for clinicians, NRB patients and partner labs.',
    items: [
      {
        q: 'What specific Zirconia blanks and milling technology does CNDL utilize?',
        a: 'We mill exclusively on authentic Aidite multilayer zirconia discs using Japanese Roland DGSHAPE 5-axis technology, then fire each restoration with authentic Shofu (Japan) natural glaze at 900°C. This combination produces lifelike fluorescence, graduate translucency across the layers, and wear-compatibility that is gentle on opposing natural dentition.',
      },
      {
        q: 'What is the guaranteed delivery turnaround time across Dhaka and regional districts?',
        a: 'We guarantee 3 working days delivery directly to your dental chamber inside Dhaka via our dedicated in-house lab riders and Pathao logistics. Nationwide cases reach regional districts within 3–4 working days through reliable courier partners, with dispatch confirmation shared at every stage.',
      },
      {
        q: 'How does CNDL accept digital intraoral scan files (STL/OBJ)?',
        a: 'CNDL runs a fully open digital architecture. Send scans via direct cloud integration with Medit Link or 3Shape Communicate, export from iTero, upload through our online order portal at /order-create, or dispatch large STL/OBJ files straight to the lab WhatsApp at +880 1743-167963 for instant confirmation by our CAD team.',
      },
      {
        q: 'What tooth preparation guidelines are recommended for CNDL Zirconia crowns?',
        a: 'For optimal CAD/CAM milling adaptation we recommend a 0.8 mm–1.0 mm chamfer or rounded shoulder margin, 1.2 mm–1.5 mm occlusal reduction, and smooth transitions with no sharp line angles or undercuts. These parameters give the digital scanner clean margins and the 5-axis mill uninterrupted tool paths, ensuring accurate, void-free seatings.',
      },
      {
        q: 'Does CNDL support Non-Resident Bangladeshi (NRB) and dental tourism fast-track cases?',
        a: 'Yes. We operate an express 3-day smile restoration workflow purpose-built for overseas Bangladeshi patients and dental tourists: scans or impressions are taken by the partnering local surgeon, we design, mill and glaze in-house, and the restoration is seated before the patient flies home — all coordinated directly between CNDL and the treating clinician.',
      },
      {
        q: 'Can other dental laboratories outsource CAD/CAM milling to CNDL?',
        a: 'Absolutely. CNDL runs B2B lab-to-lab milling partnerships for dental laboratories without in-house 5-axis milling or sintering setups. Partner labs send digital designs or scans; we return milled, sintered and glaze-finished frameworks and anatomies under strict confidentiality, with volume pricing arranged directly with our Lab Director at +880 1743-167963.',
      },
    ],
  },
  blog: {
    eyebrow: 'From the Blog',
    title: 'Choosing the Right Material for Your Case',
    lead: 'Get in touch with our lab team or follow our blog for regular updates on dental materials and innovations.',
    all: 'Blog',
  },
};

const bn: HomeCopy = {
  hero: {
    eyebrow: 'ডিজিটাল CAD/CAM ডেন্টাল ল্যাব · ঢাকা, ২০১৫ থেকে',
    titleA: 'Zirconia, E-max, PFM ও Flexible Dentures',
    titleB: 'সর্বোচ্চ নির্ভুলতায় আস্থা রাখুন।',
    subtitle:
      'নিশ্চিত ৩-৪ কর্মদিবসে ডেলিভারিসহ Zirconia, E-max, PFM ও Flexible Dentures তৈরিতে আপনার বিশ্বস্ত ডিজিটাল ডেন্টাল ল্যাব।',
    primary: 'কেস জমা দিন',
    secondary: 'মূল্য জানুন',
    tertiary: 'কেস ট্র্যাক করুন',
    points: ['৩–৪ কর্মদিবসে ডেলিভারি', 'Roland ৫-অ্যাক্সিস মিলিং (জাপান)', 'আসল Aidite ও Shofu'],
    rating: (avg: string, n: string, _count: number) => `${n} জন ডেন্টিস্টের রিভিউতে ${avg}/৫`,
    floatA: { value: '±৫ µm', label: 'মার্জিনাল নির্ভুলতা' },
    floatB: { value: '৩ দিন', label: 'ঢাকায় চেম্বারে ডেলিভারি' },
    imageAlt: 'CNDL ডিজিটাল CAD/CAM ডেন্টাল ল্যাবরেটরি',
  },
  stats: [
    { value: '২০১৫', label: 'থেকে ডেন্টাল সার্জনদের সেবায়' },
    { value: '১৫', label: 'ধরনের প্রোডাক্ট, সবই ইন-হাউস' },
    { value: '৩–৪', label: 'কর্মদিবসে আপনার চেম্বারে' },
    { value: '±৫ µm', label: 'মার্জিনাল অ্যাডাপটেশন' },
  ],
  tech: {
    label: 'আসল হার্ডওয়্যার ও ম্যাটেরিয়ালে তৈরি · সব প্রধান স্ক্যানারের ফাইল গ্রহণযোগ্য',
    items: en.tech.items,
  },
  why: {
    eyebrow: 'কেন CNDL',
    title: 'আপনার রেস্টোরেশনের জন্য কেন CNDL?',
    lead: 'ঢাকা ও সারা দেশের ডেন্টাল সার্জনরা চারটি কারণে আমাদের সম্পূর্ণ ডিজিটাল ওয়ার্কফ্লোর ওপর ভরসা রাখেন — স্ক্যান গ্রহণ থেকে চেম্বারে ডেলিভারি পর্যন্ত।',
    features: [
      {
        eyebrow: 'CAD/CAM মিলিং',
        title: '৫-অ্যাক্সিস সাব-মাইক্রন নির্ভুলতা',
        desc: 'Roland DWX-52Di Plus মিলিংয়ে নিখুঁত মার্জিন এবং প্রতিবার একই মাইক্রন-লেভেল ফিট।',
        stat: 'DWX-52Di Plus',
      },
      {
        eyebrow: 'ম্যাটেরিয়াল',
        title: 'সার্টিফায়েড আসল ব্ল্যাঙ্ক',
        desc: 'Aidite Multilayer জিরকোনিয়া ও Shofu (জাপান) সিরামিক — ব্যাচ ট্রেস করা যায়, কখনো সাধারণ ডিস্ক নয়।',
        stat: 'Aidite · Shofu Japan',
      },
      {
        eyebrow: 'লজিস্টিকস',
        title: '৩ দিনে চেম্বারে ডেলিভারি',
        desc: 'ঢাকা জুড়ে নিজস্ব ল্যাব রাইডার ও Pathao লজিস্টিকস — ইমপ্রেশন থেকে চেয়ার পর্যন্ত ৭২ ঘণ্টায়।',
        stat: '৭২ ঘণ্টা',
      },
      {
        eyebrow: 'ডিজিটাল ওয়ার্কফ্লো',
        title: 'ওপেন ডিজিটাল স্ক্যান ইন্টিগ্রেশন',
        desc: 'Medit, 3Shape বা iTero থেকে সরাসরি STL/OBJ ফাইল পাঠান — ফিজিক্যাল ইমপ্রেশনের প্রয়োজন নেই।',
        stat: 'STL / OBJ প্রস্তুত',
      },
    ],
  },
  services: {
    eyebrow: 'প্রোডাক্ট ক্যাটালগ',
    title: 'আমাদের ডেন্টাল প্রোডাক্ট ও রেস্টোরেশন',
    lead: 'সরাসরি আমাদের ল্যাবরেটরি ডাটাবেস থেকে হালনাগাদ — Zirconia ও All-Ceramic, Porcelain (PFM) এবং Dentures ও Orthodontics।',
    delivery: 'ঢাকা জুড়ে ৩ দিনে রাইডার ডেলিভারি',
    viewAll: 'সম্পূর্ণ প্রোডাক্ট ক্যাটালগ দেখুন',
    order: 'অর্ডার / কেস জমা দিন',
    warranty: (n: number) => `${n.toLocaleString('bn-BD')} বছরের ওয়ারেন্টি`,
  },
  equipment: {
    eyebrow: 'প্রযুক্তি',
    title: 'আধুনিক যন্ত্রপাতি, সার্টিফায়েড মান',
    lead: 'আমরা আসল জাপানি ও আন্তর্জাতিক ডিজিটাল ডেন্টিস্ট্রি হার্ডওয়্যারে বিনিয়োগ করি, যাতে প্রতিটি কেস ইন-হাউসে সাব-মাইক্রন নির্ভুলতায় ডিজাইন, মিল ও ফিনিশ করা যায়।',
    machines: [
      { tag: 'জাপানে তৈরি', desc: 'মনোলিথিক ও মাল্টিলেয়ার জিরকোনিয়ার জন্য সাব-মাইক্রন মার্জিনাল অ্যাডাপটেশনসহ ৫-অ্যাক্সিস ড্রাই মিলিং।' },
      { tag: 'জিরকোনিয়া সিন্টারিং', desc: 'অত্যন্ত নান্দনিক রেস্টোরেশনের জন্য হাই-ট্রান্সলুসেন্সি নির্ভুল তাপমাত্রা নিয়ন্ত্রণ।' },
      { tag: 'Shofu গ্লেজ, জাপান', desc: '৯০০°C কার্ভে আসল জাপানি Shofu গ্লেজ — প্রাকৃতিক উজ্জ্বলতা, এনামেলের মতো ফ্লুরোসেন্স ও ক্ষয়রোধী।' },
      { tag: '3D প্রিন্টিং', desc: 'ইন-হাউস অতি উচ্চ রেজোলিউশনের মডেল, ওয়ার্কিং ডাই ও সার্জিক্যাল গাইড।' },
      { tag: 'ডিজিটাইজেশন', desc: 'ফিজিক্যাল মডেল ও ইমপ্রেশনের মাইক্রন-নির্ভুল ডিজিটাইজেশন।' },
    ],
    badges: [
      { title: '৩ - ৪ কর্মদিবসে ডেলিভারি', desc: 'ঢাকা ও সারা দেশে দ্রুত, নির্ভরযোগ্য ডেলিভারি।' },
      { title: '১০০% ইন-হাউস ডিজিটাল প্রোডাকশন', desc: 'CAD ডিজাইন, CAM মিলিং, 3D প্রিন্টিং ও স্টেইনিং/গ্লেজিং এক ছাদের নিচে।' },
      { title: 'ওপেন STL / ডিজিটাল স্ক্যান গ্রহণ', desc: 'Medit, 3Shape, iTero ও Carestream-এর সাথে সরাসরি ইন্টিগ্রেশন।' },
    ],
    strip: 'প্রতিটি রেস্টোরেশন সার্টিফায়েড ডিজিটাল হার্ডওয়্যারে ইন-হাউসে তৈরি।',
    more: 'আমাদের প্রযুক্তি দেখুন',
  },
  process: {
    eyebrow: 'আমাদের প্রক্রিয়া',
    title: 'যেভাবে আমরা মানসম্মত রেস্টোরেশন ডেলিভারি করি',
    step: 'ধাপ',
    inspect: 'কোয়ালিটি প্রোটোকল দেখুন',
    protocol: 'কোয়ালিটি প্রোটোকল',
    equipmentLabel: 'যন্ত্রপাতি ও ম্যাটেরিয়াল',
    standardsLabel: 'মান নিয়ন্ত্রণের মানদণ্ড',
    close: 'প্রোটোকল বন্ধ করুন',
    tablist: 'প্রোডাকশনের ধাপ',
    steps: [
      {
        title: 'স্বয়ংক্রিয় কেস শনাক্তকরণ',
        protocol: 'স্বয়ংক্রিয় কেস আইডি ও ডিজিটাল ইনটেক',
        summary:
          'কেস পৌঁছানোর সাথে সাথে তা রেজিস্টার, জীবাণুমুক্ত এবং একটি ইউনিক CNDL Case ID দেওয়া হয় — এই আইডি দিয়েই আপনার রোগী আমাদের কেস ট্র্যাকারে লাইভ অবস্থা দেখতে পারেন।',
        clinical:
          'প্রোডাকশনে যাওয়ার আগে প্রতিটি প্রেসক্রিপশন, ইমপ্রেশন বা ইনট্রাওরাল স্ক্যান সংশ্লিষ্ট চিকিৎসক ও রেস্টোরেশনের ধরন অনুযায়ী লগ করা হয়। Medit, 3Shape ও iTero-এর STL ফাইল সরাসরি গ্রহণ করা হয়; ফিজিক্যাল ইমপ্রেশন ইনটেক বেঞ্চে ছবি তুলে জীবাণুমুক্ত করা হয়।',
        equipment: [
          'স্ক্যান আপলোডসহ ডিজিটাল কেস ইনটেক ফর্ম (ওপেন STL আর্কিটেকচার)',
          'ইনটেক বেঞ্চে জীবাণুমুক্তকরণ ও ইমপ্রেশন স্যানিটাইজেশন',
          'স্বয়ংক্রিয় CNDL Case ID তৈরি + SMS নিশ্চিতকরণ',
        ],
        standards: [
          'কাগজের ট্যাগ মিশে যাওয়ার সুযোগ নেই — প্রতিটি কেস শুরু থেকে শেষ পর্যন্ত ডিজিটালি ট্র্যাক করা হয়',
          'আসা সব কেস একই দিনে ডিজিটালি রেজিস্টার করা হয়',
          'ডিজাইন শুরুর আগে প্রেসক্রিপশন সম্পূর্ণ কিনা যাচাই করা হয়',
        ],
      },
      {
        title: 'ডিজিটাল ডিজাইন ও পরিকল্পনা',
        protocol: '3D CAD ডিজাইন ও ডিজিটাল প্রিপারেশন চেক',
        summary:
          'ম্যাগনিফিকেশনে মার্জিন ট্রেস করে Exocad-এ পূর্ণ অ্যানাটমি তৈরি করা হয় — ডিজিটাল প্রিপারেশন চেক মিলিংয়ের আগেই আন্ডারকাট, ব্লকার ও অপর্যাপ্ত রিডাকশন চিহ্নিত করে।',
        clinical:
          'আমাদের ডিজাইনাররা স্ক্যান করা জ্যামিতিতে মার্জিন চিহ্নিত করেন, ম্যাটেরিয়াল অনুযায়ী সিমেন্ট গ্যাপ যাচাই করেন এবং বিপরীত দাঁতের সাথে অক্লুশন সিমুলেট করেন। ইনসারশন অ্যাক্সিস, কন্টাক্টের টাইটনেস ও ইমার্জেন্স প্রোফাইল ডিজিটালি নির্ধারণ করে কেসের সাথে সংরক্ষণ করা হয়।',
        equipment: [
          'মার্জিন-ম্যাপিং টুলসহ Exocad CAD প্ল্যাটফর্ম',
          'উচ্চ নির্ভুলতার ল্যাব স্ক্যান ওয়ার্কস্টেশন',
          'প্রয়োজনে চিকিৎসকের সাথে ডিজিটাল প্রিপারেশন-চেক রিপোর্ট শেয়ার',
        ],
        standards: [
          'ম্যাটেরিয়াল অনুযায়ী সিমেন্ট গ্যাপ (জিরকোনিয়া / E-Max) সফটওয়্যারে নির্ধারিত',
          'মিলিংয়ে পাঠানোর আগে ১০০% কেসে মার্জিন পুনরায় যাচাই',
          'পুনরায় তৈরির সুবিধার্থে প্রতিটি কেসের ডিজাইন সংরক্ষিত',
        ],
      },
      {
        title: 'নির্ভুল ম্যানুফ্যাকচারিং',
        protocol: 'Roland ৫-অ্যাক্সিস সাব-মাইক্রন ড্রাই মিলিং',
        summary:
          'রেস্টোরেশনগুলো ইন-হাউসে Roland DGSHAPE ৫-অ্যাক্সিস ড্রাই মিলিংয়ে আসল Aidite মাল্টিলেয়ার জিরকোনিয়া ডিস্ক থেকে মিল করা হয় — কখনো আউটসোর্স নয়, কখনো বিকল্প ম্যাটেরিয়াল নয়।',
        clinical:
          'সার্ভিকাল থেকে ইনসিসাল পর্যন্ত শেডের গ্রেডেশন ঠিক রাখতে মাল্টিলেয়ার ডিস্কে সঠিকভাবে নেস্টিং করা হয়। ড্রাই মিলিং কুলিংজনিত মাইক্রো-ফ্র্যাকচার দূর করে, আর ফিনিশিংয়ে অ্যানাটমি রক্ষায় স্প্রু ফাংশনাল কাস্প থেকে দূরে রাখা হয়।',
        equipment: [
          'Roland DGSHAPE ৫-অ্যাক্সিস ড্রাই মিলিং ইউনিট',
          'আসল Aidite Multilayer Zirconia ডিস্ক (শুধু সার্টিফায়েড ব্ল্যাঙ্ক)',
          'UP3D উচ্চ তাপমাত্রার সিন্টারিং ফার্নেস',
        ],
        standards: [
          'প্রতিটি প্রোডাকশন ধাপে সাব-মাইক্রন মার্জিনাল নির্ভুলতা যাচাই',
          'আসল ব্ল্যাঙ্কের ট্রেসেবিলিটি — অনুরোধে সার্টিফিকেট',
          'জিরকোনিয়ার পূর্ণ শক্তি নিশ্চিতে প্রতি ব্যাচের সিন্টারিং সাইকেল লগ',
        ],
      },
      {
        title: 'কোয়ালিটি কন্ট্রোল ও ফিনিশিং',
        protocol: 'Shofu ন্যাচারাল গ্লেজিং ও মাইক্রোস্কোপিক পরিদর্শন',
        summary:
          'প্রতিটি রেস্টোরেশনে আসল Shofu (জাপান) গ্লেজ ও চূড়ান্ত মাইক্রোস্কোপিক মার্জিনাল পরিদর্শন করা হয়, তারপর জীবাণুমুক্ত করে প্যাক করে ৩ কর্মদিবসের মধ্যে আপনার চেম্বারে পাঠানো হয়।',
        clinical:
          'প্রাকৃতিক আলোর প্রতিফলন ও বিপরীত এনামেলের ক্ষয় কমাতে গ্লেজ ফায়ারিং ক্যালিব্রেট করা হয়। মাইক্রোস্কোপে মার্জিনাল ফিট, ইন্টারপ্রক্সিমাল কন্টাক্ট ও অক্লুশন যাচাই করা হয় — কোনো যাচাইয়ে ব্যর্থ রেস্টোরেশন ফিনিশিংয়ে ফেরত যায়, চিকিৎসকের কাছে নয়।',
        equipment: [
          'আসল Shofu (জাপান) গ্লেজ ও স্টেইনিং সিস্টেম',
          'স্টেরিও-মাইক্রোস্কোপিক পরিদর্শন স্টেশন',
          'আর্টিকুলেটরে অক্লুশন যাচাই',
        ],
        standards: [
          '১০০% মাইক্রোস্কোপিক মার্জিনাল পরিদর্শন — ব্যাচ স্যাম্পলিং নয়',
          'ডেলিভারির আগে জীবাণুনাশকসহ প্যাকিং',
          'ঢাকা জুড়ে ৩ দিনে নিজস্ব রাইডারে চেম্বারে ডেলিভারি',
        ],
      },
    ],
  },
  reviews: {
    eyebrow: 'ডেন্টিস্টদের মতামত',
    title: 'শীর্ষ ডেন্টাল চিকিৎসকদের আস্থা।',
    lead: 'সারা বাংলাদেশের ডেন্টিস্টদের সত্যিকারের অভিজ্ঞতা, যারা CNDL-এর ওপর তাদের কেসের ভরসা রাখেন',
    of5: (n: number) => `৫-এর মধ্যে ${n.toLocaleString('bn-BD')}`,
  },
  cta: {
    title: 'নির্ভুল CAD/CAM রেস্টোরেশনে আপনার প্র্যাকটিসকে এগিয়ে নিতে প্রস্তুত?',
    lead: 'আজই CNDL-এর সাথে যুক্ত হন। আপনার ডিজিটাল STL স্ক্যান বা ফিজিক্যাল ইমপ্রেশন পাঠান, আর নিশ্চিত ৩ দিনে চেম্বারে ডেলিভারি পান।',
    primary: 'অনলাইনে কেস জমা দিন',
    secondary: 'সিনিয়র টেকনিশিয়ানের সাথে কথা বলুন',
  },
  faq: {
    title: 'ডেন্টাল সার্জনদের ক্লিনিক্যাল প্রশ্নের উত্তর',
    lead: 'ম্যাটেরিয়াল, মিলিং, প্রিপারেশন গাইডলাইন ও ডেলিভারি সময় নিয়ে টেকনিক্যাল উত্তর — চিকিৎসক, প্রবাসী রোগী ও পার্টনার ল্যাবের জন্য।',
    items: [
      {
        q: 'CNDL কোন জিরকোনিয়া ব্ল্যাঙ্ক ও মিলিং প্রযুক্তি ব্যবহার করে?',
        a: 'আমরা শুধুমাত্র আসল Aidite মাল্টিলেয়ার জিরকোনিয়া ডিস্কে জাপানি Roland DGSHAPE ৫-অ্যাক্সিস প্রযুক্তিতে মিল করি, তারপর প্রতিটি রেস্টোরেশন আসল Shofu (জাপান) ন্যাচারাল গ্লেজে ৯০০°C-এ ফায়ার করি। এতে প্রাকৃতিক ফ্লুরোসেন্স, লেয়ার জুড়ে ধীরে ধীরে বদলানো ট্রান্সলুসেন্সি এবং বিপরীত প্রাকৃতিক দাঁতের জন্য কোমল ক্ষয়-সামঞ্জস্য পাওয়া যায়।',
      },
      {
        q: 'ঢাকা ও জেলা শহরে নিশ্চিত ডেলিভারি সময় কত?',
        a: 'ঢাকার ভেতরে আমাদের নিজস্ব ল্যাব রাইডার ও Pathao লজিস্টিকসের মাধ্যমে সরাসরি আপনার চেম্বারে ৩ কর্মদিবসে ডেলিভারি নিশ্চিত করি। দেশের অন্যান্য জেলায় নির্ভরযোগ্য কুরিয়ারে ৩–৪ কর্মদিবসে কেস পৌঁছায়, প্রতিটি ধাপে ডিসপ্যাচ নিশ্চিতকরণসহ।',
      },
      {
        q: 'CNDL কীভাবে ডিজিটাল ইনট্রাওরাল স্ক্যান ফাইল (STL/OBJ) গ্রহণ করে?',
        a: 'CNDL সম্পূর্ণ ওপেন ডিজিটাল আর্কিটেকচারে কাজ করে। Medit Link বা 3Shape Communicate-এর ক্লাউডে সরাসরি পাঠান, iTero থেকে এক্সপোর্ট করুন, /order-create-এ আমাদের অনলাইন অর্ডার পোর্টালে আপলোড করুন, অথবা বড় STL/OBJ ফাইল ল্যাবের হোয়াটসঅ্যাপে (+880 1743-167963) পাঠান — আমাদের CAD টিম সাথে সাথে নিশ্চিত করবে।',
      },
      {
        q: 'CNDL জিরকোনিয়া ক্রাউনের জন্য দাঁত প্রিপারেশনের কী গাইডলাইন?',
        a: 'সেরা CAD/CAM মিলিং অ্যাডাপটেশনের জন্য ০.৮–১.০ মিমি চ্যামফার বা রাউন্ডেড শোল্ডার মার্জিন, ১.২–১.৫ মিমি অক্লুসাল রিডাকশন এবং ধারালো লাইন অ্যাঙ্গেল বা আন্ডারকাট ছাড়া মসৃণ ট্রানজিশন রাখার পরামর্শ দিই। এতে ডিজিটাল স্ক্যানার পরিষ্কার মার্জিন পায় এবং ৫-অ্যাক্সিস মিল নিরবচ্ছিন্ন টুলপাথে কাজ করে — ফলে নির্ভুল, ফাঁকবিহীন সিটিং হয়।',
      },
      {
        q: 'CNDL কি প্রবাসী বাংলাদেশি (NRB) ও ডেন্টাল ট্যুরিজমের দ্রুত কেস নেয়?',
        a: 'হ্যাঁ। প্রবাসী বাংলাদেশি রোগী ও ডেন্টাল ট্যুরিস্টদের জন্য আমাদের ৩ দিনের এক্সপ্রেস ওয়ার্কফ্লো আছে: স্থানীয় পার্টনার সার্জন স্ক্যান বা ইমপ্রেশন নেন, আমরা ইন-হাউসে ডিজাইন, মিল ও গ্লেজ করি, এবং রোগী দেশ ছাড়ার আগেই রেস্টোরেশন বসানো হয় — সবকিছু CNDL ও চিকিৎসকের মধ্যে সরাসরি সমন্বয়ে।',
      },
      {
        q: 'অন্য ডেন্টাল ল্যাব কি CNDL-এ CAD/CAM মিলিং আউটসোর্স করতে পারে?',
        a: 'অবশ্যই। যেসব ডেন্টাল ল্যাবে নিজস্ব ৫-অ্যাক্সিস মিলিং বা সিন্টারিং নেই, তাদের জন্য CNDL B2B ল্যাব-টু-ল্যাব মিলিং পার্টনারশিপ চালায়। পার্টনার ল্যাব ডিজিটাল ডিজাইন বা স্ক্যান পাঠায়; আমরা কঠোর গোপনীয়তায় মিল, সিন্টার ও গ্লেজ-ফিনিশড ফ্রেমওয়ার্ক ও অ্যানাটমি ফেরত দিই। বেশি পরিমাণের মূল্য সরাসরি ল্যাব ডিরেক্টরের (+880 1743-167963) সাথে ঠিক করা হয়।',
      },
    ],
  },
  blog: {
    eyebrow: 'ব্লগ থেকে',
    title: 'আপনার কেসের জন্য সঠিক ম্যাটেরিয়াল বাছাই',
    lead: 'ডেন্টাল ম্যাটেরিয়াল ও নতুন উদ্ভাবন সম্পর্কে নিয়মিত আপডেটের জন্য আমাদের ল্যাব টিমের সাথে যোগাযোগ করুন বা ব্লগ পড়ুন।',
    all: 'ব্লগ',
  },
};

export const homeCopy = { en, bn };
