import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { churchTime, nextService, SOCIAL_NETWORKS, TOP_BAR_STYLES } from '../data/siteSettings'
import { SOCIAL_ICONS, SocialIcon } from './SocialIcons'

export const CONTACT_BAR_HEIGHT = 40

const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`

function LineIcon({ d, className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const ICONS = {
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
}

// Re-renders every minute so "Next service" and "Live now" stay right while the page is open
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

// A Date's time the way the church writes it: 0830Hrs
const startsAt = (date) => churchTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)

function NextServiceChip({ service, style }) {
  const short = service.when === 'Today' || service.when === 'Tomorrow' ? service.when : service.when.slice(0, 3)
  return (
    <a
      href="/#services"
      className={`flex min-w-0 shrink-0 items-center gap-2 rounded-full px-2.5 py-1 ring-1 transition hover:opacity-90 ${style.chip}`}
      title={service.live ? `${service.name} is on now` : `${service.name}, ${service.when} ${startsAt(service.start)}`}
    >
      {service.live ? (
        <>
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className={`font-bold uppercase tracking-wider ${style.strong}`}>Live now</span>
          <span className="hidden truncate sm:inline">{service.name}</span>
        </>
      ) : (
        <>
          <LineIcon d={ICONS.clock} />
          <span className={`hidden font-semibold uppercase tracking-wider sm:inline ${style.muted}`}>Next service</span>
          <span className={`font-semibold tabular-nums ${style.strong}`}>
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{service.when}</span> {startsAt(service.start)}
          </span>
        </>
      )}
    </a>
  )
}

// What the contact & social bar would show; it isn't drawn when this is all empty
export function contactBarItems({ top_bar: options, contact, social, service_times: serviceTimes }, now = new Date()) {
  return {
    service: options.show_next_service ? nextService(serviceTimes, now) : null,
    phone: options.show_phone ? contact.phone.trim() : '',
    email: options.show_email ? contact.email.trim() : '',
    address: options.show_address ? contact.address.trim() : '',
    mapUrl: contact.map_url.trim(),
    networks: options.show_social ? SOCIAL_NETWORKS.filter(({ key }) => social[key]?.trim()) : [],
    login: options.show_login,
  }
}

export const contactBarHasContent = (items) => Boolean(items.service || items.phone || items.email || items.address || items.networks.length || items.login)

// The strip above the navbar with service time, contact details and social links. `preview` draws it in
// place for the admin's live preview instead of fixed to the top of the window.
function ContactBar({ settings, shown = true, preview = false }) {
  const now = useMinuteClock()
  const style = TOP_BAR_STYLES[settings.top_bar.style] || TOP_BAR_STYLES.dark
  const items = contactBarItems(settings, now)
  const position = preview ? 'relative rounded-lg' : `fixed inset-x-0 top-0 z-60 transition-transform duration-500 ${shown ? 'translate-y-0' : '-translate-y-full'}`
  const detail = `flex min-w-0 items-center gap-1.5 transition ${style.hover}`
  const divider = <span className={`hidden h-4 w-px shrink-0 sm:block ${style.divider}`} aria-hidden="true" />

  return (
    <div role={preview ? undefined : 'region'} aria-label={preview ? undefined : 'Contact and social links'} className={`${position} ${style.bar} text-xs`} style={{ height: CONTACT_BAR_HEIGHT }}>
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: when to come, and how to reach the church */}
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          {items.service && <NextServiceChip service={items.service} style={style} />}
          {items.service && (items.phone || items.email || items.address) && divider}
          {items.phone && (
            <a href={telHref(items.phone)} className={`${detail} hidden shrink-0 md:flex`}>
              <LineIcon d={ICONS.phone} />
              <span className="tabular-nums">{items.phone}</span>
            </a>
          )}
          {items.email && (
            <a href={`mailto:${items.email}`} className={`${detail} hidden lg:flex`}>
              <LineIcon d={ICONS.mail} />
              <span className="truncate">{items.email}</span>
            </a>
          )}
          {items.address &&
            (items.mapUrl ? (
              <a href={items.mapUrl} target="_blank" rel="noreferrer" className={`${detail} hidden xl:flex`}>
                <LineIcon d={ICONS.pin} />
                <span className="truncate">{items.address}</span>
              </a>
            ) : (
              <span className={`${detail} hidden xl:flex`}>
                <LineIcon d={ICONS.pin} />
                <span className="truncate">{items.address}</span>
              </span>
            ))}
        </div>

        {/* Right: login and social links */}
        <div className="flex shrink-0 items-center gap-2">
          {items.phone && (
            <a href={telHref(items.phone)} aria-label={`Call ${items.phone}`} className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 transition md:hidden ${style.icon}`}>
              <LineIcon d={ICONS.phone} />
            </a>
          )}
          {items.login && (
            <>
              <Link to="/login" className={`${detail} hidden font-medium sm:flex`}>
                <LineIcon d={ICONS.user} />
                Staff login
              </Link>
              {items.networks.length > 0 && divider}
            </>
          )}
          {items.networks.length > 0 ? (
            <ul className="flex items-center gap-1.5" aria-label="Follow us">
              <li className={`mr-1 hidden text-[10px] font-bold uppercase tracking-[0.2em] lg:block ${style.muted}`} aria-hidden="true">
                Follow us
              </li>
              {items.networks.map((network) => (
                <li key={network.key}>
                  <a
                    href={settings.social[network.key].trim()}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={network.label.replace(' (Twitter)', '')}
                    title={network.label.replace(' (Twitter)', '')}
                    className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 transition duration-200 hover:-translate-y-0.5 ${style.icon} ${SOCIAL_ICONS[network.key]?.hover || ''}`}
                  >
                    <SocialIcon network={network.key} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !items.login && (
              <Link to="/contact" className={`${detail} hidden font-semibold uppercase tracking-wider sm:flex ${style.strong}`}>
                Book appointment
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactBar
