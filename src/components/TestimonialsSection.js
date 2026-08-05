import React, { useState } from 'react'

const testimonials = [
  {
    id: 1,
    name: 'Grace Wanjiru',
    role: 'Member since 2018',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80',
    quote:
      "AIC Kabuku completely transformed my faith journey. The community here is so genuine — people who actually show up for each other in prayer and in life. I found my purpose through the Women's Fellowship.",
  },
  {
    id: 2,
    name: 'David Kamau',
    role: 'Member since 2015',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    quote:
      "I came broken and searching. The Men's Ministry gave me brothers who held me accountable and helped me rebuild my family. This church doesn't just preach — it walks with you through the valleys.",
  },
  {
    id: 3,
    name: 'Faith Muthoni',
    role: 'Member since 2021',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    quote:
      "The worship here is unlike anything I've ever experienced. When the choir sings, you feel the presence of God so tangibly. AIC Kabuku is not just a church \u2014 it's home.",
  },
]

function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const t = testimonials[active]

  return (
    <section id="testimonials" data-reveal className="bg-white py-16 sm:py-24 font-sans overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center">
          <p className="font-serif italic text-lg text-[#b91c1c] sm:text-xl">
            Stories of Faith
          </p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            What Our Members Say
          </h2>
          <div className="mt-3 mx-auto h-1 w-16 rounded-full bg-[#b91c1c]" />
        </div>

        {/* Testimonial Display */}
        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-center">

          {/* Left: Avatars selector */}
          <div className="flex flex-row justify-center gap-4 lg:col-span-4 lg:flex-col lg:items-start lg:gap-5">
            {testimonials.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActive(idx)}
                className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 w-full
                  ${active === idx
                    ? 'border-[#b91c1c] bg-red-50 shadow-md'
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                <img
                  src={item.photo}
                  alt={item.name}
                  className={`h-12 w-12 shrink-0 rounded-xl object-cover transition-all duration-200 sm:h-14 sm:w-14
                    ${active === idx ? 'ring-2 ring-[#b91c1c] ring-offset-2' : ''}`}
                />
                <div className="hidden sm:block">
                  <p className={`text-sm font-bold ${active === idx ? 'text-[#b91c1c]' : 'text-slate-800'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">{item.role}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Quote display */}
          <div className="relative lg:col-span-8">

            {/* Large background quote mark */}
            <svg
              aria-hidden="true"
              className="absolute -top-4 -left-2 h-20 w-20 select-none text-red-100 sm:-top-6 sm:-left-4 sm:h-28 sm:w-28"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.498 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364z" />
            </svg>

            <div
              key={active}
              className="relative rounded-3xl border border-slate-100 bg-[#f8f7f4] p-8 shadow-sm sm:p-10"
              style={{ animation: 'fadeSlideIn 0.35s ease' }}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-[#b91c1c]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
              </div>

              {/* Quote text */}
              <p className="mt-5 text-base leading-[1.85] text-slate-600 sm:text-lg sm:leading-[1.9]">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="h-14 w-14 rounded-xl object-cover ring-2 ring-[#b91c1c]/20"
                />
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                {/* AIC badge */}
                <div className="ml-auto hidden items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1.5 sm:flex">
                  <svg className="h-3.5 w-3.5 text-[#b91c1c]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#b91c1c]">AIC Kabuku</span>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="mt-6 flex justify-center gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active === idx ? 'w-6 bg-[#b91c1c]' : 'w-2 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inline animation style */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

export default TestimonialsSection
