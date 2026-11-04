import React from 'react'
import { Link } from 'react-router-dom'
import { usePublicEvents } from './useEvents'
import { dateBadge, formatDateRange, signupState, timeRange } from '../data/events'
import { useSiteSettings } from './SiteSettings'
import { formatSlot } from '../data/siteSettings'

// The featured event while it's still coming up, otherwise the soonest one
function pickEvent(events) {
  const live = events.filter((event) => event.status !== 'cancelled')
  return live.find((event) => event.featured) || live[0] || null
}

function Detail({ label, tone = 'text-red-600', icon, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 ${tone}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
        <dd className="font-semibold text-slate-900">{children}</dd>
      </div>
    </div>
  )
}

const ICONS = {
  person: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  pin: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
}

const PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-red-700 active:scale-95'
const SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-slate-700 transition-all duration-200 hover:border-red-700 hover:text-red-700'

function Arrow() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

function Content({ tile, label, title, text, actions, details }) {
  return (
    <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        <div className="flex items-start gap-4">
          <div className="flex h-16 min-w-[4rem] shrink-0 flex-col items-center justify-center rounded-3xl bg-red-800 px-2 text-white shadow-lg shadow-red-800/30 ring-1 ring-red-700/20">
            <span className={`font-extrabold leading-none ${tile.day.length > 2 ? 'text-lg' : 'text-2xl'}`}>{tile.day}</span>
            <span className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-red-200">{tile.month}</span>
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              <svg className="h-3.5 w-3.5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS.calendar}
              </svg>
              {label}
            </span>
            <h3 className="mt-2 font-sans text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">{title}</h3>
          </div>
        </div>
        {text && <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-7 text-slate-600">{text}</p>}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div>
      </div>
      <div className="lg:col-span-5 lg:border-l lg:border-slate-200/80 lg:pl-10">
        <dl className="space-y-4 font-sans text-sm text-slate-600">{details}</dl>
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="relative grid gap-8 lg:grid-cols-12 lg:gap-10" aria-hidden="true">
      <div className="space-y-4 lg:col-span-7">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-3xl bg-slate-100" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-7 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="space-y-4 lg:col-span-5 lg:border-l lg:border-slate-200/80 lg:pl-10">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-9 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

function EventHighlight() {
  const { events, status } = usePublicEvents('upcoming')
  const serviceTimes = useSiteSettings().service_times
  const event = pickEvent(events)
  let body

  if (status === 'loading') {
    body = <Placeholder />
  } else if (event) {
    const detailsPath = `/events?event=${event.id}`
    const time = timeRange(event)
    body = (
      <Content
        tile={dateBadge(event)}
        label={event.featured ? 'Featured event' : 'Next upcoming event'}
        title={event.title}
        text={event.description}
        actions={
          <>
            <Link to={detailsPath} className={PRIMARY}>
              <span>{signupState(event) === 'open' ? 'Reserve a place' : 'Event details'}</span>
              <Arrow />
            </Link>
            <Link to="/events" className={SECONDARY}>
              See all events
            </Link>
          </>
        }
        details={
          <>
            {event.speaker && (
              <Detail label="Speaker" tone="text-red-700" icon={ICONS.person}>
                {event.speaker}
              </Detail>
            )}
            {event.location && (
              <Detail label="Location" icon={ICONS.pin}>
                {event.location}
              </Detail>
            )}
            <Detail label={time ? 'Date & time' : 'Date'} icon={ICONS.clock}>
              {formatDateRange(event, { weekday: true })}
              {time && <span className="block text-xs font-medium text-slate-500">{time}</span>}
            </Detail>
          </>
        }
      />
    )
  } else {
    // Nothing on the calendar: invite people to the weekly services instead
    const sunday = serviceTimes[0] || { day: 'Sundays', note: '', services: [] }
    body = (
      <Content
        tile={{ day: 'SUN', month: 'Weekly' }}
        label="Join us this week"
        title="Worship with us this Sunday"
        text={sunday.note}
        actions={
          <>
            <Link to="/contact" className={PRIMARY}>
              <span>Plan your visit</span>
              <Arrow />
            </Link>
            <Link to="/events" className={SECONDARY}>
              See all events
            </Link>
          </>
        }
        details={sunday.services.slice(0, 3).map((service) => (
          <Detail key={service.name} label={service.name} icon={ICONS.clock}>
            {service.slots.map(formatSlot).join(' & ')}
          </Detail>
        ))}
      />
    )
  }

  return (
    <section id="event" data-reveal className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-900/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-16 h-40 w-40 rounded-full bg-red-700/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-32 w-32 rounded-full bg-slate-900/5 blur-3xl" />

      <div
        data-reveal
        aria-busy={status === 'loading' || undefined}
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:p-10"
      >
        <div className="absolute -right-10 -top-10 hidden h-48 w-48 rounded-full bg-red-100/70 blur-3xl sm:block" />
        {body}
      </div>
    </section>
  )
}

export default EventHighlight
