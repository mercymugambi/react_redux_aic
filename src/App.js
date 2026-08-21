import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Header from './components/Header'
import EventHighlight from './components/EventHighlight'
import RecentCauses from './components/RecentCauses'
import HomeAboutSection from './components/HomeAboutSection'
import AboutUs from './components/AboutUs'
import StatsCounter from './components/StatsCounter'
import MinistriesSection from './components/MinistriesSection'
import ScriptureBanner from './components/ScriptureBanner'
import TestimonialsSection from './components/TestimonialsSection'
import FaqSection from './components/FaqSection'
import Events from './components/Events'
import Gallery from './components/Gallery'
import ContactUs from './components/ContactUs'
import Blog from './components/Blog'
import BlogPost from './components/BlogPost'
import Footer from './components/Footer'
import Seo from './components/Seo'

function HomePage() {
  return (
    <>
      <Seo
        path="/"
        description="Africa Inland Church Kabuku is a Bible-believing church family in Kiambu County, Kenya. Sunday services at 8:00 AM and 10:30 AM, Wednesday Bible study, youth ministry and community outreach — everyone is welcome."
      />
      <Header />
      <EventHighlight />
      <RecentCauses />
      <HomeAboutSection />
      <StatsCounter />
      <MinistriesSection />
      <ScriptureBanner />
      <TestimonialsSection />
      <FaqSection />
    </>
  )
}

function App() {
  const [showAd, setShowAd] = useState(false)
  const [adMounted, setAdMounted] = useState(false)

  useEffect(() => {
    const adTimer = window.setTimeout(() => {
      setAdMounted(true)
      setShowAd(true)
    }, 400)

    return () => window.clearTimeout(adTimer)
  }, [])

  // Keep the announcement bar's height in a CSS variable so the fixed navbar and
  // every page's top offset stay in sync as it slides in and out.
  useEffect(() => {
    document.documentElement.style.setProperty('--ad-height', showAd ? '44px' : '0px')
  }, [showAd])

  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    const prefersReducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false

    if (prefersReducedMotion || typeof window.IntersectionObserver === 'undefined') {
      revealItems.forEach((item) => item.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -56px' }
    )

    revealItems.forEach((item) => observer.observe(item))

    const updateScrollProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0
      document.documentElement.style.setProperty('--scroll-progress', `${progress}%`)
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
        <div className="scroll-progress" aria-hidden="true" />
        {adMounted && (
          <div
            className={`fixed inset-x-0 top-0 z-60 bg-blue-800 shadow-lg shadow-blue-900/40 transition-transform duration-500 ${showAd ? 'translate-y-0' : '-translate-y-full'}`}
          >
            <div className="mx-auto flex h-11 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
              {/* Left: marquee-style announcement text */}
              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                <span className="shrink-0 flex items-center gap-1.5 rounded-sm bg-white/20 pl-1 pr-2.5 py-0.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                    <img src="/favicon.ico" alt="AIC logo" className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">Notice</span>
                </span>
                <span className="truncate text-xs font-semibold text-white/95 sm:text-sm">
                  Watch sermons on YouTube for encouraging messages and worship every week.
                </span>
              </div>
              {/* Right: CTA + Close */}
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-sm bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-800 transition duration-200 hover:bg-blue-50 sm:inline-flex"
                >
                  Watch Sermons
                </a>
                <button
                  type="button"
                  onClick={() => setShowAd(false)}
                  aria-label="Close announcement"
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-sm border border-white/30 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/event" element={<Events />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App


