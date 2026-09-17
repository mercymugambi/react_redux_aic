import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './components/admin/Dashboard'
import DashboardHome from './components/admin/DashboardHome'
import MembersList from './components/admin/MembersList'
import UsersList from './components/admin/UsersList'
import RolesList from './components/admin/RolesList'
import DevotionsList from './components/admin/DevotionsList'
import EventsList from './components/admin/EventsList'
import FellowshipGroupsList from './components/admin/FellowshipGroupsList'
import LeadershipPositionsList from './components/admin/LeadershipPositionsList'

function PublicSite() {
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

function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route path="/" element={<PublicSite />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin dashboard (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="members" element={<MembersList />} />
        <Route path="users" element={<UsersList />} />
        <Route path="roles" element={<RolesList />} />
        <Route path="devotions" element={<DevotionsList />} />
        <Route path="events" element={<EventsList />} />
        <Route path="fellowship-groups" element={<FellowshipGroupsList />} />
        <Route path="leadership-positions" element={<LeadershipPositionsList />} />
      </Route>
    </Routes>
  )
}

export default App
