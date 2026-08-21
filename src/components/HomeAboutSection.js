import React from 'react'
import { Link } from 'react-router-dom'

function HomeAboutSection() {
  const pillars = [
    {
      icon: (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Glorify God",
      desc: "Faithful worship, praise, and honoring God in all our daily lives."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Believe Bible",
      desc: "Standing firm on the inspired Word of God as our foundational truth."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Love Community",
      desc: "Serving local families with active compassion, fellowship, and unity."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Love People",
      desc: "Welcoming all with open hearts, extending grace and Christ's love."
    }
  ]

  return (
    <section id="about-brief" data-reveal className="relative bg-slate-950 py-12 lg:py-16 text-white min-h-0 lg:max-h-[100vh] overflow-hidden">
      {/* Background Subtle Accent Glows */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-red-900/20 blur-[100px]" />
      
      {/* Cross Watermark */}
      <svg
        className="pointer-events-none absolute right-4 bottom-4 h-48 w-48 text-white/5 select-none fill-current sm:right-8 sm:bottom-8 sm:h-64 sm:w-64"
        viewBox="0 0 24 24"
      >
        <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          
          {/* Left Column: Church Photo */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=1000&q=80"
                alt="AIC Kabuku Sanctuary"
                className="h-[280px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-[340px] lg:h-[400px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              
              {/* Badge Overlay */}
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-slate-900/80 backdrop-blur-md p-3.5 border border-white/15">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-base font-bold text-red-200 sm:text-lg">
                      AIC Kabuku Sanctuary
                    </p>
                    <p className="text-[11px] text-slate-300">Africa Inland Church • Est. 1985</p>
                  </div>
                  <span className="rounded-full bg-red-600/30 px-2.5 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/30 uppercase tracking-wider">
                    Our Home
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story Brief & Pillars */}
          <div className="lg:col-span-7">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                ABOUT OUR CHURCH
              </p>
              <h2 className="mt-2 font-sans text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Welcome to AIC Kabuku Church
              </h2>
              <div className="mt-2.5 h-1.5 w-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full" />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              We are a Bible-believing, Christ-centered family committed to worshipping God, maturing in faith, and transforming our community through gospel-centered love and hands-on service.
            </p>

            {/* 4 Pillars Grid */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition hover:border-red-500/40 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                      {pillar.icon}
                    </div>
                    <h3 className="font-sans text-sm font-bold text-white">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-300 leading-snug">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button to Dedicated About Page */}
            <div className="mt-6">
              <Link
                to="/aboutus"
                className="inline-flex items-center gap-2 rounded-full bg-red-700 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-700/30 transition hover:bg-red-800 hover:scale-105"
              >
                <span>Read Full Story & Milestones</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default HomeAboutSection
