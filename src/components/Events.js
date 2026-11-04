import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../redux/api'
import Seo from './Seo'
import { AuthorInitials } from './BlogParts'
import { submitRsvp, usePublicEvents } from './useEvents'
import { dateBadge, EVENT_CATEGORIES, eventImage, eventTiming, formatDateRange, isoEnd, isoStart, signupState, timeRange } from '../data/events'
import { useSiteSettings } from './SiteSettings'
import { formatSlot } from '../data/siteSettings'
import { SITE_NAME, SITE_URL } from '../seo/siteMeta'

const ALL = 'All'
const CATEGORIES = [ALL, ...EVENT_CATEGORIES]
const MAX_SEATS = 10

const matches = (event, needle) =>
  !needle || [event.title, event.location, event.speaker, event.category, event.description].join(' ').toLowerCase().includes(needle)

/* ── Pieces ── */
function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// The event's photo, or a branded panel when it has none (or it fails to load)
function EventCover({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-red-800 via-red-700 to-slate-900 ${className}`} aria-hidden="true">
        <svg className="h-10 w-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

function EventCard({ event, past, onOpen }) {
  const badge = dateBadge(event)
  const cancelled = event.status === 'cancelled'
  const time = timeRange(event)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <EventCover
          src={eventImage(event)}
          alt={event.title}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${cancelled || past ? 'grayscale-[60%]' : ''}`}
        />
        {event.category && (
          <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
            {event.category}
          </span>
        )}
        <div className="absolute right-3 top-3 flex min-w-[44px] flex-col items-center justify-center rounded-xl bg-red-700 px-3 py-1.5 text-white shadow-sm">
          <span className={`font-extrabold leading-none ${badge.day.length > 2 ? 'text-sm' : 'text-base'}`}>{badge.day}</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-red-200">{badge.month}</span>
        </div>
        {cancelled && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/85 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white">Cancelled</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className={`text-base font-bold leading-snug transition group-hover:text-red-700 ${cancelled ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
          {event.title}
        </h3>
        {event.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{event.description}</p>}

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <ClockIcon />
            <span>
              {formatDateRange(event)}
              {time && ` · ${time}`}
            </span>
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <PinIcon />
              <span className="truncate">{event.location}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            {event.speaker ? (
              <>
                <AuthorInitials name={event.speaker} className="h-7 w-7 text-[10px]" />
                <span className="truncate text-[11px] font-semibold text-slate-600">{event.speaker}</span>
              </>
            ) : (
              event.audience && <span className="truncate text-[11px] font-semibold text-slate-500">For {event.audience.toLowerCase()}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-full border border-red-700 px-3.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-700 hover:text-white"
          >
            {!past && signupState(event) === 'open' ? 'Details & RSVP' : 'Details'}
          </button>
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}

/* ── Signing up ── */
const FIELD =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-100'

function RsvpForm({ event, onConfirmed }) {
  const [fields, setFields] = useState({ name: '', phone: '', email: '', seats: '1' })
  const [errors, setErrors] = useState([])
  const [sending, setSending] = useState(false)
  const trapRef = useRef(null)

  const seatsLeft = event.capacity ? Math.max(0, event.capacity - (event.seats_taken || 0)) : null
  const maxSeats = Math.max(1, Math.min(MAX_SEATS, seatsLeft ?? MAX_SEATS))
  const set = (name) => (changeEvent) => setFields((current) => ({ ...current, [name]: changeEvent.target.value }))

  const submit = async (submitEvent) => {
    submitEvent.preventDefault()
    const problems = []
    if (!fields.name.trim()) problems.push('Please enter your name.')
    if (!fields.phone.trim() && !fields.email.trim()) problems.push('Please give a phone number or an email address, so we can reach you if plans change.')
    setErrors(problems)
    if (problems.length) return

    setSending(true)
    try {
      const data = await submitRsvp(event.id, {
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        email: fields.email.trim(),
        seats: Number(fields.seats),
        // Left empty by people; filled in by spam bots
        website: trapRef.current?.value || '',
      })
      setSending(false)
      onConfirmed({ firstName: fields.name.trim().split(/\s+/)[0], seats: Number(fields.seats) }, data.event)
    } catch (error) {
      setErrors(error.messages)
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-3">
      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="sr-only">Your full name</span>
          <input type="text" autoComplete="name" placeholder="Your full name" value={fields.name} onChange={set('name')} maxLength={100} className={FIELD} />
        </label>
        <label>
          <span className="sr-only">Phone number</span>
          <input type="tel" autoComplete="tel" placeholder="Phone number" value={fields.phone} onChange={set('phone')} maxLength={20} className={FIELD} />
        </label>
        <label>
          <span className="sr-only">Email address (optional if you gave a phone number)</span>
          <input type="email" autoComplete="email" placeholder="Email (optional)" value={fields.email} onChange={set('email')} maxLength={120} className={FIELD} />
        </label>
        <label className="sm:col-span-2">
          <span className="sr-only">How many people are coming</span>
          <select value={fields.seats} onChange={set('seats')} className={FIELD}>
            {Array.from({ length: maxSeats }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count === 1 ? 'Just me' : `${count} people`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <input ref={trapRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-lg bg-red-700 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70"
      >
        {sending ? 'Saving your place…' : 'Reserve my place'}
      </button>
      <p className="text-center text-[11px] text-slate-400">We only use your details to plan for this event.</p>
    </form>
  )
}

function SignUp({ event, past, onSaved }) {
  // Kept once an RSVP succeeds, even if it took the last seats and the event is now full
  const [confirmed, setConfirmed] = useState(null)
  const state = signupState(event)
  const seatsLeft = event.capacity ? Math.max(0, event.capacity - (event.seats_taken || 0)) : null
  let content

  const confirm = (confirmation, savedEvent) => {
    setConfirmed(confirmation)
    if (savedEvent) onSaved(savedEvent)
  }

  if (confirmed) {
    content = (
      <div role="status" className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-bold text-green-700">✓ You’re on the list, {confirmed.firstName}!</p>
        <p className="mt-1 text-xs text-green-700">
          We’ve saved {confirmed.seats === 1 ? 'a seat' : `${confirmed.seats} seats`} for you. We look forward to seeing you.
        </p>
      </div>
    )
  } else if (state === 'cancelled') {
    content = <p className="text-xs text-slate-600">This event has been cancelled. We’re sorry for any inconvenience.</p>
  } else if (past) {
    content = <p className="text-xs text-slate-600">This event has ended. See what’s coming up next on the calendar.</p>
  } else if (state === 'open') {
    content = (
      <>
        <p className="text-xs text-slate-500">
          Free registration — it helps us prepare seating and refreshments.
          {seatsLeft !== null && <span className="font-semibold text-slate-700"> {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left.</span>}
        </p>
        <RsvpForm event={event} onConfirmed={confirm} />
      </>
    )
  } else if (state === 'full') {
    content = <p className="text-xs text-slate-600">This event is full. Contact the church office if you’d like to be told when a place opens up.</p>
  } else if (state === 'closed') {
    content = <p className="text-xs text-slate-600">Sign-ups for this event have closed.</p>
  } else if (state === 'external') {
    content = (
      <>
        <p className="text-xs text-slate-500">Sign up on the registration page.</p>
        <a
          href={event.registration_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800"
        >
          Register
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </>
    )
  } else {
    content = <p className="text-xs text-slate-600">No need to sign up — just come along. Everyone is welcome.</p>
  }

  let heading = past ? 'Event ended' : { open: 'Reserve your spot', external: 'Reserve your spot', cancelled: 'Cancelled' }[state] || 'Joining us'
  if (confirmed) heading = 'See you there'
  return (
    <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-bold text-slate-900">{heading}</h4>
      <div className="mt-1">{content}</div>
    </div>
  )
}

/* ── Details ── */
function EventDialog({ event, past, onClose, onSaved }) {
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const time = timeRange(event)
  const cancelled = event.status === 'cancelled'

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const opener = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Cover */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <EventCover src={eventImage(event)} alt="" className={`h-full w-full ${cancelled ? 'grayscale' : ''}`} />
          <div className="absolute inset-0 bg-slate-900/45" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-700 transition hover:bg-white hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <span className="flex flex-wrap gap-1.5">
              {event.category && <span className="rounded-full bg-red-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{event.category}</span>}
              {cancelled && <span className="rounded-full bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">Cancelled</span>}
            </span>
            <h2 id="event-dialog-title" className="mt-1.5 text-lg font-bold leading-snug text-white sm:text-xl">
              {event.title}
            </h2>
          </div>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & time</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{formatDateRange(event, { weekday: true })}</p>
              <p className="text-[11px] text-slate-500">{time || 'Time to be confirmed'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{event.location || 'To be confirmed'}</p>
            </div>
            {(event.speaker || event.audience) && (
              <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{event.speaker ? 'Speaker' : 'Who it’s for'}</p>
                <p className="mt-1 text-xs font-bold text-slate-900">{event.speaker || event.audience}</p>
                {event.speaker && event.speaker_role && <p className="text-[11px] text-slate-500">{event.speaker_role}</p>}
              </div>
            )}
          </div>
          {event.speaker && event.audience && (
            <p className="text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-400">Who it’s for · </span>
              {event.audience}
            </p>
          )}

          {event.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700">About this gathering</h4>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600 sm:text-sm">{event.description}</p>
            </div>
          )}

          <SignUp event={event} past={past} onSaved={onSaved} />
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
function Events() {
  const [view, setView] = useState('upcoming')
  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [searchQuery, setSearchQuery] = useState('')
  const [params, setParams] = useSearchParams()
  const [linked, setLinked] = useState(null)
  const serviceTimes = useSiteSettings().service_times
  const upcoming = usePublicEvents('upcoming')
  const past = usePublicEvents('past', { enabled: view === 'past' })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const current = view === 'past' ? past : upcoming
  const needle = searchQuery.trim().toLowerCase()
  const filteredEvents = useMemo(
    () => current.events.filter((event) => (selectedCategory === ALL || event.category === selectedCategory) && matches(event, needle)),
    [current.events, selectedCategory, needle]
  )
  const filtersActive = selectedCategory !== ALL || Boolean(needle)
  const clearFilters = () => {
    setSelectedCategory(ALL)
    setSearchQuery('')
  }

  // /events?event=12 opens that event; it may be on either list, or neither (fetched on its own)
  const openId = params.get('event')
  const listed = [...upcoming.events, ...past.events].find((event) => String(event.id) === openId)
  const openEvent = listed || (linked && String(linked.id) === openId ? linked : null)

  useEffect(() => {
    if (!openId || listed || upcoming.status !== 'ready' || (linked && String(linked.id) === openId)) return undefined
    let active = true
    api
      .get(`/api/v1/events/${encodeURIComponent(openId)}`)
      .then((response) => active && response.data?.id && setLinked(response.data))
      .catch(() => active && setParams({}, { replace: true }))
    return () => {
      active = false
    }
  }, [openId, listed, upcoming.status, linked, setParams])

  const openDetails = (event) => setParams({ event: String(event.id) })
  const closeDetails = () => setParams({}, { replace: false })
  const updateCounts = (saved) => {
    const changes = { seats_taken: saved.seats_taken, seats_left: saved.seats_left, registration_open: saved.registration_open, registrations_count: saved.registrations_count }
    upcoming.updateEvent(saved.id ?? openEvent.id, changes)
    if (linked && openEvent && linked.id === openEvent.id) setLinked({ ...linked, ...changes })
  }

  const year = new Date().getFullYear()
  const visibleOnSearch = upcoming.events.filter((event) => event.status !== 'cancelled')

  let grid
  if (current.status === 'loading' || current.status === 'idle') {
    grid = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading events">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  } else if (current.status === 'error') {
    grid = (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
        <p className="text-base font-bold text-slate-500">We couldn’t load the events</p>
        <p className="mt-1 text-xs text-slate-400">Please check your connection and try again.</p>
        <button type="button" onClick={current.reload} className="mt-4 rounded-full bg-red-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800">
          Try again
        </button>
      </div>
    )
  } else if (!current.events.length) {
    grid = (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
        <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-3 text-base font-bold text-slate-500">{view === 'past' ? 'No past events yet' : 'No upcoming events right now'}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
          {view === 'past' ? 'Events appear here once they’ve taken place.' : 'New gatherings are added often. In the meantime, join us at our weekly services.'}
        </p>
        {view === 'upcoming' && (
          <ul className="mx-auto mt-5 max-w-md space-y-1.5 text-left text-xs text-slate-500">
            {serviceTimes.map(({ day, services }) => (
              <li key={day} className="flex gap-2">
                <span className="w-24 shrink-0 font-bold text-slate-700">{day}</span>
                <span>{services.slice(0, 2).map((service) => `${service.name} ${service.slots[0] ? formatSlot(service.slots[0]) : ''}`).join(' · ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  } else if (!filteredEvents.length) {
    grid = (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 py-20 text-center">
        <p className="text-base font-bold text-slate-400">No events found</p>
        <button type="button" onClick={clearFilters} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
          Show all events
        </button>
      </div>
    )
  } else {
    grid = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} past={view === 'past'} onOpen={() => openDetails(event)} />
        ))}
      </div>
    )
  }

  return (
    <div className="page-offset min-h-screen bg-white font-sans text-slate-900 antialiased">
      <Seo
        page="events"
        title={`Church Events & Calendar ${year}`}
        path="/events"
        description="Upcoming events at AIC Kabuku: conferences, youth nights, worship services, prayer vigils and community outreach across Kiambu County."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'AIC Kabuku Church Events',
          itemListElement: visibleOnSearch.map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Event',
              name: event.title,
              description: event.description,
              image: eventImage(event) || undefined,
              startDate: isoStart(event),
              endDate: isoEnd(event),
              url: `${SITE_URL}/events?event=${event.id}`,
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: event.location || SITE_NAME,
                address: { '@type': 'PostalAddress', addressRegion: 'Kiambu County', addressCountry: 'KE' },
              },
              organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
              performer: event.speaker ? { '@type': 'Person', name: event.speaker } : undefined,
            },
          })),
        }}
      />

      {/* ── HERO BANNER ── */}
      <section className="border-b border-slate-200 bg-slate-50 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav className="mb-4 flex justify-center text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="transition hover:text-red-700">
              Home
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-red-700">Events</span>
          </nav>

          <span className="mb-4 inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-700">
            Church Calendar {year}
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Upcoming Church Events</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Join us for inspiring worship services, revival nights, youth gatherings, and community outreach events throughout the year.
          </p>
        </div>
      </section>

      {/* ── FILTERS & SEARCH ── */}
      <section className="sticky sticky-below-nav z-30 border-b border-slate-200 bg-white py-4 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:w-auto lg:pb-0">
              <div className="mr-1 flex shrink-0 rounded-full border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Show">
                {[
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past', label: 'Past' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    aria-pressed={view === key}
                    className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${view === key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    selectedCategory === category ? 'border-red-700 bg-red-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative w-full shrink-0 lg:w-64">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                aria-label="Search events"
                placeholder="Search events or speakers..."
                value={searchQuery}
                onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── EVENT GRID ── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {current.status === 'ready' && current.events.length > 0 && (
            <div className="mb-8 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Showing <span className="font-bold text-red-700">{filteredEvents.length}</span> {view === 'past' ? 'past ' : ''}event{filteredEvents.length !== 1 ? 's' : ''}
                {selectedCategory !== ALL && (
                  <span className="text-slate-400">
                    {' '}
                    in <em className="not-italic text-slate-700">{selectedCategory}</em>
                  </span>
                )}
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-red-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
          {grid}
        </div>
      </section>

      {openEvent && (
        <EventDialog key={openEvent.id} event={openEvent} past={eventTiming(openEvent) === 'past'} onClose={closeDetails} onSaved={updateCounts} />
      )}
    </div>
  )
}

export default Events
