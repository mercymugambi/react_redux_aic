import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Seo from './Seo'

function Events() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)
  const [rsvpForm, setRsvpForm] = useState({ name: '', email: '', phone: '', seats: '1' })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const categories = ['All', 'Conferences', 'Youth', 'Worship & Services', 'Outreach', 'Prayer']

  const eventsData = [
    {
      id: 1,
      title: 'Annual Faith & Worship Conference 2026',
      category: 'Conferences',
      month: 'FEB',
      day: '28',
      year: '2026',
      time: '9:00 AM – 4:00 PM EAT',
      location: 'AIC Kabuku Main Sanctuary',
      speaker: 'Rev. Joseph Njuguna & Guest Worshippers',
      speakerRole: 'Senior Pastor & Keynote Speaker',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      desc: 'Join us for a day of powerful worship, biblical teaching, prayer, and spiritual renewal for the whole family.',
      fullDetails: 'The Faith & Worship Conference is our annual flagship gathering bringing together believers from across Kiambu County and beyond. Experience anointed choir music, break-out workshops, leadership empowerment, and communal lunch.',
      attendees: '280+ Registered',
    },
    {
      id: 2,
      title: 'Youth Revival & Worship Night',
      category: 'Youth',
      month: 'MAR',
      day: '07',
      year: '2026',
      time: '5:00 PM – 9:00 PM EAT',
      location: 'Youth Fellowship Center',
      speaker: 'Pastor Timothy Mwangi',
      speakerRole: 'Youth Pastor',
      speakerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      desc: 'An energetic evening of live praise music, testimonies, and inspiring Word tailored for teenagers and young adults.',
      fullDetails: 'Youth Praise Night is dedicated to empowering the next generation. Features guest Christian gospel artists, interactive Q&A panel, and fellowship refreshments.',
      attendees: '150+ Expected',
    },
    {
      id: 3,
      title: 'Community Compassion & Health Outreach',
      category: 'Outreach',
      month: 'MAR',
      day: '15',
      year: '2026',
      time: '8:00 AM – 2:00 PM EAT',
      location: 'Kabuku Town Grounds',
      speaker: 'Outreach & Missions Team',
      speakerRole: 'Community Coordinators',
      speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
      desc: 'Free medical check-ups, food distribution, prayer support, and evangelism for surrounding community families.',
      fullDetails: 'Demonstrating the love of Christ in practical ways. Volunteer doctors, nurses, and church members come together to serve over 500 local residents.',
      attendees: 'Open to All',
    },
    {
      id: 4,
      title: 'Couples & Family Marriage Seminar',
      category: 'Worship & Services',
      month: 'MAR',
      day: '22',
      year: '2026',
      time: '2:00 PM – 5:30 PM EAT',
      location: 'Sanctuary Fellowship Hall',
      speaker: 'Elder Samuel & Mary Karanja',
      speakerRole: 'Family Life Mentors',
      speakerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
      desc: 'Nurturing godly marriages and healthy family relationships through biblical principles, practical wisdom, and Q&A.',
      fullDetails: 'A warm interactive seminar for engaged and married couples focused on communication, conflict resolution, and building Christ-centered homes.',
      attendees: '80 Couples',
    },
    {
      id: 5,
      title: 'Night of 1000 Prayers & Intercession',
      category: 'Prayer',
      month: 'APR',
      day: '03',
      year: '2026',
      time: '9:00 PM – 5:00 AM EAT',
      location: 'Main Sanctuary & Prayer Hall',
      speaker: 'Intercessory Ministry Team',
      speakerRole: 'Prayer Leaders',
      speakerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
      desc: 'Overnight prayer vigil seeking God\'s divine presence, revival, healing, and nation-wide spiritual transformation.',
      fullDetails: 'Stand in the gap through guided worship hours, prayer watches, scripture declarations, and communion.',
      attendees: '200+ Prayer Warriors',
    },
    {
      id: 6,
      title: 'Resurrection Sunday Easter Celebration',
      category: 'Worship & Services',
      month: 'APR',
      day: '12',
      year: '2026',
      time: '8:30 AM – 1:00 PM EAT',
      location: 'AIC Kabuku Main Sanctuary',
      speaker: 'Pastoral Ministry Team',
      speakerRole: 'Pastoral Staff',
      speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=800&q=80',
      desc: 'Glorious Easter worship celebrating the victory of Christ\'s resurrection with special choir music and baptism service.',
      fullDetails: 'Join our joyful Easter Sunday service with combined choirs, drama presentation, baptism service, and family thanksgiving.',
      attendees: 'Whole Church',
    },
  ]

  const filteredEvents = eventsData.filter(event => {
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleRsvpSubmit = e => {
    e.preventDefault()
    setRsvpSubmitted(true)
    setTimeout(() => {
      setRsvpSubmitted(false)
      setSelectedEvent(null)
      setRsvpForm({ name: '', email: '', phone: '', seats: '1' })
    }, 2800)
  }

  return (
    <div className="page-offset min-h-screen bg-white font-sans antialiased text-slate-900">
      <Seo
        title="Church Events & Calendar 2026"
        path="/events"
        description="Upcoming events at AIC Kabuku: conferences, youth revival nights, worship services, prayer vigils and community outreach across Kiambu County. Free RSVP for every gathering."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'AIC Kabuku Church Events',
          itemListElement: eventsData.map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Event',
              name: event.title,
              description: event.desc,
              image: event.image,
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: event.location,
                address: { '@type': 'PostalAddress', addressRegion: 'Kiambu County', addressCountry: 'KE' },
              },
              performer: { '@type': 'Person', name: event.speaker },
            },
          })),
        }}
      />

      {/* ── HERO BANNER ── */}
      <section className="bg-slate-50 border-b border-slate-200 py-14 sm:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex justify-center mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Link to="/" className="hover:text-red-700 transition">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-red-700">Events</span>
          </nav>

          {/* Decorative label */}
          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-700 mb-4">
            Church Calendar 2026
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Upcoming Church Events
          </h1>
          <p className="mt-4 text-sm text-slate-500 sm:text-base max-w-xl mx-auto leading-relaxed">
            Join us for inspiring worship services, revival nights, youth gatherings, and community outreach events throughout the year.
          </p>
        </div>
      </section>

      {/* ── FILTERS & SEARCH ── */}
      <section className="sticky sticky-below-nav z-30 bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

            {/* Scrollable category pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events or speakers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── EVENT GRID ── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Count label */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm font-semibold text-slate-500">
              Showing <span className="text-red-700 font-bold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' && (
                <span className="text-slate-400"> in <em className="not-italic text-slate-700">{selectedCategory}</em></span>
              )}
            </p>
            {(selectedCategory !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => { setSelectedCategory('All'); setSearchQuery('') }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-slate-50 border border-slate-200">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 text-base font-bold text-slate-400">No events found</p>
              <button
                type="button"
                onClick={() => { setSelectedCategory('All'); setSearchQuery('') }}
                className="mt-2 text-xs font-semibold text-red-600 hover:underline"
              >
                Show all events
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map(event => (
                <article
                  key={event.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Cover image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Category badge */}
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 border border-slate-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                      {event.category}
                    </span>

                    {/* Date badge */}
                    <div className="absolute top-3 right-3 flex flex-col items-center justify-center rounded-xl bg-red-700 px-3 py-1.5 text-white shadow-sm min-w-[44px]">
                      <span className="text-base font-extrabold leading-none">{event.day}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-red-200">{event.month}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-red-700 transition">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                      {event.desc}
                    </p>

                    {/* Meta */}
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.time}
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={event.speakerAvatar}
                          alt={event.speaker}
                          className="h-7 w-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <span className="text-[11px] font-semibold text-slate-600 truncate">{event.speaker}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="shrink-0 rounded-full border border-red-700 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-700 hover:text-white transition"
                      >
                        Details & RSVP
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── RSVP MODAL ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setSelectedEvent(null) }}
        >
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl my-8">

            {/* Modal cover image */}
            <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/40" />

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close modal"
                className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-slate-700 hover:bg-white hover:text-red-700 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute bottom-4 left-5 right-5">
                <span className="inline-block rounded-full bg-red-700 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  {selectedEvent.category}
                </span>
                <h2 className="mt-1.5 text-lg font-bold text-white leading-snug sm:text-xl">
                  {selectedEvent.title}
                </h2>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* Meta cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date & Time</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">{selectedEvent.month} {selectedEvent.day}, {selectedEvent.year}</p>
                  <p className="text-[11px] text-slate-500">{selectedEvent.time}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Location</p>
                  <p className="mt-1 text-xs font-bold text-slate-900 truncate">{selectedEvent.location}</p>
                  <p className="text-[11px] text-red-600">Kiambu County</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Speaker</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">{selectedEvent.speaker}</p>
                  <p className="text-[11px] text-slate-500">{selectedEvent.speakerRole}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700">About This Gathering</h4>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {selectedEvent.fullDetails || selectedEvent.desc}
                </p>
              </div>

              {/* RSVP Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-bold text-slate-900">Reserve Your Spot</h4>
                <p className="text-xs text-slate-500 mt-0.5">Free registration — helps us prepare seating and refreshments.</p>

                {rsvpSubmitted ? (
                  <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                    <p className="text-sm font-bold text-green-700">✓ Registration Confirmed!</p>
                    <p className="text-xs text-green-600 mt-1">We look forward to worshipping with you.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={rsvpForm.name}
                        onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={rsvpForm.email}
                        onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={rsvpForm.phone}
                        onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                      />
                      <select
                        value={rsvpForm.seats}
                        onChange={e => setRsvpForm({ ...rsvpForm, seats: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                      >
                        <option value="1">1 Person</option>
                        <option value="2">2 People (Couple)</option>
                        <option value="3">3–4 Family Members</option>
                        <option value="5">5+ Group</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-red-700 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-800 transition"
                    >
                      Confirm RSVP Registration
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Events
