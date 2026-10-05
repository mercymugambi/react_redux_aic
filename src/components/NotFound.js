import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Seo from './Seo'

// One layout, two messages: a true 404 for unknown URLs, and a "coming soon"
// page for links we point at on purpose before the real page exists.
const VARIANTS = {
  notFound: {
    seoTitle: 'Page Not Found',
    eyebrow: 'Error 404',
    title: 'We couldn’t find that page',
    message:
      'The page you’re looking for may have moved, been renamed, or never existed. Let’s get you back on the path.',
    primary: { to: '/', label: 'Back to Home' },
    secondary: { to: '/contact', label: 'Contact Us' },
  },
  adminHelp: {
    seoTitle: 'Administrator Support',
    eyebrow: 'Coming Soon',
    title: 'Admin support is on its way',
    message:
      'A dedicated help desk for dashboard access isn’t ready yet. In the meantime, reach the church office through our contact page and mention that you need help with admin access.',
    primary: { to: '/contact', label: 'Contact the Church Office' },
    secondary: { to: '/login', label: 'Back to Login' },
  },
}

const quickLinks = [
  { to: '/about', label: 'About Us', note: 'Our story & beliefs' },
  { to: '/events', label: 'Events', note: 'What’s coming up' },
  { to: '/gallery', label: 'Gallery', note: 'Moments together' },
  { to: '/blog', label: 'Blog', note: 'Devotions & news' },
]

function NotFound({ variant = 'notFound' }) {
  const content = VARIANTS[variant] || VARIANTS.notFound
  const isNotFound = variant === 'notFound'
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="page-offset relative overflow-hidden bg-[#fcfcfb] font-sans text-slate-900">
      <Seo title={content.seoTitle} path={location.pathname} noIndex />

      {/* Soft brand backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-red-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-red-50 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <section className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        {/* 4 [logo] 4 — or the logo alone for the coming-soon variant */}
        {isNotFound ? (
          <div className="flex items-center gap-2 sm:gap-4" aria-hidden="true">
            <span className="bg-gradient-to-b from-red-600 to-red-900 bg-clip-text font-serif text-[6.5rem] font-bold leading-none text-transparent sm:text-[9rem]">
              4
            </span>
            <span className="relative h-24 w-24 sm:h-32 sm:w-32">
              {/* Pulse is painted first so the white disc covers it and it only shows around the edge */}
              <span className="absolute inset-0 animate-ping rounded-full bg-red-200/50 [animation-duration:3s]" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white shadow-xl shadow-red-900/15 ring-8 ring-red-50">
                <img src="/favicon.ico" alt="" className="h-12 w-12 sm:h-16 sm:w-16" />
              </span>
            </span>
            <span className="bg-gradient-to-b from-red-600 to-red-900 bg-clip-text font-serif text-[6.5rem] font-bold leading-none text-transparent sm:text-[9rem]">
              4
            </span>
          </div>
        ) : (
          <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-red-900 shadow-xl shadow-red-900/25 sm:h-28 sm:w-28" aria-hidden="true">
            <svg className="h-11 w-11 text-white sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
        )}

        <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-red-700 ring-1 ring-red-100">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
          {content.eyebrow}
        </span>

        <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">{content.title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">{content.message}</p>

        {isNotFound && (
          <p className="mt-4 max-w-full truncate rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-500">
            {location.pathname}
          </p>
        )}

        <blockquote className="mt-8 border-l-2 border-red-700 pl-4 text-left">
          <p className="font-serif text-lg italic text-slate-800">“Seek and you will find.”</p>
          <cite className="mt-1 block text-xs font-semibold not-italic uppercase tracking-wider text-red-700">Matthew 7:7</cite>
        </blockquote>

        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            to={content.primary.to}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-red-600 to-red-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-900/30"
          >
            {content.primary.label}
            <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to={content.secondary.to}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
          >
            {content.secondary.label}
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Go back
          </button>
        </div>

        {/* Helpful next stops */}
        <div className="mt-14 w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Or explore</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
              >
                <span className="flex items-center justify-between text-sm font-bold text-slate-800 group-hover:text-red-700">
                  {link.label}
                  <svg className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
                <span className="mt-1 block text-xs text-slate-500">{link.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default NotFound
