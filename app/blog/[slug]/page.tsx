import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { prisma } from '@/lib/prisma';
import { safeJsonLd } from '@/lib/safe-json-ld';
import { ChevronRight, CheckCircle2, MessageCircle, ArrowLeft, Calendar, User, Tag } from 'lucide-react';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const SITE = 'https://cndl-global.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: 'Article Not Found | CNDL Global' };

  return {
    title: `${post.title} | CNDL Global`,
    description: post.excerpt,
    keywords: [
      post.category,
      'dental lab Bangladesh',
      'CNDL Global',
      'Zirconia crown Dhaka',
      'CAD CAM milling Bangladesh',
      'ডেন্টাল ল্যাব ঢাকা',
    ],
    alternates: {
      canonical: `${SITE}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
      images: [{ url: post.image }],
      alternateLocale: ['bn_BD'],
    },
  };
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    // Heading 2 (## )
    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '');
      elements.push(
        <h2
          key={i}
          className="text-2xl md:text-3xl font-semibold secondary mt-12 mb-4 pb-3 border-b border-slate-200 text-(--text-primary) tracking-tight"
        >
          {heading}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3 (### )
    if (line.startsWith('### ')) {
      const heading = line.replace(/^###\s+/, '');
      elements.push(
        <h3 key={i} className="text-xl font-semibold mt-8 mb-3 text-(--text-primary)">
          {heading}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote (> )
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={i}
          className="my-6 border-l-4 border-[#1977C5] bg-slate-50 p-5 md:p-6 rounded-r-xl italic text-base text-(--text-secondary) leading-relaxed"
        >
          {quoteLines.join(' ')}
        </blockquote>
      );
      continue;
    }

    // Markdown Table
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .split('|')
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);

        elements.push(
          <div
            key={i}
            className="my-6 overflow-x-auto rounded-xl border border-slate-200"
          >
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100 text-(--text-primary) border-b border-slate-200">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="py-3.5 px-4 font-semibold uppercase tracking-wider text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-(--text-secondary) leading-relaxed">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Bullet List
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().match(/^[-*]\s+/) || lines[i].trim().match(/^\d+\.\s+/))
      ) {
        listItems.push(
          lines[i]
            .trim()
            .replace(/^[-*]\s+/, '')
            .replace(/^\d+\.\s+/, '')
        );
        i++;
      }
      elements.push(
        <ul key={i} className="my-5 space-y-2.5">
          {listItems.map((item, lIdx) => (
            <li
              key={lIdx}
              className="flex items-start gap-3 text-base text-slate-700 leading-relaxed"
            >
              <CheckCircle2 size={17} className="text-[#1977C5] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Bilingual Bengali Callout
    if (line.startsWith('বাংলা:') || line.startsWith('বাংলা -')) {
      elements.push(
        <div
          key={i}
          className="my-6 border-l-4 border-[#1977C5] bg-[#1977C5]/5 p-5 rounded-r-xl text-base text-slate-800 leading-relaxed font-medium"
        >
          {line}
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-base md:text-lg text-slate-700 leading-[1.75] my-4">
        {line}
      </p>
    );
    i++;
  }

  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) notFound();

  const related = await prisma.blogPost.findMany({
    where: { slug: { not: post.slug } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    image: `${SITE}${post.image}`,
    datePublished: post.publishedAt.toISOString(),
    inLanguage: ['en', 'bn-BD'],
    articleSection: post.category,
    author: {
      '@type': 'Person',
      // G4 (2026-11-05): reflect the actual DB author instead of a hardcoded name.
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CN Dental Lab (CNDL Global)',
      logo: { '@type': 'ImageObject', url: `${SITE}/icon/Logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
    about: ['Digital Dentistry', 'Zirconia', 'CAD/CAM', 'Dental Laboratory Dhaka'],
  };

  // G6 (2026-11-05): machine-readable breadcrumb trail for AI/search engines.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title },
    ],
  };

  return (
    <section className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <PageHeader
        eyebrow={
          <>
            <Tag size={14} className="shrink-0 text-[#1977C5]" aria-hidden="true" />
            <span className="min-w-0">{post.category}</span>
          </>
        }
        title={post.title}
        lead={<p className="line-clamp-3">{post.excerpt}</p>}
      />

      <div className="container py-10 md:py-14">
        <article className="mx-auto max-w-3xl">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="inline-flex min-h-10 items-center hover:text-[#1668AD]">Home</Link>
            <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <Link href="/blog" className="inline-flex min-h-10 items-center hover:text-[#1668AD]">Blog</Link>
            <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span className="max-w-[200px] truncate font-medium text-slate-900 sm:max-w-xs md:max-w-md" aria-current="page">
              {post.title}
            </span>
          </nav>

          {/* Meta row */}
          <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-200 py-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-400" aria-hidden="true" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={16} className="text-slate-400" aria-hidden="true" />
              By {post.author}
            </span>
          </div>

          {/* Featured Image */}
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image src={post.image} alt={post.title} fill sizes="(min-width: 768px) 768px, 90vw" className="object-cover" priority />
          </div>

          {/* Editorial Rendered Content */}
          <div className="editorial-content">{renderContent(post.content)}</div>

          {/* Lab Director Authority Card */}
          <div className="mt-12 flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-start sm:p-8">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#1977C5] text-xl font-semibold text-white">
              AK
            </span>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="secondary text-lg font-semibold text-slate-900">M. Abdul Kadir</h2>
                  <p className="text-sm text-[#1668AD]">Chairman &amp; Managing Director · CN Dental Lab (CNDL)</p>
                </div>
                <a
                  href={`https://wa.me/8801743167963?text=${encodeURIComponent(`Hello CNDL, I am reading "${post.title}" and have a clinical question.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-center rounded-full bg-[#128C7E] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D] sm:self-auto"
                >
                  <MessageCircle size={16} aria-hidden="true" /> Clinical WhatsApp Inquiry
                </a>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Direct supervisor of CNDL’s Japanese 5-axis Roland dry milling, 1530°C Aidite sintering cycles, and Shofu glaze finishing. Serving dental practices across Dhaka with guaranteed 3-day turnaround.
              </p>
            </div>
          </div>

          {/* Back button */}
          <div className="mt-10">
            <Link
              href="/blog"
              className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-[#1668AD] hover:bg-[#1977C5]/5"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back to all articles
            </Link>
          </div>
        </article>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="mx-auto mt-14 max-w-5xl border-t border-slate-200 pt-10">
            <h2 className="secondary mb-6 text-2xl font-semibold text-slate-900">More Clinical Articles from CNDL</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors duration-150 hover:border-slate-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 320px, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#1668AD]">{item.category}</span>
                    <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-[#1668AD]">{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
