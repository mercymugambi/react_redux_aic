import React from 'react'

function ScriptureBanner() {
  return (
    <section
      data-reveal
      className="relative overflow-hidden py-20 sm:py-28 font-sans"
      style={{ backgroundColor: '#0d0e12' }}
    >
      {/* Decorative cross watermark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 select-none fill-white/[0.03] sm:h-[600px] sm:w-[600px]"
        viewBox="0 0 24 24"
      >
        <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
      </svg>

      {/* Soft left glow */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-red-900/25 blur-[100px]" />
      {/* Soft right glow */}
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-yellow-800/20 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">

        {/* Opening quotation mark */}
        <svg
          className="mx-auto mb-4 h-10 w-10 text-red-300/40 sm:h-12 sm:w-12"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.498 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364z" />
        </svg>

        {/* Scripture verse */}
        <blockquote
          className="font-serif text-2xl font-bold italic leading-snug text-white sm:text-3xl lg:text-4xl"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}
        >
          For I know the plans I have for you, declares the&nbsp;Lord, plans to prosper you and not to harm you, plans to give you hope and a future.
        </blockquote>

        {/* Gold divider */}
        <div className="mx-auto mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-300/60" />
          <svg className="h-4 w-4 text-red-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
          </svg>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-300/60" />
        </div>

        {/* Bible reference */}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-red-300">
          Jeremiah 29:11&nbsp;&nbsp;·&nbsp;&nbsp;NIV
        </p>

        {/* Sub-copy */}
        <p className="mt-6 text-sm leading-relaxed text-white/50 sm:text-base">
          This is the foundation on which AIC Kabuku stands — a church built on God's promises and His unending faithfulness.
        </p>
      </div>
    </section>
  )
}

export default ScriptureBanner
