import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from './Seo'
import { CHURCH_INFO, SITE_NAME } from '../seo/siteMeta'

const gatherings = [
  { day: 'Sunday', name: 'First Service', time: '8:00 AM – 10:00 AM', note: 'A calm start in worship and the Word.' },
  { day: 'Sunday', name: 'Main Service', time: '10:30 AM – 1:00 PM', note: 'Worship, teaching and family fellowship.' },
  { day: 'Wednesday', name: 'Bible Study', time: '5:30 PM – 7:00 PM', note: 'A midweek place to grow in Scripture.' },
]

const fellowships = ['Youth Ministry', "Women’s Fellowship", "Men’s Ministry", 'Children’s Church']

function Icon({ children }) {
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">{children}</span>
}

function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', topic: 'General enquiry', message: '' })
  const [sent, setSent] = useState(false)

  useEffect(() => window.scrollTo(0, 0), [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setSent(true)
    setFormData({ name: '', email: '', phone: '', topic: 'General enquiry', message: '' })
  }

  const updateField = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))

  return (
    <main className="page-offset bg-[#fcfcfb] font-sans text-slate-900">
      <Seo
        title="Contact Us & Plan Your Visit"
        path="/contact"
        description="Get in touch with AIC Kabuku Church in Kiambu County, Kenya. Ask a question, request prayer, or plan your first visit — Sunday services at 8:00 AM and 10:30 AM."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Church',
          name: SITE_NAME,
          legalName: CHURCH_INFO.legalName,
          address: {
            '@type': 'PostalAddress',
            addressLocality: CHURCH_INFO.locality,
            addressRegion: CHURCH_INFO.region,
            addressCountry: CHURCH_INFO.country,
          },
          openingHoursSpecification: CHURCH_INFO.services.map((service) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: `https://schema.org/${service.day}`,
            opens: service.opens,
            closes: service.closes,
            name: service.name,
          })),
        }}
      />
      <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl text-center contact-enter">
          <nav className="flex justify-center text-xs font-bold uppercase tracking-[.16em] text-slate-400"><Link to="/" className="transition hover:text-red-700">Home</Link><span className="mx-2 text-slate-300">/</span><span className="text-red-700">Contact</span></nav>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[.28em] text-red-700">We would love to hear from you</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Let’s begin a conversation.</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">Whether you need prayer, would like to visit, or have a question about life at AIC Kabuku, our church family is here for you.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid overflow-hidden border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,.45)] lg:grid-cols-[.88fr_1.12fr]">
          <aside className="bg-slate-950 p-7 text-white sm:p-10 contact-enter contact-enter-delay-1">
            <p className="text-xs font-bold uppercase tracking-[.24em] text-red-300">Contact information</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">You’re welcome here.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">Reach out through the form and our team will respond as soon as they can. You can also find us in Kabuku every week.</p>
            <div className="mt-9 space-y-6 border-t border-white/10 pt-7">
              <div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-red-300"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21s7-5.4 7-12A7 7 0 005 9c0 6.6 7 12 7 12z"/><circle cx="12" cy="9" r="2.2" strokeWidth="1.8"/></svg></span><div><p className="text-xs font-bold uppercase tracking-wider text-red-200">Visit us</p><p className="mt-1 text-sm text-white">Kabuku, Kiambu County, Kenya</p></div></div>
              <div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-red-300"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 5h16v14H4zM4 7l8 6 8-6"/></svg></span><div><p className="text-xs font-bold uppercase tracking-wider text-red-200">Send a message</p><p className="mt-1 text-sm text-white">Use the form — we’ll be in touch.</p></div></div>
              <div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-red-300"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" strokeWidth="1.8"/><path strokeLinecap="round" strokeWidth="1.8" d="M12 7v5l3 2"/></svg></span><div><p className="text-xs font-bold uppercase tracking-wider text-red-200">Office & pastoral care</p><p className="mt-1 text-sm text-white">We’ll reply as soon as possible.</p></div></div>
            </div>
            <div className="mt-10 border-l-2 border-red-500 pl-4"><p className="text-sm font-semibold leading-6 text-white">“Carry each other’s burdens, and in this way you will fulfil the law of Christ.”</p><p className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-red-300">Galatians 6:2</p></div>
          </aside>

          <div className="p-7 sm:p-10 contact-enter contact-enter-delay-2">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-red-700">Send us a note</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">How can we help?</h2>
            {sent && <div className="mt-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status"><svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6"/></svg><span><strong>Thank you for reaching out.</strong> Your message has been received and our team will get back to you soon.</span></div>}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Your name<input required name="name" value={formData.name} onChange={updateField} placeholder="Jane Wanjiku" className="contact-input mt-2" /></label><label className="block text-sm font-semibold text-slate-700">Email address<input required type="email" name="email" value={formData.email} onChange={updateField} placeholder="jane@email.com" className="contact-input mt-2" /></label></div>
              <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span><input type="tel" name="phone" value={formData.phone} onChange={updateField} placeholder="Your phone number" className="contact-input mt-2" /></label><label className="block text-sm font-semibold text-slate-700">I’m getting in touch about<select name="topic" value={formData.topic} onChange={updateField} className="contact-input mt-2"><option>General enquiry</option><option>Prayer request</option><option>Visiting AIC Kabuku</option><option>Service or fellowship</option><option>Ministry involvement</option></select></label></div>
              <label className="block text-sm font-semibold text-slate-700">Your message<textarea required name="message" value={formData.message} onChange={updateField} placeholder="Tell us a little more…" rows="5" className="contact-input mt-2 resize-y" /></label>
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-400">By sending this form, you agree that AIC Kabuku may respond to your enquiry.</p><button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 bg-red-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-red-800 active:translate-y-0">Send message <span aria-hidden="true">→</span></button></div>
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.26em] text-red-700">Join us this week</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">There’s a place for you here.</h2><p className="mt-3 leading-7 text-slate-600">Come as you are. Find a service, Bible study or fellowship that helps you take your next step in faith.</p></div><div className="mt-9 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-3">{gatherings.map((gathering, index) => <article key={gathering.name} className={`bg-white p-6 contact-enter contact-enter-delay-${index + 1}`}><p className="text-xs font-bold uppercase tracking-[.18em] text-red-700">{gathering.day}</p><h3 className="mt-3 text-lg font-extrabold text-slate-900">{gathering.name}</h3><p className="mt-1 font-semibold text-slate-700">{gathering.time}</p><p className="mt-3 text-sm leading-6 text-slate-500">{gathering.note}</p></article>)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="grid gap-8 border-l-4 border-red-700 bg-white p-7 shadow-[0_16px_38px_-30px_rgba(15,23,42,.35)] sm:p-10 lg:grid-cols-[1fr_1.35fr] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.26em] text-red-700">Find your people</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Fellowship beyond Sunday.</h2><p className="mt-3 leading-7 text-slate-600">Our ministries are places to belong, serve and grow with people who know your name.</p></div><div className="grid gap-3 sm:grid-cols-2">{fellowships.map((fellowship) => <div key={fellowship} className="flex items-center gap-3 border border-slate-200 bg-[#fcfcfb] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"><Icon><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h8M12 8v8"/><circle cx="12" cy="12" r="8" strokeWidth="1.8"/></svg></Icon><span className="text-sm font-bold text-slate-800">{fellowship}</span></div>)}</div></div></section>
    </main>
  )
}

export default ContactUs
