import React, { useState } from 'react'

function AboutSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const pillars = [
    {
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Glorify God",
      desc: "Faithful worship, praise, and honoring God in all our daily lives and weekly gatherings."
    },
    {
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Believe Bible",
      desc: "Standing firm on the inspired, uncompromised Word of God as our eternal truth."
    },
    {
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Love Community",
      desc: "Serving families and neighbors with active compassion, fellowship, and unity."
    },
    {
      icon: (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Love People",
      desc: "Welcoming all with open hearts, extending grace, prayer, and Christ's salvation."
    }
  ]

  const milestones = [
    {
      id: 1,
      month: 'OCT',
      day: '01',
      year: '1985',
      title: 'Church Foundation & First Gathering',
      desc: 'Started our journey as a small prayer fellowship under a modest tree shelter with 15 faithful believers.',
      images: [
        'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=300&q=80'
      ]
    },
    {
      id: 2,
      month: 'SEPT',
      day: '16',
      year: '1998',
      title: 'Dedicated Sanctuary Inauguration',
      desc: 'Formally dedicated our first permanent stone sanctuary building with over 400 members in attendance.',
      badgeText: 'Milestone Dedication'
    },
    {
      id: 3,
      month: 'SEPT',
      day: '12',
      year: '2010',
      title: 'Youth & Children Ministry Launch',
      desc: 'Expanded our ministry programs to equip over 300 young people weekly in Biblical foundations and mentorship.'
    },
    {
      id: 4,
      month: 'AUG',
      day: '20',
      year: '2019',
      title: 'New Pastoral Leadership Joined',
      desc: 'Welcomed dedicated pastoral ministry team to shepherd the growing congregation into a new decade.',
      avatar: {
        img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        name: 'Rev. Joseph Njuguna',
        role: 'Senior Pastor & Shepherd'
      }
    },
    {
      id: 5,
      month: 'JUL',
      day: '10',
      year: '2024',
      title: 'Digital Broadcast & Sanctuary Expansion',
      desc: 'Launched live online Sunday services reaching believers globally and broke ground on modern facility expansion.',
      images: [
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1510519138161-58446265071c?auto=format&fit=crop&w=300&q=80'
      ]
    }
  ]

  return (
    <div id="about" className="bg-white text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* ────────────────────────────────────────────────────────────
          SECTION 1: CHURCH BRIEF & STORY
      ─────────────────────────────────────────────────────────── */}
      <section data-reveal className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Column: Church Photo */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto overflow-hidden rounded-3xl border border-slate-200 shadow-lg bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=1000&q=80"
                  alt="AIC Kabuku Sanctuary"
                  className="h-[320px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-[400px] lg:h-[480px]"
                />

                {/* Floating info badge */}
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 backdrop-blur-sm p-4 border border-slate-200 shadow-md sm:bottom-6 sm:left-6 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-serif text-base font-bold text-slate-900 sm:text-lg">
                        AIC Kabuku Church
                      </p>
                      <p className="text-xs text-slate-500">Africa Inland Church • Founded 1985</p>
                    </div>
                    <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold text-red-700 uppercase tracking-wider">
                      House of Faith
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Church Brief Content */}
            <div className="lg:col-span-7">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-red-700 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                Know Our Story & Mission
              </p>
              <h2 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Welcome to AIC Kabuku Church
              </h2>
              <div className="mt-4 h-1 w-16 bg-red-700 rounded-full" />

              <p className="mt-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                We are a Bible-believing, Christ-centered family committed to worshipping God, equipping saints, and serving our local community with transformative grace. Through prayer, scripture, fellowship, and outreach, we build lives rooted in the love of Jesus Christ.
              </p>

              {/* 4 Pillars Grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 transition-all duration-300 hover:border-red-200 hover:bg-red-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100 group-hover:bg-red-100">
                        {pillar.icon}
                      </div>
                      <h3 className="font-sans text-sm font-bold text-slate-900 sm:text-base">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          SECTION 2: VIDEO SHOWCASE
      ─────────────────────────────────────────────────────────── */}
      <section data-reveal className="bg-slate-50 border-y border-slate-200 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-700 mb-3">
              Experience Our Worship
            </span>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Watch Our Church In Action
            </h3>
            <p className="mt-3 text-sm text-slate-500 sm:text-base">
              Take a peak into our Sunday services, spirit-filled worship, and vibrant church family.
            </p>
          </div>

          {/* Video Container - 16:9 Responsive */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 group">
            {!isVideoPlaying ? (
              <div className="relative h-full w-full">
                <img
                  src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80"
                  alt="AIC Worship Service Video Thumbnail"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/30" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsVideoPlaying(true)}
                    aria-label="Play Worship Video"
                    className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-red-700 text-white shadow-2xl shadow-red-700/40 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none"
                  >
                    <span className="absolute inset-0 rounded-full bg-red-700 animate-ping opacity-30" />
                    <svg className="h-8 w-8 sm:h-10 sm:w-10 translate-x-0.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <p className="mt-4 text-sm font-bold uppercase tracking-wider text-white sm:text-base">
                    Click to Play Sunday Worship Highlight
                  </p>
                  <span className="mt-1 text-xs text-white/70">Duration: 3 mins • HD Video</span>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                  title="AIC Kabuku Church Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(false)}
                  className="absolute top-4 right-4 rounded-full bg-black/70 p-2 text-white hover:bg-red-700 transition"
                  aria-label="Close Video"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Info strip under video */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-xs sm:text-sm font-medium text-slate-700">
                Join Us Live Every Sunday: <strong className="text-slate-900">9:00 AM – 12:30 PM EAT</strong>
              </p>
            </div>
            <a
              href="#contact"
              className="text-xs font-bold uppercase tracking-wider text-red-700 hover:underline"
            >
              Get Church Location & Directions &rarr;
            </a>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CHURCH MILESTONES TIMELINE
          (Styled & Structured exactly after the user reference design)
      ───────────────────────────────────────────────────────────── */}
      <section data-reveal className="relative bg-slate-100 py-16 sm:py-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl lg:text-5xl">
              Our Church Milestones
            </h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
              WON, TRIUMPH & JOURNEY SO FAR
            </p>
            <div className="mt-4 mx-auto h-1 w-16 bg-blue-600 rounded-full" />
          </div>

          {/* Vertical Timeline Container */}
          <div className="relative">
            
            {/* Center Line for Desktop (`lg:`), Left Line for Mobile */}
            <div className="absolute top-0 bottom-0 left-6 lg:left-1/2 w-0.5 -translate-x-1/2 bg-slate-300" />

            {/* Timeline Cards List */}
            <div className="space-y-12 sm:space-y-16">
              {milestones.map((item, index) => {
                const isEven = index % 2 === 1

                return (
                  <div
                    key={item.id}
                    className={`relative flex flex-col lg:flex-row items-start ${
                      isEven ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    
                    {/* Node Circle Dot on the Line */}
                    <div className="absolute top-6 left-6 lg:left-1/2 -translate-x-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-md ring-4 ring-slate-100">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </div>

                    {/* Card Container (Right of line on mobile; Alternating left/right on Desktop) */}
                    <div
                      className={`w-full pl-14 lg:pl-0 lg:w-[calc(50%-2.5rem)] ${
                        isEven ? 'lg:mr-auto' : 'lg:ml-auto'
                      }`}
                    >
                      <div className="relative rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/60 border border-slate-200/80 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        
                        {/* Triangular Arrow indicator towards line on desktop */}
                        <div
                          className={`hidden lg:block absolute top-7 h-0 w-0 border-y-8 border-y-transparent ${
                            isEven
                              ? '-right-3 border-l-[12px] border-l-white'
                              : '-left-3 border-r-[12px] border-r-white'
                          }`}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Card Text & Content */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              {item.desc}
                            </p>

                            {/* Optional Thumbnail Image Gallery inside card (matching screenshot!) */}
                            {item.images && (
                              <div className="mt-4 flex flex-wrap gap-2.5">
                                {item.images.map((imgUrl, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={imgUrl}
                                    alt={`${item.title} preview ${imgIdx + 1}`}
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Optional Avatar / Leader profile inside card */}
                            {item.avatar && (
                              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                                <img
                                  src={item.avatar.img}
                                  alt={item.avatar.name}
                                  className="h-10 w-10 rounded-full object-cover border border-blue-400"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{item.avatar.name}</p>
                                  <p className="text-[11px] text-slate-500">{item.avatar.role}</p>
                                </div>
                              </div>
                            )}

                            {/* Optional Badge Tag inside card */}
                            {item.badgeText && (
                              <div className="mt-3 inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                                {item.badgeText}
                              </div>
                            )}
                          </div>

                          {/* Date Block (Month, Day, Year - Matching Screenshot Style!) */}
                          <div className="shrink-0 flex sm:flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5 text-center min-w-[70px]">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {item.month}
                            </span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none my-0.5 sm:my-1 ml-2 sm:ml-0">
                              {item.day}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 ml-2 sm:ml-0">
                              {item.year}
                            </span>
                          </div>

                        </div>

                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

          </div>

        </div>
      </section>

    </div>
  )
}

export default AboutSection

