import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import AboutSection from './AboutSection'
import Seo from './Seo'

function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="page-offset min-h-screen bg-white font-sans antialiased text-slate-900">
      <Seo
        title="About Our Church"
        path="/aboutus"
        description="Learn the history, mission and beliefs of Africa Inland Church Kabuku — a Bible-believing, Christ-centred family serving Kiambu County, Kenya since 1985."
      />

      {/* ── Page Hero Banner ── */}
      <section className="bg-slate-50 border-b border-slate-200 py-14 sm:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex justify-center mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-red-700 transition">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-red-700">About Us</span>
          </nav>

          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-700 mb-4">
            Africa Inland Church · Kabuku
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            About AIC Kabuku Church
          </h1>
          <p className="mt-4 text-sm text-slate-500 sm:text-base max-w-xl mx-auto leading-relaxed">
            Discover our rich history, mission, community worship, and how God has guided us through every milestone.
          </p>
        </div>
      </section>

      {/* ── Main About Content ── */}
      <AboutSection />
    </div>
  )
}

export default AboutUs
