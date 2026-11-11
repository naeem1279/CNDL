import HeroSection from '@/components/home/HeroSection';
import ServicesSection from '@/components/home/ServicesSection';
import EquipmentSection from '@/components/home/EquipmentSection';
import WhyChooseSection from '@/components/home/WhyChooseSection';
import ReviewSection from '@/components/home/ReviewsSection';
import ProcessSection from '@/components/home/ProcessSection';
import FAQSection from '@/components/home/FAQSection';
import BlogSection from '@/components/home/BlogSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CN Dental Lab (CNDL) | #1 Digital CAD/CAM Zirconia Laboratory in Bangladesh',
  description: 'Premier digital dental lab in Dhaka, Bangladesh specializing in 5-axis CAD/CAM Zirconia crowns, E-max veneers, PFM, clear aligners, and flexible dentures with guaranteed 3-4 day turnaround.',
  keywords: [
    'Best Zirconia Lab in Bangladesh',
    'Top Dental Laboratory Bangladesh',
    'Best Dental Lab for Zirconia',
    'Premium Zirconia Crowns BD',
    'Digital Dental Lab Bangladesh',
    'Best Dental Lab Dhaka',
    'Dental Zirconia Price in Bangladesh'
  ],
  openGraph: {
    title: 'CN Dental Lab (CNDL) | #1 Digital CAD/CAM Zirconia Laboratory in Bangladesh',
    description: 'Premier digital dental lab in Dhaka, Bangladesh specializing in 5-axis CAD/CAM Zirconia crowns, E-max veneers, PFM, clear aligners, and flexible dentures with guaranteed 3-4 day turnaround.',
    url: 'https://cndl-global.com',
    images: [{ url: '/images/CTA.jpg' }],
    type: 'website',
  },
  alternates: {
    canonical: 'https://cndl-global.com',
  }
};

const medicalSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  '@id': 'https://cndl-global.com/#organization',
  name: 'CNDL Global',
  // G3 (2026-11-05): alternateName must be a real alternate name, not a
  // marketing claim; unverifiable self-awarded `award` removed.
  alternateName: 'CNDL Zirconia Laboratory',
  url: 'https://cndl-global.com',
  logo: 'https://cndl-global.com/icon/Logo.svg',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+8801743167963',
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['en', 'bn']
    },
    {
      '@type': 'ContactPoint',
      telephone: '+8801805976351',
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['en', 'bn']
    }
  ],
  description: 'CNDL Global is a digital dental laboratory in Dhaka, Bangladesh, specializing in high-end dental restorations using CAD/CAM technology.'
};

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Premium Zirconia Crowns & Bridges',
  description: 'High-strength, aesthetic Zirconia restorations from the best Zirconia lab in Bangladesh.',
  brand: {
    '@type': 'Brand',
    name: 'CNDL Global'
  }
};

