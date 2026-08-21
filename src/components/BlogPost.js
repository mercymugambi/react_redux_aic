import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPostDate, getPostBySlug, getRelatedPosts } from '../data/blogPosts'
import Seo from './Seo'
import { SITE_NAME } from '../seo/siteMeta'

function ArticleBlock({ block }) {
  if (block.type === 'heading') {
    return (
      <h2 className="mt-11 scroll-mt-28 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
        {block.text}
      </h2>
    )
  }

  if (block.type === 'quote') {
    return (
      <figure className="my-9 border-l-4 border-red-700 bg-red-50/60 py-5 pl-6 pr-5 sm:pl-8">
        <blockquote className="font-serif text-lg italic leading-relaxed text-slate-800 sm:text-xl">
          &ldquo;{block.text}&rdquo;
        </blockquote>
        {block.cite && (
          <figcaption className="mt-3 text-xs font-bold uppercase tracking-wider text-red-700">
            — {block.cite}
          </figcaption>
        )}
      </figure>
    )
  }

  if (block.type === 'list') {
    return (
      <ul className="mt-6 space-y-3">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-8 text-slate-700">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  return <p className="mt-6 text-base leading-8 text-slate-700">{block.text}</p>
}

function NotFound() {
  return (
    <main className="page-offset flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-sans">
      <Seo title="Article not found" path="/blog" noIndex />
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-red-700">404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        We couldn&apos;t find that article
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        The post may have been moved or renamed. Browse the journal to find what you were looking for.
      </p>
      <Link
        to="/blog"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-700 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800"
      >
        Back to the blog
      </Link>
    </main>
  )
}

function BlogPost() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setCopied(false)
  }, [slug])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(timer)
  }, [copied])

  if (!post) return <NotFound />

  const relatedPosts = getRelatedPosts(post)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = encodeURIComponent(`${post.title} — AIC Kabuku`)

  const copyLink = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(shareUrl).then(() => setCopied(true)).catch(() => {})
  }

  return (
    <main className="page-offset min-h-screen bg-white font-sans antialiased text-slate-900">
      <Seo
        title={post.title}
        path={`/blog/${post.slug}`}
        description={post.excerpt}
        image={post.image}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.image,
          datePublished: post.date,
          dateModified: post.date,
          keywords: post.tags.join(', '),
          articleSection: post.category,
          wordCount: post.body.reduce(
            (total, block) =>
              total + (block.text || (block.items || []).join(' ')).split(/\s+/).length,
            0
          ),
          author: { '@type': 'Person', name: post.author.name, jobTitle: post.author.role },
          publisher: { '@type': 'Organization', name: SITE_NAME },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `/blog/${post.slug}` },
        }}
      />

      {/* ── COVER ── */}
      <header className="relative isolate overflow-hidden bg-slate-950 text-white">
        <img
          src={post.image}
          alt={post.title}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/75" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <nav className="flex flex-wrap items-center text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="transition hover:text-red-300">Home</Link>
            <span className="mx-2 text-slate-600">/</span>
            <Link to="/blog" className="transition hover:text-red-300">Blog</Link>
            <span className="mx-2 text-slate-600">/</span>
            <span className="text-red-300">{post.category}</span>
          </nav>

          <span className="mt-6 inline-block rounded-full bg-red-700 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {post.category}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{post.excerpt}</p>

          <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/15 pt-6">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-12 w-12 rounded-full border-2 border-white/25 object-cover"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">{post.author.name}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300">
                {post.author.role}
              </p>
            </div>
            <span className="hidden h-8 w-px bg-white/20 sm:block" />
            <div className="text-xs font-semibold text-slate-300">
              <p>{formatPostDate(post.date)}</p>
              <p className="text-slate-400">{post.readTime} min read</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── ARTICLE ── */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        {post.body.map((block, index) => (
          <ArticleBlock key={`${block.type}-${index}`} block={block} />
        ))}

        {/* Tags */}
        <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-8">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Tags</span>
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
              #{tag}
            </span>
          ))}
        </div>

        {/* Share */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Share</span>

          <button
            type="button"
            onClick={copyLink}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
              copied
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700'
            }`}
          >
            {copied ? (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m6.5-6.5l1.5-1.5a4 4 0 115.656 5.656l-3 3a4 4 0 01-5.656 0" />
              </svg>
            )}
            {copied ? 'Link copied' : 'Copy link'}
          </button>

          <a
            href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700"
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700"
          >
            X
          </a>
        </div>

        {/* Author card */}
        <aside className="mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Written by</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{post.author.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {post.author.role} at AIC Kabuku. Have a question about this article, or a story of your own?{' '}
              <Link to="/contact" className="font-semibold text-red-700 hover:underline">Get in touch</Link>.
            </p>
          </div>
        </aside>
      </article>

      {/* ── RELATED ── */}
      <section className="border-t border-slate-200 bg-slate-50 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-700">Keep reading</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                More from the journal
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:text-red-700"
            >
              View all articles
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <article
                key={related.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <Link to={`/blog/${related.slug}`} className="relative block h-44 overflow-hidden bg-slate-100">
                  <img
                    src={related.image}
                    alt={related.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 backdrop-blur">
                    {related.category}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {formatPostDate(related.date)} · {related.readTime} min
                  </p>
                  <h3 className="mt-2 text-base font-bold leading-snug text-slate-900 transition group-hover:text-red-700">
                    <Link to={`/blog/${related.slug}`}>{related.title}</Link>
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{related.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default BlogPost
