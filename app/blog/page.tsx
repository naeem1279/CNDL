import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { prisma } from '@/lib/prisma';
import { OG_IMAGE } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Dental Lab Blog | CNDL Global — CAD/CAM, Zirconia & Digital Dentistry Insights',
  description:
    'Practical articles for dental professionals from CNDL Global, Dhaka: Zirconia vs E-max selection, digital CAD/CAM workflows, flexible dentures and choosing a dental lab in Bangladesh.',
  keywords: [
    'dental lab blog Bangladesh',
    'Zirconia crown blog',
    'CAD CAM dental articles',
    'digital dentistry Bangladesh',
    'ডেন্টাল ল্যাব ব্লগ',
    'জিরকোনিয়া ক্রাউন তথ্য',
  ],
  alternates: {
    canonical: 'https://cndl-global.com/blog',
  },
  openGraph: {
    title: 'CNDL Global Blog — Digital Dental Lab Insights',
    description:
      'Zirconia, E-max, CAD/CAM workflows and dental lab selection guides for clinicians in Bangladesh.',
    url: 'https://cndl-global.com/blog',
    type: 'website',
    alternateLocale: ['bn_BD'],
    images: [OG_IMAGE],
  },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  const [featured, ...rest] = posts;
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <section>
      <PageHeader title="CNDL Blog" lead="Our blog is designed to help dental professionals." />

      <div className="container py-12 md:py-16">
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-10 grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300 md:mb-12 lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-[360px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(min-width: 1024px) 50vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-[#1977C5]/10 px-3 py-1 font-medium text-[#1668AD]">{featured.category}</span>
                <span className="text-slate-500">{formatDate(featured.publishedAt)}</span>
              </div>
              <h2 className="secondary mt-4 text-2xl font-semibold leading-tight text-slate-900 group-hover:text-[#1668AD] md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-base leading-relaxed text-slate-600">{featured.excerpt}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#1668AD]">
                Read Article <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {post.category}
                  </span>
                  <span className="text-slate-500">{formatDate(post.publishedAt)}</span>
                </div>
                <h3 className="text-lg font-semibold leading-snug text-slate-900 group-hover:text-[#1668AD]">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-[#1668AD]">
                  Read Article <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
