import React, { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const barRef = useRef(null)

  // Publish the navbar's real height so pages can offset themselves against it
  // rather than guessing a pixel value that only holds at one breakpoint.
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined

    const publishHeight = () => {
      const height = Math.round(bar.getBoundingClientRect().height) + 1 // + bottom border
      document.documentElement.style.setProperty('--nav-height', `${height}px`)
    }

    publishHeight()
    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(publishHeight)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  const links = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/aboutus' },
    { label: 'Events', path: '/events' },
    { label: 'Sermons', href: '/#sermons' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact Us', path: '/contact' },
  ]

  return (
    <nav
      className="fixed inset-x-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md font-sans transition-all duration-500"
      style={{ top: 'var(--ad-height)' }}
    >
      <div ref={barRef} className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* ── Brand Logo ── */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3 decoration-transparent">
          {/* Logo Badge Icon */}
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden transition sm:h-10 sm:w-10">
            <img
              src="/favicon.ico"
              alt="AIC logo"
              className="h-5 w-5 sm:h-6 sm:w-6"
            />
          </div>
          {/* Brand Name */}
          <div className="flex flex-col leading-none">
            <span className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-red-700">
              AIC Kabuku
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
              Church Community
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden shrink items-center gap-4 lg:flex xl:gap-7">
          {links.map((link) =>
            link.path ? (
              <Link
                key={link.label}
                to={link.path}
                className="font-sans text-sm font-semibold text-slate-700 transition-colors hover:text-red-700"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="font-sans text-sm font-semibold text-slate-700 transition-colors hover:text-red-700"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* ── Right Actions: Visit Button & Icons ── */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Plan a Visit Pill Button */}
          <Link
            to="/contact"
            className="hidden whitespace-nowrap rounded-full bg-red-700 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-700/30 transition-all duration-200 hover:bg-red-800 hover:shadow-red-700/50 hover:scale-105 active:scale-95 md:inline-flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Plan a Visit
          </Link>

          {/* Share Icon */}
          <button
            type="button"
            aria-label="Share page"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'AIC Kabuku Church', url: window.location.href }).catch(() => {})
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none"
          >
            <svg
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="18" cy="5" r="3" strokeWidth={1.75} />
              <circle cx="6" cy="12" r="3" strokeWidth={1.75} />
              <circle cx="18" cy="19" r="3" strokeWidth={1.75} />
              <path strokeWidth={1.75} d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </button>

          {/* Search Icon */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none"
          >
            <svg
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Menu / Hamburger Icon */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none lg:hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Optional Search Bar Drawer ── */}
      {searchOpen && (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sermons, events, blog..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ── Mobile Navigation Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) =>
              link.path ? (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-base font-semibold text-slate-800 transition hover:text-red-700"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-base font-semibold text-slate-800 transition hover:text-red-700"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="mt-2 pt-3 border-t border-slate-100">
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full justify-center rounded-full bg-red-700 py-2.5 font-sans text-sm font-bold uppercase tracking-wider text-white"
              >
                Plan a Visit
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

