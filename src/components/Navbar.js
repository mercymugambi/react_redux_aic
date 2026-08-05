import React, { useState } from 'react'

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const links = [
    { label: 'Home', href: '#home' },
    { label: 'Pages', href: '#pages' },
    { label: 'Event', href: '#event' },
    { label: 'Sermons', href: '#sermons' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact Us', href: '#contact' },
  ]

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md font-sans">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* ── Brand Logo ── */}
        <a href="#home" className="group flex items-center gap-2.5 sm:gap-3 decoration-transparent">
          {/* Logo Badge Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-700/20 bg-red-700/5 text-red-700 transition group-hover:bg-red-700 group-hover:text-white sm:h-10 sm:w-10">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Church emblem with cross */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 3v6m-3-3h6M5 11l7-6 7 6v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z"
              />
            </svg>
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
        </a>

        {/* ── Desktop Navigation Links ── */}
        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-sans text-sm font-semibold text-slate-700 transition-colors hover:text-red-700"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ── Right Actions: Donate Button & Icons ── */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Donate Pill Button */}
          <a
            href="#contact"
            className="hidden rounded-full bg-red-700 px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-red-800 hover:shadow active:scale-95 sm:inline-flex"
          >
            Donate
          </a>

          {/* Share Icon */}
          <button
            type="button"
            aria-label="Share page"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'AIC Kabuku Church', url: window.location.href }).catch(() => {})
              }
            }}
            className="p-1.5 text-slate-700 transition hover:text-red-700 focus:outline-none"
          >
            <svg
              className="h-5 w-5"
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
            className="p-1.5 text-slate-700 transition hover:text-red-700 focus:outline-none"
          >
            <svg
              className="h-5 w-5"
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
            className="p-1.5 text-slate-700 transition hover:text-red-700 focus:outline-none lg:hidden"
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
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-sans text-base font-semibold text-slate-800 transition hover:text-red-700"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 pt-3 border-t border-slate-100">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full justify-center rounded-full bg-red-700 py-2.5 font-sans text-sm font-bold uppercase tracking-wider text-white"
              >
                Donate
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