// G2 (2026-11-05): exactly ONE FAQPage per page (Google guideline) — the six
// English and four Bengali Q&As merged into a single mainEntity list.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'inLanguage': ['en', 'bn-BD'],
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What specific Zirconia blanks and milling technology does CNDL utilize?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We mill exclusively on authentic Aidite multilayer zirconia discs using Japanese Roland DGSHAPE 5-axis technology, then fire each restoration with authentic Shofu (Japan) natural glaze at 900°C. This combination produces lifelike fluorescence, graduate translucency across the layers, and wear-compatibility that is gentle on opposing natural dentition.'
      }
    },
    {
      '@type': 'Question',
      'name': 'What is the guaranteed delivery turnaround time across Dhaka and regional districts?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We guarantee 3 working days delivery directly to your dental chamber inside Dhaka via our dedicated in-house lab riders and Pathao logistics. Nationwide cases reach regional districts within 3–4 working days through reliable courier partners, with dispatch confirmation shared at every stage.'
      }
    },
    {
      '@type': 'Question',
      'name': 'How does CNDL accept digital intraoral scan files (STL/OBJ)?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'CNDL runs a fully open digital architecture. Send scans via direct cloud integration with Medit Link or 3Shape Communicate, export from iTero, upload through our online order portal at https://cndl-global.com/order-create, or dispatch large STL/OBJ files straight to the lab WhatsApp at +880 1743-167963 for instant confirmation by our CAD team.'
      }
    },
    {
      '@type': 'Question',
      'name': 'What tooth preparation guidelines are recommended for CNDL Zirconia crowns?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'For optimal CAD/CAM milling adaptation we recommend a 0.8 mm–1.0 mm chamfer or rounded shoulder margin, 1.2 mm–1.5 mm occlusal reduction, and smooth transitions with no sharp line angles or undercuts. These parameters give the digital scanner clean margins and the 5-axis mill uninterrupted tool paths, ensuring accurate, void-free seatings.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Does CNDL support Non-Resident Bangladeshi (NRB) and dental tourism fast-track cases?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes. We operate an express 3-day smile restoration workflow purpose-built for overseas Bangladeshi patients and dental tourists: scans or impressions are taken by the partnering local surgeon, we design, mill and glaze in-house, and the restoration is seated before the patient flies home — all coordinated directly between CNDL and the treating clinician.'
      }
    },
    {
      '@type': 'Question',
      'name': 'Can other dental laboratories outsource CAD/CAM milling to CNDL?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Absolutely. CNDL runs B2B lab-to-lab milling partnerships for dental laboratories without in-house 5-axis milling or sintering setups. Partner labs send digital designs or scans; we return milled, sintered and glaze-finished frameworks and anatomies under strict confidentiality, with volume pricing arranged directly with our Lab Director at +880 1743-167963.'
      }
    },
    {
      '@type': 'Question',
      'name': 'বাংলাদেশের সেরা জিরকোনিয়া ডেন্টাল ল্যাব কোনটি?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'CN Dental Lab (CNDL Global), খিলগাঁও, ঢাকা — বাংলাদেশের অন্যতম সেরা জিরকোনিয়া ডেন্টাল ল্যাব। ৫-অ্যাক্সিস Roland DGSHAPE DWX-52Di Plus মিলিং মেশিন, UP3D F20 সিনটারিং প্রযুক্তি ও জাপানি Shofu গ্লেজ ব্যবহার করে মাত্র ৩-৪ কর্মদিবসে মনোলিথিক ও মাল্টিলেয়ার জিরকোনিয়া ক্রাউন তৈরি করা হয়।'
      }
    },
    {
      '@type': 'Question',
      'name': 'জিরকোনিয়া ক্রাউন সম্পূর্ণ হতে কত দিন লাগে?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'CNDL Global-এ জিরকোনিয়া ক্রাউন, ব্রিজ, E-max ভিনিয়ার, PFM ও ফ্লেক্সিবল ডেঞ্চারসহ বেশিরভাগ রেস্টোরেশন মাত্র ৩-৪ কর্মদিবসে ডেলিভারি করা হয় — ঢাকার ভেতরে ও সারা বাংলাদেশে দ্রুত ডেলিভারি সুবিধা রয়েছে।'
      }
    },
    {
      '@type': 'Question',
      'name': 'ইনট্রাওরাল স্ক্যান ফাইল (STL/OBJ) কি অনলাইনে পাঠানো যায়?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'হ্যাঁ। Medit, 3Shape, iTero ও Carestream সিস্টেম থেকে STL বা OBJ ফরম্যাটের ডিজিটাল স্ক্যান ফাইল cndl-global.com/order-create এ আপলোড করা যায়, অথবা সরাসরি হোয়াটসঅ্যাপে (+880 1743-167963) পাঠালে সাথে সাথেই কনফার্মেশন দেওয়া হয়।'
      }
    },
    {
      '@type': 'Question',
      'name': 'CNDL-এ কেস সাবমিট কিভাবে করবেন?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'https://cndl-global.com/order-create এ ৪ ধাপের অনলাইন ফরম পূরণ করে — টুথ নম্বর, শেড নির্বাচন ও ক্লিনিকাল নোটসহ — কেস সাবমিট করুন, অথবা হোয়াটসঅ্যাপে (+880 1743-167963) স্ক্যান ও প্রেসক্রিপশন পাঠান।'
      }
    }
  ]
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HeroSection />
      <WhyChooseSection />
      <ServicesSection />
      <EquipmentSection />
      <ProcessSection />
      <ReviewSection />
      <FAQSection />
      <BlogSection />
    </main>
  );
}
