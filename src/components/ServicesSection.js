import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from './SiteSettings'
import { formatSlot } from '../data/siteSettings'

// Background footage: "Vibrant church service with devoted congregation" by Enoch Samuel,
// Pexels (free to use, no attribution required). Served from /public so it is cached
// separately from the JS bundle.
const VIDEO_SRC = '/assets/videos/congregation-worship.mp4'
const POSTER_SRC = '/assets/congregation-worship.jpg'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Cards switch from stacked (name above times) to side-by-side rows once they are wide
// enough. The wide Sunday card gets there at `sm`; the narrower weekday cards only at `lg`.
const ROW_LAYOUT = {
  sm: {
    header: 'sm:flex-row sm:items-center sm:justify-between sm:gap-3',
    row: 'sm:flex-row sm:items-start sm:justify-between sm:gap-6',
  },
  lg: {
    header: 'lg:flex-row lg:items-center lg:justify-between lg:gap-3',
    row: 'lg:flex-row lg:items-start lg:justify-between lg:gap-6',
  },
}

function ServiceList({ services, rowClassName }) {
  return (
    <dl className="divide-y divide-slate-100">
      {services.map((service) => (
        <div key={service.name} className={`flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0 ${rowClassName}`}>
          <dt className="text-[15px] italic text-slate-500">{service.name}</dt>
          <div className="space-y-1.5">
            {service.slots.map((slot, index) => (
              <dd key={index} className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold tabular-nums text-slate-900">
                <ClockIcon />
                {formatSlot(slot)}
              </dd>
            ))}
          </div>
        </div>
      ))}
    </dl>
  )
}

function DayCard({ day, tagline, services, note, rowsFrom = 'sm', delay = 0 }) {
  const layout = ROW_LAYOUT[rowsFrom]

  return (
    <article
      data-reveal
      style={{ transitionDelay: `${delay}ms` }}
      className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/70 sm:p-8"
    >
      <div className={`flex flex-col items-start gap-2 ${layout.header}`}>
        <h3 className="rounded-md bg-red-700 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-sm shadow-red-700/30">
          {day}
        </h3>
        <p className="text-xs font-medium text-slate-400">{tagline}</p>
      </div>

      <div className="my-6 h-px bg-slate-200" />

      <ServiceList services={services} rowClassName={layout.row} />

      {/* mt-auto pins the note to the bottom when the card is stretched to its row's height */}
      {note && (
        <div className="mt-auto pt-7">
          <p className="flex items-start gap-3 rounded-2xl bg-red-50/70 p-4 text-sm leading-6 text-slate-600 ring-1 ring-red-100">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {note}
          </p>
        </div>
      )}
    </article>
  )
}

function ServicesSection() {
  const [showVideo] = useState(() => !prefersReducedMotion())
  // The first day (Sundays) gets the wide card; the others share the row beside it
  const [sunday, ...weekdays] = useSiteSettings().service_times

  return (
    <section id="services" aria-labelledby="services-heading" className="relative isolate mt-8 overflow-hidden py-14 sm:mt-12 sm:py-20">
      {/* Background: muted looping congregation footage (a still image when motion is reduced) */}
      {showVideo ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <img src={POSTER_SRC} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      )}
      {/* Light wash: ~18% of the footage shows through, fading to white at the edges so the
          section blends into the page. Raise the 0.82 values to calm the video, lower them to strengthen it. */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,rgba(255,255,255,0.82)_14%,rgba(255,247,247,0.82)_86%,#ffffff_100%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-red-700 sm:text-sm">
            <span className="h-px w-8 bg-red-300" />
            Worship With Us
            <span className="h-px w-8 bg-red-300" />
          </p>
          <h2 id="services-heading" className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Our Services
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Join us as we come together in worship, sharing in fellowship and spiritual growth, and uplifting
            one another through prayer, song, preaching, and other elements of worship. We look forward to
            welcoming you to our services.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            {sunday && <DayCard {...sunday} />}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-8">
            {weekdays.map((entry, index) => (
              <DayCard key={entry.day} {...entry} rowsFrom="lg" delay={(index + 1) * 90} />
            ))}

            {/* Visitor call to action fills the column beside the longer Sunday list */}
            <div
              data-reveal
              style={{ transitionDelay: `${(weekdays.length + 1) * 90}ms` }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/20 sm:col-span-2 sm:p-8 lg:col-span-1"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-700/40 blur-3xl" aria-hidden="true" />
              <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-red-300">First time with us?</p>
              <p className="relative mt-3 text-lg font-semibold leading-snug">
                Come as you are — someone will be at the door to welcome you and help you find a seat.
              </p>
              <div className="relative mt-6 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-600"
                >
                  Book appointment
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center rounded-full border border-white/25 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/90 transition hover:border-white hover:text-white"
                >
                  Upcoming events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
