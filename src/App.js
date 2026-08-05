import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Header from './components/Header'
import EventSermonHighlights from './components/EventSermonHighlights'
import RecentCauses from './components/RecentCauses'
import AboutSection from './components/AboutSection'
import StatsCounter from './components/StatsCounter'
import MinistriesSection from './components/MinistriesSection'
import ScriptureBanner from './components/ScriptureBanner'
import TestimonialsSection from './components/TestimonialsSection'
import Footer from './components/Footer'

function App() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <div className="scroll-progress" aria-hidden="true" />
      <Navbar />
      <Header />
      <EventSermonHighlights />
      <RecentCauses />
      <AboutSection />
      <StatsCounter />
      <MinistriesSection />
      <ScriptureBanner />
      <TestimonialsSection />
      <Footer />
    </div>
  )
}

export default App
