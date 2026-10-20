import React, { useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import BookingModal from './BookingModal'

// The link for the page you're on keeps the red hover colour, so visitors can always tell where they are.
// `end` on Home stops "/" from matching every page; other links stay active on their sub-pages (e.g. /blog/:slug).
const desktopLinkClass = ({ isActive }) =>
  `relative py-1 font-sans text-sm font-semibold transition-colors hover:text-red-700 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-red-700 after:transition-transform after:duration-200 ${
    isActive ? 'text-red-700 after:scale-x-100' : 'text-slate-700 after:scale-x-0'
  }`

const mobileLinkClass = ({ isActive }) =>
  `-mx-3 rounded-lg px-3 py-1.5 font-sans text-base font-semibold transition hover:text-red-700 ${
    isActive ? 'bg-red-50 text-red-700' : 'text-slate-800'
  }`

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
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
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact Us', path: '/contact' },
    { label: 'Giving', href: '/giving' },
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
              <NavLink
                key={link.label}
                to={link.path}
                end={link.path === '/'}
                className={desktopLinkClass}
              >
                {link.label}
              </NavLink>
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
          {/* Book Appointment Pill Button */}
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="hidden whitespace-nowrap rounded-full bg-red-700 px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-700/30 transition-all duration-200 hover:bg-red-800 hover:shadow-red-700/50 hover:scale-105 active:scale-95 md:inline-flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Appointment
          </button>

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
              placeholder="Search giving, events, blog..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ── Mobile Navigation Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) =>
              link.path ? (
                <NavLink
                  key={link.label}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  {link.label}
                </NavLink>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 rounded-lg px-3 py-1.5 font-sans text-base font-semibold text-slate-800 transition hover:text-red-700"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="mt-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setBookingOpen(true) }}
                className="inline-flex w-full justify-center rounded-full bg-red-700 py-2.5 font-sans text-sm font-bold uppercase tracking-wider text-white"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </nav>
  )
}

export default Navbar

