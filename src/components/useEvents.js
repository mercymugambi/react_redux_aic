import { useCallback, useEffect, useState } from 'react'
import api from '../redux/api'
import { bySoonest, eventDays, eventTiming } from '../data/events'

const byMostRecent = (a, b) => (eventDays(b).end?.getTime() ?? 0) - (eventDays(a).end?.getTime() ?? 0)

// Loads the events visitors can see: published ones, and cancelled ones so people know.
//   when: 'upcoming' (on now or later, soonest first) or 'past' (most recent first)
//   status: 'idle' (not asked for yet) | 'loading' | 'ready' | 'error'
// Until the events API exists the server answers 404; that's treated as "no events yet".
export function usePublicEvents(when = 'upcoming', { enabled = true } = {}) {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle')

  const load = useCallback(() => {
    if (!enabled) return undefined
    let active = true
    setStatus('loading')
    api
      .get(`/api/v1/events?when=${when}`)
      .then((response) => {
        if (!active) return
        const past = when === 'past'
        // Checked here too, so an older API that returns every event still shows the right ones
        const rows = (Array.isArray(response.data) ? response.data : []).filter(
          (event) => event.status !== 'draft' && (eventTiming(event) === 'past') === past
        )
        setEvents(rows.sort(past ? byMostRecent : bySoonest))
        setStatus('ready')
      })
      .catch((error) => {
        if (!active) return
        setEvents([])
        setStatus(error?.response?.status === 404 ? 'ready' : 'error')
      })
    return () => {
      active = false
    }
  }, [when, enabled])

  useEffect(() => load(), [load])

  // An RSVP changes the seat counts of one event
  const updateEvent = useCallback((id, changes) => {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, ...changes } : event)))
  }, [])

  return { events, status, reload: load, updateEvent }
}

// Reserves seats at an event. Resolves to the API's response, or throws with
// `messages`: what to tell the visitor.
export async function submitRsvp(eventId, fields) {
  try {
    const response = await api.post(`/api/v1/events/${eventId}/registrations`, { registration: fields })
    return response.data || {}
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data || {}
    let messages = Array.isArray(data.errors) && data.errors.length ? data.errors : data.error ? [data.error] : []
    if (!messages.length) {
      if (status === 429) messages = ['Too many sign-ups from this connection. Please try again in a few minutes.']
      else if (status === 404) messages = ['Sign-ups aren’t open for this event yet.']
      else messages = ['We couldn’t save your RSVP. Please check your connection and try again.']
    }
    throw Object.assign(new Error(messages.join(' ')), { messages })
  }
}
