import { clockTime, dateBadge, eventTiming, formatDateRange, formatTime, isoEnd, isoStart, signupState, timeRange } from './events'

test('times read as a 12-hour clock, from "HH:MM" or a Rails time', () => {
  expect(clockTime('2000-01-01T09:05:00.000Z')).toBe('09:05')
  expect(formatTime('17:30')).toBe('5:30 PM')
  expect(formatTime('00:15')).toBe('12:15 AM')
  expect(formatTime('')).toBe('')
  expect(timeRange({ start_time: '09:00', end_time: '16:00' })).toBe('9:00 AM – 4:00 PM')
  expect(timeRange({ start_time: '09:00' })).toBe('9:00 AM')
  expect(timeRange({})).toBe('')
})

test('dates read naturally, over one day or several', () => {
  expect(formatDateRange({ date: '2026-03-07' })).toBe('7 Mar 2026')
  expect(formatDateRange({ date: '2026-03-07' }, { weekday: true })).toBe('Sat 7 Mar 2026')
  expect(formatDateRange({ date: '2026-12-12', end_date: '2026-12-16' })).toBe('12–16 Dec 2026')
  expect(formatDateRange({ date: '2026-11-28', end_date: '2026-12-02' })).toBe('28 Nov – 2 Dec 2026')
  expect(formatDateRange({ date: '2026-12-30', end_date: '2027-01-02' })).toBe('30 Dec 2026 – 2 Jan 2027')
  expect(formatDateRange({ date: '2026-03-07', end_date: '2026-03-07' })).toBe('7 Mar 2026')
  expect(formatDateRange({})).toBe('Date to be confirmed')
})

test('the date badge shows a range for events over several days', () => {
  expect(dateBadge({ date: '2026-03-07' })).toEqual({ day: '7', month: 'MAR' })
  expect(dateBadge({ date: '2026-12-12', end_date: '2026-12-16' })).toEqual({ day: '12–16', month: 'DEC' })
  expect(dateBadge({ date: '2026-11-28', end_date: '2026-12-02' })).toEqual({ day: '28', month: 'NOV–DEC' })
})

test('an event is past only after its last day', () => {
  const today = new Date(2026, 9, 8)
  expect(eventTiming({ date: '2026-10-08' }, today)).toBe('today')
  expect(eventTiming({ date: '2026-10-06', end_date: '2026-10-09' }, today)).toBe('today')
  expect(eventTiming({ date: '2026-10-07' }, today)).toBe('past')
  expect(eventTiming({ date: '2026-10-09' }, today)).toBe('upcoming')
})

test('sign-up state follows the event’s settings', () => {
  expect(signupState({ status: 'cancelled', registration: 'rsvp', registration_open: true })).toBe('cancelled')
  expect(signupState({ registration: 'external', registration_url: 'https://forms.gle/x' })).toBe('external')
  expect(signupState({ registration: 'external' })).toBe('none')
  expect(signupState({ registration: 'rsvp', registration_open: true })).toBe('open')
  expect(signupState({ registration: 'rsvp', registration_open: false, capacity: 10, seats_taken: 10 })).toBe('full')
  expect(signupState({ registration: 'rsvp', registration_open: false, capacity: 10, seats_taken: 4 })).toBe('closed')
  expect(signupState({ registration: 'none' })).toBe('none')
  expect(signupState({})).toBe('none')
})

test('search engines get start and end in Kenya time', () => {
  const vigil = { date: '2026-04-03', start_time: '21:00', end_date: '2026-04-04', end_time: '05:00' }
  expect(isoStart(vigil)).toBe('2026-04-03T21:00:00+03:00')
  expect(isoEnd(vigil)).toBe('2026-04-04T05:00:00+03:00')
  expect(isoStart({ date: '2026-04-12' })).toBe('2026-04-12')
  expect(isoEnd({ date: '2026-04-12' })).toBe('2026-04-12')
})
