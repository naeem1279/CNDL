import { LanguageProvider } from '@/context/LanguageContext';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../style/globals.css';
import { Toaster } from 'sonner';
import SiteChrome from '@/components/layout/SiteChrome';
import { OG_IMAGE } from '@/lib/seo';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cndl-global.com'),
  title: 'CN Dental Lab (CNDL) | #1 Digital CAD/CAM Zirconia Laboratory in Bangladesh',
  description: 'Premier digital dental laboratory in Dhaka, Bangladesh specializing in 5-axis CAD/CAM Zirconia crowns, E-max veneers, PFM, in-house clear aligners, and flexible dentures. Guaranteed 3-4 day turnaround with Japanese Roland milling & Shofu glaze technology.',
  keywords: ['Zirconia dental lab Bangladesh', 'best dental lab Dhaka', 'CAD CAM dental milling Bangladesh', 'Roland DGSHAPE dental lab', 'E-max veneer lab Dhaka', 'in-house clear aligners Bangladesh', 'Khilgaon dental lab', 'সেরা ডেন্টাল ল্যাব ঢাকা', 'জিরকোনিয়া ক্রাউন বাংলাদেশ', 'ডেন্টাল ল্যাব বাংলাদেশ', 'জিরকোনিয়া ক্রাউন এর দাম', 'ডিজিটাল ডেন্টাল ল্যাব ঢাকা'],
  authors: [{ name: 'CNDL Global' }],
  creator: 'CNDL Global',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['bn_BD'],
    url: 'https://cndl-global.com/',
    title: 'CNDL Global | Precision Dental Lab Solutions',
    description: 'High-quality Zirconia, E-max, PFM restorations, and flexible dentures. Precision dental lab services with guaranteed turnaround.',
    siteName: 'CNDL Global',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CNDL Global | Precision Dental Lab Solutions',
    description: 'High-quality Zirconia, E-max, PFM restorations, and flexible dentures in Dhaka, Bangladesh.',
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Multi-Entity Knowledge Graph for AEO / GEO (AI answer engines)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['DentalLaboratory', 'MedicalOrganization', 'LocalBusiness'],
    '@id': 'https://cndl-global.com/#organization',
    name: 'CN Dental Lab (CNDL Global)',
    alternateName: ['CNDL', 'C.N Dental Lab', 'CN Dental Lab Bangladesh', 'CNDL Zirconia Lab'],
    url: 'https://cndl-global.com/',
    logo: 'https://cndl-global.com/icon/Logo.svg',
    image: 'https://cndl-global.com/images/CTA.jpg',
    description:
      'Premier digital dental laboratory in Dhaka, Bangladesh specializing in 5-axis CAD/CAM Zirconia crowns, E-max veneers, PFM, in-house clear aligners, and flexible dentures with a guaranteed 3-4 working day turnaround.',
    founder: {
      '@type': 'Person',
      name: 'M. Abdul Kadir',
      jobTitle: 'Chairman',
    },
    leader: {
      '@type': 'Person',
      name: 'M. Abdul Kadir',
      jobTitle: 'Chairman',
    },
    telephone: ['+8801743167963', '+8801805976351'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+8801743167963',
        contactType: 'customer service',
        areaServed: 'BD',
        availableLanguage: ['en', 'bn'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+8801805976351',
        contactType: 'customer service',
        areaServed: 'BD',
        availableLanguage: ['en', 'bn'],
      },
    ],
    email: 'chistiyanizamiyad@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '419/1/C Khilgaon (West Side of Jorpukur Field)',
      addressLocality: 'Dhaka',
      addressRegion: 'Dhaka Division',
      postalCode: '1219',
      addressCountry: 'BD',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 23.7545,
      longitude: 90.4245,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '23:30',
      },
    ],
    priceRange: '$$',
    currenciesAccepted: 'BDT',
    paymentAccepted: 'Cash, bKash, Bank Transfer',
    areaServed: [
      { '@type': 'City', name: 'Dhaka' },
      { '@type': 'Country', name: 'Bangladesh' },
    ],
    knowsAbout: [
      'Roland DGSHAPE DWX-52Di Plus 5-Axis Milling',
      'CAD/CAM Monolithic & Multilayer Zirconia Crowns',
      'IPS E-Max Veneers',
      'Authentic Shofu Natural Glaze (900°C)',
      'UP3D F20 Sintering Technology',
      'In-House Clear Aligners Planning & Printing',
      'Flexible Dentures',
      'Intraoral Scan Processing (STL/OBJ)',
      '3 to 4 Working Days Fast Dental Turnaround',
    ],
    sameAs: ['https://www.facebook.com/cndentallab'],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.variable}>
        <LanguageProvider>
          <SiteChrome>{children}</SiteChrome>
        </LanguageProvider>
        <Toaster position="bottom-right" richColors duration={5000} />
      </body>
    </html>
  );
}
