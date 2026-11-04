// Shared by the public events pages and the admin. Events come from the API
// (/api/v1/events); the backend keeps the same category list.

export const EVENT_CATEGORIES = ['Conferences', 'Youth', 'Worship & Services', 'Outreach', 'Prayer']

// How people sign up for an event
export const REGISTRATION_MODES = [
  { value: 'none', label: 'No sign-up needed', hint: 'People just come.' },
  { value: 'rsvp', label: 'RSVP on the website', hint: 'Visitors reserve seats on the Events page; you see the list here.' },
  { value: 'external', label: 'Link to another site', hint: 'For a Google Form or a ticketing page.' },
]

// Times are the church's local time (Kenya, UTC+3, no daylight saving)
export const CHURCH_UTC_OFFSET = '+03:00'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// "2026-03-07" → a local Date, so it never shifts a day
export function parseDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '')
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : null
}

// "17:00", or a Rails time such as "2000-01-01T17:00:00.000Z" → "17:00"
export function clockTime(value) {
  const match = /(\d{1,2}):(\d{2})/.exec(value || '')
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
}

// "17:00" → "5:00 PM"
export function formatTime(value) {
  const time = clockTime(value)
  if (!time) return ''
  const hours = Number(time.slice(0, 2))
  return `${hours % 12 || 12}:${time.slice(3)} ${hours < 12 ? 'AM' : 'PM'}`
}

export function timeRange(event) {
  const start = formatTime(event.start_time)
  const end = formatTime(event.end_time)
  if (start && end) return `${start} – ${end}`
  return start
}

// The first and last day of an event
export function eventDays(event) {
  const start = parseDay(event.date)
  const end = parseDay(event.end_date)
  return { start, end: end && start && end > start ? end : start }
}

const dayLabel = (date, { weekday, year = true }) =>
  `${weekday ? `${WEEKDAYS[date.getDay()]} ` : ''}${date.getDate()} ${MONTHS[date.getMonth()]}${year ? ` ${date.getFullYear()}` : ''}`

// "Sat 7 Mar 2026", "12–16 Dec 2026", "30 Dec 2026 – 2 Jan 2027"
export function formatDateRange(event, { weekday = false } = {}) {
  const { start, end } = eventDays(event)
  if (!start) return 'Date to be confirmed'
  if (end.getTime() === start.getTime()) return dayLabel(start, { weekday })
  if (start.getFullYear() !== end.getFullYear()) return `${dayLabel(start, { weekday })} – ${dayLabel(end, { weekday })}`
  if (start.getMonth() === end.getMonth() && !weekday) return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
  return `${dayLabel(start, { weekday, year: false })} – ${dayLabel(end, { weekday })}`
}

// For the date badge on cards: { day: '12–16', month: 'DEC' }
export function dateBadge(event) {
  const { start, end } = eventDays(event)
  if (!start) return { day: '–', month: 'TBC' }
  const month = MONTHS[start.getMonth()].toUpperCase()
  if (end.getTime() === start.getTime()) return { day: String(start.getDate()), month }
  if (end.getMonth() === start.getMonth()) return { day: `${start.getDate()}–${end.getDate()}`, month }
  return { day: String(start.getDate()), month: `${month}–${MONTHS[end.getMonth()].toUpperCase()}` }
}

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// 'upcoming', 'today' (on now, including the middle of a multi-day event) or 'past'
export function eventTiming(event, today = startOfToday()) {
  const { start, end } = eventDays(event)
  if (!start) return 'upcoming'
  if (end < today) return 'past'
  if (start > today) return 'upcoming'
  return 'today'
}

// Upcoming first by date then start time; events without a time go first on their day
export const bySoonest = (a, b) =>
  (parseDay(a.date)?.getTime() ?? Infinity) - (parseDay(b.date)?.getTime() ?? Infinity) ||
  clockTime(a.start_time).localeCompare(clockTime(b.start_time))

export const eventImage = (event) => event.cover_image_url || event.image || null

// What a visitor can do about signing up: 'open', 'full', 'closed', 'external', 'none' or 'cancelled'
export function signupState(event) {
  if (event.status === 'cancelled') return 'cancelled'
  if (event.registration === 'external') return event.registration_url ? 'external' : 'none'
  if (event.registration !== 'rsvp') return 'none'
  if (event.registration_open) return 'open'
  if (event.capacity && event.seats_taken >= event.capacity) return 'full'
  return 'closed'
}

// ISO 8601 start and end, in the church's time zone, for search engines
export function isoStart(event) {
  const time = clockTime(event.start_time)
  return time ? `${event.date}T${time}:00${CHURCH_UTC_OFFSET}` : event.date
}

export function isoEnd(event) {
  const day = event.end_date || event.date
  const time = clockTime(event.end_time)
  return time ? `${day}T${time}:00${CHURCH_UTC_OFFSET}` : day
}
