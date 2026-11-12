import { Star } from 'lucide-react';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { safeJsonLd } from '@/lib/safe-json-ld';
import SectionHeader from '@/components/ui/SectionHeader';

type Review = {
  name: string;
  role: string;
  image: string;
  rating: number;
  review: string;
};

const fallbackReviews: Review[] = [
  {
    name: 'Dr. Michael Carter',
    role: 'Dental Surgeon',
    image: '/images/Avatar.png',
    rating: 5,
    review:
      'The precision and consistency of restorations are outstanding. Each case fits perfectly, saving chairside time. Their predictable turnaround and responsive support team make them a dependable long-term partner for our dental practice.',
  },
  {
    name: 'Dr. Sarah Williams',
    role: 'Prosthodontist',
    image: '/images/Avatar.png',
    rating: 5,
    review:
      'CNDL delivers excellent esthetics with remarkable accuracy. The materials feel premium and durable. Communication is clear, timelines are respected, and every case arrives exactly as planned, which significantly improves our daily workflow.',
  },
  {
    name: 'Dr. James Anderson',
    role: 'Implant Specialist',
    image: '/images/Avatar.png',
    rating: 4,
    review:
      'Their implant restorations show great attention to detail. Fit and finish are consistently reliable. Turnaround time is predictable, and quality control standards give us confidence when handling complex implant-supported restorations.',
  },
];

export default async function ReviewComponent() {
  let reviews: Review[];
  try {
    const rows = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
    reviews = rows.length
      ? rows.map((t) => ({
          name: t.doctorName,
          role: `${t.clinicName}, ${t.location}`,
          image: t.avatar || '/images/Avatar.png',
          rating: t.rating,
          review: t.comment,
        }))
      : fallbackReviews;
  } catch {
    reviews = fallbackReviews;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DentalLaboratory',
    '@id': 'https://cndl-global.com/#organization',
    name: 'CN Dental Lab (CNDL Global)',
    review: reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.review,
    })),
  };

  const renderReviews = (items: Review[], copy: boolean) =>
    [...items, ...items].map((review, index) => (
      <figure
        key={`${review.name}-${index}`}
        // The second half repeats the first so the scroll loops; hide it from screen readers.
        aria-hidden={copy || index >= items.length ? true : undefined}
        className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex gap-0.5" role="img" aria-label={`${review.rating} out of 5`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              aria-hidden="true"
              className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
            />
          ))}
        </div>

        <blockquote className="mt-4 text-base leading-relaxed text-slate-700">&ldquo;{review.review}&rdquo;</blockquote>

        <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
          <Image src={review.image} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{review.name}</div>
            <div className="text-sm text-slate-500">{review.role}</div>
          </div>
        </figcaption>
      </figure>
    ));

  return (
    <section className="overflow-hidden bg-white py-16 md:py-24" id="review">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="container">
        <SectionHeader
          align="center"
          title="Trusted by Top Dental Practitioners."
          lead="Real stories from dentists across Bangladesh who trust CNDL with their cases"
        />

        <div className="relative h-[560px] overflow-hidden md:h-[600px]">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-20 w-full bg-linear-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-20 w-full bg-linear-to-t from-white to-transparent" />

          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            <div className="overflow-hidden">
              <div className="review-scroll-up flex flex-col gap-4 lg:gap-6">
                {reviews.length > 0 && renderReviews(reviews, false)}
              </div>
            </div>

            <div className="hidden overflow-hidden md:block">
              <div className="review-scroll-down flex flex-col gap-4 lg:gap-6">
                {reviews.length > 0 && renderReviews([...reviews].reverse(), true)}
              </div>
            </div>

            <div className="hidden overflow-hidden xl:block">
              <div className="review-scroll-up flex flex-col gap-4 lg:gap-6">
                {reviews.length > 0 && renderReviews(reviews, true)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
