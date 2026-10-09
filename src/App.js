import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Header from './components/Header'
import EventHighlight from './components/EventHighlight'
import ServicesSection from './components/ServicesSection'
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
import NoticeBar from './components/NoticeBar'
import Seo from './components/Seo'
import { SiteSettingsProvider, useSiteSettings } from './components/SiteSettings'
import { noticeIsLive, noticeKey } from './data/siteSettings'
import Login from './components/Login'
import NotFound from './components/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import Dashboard from './components/admin/Dashboard'
import DashboardHome from './components/admin/DashboardHome'
import NotAuthorized from './components/admin/NotAuthorized'
import MembersList from './components/admin/MembersList'
import UsersList from './components/admin/UsersList'
import AddUser from './components/admin/AddUser'
import RolesList from './components/admin/RolesList'
import DevotionsList from './components/admin/DevotionsList'
import EventsList from './components/admin/EventsList'
import BlogPosts from './components/admin/BlogPosts'
import BlogEditor from './components/admin/BlogEditor'
import GalleryList from './components/admin/GalleryList'
import FellowshipGroupsList from './components/admin/FellowshipGroupsList'
import LeadershipPositionsList from './components/admin/LeadershipPositionsList'
import SiteSettingsPage from './components/admin/SiteSettingsPage'

function HomePage() {
  return (
    <>
      <Seo />
      <Header />
      <EventHighlight />
      <ServicesSection />
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

const NOTICE_CLOSED_KEY = 'aic:notice-closed'

function readClosedNotice() {
  try {
    return window.localStorage.getItem(NOTICE_CLOSED_KEY)
  } catch (error) {
    return null
  }
}

function PublicSite() {
  const { notice } = useSiteSettings()
  const [adMounted, setAdMounted] = useState(false)
  // A closed notice stays closed in this browser until its text changes
  const [closedNotice, setClosedNotice] = useState(readClosedNotice)
  // Kept on the page just long enough to slide away once closed
  const [noticeLeaving, setNoticeLeaving] = useState(false)
  const live = noticeIsLive(notice) && closedNotice !== noticeKey(notice)
  const showAd = adMounted && live

  useEffect(() => {
    const adTimer = window.setTimeout(() => setAdMounted(true), 400)
    return () => window.clearTimeout(adTimer)
  }, [])

  useEffect(() => {
    if (!noticeLeaving) return undefined
    const leaveTimer = window.setTimeout(() => setNoticeLeaving(false), 500)
    return () => window.clearTimeout(leaveTimer)
  }, [noticeLeaving])

  const closeNotice = () => {
    const key = noticeKey(notice)
    setClosedNotice(key)
    setNoticeLeaving(true)
    try {
      window.localStorage.setItem(NOTICE_CLOSED_KEY, key)
    } catch (error) {
      // Closed for this visit only
    }
  }

  // Keep the announcement bar's height in a CSS variable so the fixed navbar and
  // every page's top offset stay in sync as it slides in and out.
  useEffect(() => {
    document.documentElement.style.setProperty('--ad-height', showAd ? '44px' : '0px')
  }, [showAd])

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
    const canAnimate = !prefersReducedMotion && typeof window.IntersectionObserver !== 'undefined'

    const observer = canAnimate
      ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return

            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -56px' }
      )
      : null

    const reveal = (item) => {
      if (item.classList.contains('is-visible')) return
      if (observer) observer.observe(item)
      else item.classList.add('is-visible')
    }

    const revealWithin = (node) => {
      if (!(node instanceof Element)) return
      if (node.matches('[data-reveal]')) reveal(node)
      node.querySelectorAll('[data-reveal]').forEach(reveal)
    }

    revealWithin(document.body)

    // Pages rendered after a client-side navigation (or once their data loads) add new
    // [data-reveal] elements. Without this they keep opacity: 0 until a full reload.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach(revealWithin))
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      if (observer) observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0
      document.documentElement.style.setProperty('--scroll-progress', `${progress}%`)
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress)

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <div className="scroll-progress" aria-hidden="true" />
      {adMounted && (live || noticeLeaving) && <NoticeBar notice={notice} shown={showAd} onClose={closeNotice} />}
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
        <Route path="/contact-admin" element={<NotFound variant="adminHelp" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route path="/*" element={<SiteSettingsProvider><PublicSite /></SiteSettingsProvider>} />

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
        {/* The permission each page needs is set in src/auth/permissions.js */}
        <Route element={<PermissionRoute />}>
          <Route index element={<DashboardHome />} />
          <Route path="members" element={<MembersList />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/new" element={<AddUser />} />
          <Route path="roles" element={<RolesList />} />
          <Route path="devotions" element={<DevotionsList />} />
          <Route path="events" element={<EventsList />} />
          <Route path="blog" element={<BlogPosts />} />
          <Route path="blog/:postId" element={<BlogEditor />} />
          <Route path="gallery" element={<GalleryList />} />
          <Route path="fellowship-groups" element={<FellowshipGroupsList />} />
          <Route path="leadership-positions" element={<LeadershipPositionsList />} />
          <Route path="settings" element={<SiteSettingsPage />} />
        </Route>
        <Route path="not-authorized" element={<NotAuthorized />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

export default App
