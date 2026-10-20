// Site-wide content that admins edit on the Site settings page (/admin/settings) and the
// API serves from /api/v1/site_settings. These defaults are what the website shows until
// settings are saved, or when the API can't be reached.

export const NOTICE_STYLES = {
  blue: { label: 'Blue', bar: 'bg-blue-800 shadow-blue-900/40', button: 'text-blue-800 hover:bg-blue-50', swatch: 'bg-blue-800' },
  red: { label: 'Church red', bar: 'bg-red-800 shadow-red-900/40', button: 'text-red-800 hover:bg-red-50', swatch: 'bg-red-800' },
  dark: { label: 'Dark', bar: 'bg-slate-900 shadow-slate-900/40', button: 'text-slate-900 hover:bg-slate-100', swatch: 'bg-slate-900' },
  green: { label: 'Green', bar: 'bg-emerald-800 shadow-emerald-900/40', button: 'text-emerald-800 hover:bg-emerald-50', swatch: 'bg-emerald-800' },
}

// What the strip above the navbar shows
export const TOP_BAR_MODES = [
  { key: 'auto', label: 'Automatic', hint: 'Your notice while one is showing; the contact & social bar the rest of the time.' },
  { key: 'notice', label: 'Notice only', hint: 'Only the notice. Nothing shows when there isn’t one.' },
  { key: 'contact', label: 'Contact & social only', hint: 'Always the contact & social bar, even if a notice is switched on.' },
  { key: 'off', label: 'Nothing', hint: 'No bar above the navbar.' },
]

export const TOP_BAR_STYLES = {
  dark: { label: 'Dark', bar: 'bg-slate-950 text-slate-300', hover: 'hover:text-white', divider: 'bg-white/10', muted: 'text-slate-400', strong: 'text-white', icon: 'bg-white/5 text-slate-300 ring-white/10', chip: 'bg-white/5 ring-white/10', swatch: 'bg-slate-950' },
  light: { label: 'Light', bar: 'border-b border-slate-200 bg-white text-slate-600', hover: 'hover:text-red-700', divider: 'bg-slate-200', muted: 'text-slate-400', strong: 'text-slate-900', icon: 'bg-slate-100 text-slate-500 ring-slate-200/70', chip: 'bg-slate-50 ring-slate-200', swatch: 'bg-white ring-1 ring-slate-300' },
  red: { label: 'Church red', bar: 'bg-red-800 text-red-50/90', hover: 'hover:text-white', divider: 'bg-white/15', muted: 'text-red-200/80', strong: 'text-white', icon: 'bg-white/10 text-white/90 ring-white/15', chip: 'bg-white/10 ring-white/15', swatch: 'bg-red-800' },
}

// Pages with their own search title and description
export const SEO_PAGES = [
  { key: 'about', label: 'About Us', path: '/aboutus' },
  { key: 'events', label: 'Events', path: '/events' },
  { key: 'blog', label: 'Blog', path: '/blog' },
  { key: 'gallery', label: 'Gallery', path: '/gallery' },
  { key: 'contact', label: 'Contact', path: '/contact' },
]

export const SOCIAL_NETWORKS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/…' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/…' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/2547…' },
]

const slot = (start, end) => ({ start, end })

