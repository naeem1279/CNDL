import { Star } from 'lucide-react';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { safeJsonLd } from '@/lib/safe-json-ld';

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

  const renderReviews = (items: Review[]) =>
    [...items, ...items].map((review, index) => (
      <div
        key={`${review.name}-${index}`}
        className="p-6 lg:p-7 xl:p-8  rounded-[10px] md:rounded-[16px] lg:rounded-[24px] bg-(--bg-primary) border-[1.5px] border-(--border-primary) flex flex-col justify-between"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center pb-10 pt-5">
          <Image src={review.image} alt="review" width={48} height={48} className="rounded-full" />
        </div>

        <div className="font-semibold text-sm md:text-base lg:text-lg xl:text-xl pb-2">
          {review.name}
        </div>
        <div className="text-[10px] md:text-xs text-(--text-secondary) pb-2">{review.role}</div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              className={
                i < review.rating
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-gray-300 text-gray-300'
              }
            />
          ))}
        </div>

        <p className="text-(--text-secondary) text-xs md:text-sm lg:text-base xl:text-lg">
          &quot;{review.review}&quot;
        </p>
      </div>
    ));

  return (
    <section className="py-7 sm:py-10 md:py-20  bg-(--bg-secondary) overflow-hidden" id="review">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="container">
        <div className="text-center gap-6 mb-14">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[48px] font-semibold secondary">
            Trusted by Top Dental Practitioners.
          </div>
          <p className="text-[10px] md:text-xs lg:text-base text-(--text-secondary) mt-2 md:mt-4">
            Real stories from dentists across Bangladesh who trust CNDL with their cases
          </p>
        </div>

        <div className="relative h-[600px] container overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 w-full h-24 bg-linear-to-b from-(--bg-secondary) to-transparent z-10" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-(--bg-secondary) to-transparent z-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
            <div className="overflow-hidden">
              <div className="flex flex-col gap-6 review-scroll-up">
                {reviews.length > 0 && renderReviews(reviews)}
              </div>
            </div>

            <div className="overflow-hidden hidden md:block">
              <div className="flex flex-col gap-6 review-scroll-down">
                {reviews.length > 0 && renderReviews([...reviews].reverse())}
              </div>
            </div>

            <div className="overflow-hidden hidden xl:block">
              <div className="flex flex-col gap-6 review-scroll-up">
                {reviews.length > 0 && renderReviews(reviews)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
