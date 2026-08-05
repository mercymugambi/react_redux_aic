import React from 'react'

function AboutSection() {
  const pillars = [
    {
      icon: (
        <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Glorify God",
      desc: "Faithful worship, praise, and honoring God in all our daily lives and services."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Believe Bible",
      desc: "Standing firm on the inspired, uncompromised Word of God as our foundational truth."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Love Community",
      desc: "Serving local families and neighbors with active compassion, unity, and support."
    },
    {
      icon: (
        <svg className="h-5 w-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Love People",
      desc: "Welcoming all with open hearts, extending grace and the transformative Gospel."
    }
  ]

  return (
    <section id="about" data-reveal className="relative overflow-hidden bg-[#0d0e12] py-16 sm:py-24 text-white">
      {/* Subtle Background Glow & Cross Accent */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-red-900/20 blur-[120px]" />
      <svg className="pointer-events-none absolute right-5 bottom-5 h-48 w-48 text-white/5 select-none fill-current sm:right-10 sm:bottom-10 sm:h-72 sm:w-72" viewBox="0 0 24 24">
        <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-center">
          
          {/* Left Column: Cathedral / Church Image */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=1000&q=80"
                alt="AIC Kabuku Church Sanctuary"
                className="h-[320px] w-full object-cover transition-transform duration-700 hover:scale-105 sm:h-[420px] lg:h-[480px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              
              {/* Badge Overlay */}
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/70 backdrop-blur-md p-3.5 border border-white/15 sm:bottom-6 sm:left-6 sm:p-4">
                <p className="font-serif text-base font-bold text-red-200 sm:text-lg">
                  AIC Kabuku
                </p>
                <p className="text-xs text-white/80">Est. Africa Inland Church</p>
              </div>
            </div>
          </div>

          {/* Right Column: Story & 4 Pillars */}
          <div className="lg:col-span-7">
            {/* Header */}
            <div>
              <p className="font-serif italic text-xl text-red-200 sm:text-2xl">
                About Our Story
              </p>
              <h2 className="mt-2 font-sans text-2xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome to AIC Kabuku Church
              </h2>
              <div className="mt-3 h-1 w-16 bg-[#b91c1c] rounded-full" />
            </div>

            {/* Description */}
            <p className="mt-6 text-base font-sans leading-relaxed text-white/80 sm:text-lg">
              We are a Bible-believing, Christ-centered community dedicated to worshipping God, maturing in faith, and transforming our surrounding neighborhood through gospel-centered love and hands-on service.
            </p>

            {/* Read More Link */}
            <a
              href="#about"
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold text-red-200 hover:text-red-100 hover:underline"
            >
              <span>Read Full Story</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>

            {/* 4 Pillars (2x2 Grid) */}
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-red-400/50 hover:bg-white/10 font-sans"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl text-red-300">{pillar.icon}</span>
                    <h3 className="font-sans text-lg font-bold text-white">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/70 font-sans">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default AboutSection
