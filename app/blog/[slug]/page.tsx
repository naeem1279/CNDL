import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareHero from '@/components/share/ShareHero';
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
          className="text-xl sm:text-2xl md:text-3xl font-semibold secondary mt-10 mb-4 pb-2 border-b-2 border-teal-500/40 text-(--text-primary) tracking-tight"
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
        <h3 key={i} className="text-lg sm:text-xl font-semibold mt-7 mb-3 text-(--text-primary)">
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
          className="my-6 border-l-4 border-slate-800 dark:border-teal-400 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-r-2xl italic text-sm md:text-base text-(--text-secondary) leading-relaxed shadow-xs"
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
            className="my-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-(--text-primary) border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="py-3.5 px-4 font-semibold uppercase tracking-wider text-xs">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
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
              className="flex items-start gap-3 text-xs sm:text-sm md:text-base text-(--text-secondary) leading-relaxed"
            >
              <CheckCircle2 size={17} className="text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
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
          className="my-6 border-l-4 border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 p-4 md:p-5 rounded-r-2xl text-sm md:text-base text-teal-950 dark:text-teal-200 leading-relaxed font-medium shadow-xs"
        >
          {line}
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={i} className="text-sm sm:text-base md:text-lg text-(--text-secondary) leading-relaxed my-3.5">
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
    <section className="bg-(--bg-primary)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <ShareHero>
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider">
            <Tag size={12} /> {post.category}
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight secondary text-(--text-tertiary)">
            {post.title}
          </h1>
          <p className="text-xs md:text-sm text-(--text-tertiary)/90 line-clamp-2">
            {post.excerpt}
          </p>
        </div>
      </ShareHero>

      <div className="container my-8 sm:my-10 md:my-14">
        <article className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs md:text-sm text-(--text-secondary) flex-wrap">
            <Link href="/" className="hover:text-[#1977C5] transition-colors">Home</Link>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
            <Link href="/blog" className="hover:text-[#1977C5] transition-colors">Blog</Link>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
            <span className="text-(--text-primary) font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {post.title}
            </span>
          </nav>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-y border-(--border-primary) mb-6 text-xs text-(--text-secondary)">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-[#1977C5]" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <User size={14} className="text-[#1977C5]" />
              By {post.author}
            </span>
            <span className="flex items-center gap-1.5 font-medium ml-auto">
              <Tag size={14} className="text-[#88C845]" />
              {post.category}
            </span>
          </div>

          {/* Featured Image */}
          <div className="relative h-[260px] sm:h-[380px] md:h-[460px] w-full rounded-2xl md:rounded-[32px] overflow-hidden shadow-sm mb-8">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Editorial Rendered Content */}
          <div className="editorial-content mt-6">
            {renderContent(post.content)}
          </div>

          {/* Lab Director Authority Card */}
          <div className="mt-12 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 bg-(--bg-secondary) p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1977C5] text-white flex items-center justify-center font-semibold text-2xl shrink-0 shadow-md">
              AK
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold secondary text-(--text-primary)">M. Abdul Kadir</h4>
                  <p className="text-xs font-semibold text-[#1977C5]">Chairman &amp; Managing Director · CN Dental Lab (CNDL)</p>
                </div>
                <a
                  href={`https://wa.me/8801743167963?text=${encodeURIComponent(`Hello CNDL, I am reading "${post.title}" and have a clinical question.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold shadow hover:brightness-105 transition-all self-center sm:self-auto shrink-0"
                >
                  <MessageCircle size={16} /> Clinical WhatsApp Inquiry
                </a>
              </div>
              <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                Direct supervisor of CNDL’s Japanese 5-axis Roland dry milling, 1530°C Aidite sintering cycles, and Shofu glaze finishing. Serving dental practices across Dhaka with guaranteed 3-day turnaround.
              </p>
            </div>
          </div>

          {/* Back button */}
          <div className="mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold secondary hover:text-[#1977C5] transition-colors"
            >
              <ArrowLeft size={16} /> Back to all articles
            </Link>
          </div>
        </article>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="max-w-4xl mx-auto mt-14 pt-10 border-t border-(--border-primary)">
            <h2 className="text-xl sm:text-2xl font-semibold secondary mb-6">
              More Clinical Articles from CNDL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group rounded-2xl overflow-hidden bg-(--bg-secondary) border border-(--border-primary) flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="relative h-[160px] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-[#1977C5] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-semibold text-(--text-primary) mt-1.5 group-hover:text-[#1977C5] transition line-clamp-2">
                      {item.title}
                    </h3>
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