export const DEFAULT_SITE_SETTINGS = {
  // The contact & social bar takes its phone, email, address and links from `contact` and `social`
  top_bar: {
    mode: 'auto',
    style: 'dark',
    show_phone: true,
    show_email: true,
    show_address: true,
    show_next_service: true,
    show_social: true,
    show_login: false,
  },
  notice: {
    enabled: true,
    label: 'Notice',
    message: 'Watch sermons on YouTube for encouraging messages and worship every week.',
    link_text: 'Watch Sermons',
    link_url: 'https://youtube.com',
    style: 'blue',
    starts_on: null,
    ends_on: null,
  },
  seo: {
    site_name: 'AIC Kabuku Church',
    home_title: 'AIC Kabuku Church | Africa Inland Church in Kiambu, Kenya',
    description:
      'Africa Inland Church Kabuku is a Bible-believing church family in Kiambu County, Kenya. Join us for Sunday worship, midweek prayer, youth ministry and outreach.',
    pages: {
      about: {
        title: 'About Our Church',
        description: 'Learn the history, mission and beliefs of Africa Inland Church Kabuku — a Bible-believing, Christ-centred family serving Kiambu County, Kenya since 1985.',
      },
      events: {
        title: 'Church Events & Calendar',
        description: 'Upcoming events at AIC Kabuku: conferences, youth nights, worship services, prayer vigils and community outreach across Kiambu County.',
      },
      blog: {
        title: 'Blog',
        description: 'Reflections from our pastors, ministry updates and stories from the AIC Kabuku church family on faith, prayer, parenting, youth work and outreach.',
      },
      gallery: {
        title: 'Photo Gallery',
        description: "Photos from worship, prayer, children's ministry and outreach at AIC Kabuku: the people, praise and purpose that make our church family feel like home.",
      },
      contact: {
        title: 'Contact Us & Plan Your Visit',
        description: 'Get in touch with AIC Kabuku Church in Kiambu County, Kenya. Ask a question, request prayer, or plan your first visit to one of our Sunday services.',
      },
    },
  },
  contact: {
    address: 'Kabuku, Kiambu County, Kenya',
    phone: '',
    email: '',
    office_hours: '',
    map_url: '',
  },
  social: { facebook: '', youtube: '', instagram: '', x: '', tiktok: '', whatsapp: '' },
  // `main` services are also listed in the footer, on the Contact page and for search engines
  service_times: [
    {
      day: 'Sundays',
      tagline: 'Our main day of worship',
      note: 'Sunday School and the Teen Service run alongside the first and second services, so the whole family can worship at the same time.',
      services: [
        { name: 'First Service', slots: [slot('08:30', '10:00')], main: true, description: 'A calm start in worship and the Word.' },
        { name: 'Second Service', slots: [slot('11:00', '12:30')], main: true, description: 'Worship, teaching and family fellowship.' },
        { name: 'Sunday School (Children)', slots: [slot('08:30', '10:00'), slot('11:00', '12:30')], main: false, description: '' },
        { name: 'Teen Service', slots: [slot('08:30', '10:00'), slot('11:00', '12:30')], main: false, description: '' },
        { name: 'Youth Service', slots: [slot('13:00', '14:30')], main: false, description: '' },
        { name: 'Catechism Class', slots: [slot('09:00', '10:30')], main: false, description: '' },
      ],
    },
    {
      day: 'Wednesdays',
      tagline: 'Midweek prayer & the Word',
      note: '',
      services: [{ name: 'Midweek Service', slots: [slot('18:00', '19:00')], main: true, description: 'A midweek place to pray and grow in Scripture.' }],
    },
    {
      day: 'Fridays',
      tagline: 'For young people',
      note: '',
      services: [{ name: 'Youth Bible Study', slots: [slot('18:00', '20:00')], main: false, description: '' }],
    },
  ],
}

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

// Saved settings over the defaults: anything missing or of the wrong kind falls back, so
// an older or partial response can never break the site
export function mergeSettings(defaults, saved) {
  if (!isObject(saved)) return defaults
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const value = saved[key]
      if (isObject(fallback)) return [key, mergeSettings(fallback, value)]
      if (Array.isArray(fallback)) return [key, Array.isArray(value) ? value : fallback]
      if (value === undefined) return [key, fallback]
      if (fallback !== null && value !== null && typeof value !== typeof fallback) return [key, fallback]
      return [key, value]
    })
  )
}

const text = (value) => (typeof value === 'string' ? value : '')

// Every day, service and slot in the shape the site expects; anything else is dropped
export function normalizeServiceTimes(days) {
  if (!Array.isArray(days)) return DEFAULT_SITE_SETTINGS.service_times
  return days.filter(isObject).map((day) => ({
    day: text(day.day),
    tagline: text(day.tagline),
    note: text(day.note),
    services: (Array.isArray(day.services) ? day.services : []).filter(isObject).map((service) => ({
      name: text(service.name),
      slots: (Array.isArray(service.slots) ? service.slots : []).filter(isObject).map((slot) => ({ start: text(slot.start), end: text(slot.end) })),
      main: service.main === true,
      description: text(service.description),
    })),
  }))
}

