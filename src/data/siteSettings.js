// Site-wide content that admins edit on the Site settings page (/admin/settings) and the
// API serves from /api/v1/site_settings. These defaults are what the website shows until
// settings are saved, or when the API can't be reached.

export const NOTICE_STYLES = {
  blue: { label: 'Blue', bar: 'bg-blue-800 shadow-blue-900/40', button: 'text-blue-800 hover:bg-blue-50', swatch: 'bg-blue-800' },
  red: { label: 'Church red', bar: 'bg-red-800 shadow-red-900/40', button: 'text-red-800 hover:bg-red-50', swatch: 'bg-red-800' },
  dark: { label: 'Dark', bar: 'bg-slate-900 shadow-slate-900/40', button: 'text-slate-900 hover:bg-slate-100', swatch: 'bg-slate-900' },
  green: { label: 'Green', bar: 'bg-emerald-800 shadow-emerald-900/40', button: 'text-emerald-800 hover:bg-emerald-50', swatch: 'bg-emerald-800' },
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
  return { ...settings, service_times: normalizeServiceTimes(settings.service_times) }
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

// Identifies one notice's text, so a visitor who closed it doesn't see it again until it changes
export const noticeKey = (notice) => `${notice.label}|${notice.message}|${notice.link_url}`
