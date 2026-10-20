import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFAULT_SITE_SETTINGS, nextService, readSettings, topBarShows, weekdayOf } from '../data/siteSettings'
import ContactBar, { contactBarHasContent, contactBarItems } from './ContactBar'

const settingsWith = (overrides = {}) =>
  readSettings({
    ...DEFAULT_SITE_SETTINGS,
    contact: { ...DEFAULT_SITE_SETTINGS.contact, phone: '+254 712 345 678', email: 'office@aickabuku.org', map_url: 'https://maps.app.goo.gl/abc' },
    social: { ...DEFAULT_SITE_SETTINGS.social, facebook: 'https://facebook.com/aickabuku', youtube: 'https://youtube.com/@aickabuku' },
    ...overrides,
  })

// Local times, so the tests read the same in any time zone. 18 October 2026 is a Sunday.
const on = (y, m, d, h, min) => new Date(y, m - 1, d, h, min)
const SUNDAY_7AM = on(2026, 10, 18, 7, 0)

describe('nextService', () => {
  const times = DEFAULT_SITE_SETTINGS.service_times

  test('reads weekdays from day names', () => {
    expect(weekdayOf('Sundays')).toBe(0)
    expect(weekdayOf('wednesday evenings')).toBe(3)
    expect(weekdayOf('Holidays')).toBe(-1)
  })

  test('finds the next main service today, and marks it live while it runs', () => {
    expect(nextService(times, SUNDAY_7AM)).toMatchObject({ name: 'First Service', when: 'Today', live: false })
    expect(nextService(times, on(2026, 10, 18, 9, 0))).toMatchObject({ name: 'First Service', live: true })
    expect(nextService(times, on(2026, 10, 18, 10, 30))).toMatchObject({ name: 'Second Service', live: false })
  })

  test('moves on to the next day with a main service', () => {
    // After Sunday's services comes Wednesday's midweek service (Friday's study isn't a main service)
    expect(nextService(times, on(2026, 10, 18, 13, 0))).toMatchObject({ name: 'Midweek Service', when: 'Wednesday' })
    expect(nextService(times, on(2026, 10, 20, 12, 0))).toMatchObject({ when: 'Tomorrow' })
    // After Wednesday, back round to Sunday
    expect(nextService(times, on(2026, 10, 22, 20, 0))).toMatchObject({ name: 'First Service', when: 'Sunday' })
  })

  test('is null without days named after weekdays', () => {
    const special = [{ day: 'Special', tagline: '', note: '', services: [{ name: 'Carols', slots: [{ start: '18:00', end: '20:00' }], main: true, description: '' }] }]
    expect(nextService(special, SUNDAY_7AM)).toBeNull()
  })
})

test('topBarShows picks the notice first in automatic mode, then the contact bar', () => {
  expect(topBarShows('auto', { noticeLive: true, contactReady: true })).toBe('notice')
  expect(topBarShows('auto', { noticeLive: false, contactReady: true })).toBe('contact')
  expect(topBarShows('notice', { noticeLive: false, contactReady: true })).toBeNull()
  expect(topBarShows('contact', { noticeLive: true, contactReady: true })).toBe('contact')
  expect(topBarShows('off', { noticeLive: true, contactReady: true })).toBeNull()
  expect(topBarShows('auto', { noticeLive: false, contactReady: false })).toBeNull()
})

test('shows the next service, contact details and social links', () => {
  jest.useFakeTimers().setSystemTime(SUNDAY_7AM)
  render(
    <MemoryRouter>
      <ContactBar settings={settingsWith()} preview />
    </MemoryRouter>
  )
  jest.useRealTimers()

  expect(screen.getByRole('link', { name: /Next service/ })).toHaveAttribute('href', '/#services')
  expect(screen.getByText(/0830Hrs/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '+254 712 345 678' })).toHaveAttribute('href', 'tel:+254712345678')
  expect(screen.getByRole('link', { name: 'office@aickabuku.org' })).toHaveAttribute('href', 'mailto:office@aickabuku.org')
  expect(screen.getByRole('link', { name: /Kabuku, Kiambu County/ })).toHaveAttribute('href', 'https://maps.app.goo.gl/abc')
  expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://facebook.com/aickabuku')
  expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Staff login/ })).not.toBeInTheDocument()
})

test('offers Book appointment when there are no social links, and respects the switches', () => {
  const settings = settingsWith({
    social: DEFAULT_SITE_SETTINGS.social,
    top_bar: { ...DEFAULT_SITE_SETTINGS.top_bar, show_phone: false, show_email: false },
  })
  render(
    <MemoryRouter>
      <ContactBar settings={settings} preview />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: /Book appointment/ })).toHaveAttribute('href', '/contact')
  expect(screen.queryByRole('link', { name: 'office@aickabuku.org' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Call/ })).not.toBeInTheDocument()
})

test('has nothing to show when every item is switched off', () => {
  const allOff = Object.fromEntries(Object.keys(DEFAULT_SITE_SETTINGS.top_bar).map((key) => [key, false]))
  const settings = settingsWith({ top_bar: { ...allOff, mode: 'auto', style: 'dark' } })
  expect(contactBarHasContent(contactBarItems(settings))).toBe(false)
  expect(contactBarHasContent(contactBarItems(settingsWith()))).toBe(true)
})
