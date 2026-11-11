import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ShareHero from '@/components/share/ShareHero';
import { prisma } from '@/lib/prisma';

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
      <ShareHero>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-6xl font-semibold leading-tight secondary text-(--text-tertiary)">
          CNDL Blog
        </h1>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg mt-2 md:mt-4 text-(--text-tertiary)">
          Our blog is designed to help dental professionals.
        </p>
      </ShareHero>

      <div className="container my-8 sm:my-10 md:my-12 lg:my-14 xl:my-16">
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-[10px] md:rounded-[16px] lg:rounded-[24px] overflow-hidden bg-(--bg-primary) border border-(--border-muted) mb-8 md:mb-12"
          >
            <div className="relative h-[280px] md:h-[480px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-(--bg-primary) via-(--bg-primary)/10 to-transparent" />
              <div className="absolute bottom-0 z-10 p-6 md:p-8 max-w-3xl">
                <span className="inline-block text-[10px] md:text-xs font-medium text-white bg-(--background-muted) rounded-full px-3 py-1 mb-3">
                  {featured.category}
                </span>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-(--text-primary) mb-2">
                  {featured.title}
                </h2>
                <p className="text-xs md:text-sm lg:text-base text-(--text-secondary) line-clamp-2">
                  {featured.excerpt}
                </p>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group rounded-[10px] md:rounded-[16px] lg:rounded-[24px] overflow-hidden bg-(--bg-primary) border border-(--border-muted) flex flex-col"
            >
              <div className="relative h-[200px] md:h-[220px] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5 md:p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] md:text-xs font-medium secondary rounded-full px-3 py-1 bg-(--bg-secondary)">
                    {post.category}
                  </span>
                  <span className="text-[10px] md:text-xs text-(--text-secondary)">
                    {formatDate(post.publishedAt)}
                  </span>
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold text-(--text-primary) mb-2 group-hover:secondary transition">
                  {post.title}
                </h3>
                <p className="text-xs md:text-sm text-(--text-secondary) line-clamp-3 mb-4">
                  {post.excerpt}
                </p>
                <span className="mt-auto text-xs md:text-sm font-medium secondary">
                  Read Article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
