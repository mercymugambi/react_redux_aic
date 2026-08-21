import React from 'react'
import { Link } from 'react-router-dom'

function EventHighlight() {
  return (
    <section id="event" data-reveal className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-900/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-40 w-40 rounded-full bg-red-700/10 blur-3xl" />
      <div className="pointer-events-none absolute left-6 bottom-6 h-32 w-32 rounded-full bg-slate-900/5 blur-3xl" />

      <div data-reveal className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:p-10">
        <div className="absolute -right-10 -top-10 hidden h-48 w-48 rounded-full bg-red-100/70 blur-3xl sm:block" />
        <div className="absolute inset-x-6 top-6 h-1 rounded-full bg-slate-900/5" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-10">

          {/* Left: headline */}
          <div className="lg:col-span-7">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-3xl bg-red-800 text-white shadow-lg shadow-red-800/30 ring-1 ring-red-700/20">
                <span className="text-2xl font-extrabold leading-none">14</span>
                <span className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-red-200">FEB</span>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  <svg className="h-3.5 w-3.5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Next Upcoming Event
                </span>
                <h3 className="mt-2 font-sans text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                  Sharing Our Faith &amp; Love To Children
                </h3>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
              A morning set aside for the youngest members of our church family — worship, stories,
              games and a warm meal together. Parents, guardians and volunteers are all welcome.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#event"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-red-700 active:scale-95"
              >
                <span>Join Us</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <Link
                to="/events"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-slate-700 transition-all duration-200 hover:border-red-700 hover:text-red-700"
              >
                See all events
              </Link>
            </div>
          </div>

          {/* Right: details */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-200/80 lg:pl-10">
            <dl className="space-y-4 font-sans text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-red-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Speaker</dt>
                  <dd className="font-semibold text-slate-900">Pastor Christo Job</dd>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</dt>
                  <dd className="font-semibold text-slate-900">AIC Kabuku Main Hall, Kiambu</dd>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time</dt>
                  <dd className="font-semibold text-slate-900">9:00 AM &ndash; 1:00 PM</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EventHighlight
