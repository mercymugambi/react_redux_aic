import { DEFAULT_SITE_SETTINGS, formatSlot, mainServices, mergeSettings, noticeIsLive, noticeKey, readSettings } from './siteSettings'

describe('readSettings', () => {
  it('falls back to the defaults without saved settings', () => {
    expect(readSettings(null)).toEqual(DEFAULT_SITE_SETTINGS)
    expect(readSettings('oops')).toEqual(DEFAULT_SITE_SETTINGS)
  })

  it('keeps saved values and fills in what is missing', () => {
    const settings = readSettings({ notice: { message: 'Easter service at 8:30' }, seo: { pages: { blog: { title: 'Stories' } } } })
    expect(settings.notice.message).toBe('Easter service at 8:30')
    expect(settings.notice.label).toBe(DEFAULT_SITE_SETTINGS.notice.label)
    expect(settings.seo.pages.blog).toEqual({ title: 'Stories', description: DEFAULT_SITE_SETTINGS.seo.pages.blog.description })
    expect(settings.seo.pages.about).toEqual(DEFAULT_SITE_SETTINGS.seo.pages.about)
  })

  it('ignores values of the wrong kind', () => {
    const settings = readSettings({ notice: { enabled: 'yes', message: 42, starts_on: '2026-12-01' }, contact: 'nope' })
    expect(settings.notice.enabled).toBe(true)
    expect(settings.notice.message).toBe(DEFAULT_SITE_SETTINGS.notice.message)
    expect(settings.notice.starts_on).toBe('2026-12-01')
    expect(settings.contact).toEqual(DEFAULT_SITE_SETTINGS.contact)
  })

  it('repairs broken service times instead of letting them crash the site', () => {
    const settings = readSettings({
      service_times: [{ day: 'Sundays', services: [{ name: 'Worship', main: 'true' }, null] }, 'junk'],
    })
    expect(settings.service_times).toEqual([
      { day: 'Sundays', tagline: '', note: '', services: [{ name: 'Worship', slots: [], main: false, description: '' }] },
    ])
  })
})

it('mergeSettings keeps a saved null date', () => {
  expect(mergeSettings({ ends_on: '2026-01-01' }, { ends_on: null })).toEqual({ ends_on: null })
})

it('formats times the way the church writes them', () => {
  expect(formatSlot({ start: '08:30', end: '10:00' })).toBe('0830Hrs – 1000Hrs')
  expect(formatSlot({ start: '18:00', end: '' })).toBe('1800Hrs')
})

it('lists main services with their day', () => {
  const list = mainServices([
    { day: 'Sundays', services: [{ name: 'First Service', main: true, slots: [] }, { name: 'Sunday School', main: false, slots: [] }] },
    { day: 'Wednesdays', services: [{ name: 'Midweek Service', main: true, slots: [] }] },
  ])
  expect(list.map((service) => `${service.day}: ${service.name}`)).toEqual(['Sundays: First Service', 'Wednesdays: Midweek Service'])
})

describe('noticeIsLive', () => {
  const notice = { enabled: true, message: 'Hello', starts_on: null, ends_on: null }

  it('needs to be switched on and have a message', () => {
    expect(noticeIsLive(notice, '2026-10-09')).toBe(true)
    expect(noticeIsLive({ ...notice, enabled: false }, '2026-10-09')).toBe(false)
    expect(noticeIsLive({ ...notice, message: '   ' }, '2026-10-09')).toBe(false)
  })

  it('only shows between its dates, both days included', () => {
    const dated = { ...notice, starts_on: '2026-10-10', ends_on: '2026-10-12' }
    expect(noticeIsLive(dated, '2026-10-09')).toBe(false)
    expect(noticeIsLive(dated, '2026-10-10')).toBe(true)
    expect(noticeIsLive(dated, '2026-10-12')).toBe(true)
    expect(noticeIsLive(dated, '2026-10-13')).toBe(false)
  })
})

it('gives a changed notice a new key, so visitors who closed the old one see it', () => {
  const notice = { label: 'Notice', message: 'Hello', link_url: '/events', style: 'blue' }
  expect(noticeKey({ ...notice, style: 'red' })).toBe(noticeKey(notice))
  expect(noticeKey({ ...notice, message: 'Hello again' })).not.toBe(noticeKey(notice))
})
