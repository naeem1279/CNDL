import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

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
    <section className="py-7 sm:py-10 md:py-20 container">
      <div className="flex items-end justify-between gap-10 mb-6 sm:mb-8 md:mb-14">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary">
          Choosing the Right <br />
          Material for Your Case
        </h2>

        <p className="text-xs md:text-sm lg:text-base xl:text-lg text-(--text-secondary) max-w-md">
          Get in touch with our lab team or follow our blog for regular updates on dental materials
          and innovations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group rounded-[10px] md:rounded-[16px] lg:rounded-[24px] overflow-hidden bg-(--bg-primary) border border-(--border-muted) w-full md:w-[45%] relative"
          >
            <div className="relative h-[200px] sm:h-[300px] md:h-[588px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
              />
            </div>

            <div className="absolute inset-0 bg-linear-to-t from-(--bg-primary) via-(--bg-primary)/10 to-transparent" />
            <div className="absolute bottom-0 z-10 p-6">
              <p className="text-[10px] md:text-xs lg:text-base mb-2 text-(--text-secondary)">
                {formatDate(featured.publishedAt)}
              </p>
              <h3 className="text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-(--text-primary)">
                {featured.title}
              </h3>
            </div>
          </Link>
        )}

        <div className="flex flex-col gap-6 w-full md:w-[55%]">
          {side.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex gap-3 sm:gap-4 items-center flex-row rounded-[10px] md:rounded-[16px] p-3 sm:p-4 bg-(--bg-secondary) transition sm:h-[180px]"
            >
              <Image
                src={post.image}
                alt={post.title}
                width={200}
                height={200}
                className="rounded-lg sm:rounded-xl object-cover w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] md:w-[160px] md:h-[160px] shrink-0"
              />
              <div className="space-y-1 sm:space-y-3 min-w-0">
                <h4 className="text-xs sm:text-base lg:text-lg xl:text-xl font-medium text-(--text-primary) line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-[10px] sm:text-sm lg:text-base xl:text-lg text-(--text-secondary)">
                  {formatDate(post.publishedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
