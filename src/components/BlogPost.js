import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPostDate, relatedPosts as pickRelated } from '../data/blog'
import BlogComments from './BlogComments'
import { AuthorInitials, PostCover } from './BlogParts'
import Seo from './Seo'
import { usePublishedPost, usePublishedPosts } from './useBlogPosts'
import { SITE_NAME } from '../seo/siteMeta'

// A photo placed between paragraphs; left out entirely if it fails to load
function ArticleImage({ url, caption }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return null

  return (
    <figure className="my-10">
      <img
        src={url}
        alt={caption || ''}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full rounded-2xl bg-slate-100 object-cover"
      />
      {caption && <figcaption className="mt-3 text-center text-sm leading-relaxed text-slate-500">{caption}</figcaption>}
    </figure>
  )
}

// Exported, with ArticleHeader, so the admin editor's preview matches this page
export function ArticleBlock({ block }) {
  if (block.type === 'image') return <ArticleImage url={block.url} caption={block.caption} />

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

// The cover band: breadcrumb, category, title, summary, author and date
export function ArticleHeader({ post }) {
  return (
    <header className="relative isolate overflow-hidden bg-slate-950 text-white">
      <PostCover src={post.cover_image_url} alt={post.title} className="absolute inset-0 -z-20 h-full w-full object-center" />
      <div className="absolute inset-0 -z-10 bg-slate-950/75" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <nav className="flex flex-wrap items-center text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link to="/" className="transition hover:text-red-300">Home</Link>
          <span className="mx-2 text-slate-600">/</span>
          <Link to="/blog" className="transition hover:text-red-300">Blog</Link>
          {post.category && (
            <>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-red-300">{post.category}</span>
            </>
          )}
        </nav>

        {post.category && (
          <span className="mt-6 inline-block rounded-full bg-red-700 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {post.category}
          </span>
        )}

        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{post.excerpt}</p>

        <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/15 pt-6">
          {post.author_name && (
            <>
              <AuthorInitials name={post.author_name} className="h-12 w-12 text-sm" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-white">{post.author_name}</p>
                {post.author_role && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300">{post.author_role}</p>
                )}
              </div>
              <span className="hidden h-8 w-px bg-white/20 sm:block" />
            </>
          )}
          <div className="text-xs font-semibold text-slate-300">
            <p>{formatPostDate(post.published_on)}</p>
            {(post.read_minutes > 0 || post.comments_count > 0) && <p className="text-slate-400">
              {post.read_minutes > 0 && `${post.read_minutes} min read`}
              {post.comments_count > 0 && (
                <>
                  {post.read_minutes > 0 && ' · '}
                  <a href="#comments" className="transition hover:text-red-300">
                    {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
                  </a>
                </>
              )}
            </p>}
          </div>
        </div>
      </div>
    </header>
  )
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

function LoadingArticle() {
  return (
    <main className="page-offset min-h-screen bg-white font-sans" aria-busy="true" aria-label="Loading article">
      <div className="bg-slate-950">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-12 sm:px-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    </main>
  )
}

function LoadError({ onRetry }) {
  return (
    <main className="page-offset flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-sans">
      <Seo title="Blog" path="/blog" noIndex />
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">We couldn&apos;t load this article</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">Please check your connection and try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-700 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800"
      >
        Try again
      </button>
    </main>
  )
}

const wordsIn = (blocks = []) =>
  blocks
    .map((block) => [block.text, block.cite, ...(block.items || [])].join(' '))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

function BlogPost() {
  const { slug } = useParams()
  const { post, status, reload } = usePublishedPost(slug)
  const { posts } = usePublishedPosts()
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

  if (status === 'loading') return <LoadingArticle />
  if (status === 'error') return <LoadError onRetry={reload} />
  if (!post) return <NotFound />

  const relatedPosts = pickRelated(post, posts)
  const body = post.body || []
  const tags = post.tags || []
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
        image={post.cover_image_url || undefined}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image_url || undefined,
          datePublished: post.published_on,
          dateModified: post.updated_at || post.published_on,
          keywords: tags.join(', '),
          articleSection: post.category,
          wordCount: wordsIn(body),
          author: post.author_name
            ? { '@type': 'Person', name: post.author_name, jobTitle: post.author_role || undefined }
            : undefined,
          publisher: { '@type': 'Organization', name: SITE_NAME },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `/blog/${post.slug}` },
        }}
      />

      {/* ── COVER ── */}
      <ArticleHeader post={post} />

      {/* ── ARTICLE ── */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        {body.map((block, index) => (
          <ArticleBlock key={`${block.type}-${index}-${block.url || ''}`} block={block} />
        ))}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-8">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Tags</span>
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className={`flex flex-wrap items-center gap-2.5 ${tags.length > 0 ? 'mt-6' : 'mt-12 border-t border-slate-200 pt-8'}`}>
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
        {post.author_name && (
          <aside className="mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center">
            <AuthorInitials name={post.author_name} className="h-16 w-16 text-lg" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Written by</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{post.author_name}</p>
              {post.author_role && <p className="mt-1 text-sm leading-relaxed text-slate-600">{post.author_role} at AIC Kabuku</p>}
            </div>
          </aside>
        )}

        {/* ── COMMENTS ── */}
        <BlogComments key={post.slug} slug={post.slug} />
      </article>

      {/* ── RELATED ── */}
      {relatedPosts.length > 0 && (
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
                  <PostCover src={related.cover_image_url} alt={related.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  {related.category && (
                    <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 backdrop-blur">
                      {related.category}
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {formatPostDate(related.published_on)}
                    {related.read_minutes > 0 && ` · ${related.read_minutes} min`}
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
      )}
    </main>
  )
}

export default BlogPost