// Settings from the API or the browser's cache, safe to render
export function readSettings(saved) {
  const settings = mergeSettings(DEFAULT_SITE_SETTINGS, saved)
  const topBar = settings.top_bar
  const defaults = DEFAULT_SITE_SETTINGS.top_bar
  return {
    ...settings,
    top_bar: {
      ...topBar,
      mode: TOP_BAR_MODES.some(({ key }) => key === topBar.mode) ? topBar.mode : defaults.mode,
      style: TOP_BAR_STYLES[topBar.style] ? topBar.style : defaults.style,
    },
    service_times: normalizeServiceTimes(settings.service_times),
  }
}

// "08:30" → "0830Hrs", the way the church writes service times
export const churchTime = (time) => (/^\d{2}:\d{2}$/.test(time || '') ? `${time.replace(':', '')}Hrs` : '')

export const formatSlot = (slot) => [churchTime(slot.start), churchTime(slot.end)].filter(Boolean).join(' – ')

// Main services as a flat list: { day, name, slots, description }
export const mainServices = (serviceTimes) =>
  serviceTimes.flatMap((day) => day.services.filter((service) => service.main).map((service) => ({ ...service, day: day.day })))

const todayIso = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Whether the notice bar shows today: switched on, with a message, inside its dates
export function noticeIsLive(notice, today = todayIso()) {
  if (!notice?.enabled || !notice.message?.trim()) return false
  if (notice.starts_on && today < notice.starts_on) return false
  if (notice.ends_on && today > notice.ends_on) return false
  return true
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// "Sundays", "Sunday", "sunday morning" → 0; anything that isn't a weekday → -1
export function weekdayOf(label) {
  const word = (label || '').trim().toLowerCase().split(/[\s,]+/)[0].replace(/s$/, '')
  return WEEKDAYS.findIndex((day) => day.toLowerCase() === word)
}

const at = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

// The service happening now, or the next one to start: main services, or every service when none is marked main.
//   { name, start: Date, end: Date, live, when: 'Today' | 'Tomorrow' | 'Sunday' … }
// null when no day is named after a weekday or no times are set.
export function nextService(serviceTimes, now = new Date()) {
  const anyMain = serviceTimes.some((day) => day.services.some((service) => service.main))
  const candidates = []
  serviceTimes.forEach((day) => {
    const weekday = weekdayOf(day.day)
    if (weekday < 0) return
    day.services
      .filter((service) => !anyMain || service.main)
      .forEach((service) =>
        service.slots.forEach((slot) => {
          if (!/^\d{2}:\d{2}$/.test(slot.start) || !/^\d{2}:\d{2}$/.test(slot.end) || slot.end <= slot.start) return
          for (let offset = 0; offset <= 7; offset += 1) {
            const date = new Date(now)
            date.setDate(now.getDate() + offset)
            if (date.getDay() !== weekday) continue
            const start = at(date, slot.start)
            const end = at(date, slot.end)
            if (end <= now) continue
            candidates.push({ name: service.name, start, end, offset })
            break
          }
        })
      )
  })
  if (!candidates.length) return null
  const next = candidates.sort((a, b) => a.start - b.start)[0]
  const when = next.offset === 0 ? 'Today' : next.offset === 1 ? 'Tomorrow' : WEEKDAYS[next.start.getDay()]
  return { name: next.name, start: next.start, end: next.end, live: next.start <= now, when }
}

// Which bar sits above the navbar: 'notice', 'contact' or null.
//   noticeLive:   the notice is switched on, has a message, is inside its dates and this visitor hasn't closed it
//   contactReady: the contact & social bar has something to show
export function topBarShows(mode, { noticeLive, contactReady }) {
  if ((mode === 'auto' || mode === 'notice') && noticeLive) return 'notice'
  if ((mode === 'auto' || mode === 'contact') && contactReady) return 'contact'
  return null
}

// Identifies one notice's text, so a visitor who closed it doesn't see it again until it changes
export const noticeKey = (notice) => `${notice.label}|${notice.message}|${notice.link_url}`
