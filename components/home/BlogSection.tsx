import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import SectionHeader from '@/components/ui/SectionHeader';
import HomeText from './HomeText';
import { ButtonLink } from '@/components/ui/Button';

export default async function BlogSection() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 4,
  });

  if (posts.length === 0) return null;

  const [featured, ...side] = posts;
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container">
        <SectionHeader
          eyebrow={<HomeText path="blog.eyebrow" />}
          title={<HomeText path="blog.title" />}
          lead={<HomeText path="blog.lead" />}
          action={
            <ButtonLink href="/blog" variant="secondary">
              <HomeText path="blog.all" />
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(min-width: 1440px) 630px, (min-width: 1024px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500">{formatDate(featured.publishedAt)}</p>
                <h3 className="secondary mt-2 text-xl font-semibold leading-snug text-slate-900 group-hover:text-[#1668AD] md:text-2xl">
                  {featured.title}
                </h3>
              </div>
            </Link>
          )}

          <div className="flex flex-col gap-4">
            {side.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition-colors duration-150 hover:border-slate-300 sm:p-4"
              >
                <Image
                  src={post.image}
                  alt={post.title}
                  width={240}
                  height={240}
                  className="size-20 shrink-0 rounded-xl object-cover sm:size-28"
                />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-[#1668AD] sm:text-lg">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(post.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
