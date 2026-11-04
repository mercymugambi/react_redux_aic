import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BLOG_CATEGORIES, formatPostDate } from '../data/blog'
import { AuthorInitials, PostCardSkeleton, PostCover } from './BlogParts'
import Seo from './Seo'
import { usePublishedPosts } from './useBlogPosts'

const PAGE_SIZE = 6
const FILTERS = ['All', ...BLOG_CATEGORIES]

function Message({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
      <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M7 8h6M7 12h6" />
      </svg>
      <p className="mt-3 text-base font-bold text-slate-400">{title}</p>
      {children}
    </div>
  )
}

function PostCard({ post }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70">
      <Link to={`/blog/${post.slug}`} className="relative block h-48 overflow-hidden bg-slate-100">
        <PostCover src={post.cover_image_url} alt={post.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 backdrop-blur">
            {post.category}
          </span>
        )}
        {post.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-red-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            Featured
          </span>
        )}
        {post.read_minutes > 0 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            {post.read_minutes} min
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{formatPostDate(post.published_on)}</p>
        <h3 className="mt-2 text-base font-bold leading-snug text-slate-900 transition group-hover:text-red-700">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {post.author_name && (
              <>
                <AuthorInitials name={post.author_name} />
                <span className="truncate text-[11px] font-semibold text-slate-600">{post.author_name}</span>
              </>
            )}
          </div>
          <Link to={`/blog/${post.slug}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-700 transition hover:gap-2">
            Read
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}

function Blog() {
  const { posts, status, reload } = usePublishedPosts()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return posts
      .filter((post) => selectedCategory === 'All' || post.category === selectedCategory)
      .filter((post) => {
        if (!query) return true
        return [post.title, post.excerpt, post.author_name, ...(post.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        if (sortOrder === 'shortest') return (a.read_minutes || 0) - (b.read_minutes || 0)
        // The featured post leads the default view
        if (sortOrder === 'newest' && a.featured !== b.featured) return a.featured ? -1 : 1
        const diff = (b.published_on || '').localeCompare(a.published_on || '')
        return sortOrder === 'oldest' ? -diff : diff
      })
  }, [posts, selectedCategory, searchQuery, sortOrder])

  // Any change to the filters should bring the list back to the first page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedCategory, searchQuery, sortOrder])

  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const hasFilters = selectedCategory !== 'All' || searchQuery.trim() !== ''
  const clearFilters = () => {
    setSelectedCategory('All')
    setSearchQuery('')
  }

  let content
  if (status === 'loading') {
    content = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" aria-busy="true" aria-label="Loading articles">
        {Array.from({ length: 3 }, (_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    )
  } else if (status === 'error') {
    content = (
      <Message title="We couldn’t load the articles right now">
        <button type="button" onClick={reload} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
          Try again
        </button>
      </Message>
    )
  } else if (!posts.length) {
    content = (
      <Message title="No articles yet">
        <p className="mt-1 text-sm text-slate-400">Reflections, church news and testimonies will appear here soon.</p>
      </Message>
    )
  } else {
    content = (
      <>
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-500">
            Showing <span className="font-bold text-red-700">{visiblePosts.length}</span> of{' '}
            <span className="font-bold text-slate-900">{filteredPosts.length}</span> article
            {filteredPosts.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' && (
              <span className="text-slate-400"> in <em className="not-italic text-slate-700">{selectedCategory}</em></span>
            )}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <Message title="No articles match your search">
            <button type="button" onClick={clearFilters} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
              Show all articles
            </button>
          </Message>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {visiblePosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            {visibleCount < filteredPosts.length && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 transition duration-200 hover:border-red-700 hover:bg-red-700 hover:text-white"
                >
                  Load more articles
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <main className="page-offset min-h-screen bg-white font-sans antialiased text-slate-900">
      <Seo
        page="blog"
        title="Blog"
        path="/blog"
        type="blog"
        description="Reflections from our pastors, updates from our ministries and stories from the AIC Kabuku church family — on faith, prayer, parenting, youth work and community outreach."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'AIC Kabuku Journal',
          blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.published_on,
            image: post.cover_image_url || undefined,
            author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
          })),
        }}
      />

      {/* ── PAGE HEADING ── */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Blog
          </h1>
          {posts.length > 0 && (
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </p>
          )}
        </div>
      </section>

      {/* ── FILTERS ── */}
      <section className="sticky sticky-below-nav z-30 border-y border-slate-200 bg-white/95 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0 [scrollbar-width:none]">
              {FILTERS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition duration-200 ${
                    selectedCategory === category
                      ? 'border-red-700 bg-red-700 text-white shadow-sm shadow-red-700/25'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
              <div className="relative flex-1 lg:w-60 lg:flex-none">
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search articles or authors..."
                  aria-label="Search articles"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Sort articles"
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="shortest">Quickest read</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── POST GRID ── */}
      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{content}</div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-red-700/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-red-700/20 blur-3xl" />

          <div className="relative mx-auto max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-red-300">Never miss a post</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
              A little encouragement, every fortnight.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              New articles, sermon notes and church news delivered to your inbox. No noise, and you can
              unsubscribe at any time.
            </p>

            {subscribed ? (
              <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-6 py-3 text-sm font-bold text-green-300">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                You&apos;re subscribed — welcome aboard.
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubscribed(true)
                }}
                className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-red-700 px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition duration-200 hover:bg-red-600 active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Blog
