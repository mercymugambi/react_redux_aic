import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

const PASTOR_EMAIL = 'mercymugambi2016@gmail.com'
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001'

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
]
const PURPOSES = [
  'Counselling', 'Prayer', 'Marriage Preparation',
  'Baptism', 'Church Membership', 'Spiritual Guidance', 'Other',
]
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTHS_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay() }

/* ───────────── Kenya public holidays ───────────── */
const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

// Western (Gregorian) Easter Sunday
function easterSunday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month - 1, day)
}

// Holidays gazetted each year (e.g. Eid) cannot be calculated.
// Add them by hand in YYYY-MM-DD format, e.g. '2027-03-10'
const EXTRA_HOLIDAYS = []

function getKenyaHolidays(y) {
  const set = new Set(EXTRA_HOLIDAYS)

  // Fixed-date holidays: [monthIndex, day]
  const fixed = [
    [0, 1],    // New Year's Day
    [4, 1],    // Labour Day
    [5, 1],    // Madaraka Day
    [9, 10],   // Utamaduni Day (formerly Moi Day)
    [9, 20],   // Mashujaa Day
    [11, 12],  // Jamhuri Day
    [11, 25],  // Christmas Day
    [11, 26],  // Boxing Day
  ]
  fixed.forEach(([m, d]) => {
    set.add(ymd(y, m, d))
    // A holiday that falls on a Sunday is observed on the Monday
    if (new Date(y, m, d).getDay() === 0) set.add(ymd(y, m, d + 1))
  })

  // Good Friday and Easter Monday
  const e = easterSunday(y)
  const goodFriday = new Date(e); goodFriday.setDate(e.getDate() - 2)
  const easterMonday = new Date(e); easterMonday.setDate(e.getDate() + 1)
  ;[goodFriday, easterMonday].forEach(dt =>
    set.add(ymd(dt.getFullYear(), dt.getMonth(), dt.getDate()))
  )

  return set
}

export default function BookingModal({ open, onClose }) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [showPicker, setShowPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(today.getFullYear())
  const [selDay,    setSelDay]    = useState(null)
  const [selTime,   setSelTime]   = useState('')
  const [booked,    setBooked]    = useState([])
  const [step,      setStep]      = useState(1)
  const [form,      setForm]      = useState({ name:'', email:'', phone:'', purpose:'', notes:'' })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fetch booked slots for visible month
  useEffect(() => {
    if (!open) return
    const m = String(viewMonth + 1).padStart(2, '0')
    fetch(`${API_BASE}/api/v1/appointments/booked_slots?year=${viewYear}&month=${m}`)
      .then(r => r.json())
      .then(d => setBooked(d.booked || []))
      .catch(() => setBooked([]))
  }, [open, viewYear, viewMonth])

  const handleClose = useCallback(() => {
    setStep(1); setSelDay(null); setSelTime('')
    setForm({ name:'', email:'', phone:'', purpose:'', notes:'' })
    setError(''); setShowPicker(false); onClose()
  }, [onClose])

  const selectPickerMonth = (mIdx) => {
    const now = new Date(); now.setDate(1); now.setHours(0,0,0,0)
    if (new Date(pickerYear, mIdx, 1) < now) return
    setViewYear(pickerYear); setViewMonth(mIdx)
    setSelDay(null); setSelTime(''); setShowPicker(false)
  }
  const isPickerMonthDisabled = (mIdx) => {
    const now = new Date(); now.setDate(1); now.setHours(0,0,0,0)
    return new Date(pickerYear, mIdx, 1) < now
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  if (!open) return null

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay    = getFirstDay(viewYear, viewMonth)

  const holidays  = getKenyaHolidays(viewYear)
  const isHoliday = (d) => holidays.has(ymd(viewYear, viewMonth, d))

  const isPast   = (d) => {
    const dt = new Date(viewYear, viewMonth, d); dt.setHours(0,0,0,0)
    const now = new Date(); now.setHours(0,0,0,0)
    return dt < now
  }
  const isSunday = (d) => new Date(viewYear, viewMonth, d).getDay() === 0
  const isBooked = (t) => {
    if (!selDay) return false
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selDay).padStart(2,'0')} ${t}`
    return booked.includes(key)
  }

  // All future months are available; only months before the current one are blocked
  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    const now = new Date(); now.setDate(1); now.setHours(0,0,0,0)
    if (d < now) return
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11) }
    else setViewMonth(m => m-1)
    setSelDay(null); setSelTime('')
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0) }
    else setViewMonth(m => m+1)
    setSelDay(null); setSelTime('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selDay).padStart(2,'0')}`
    try {
      const res = await fetch(`${API_BASE}/api/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: { ...form, appointment_date: dateStr, appointment_time: selTime, pastor_email: PASTOR_EMAIL } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const dateLabel = selDay ? `${MONTHS[viewMonth]} ${selDay}, ${viewYear}` : ''

  // Rendered into <body> via a portal so no parent (navbar, banner, transform,
  // filter) can offset it. This keeps it centred and the overlay full-screen.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Book an Appointment">

      {/* ── Backdrop: covers the entire viewport, above the notice banner ── */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/60"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Centering shell ── */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8 pointer-events-none">

        {/* ── Modal Card ── */}
        <div
          className="pointer-events-auto relative w-full max-w-md flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
          style={{ maxHeight: '90vh' }}
        >

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-red-700 to-red-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-sans text-base font-bold text-white leading-tight">Book an Appointment</h2>
                <p className="text-red-200 text-[11px] leading-none mt-0.5">AIC Kabuku Church · Pastor</p>
              </div>
            </div>
            <button
              type="button" onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-lg font-bold leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>

          {/* Step Progress */}
          <div className="flex-shrink-0 flex items-center px-6 py-3 bg-slate-50 border-b border-slate-100">
            {['Date & Time', 'Your Info', 'Done'].map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    step > i+1 ? 'bg-green-500 text-white' :
                    step === i+1 ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {step > i+1 ? '✓' : i+1}
                  </span>
                  <span className={`text-[11px] font-semibold hidden sm:block ${step === i+1 ? 'text-red-700' : 'text-slate-400'}`}>{label}</span>
                </div>
                {i < 2 && (<div className="flex-1 mx-2 h-px bg-slate-200"/>)}
              </React.Fragment>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-6 py-5">

              {/* ── STEP 1: Calendar ── */}
              {step === 1 && (
                <div>
                  {/* Month Navigation + Picker trigger */}
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={prevMonth}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 transition font-bold text-lg"
                      aria-label="Previous month">
                      &#8249;
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPickerYear(viewYear); setShowPicker(v => !v) }}
                      className="flex items-center gap-1 font-sans font-bold text-slate-800 text-sm hover:text-red-700 transition"
                    >
                      {MONTHS[viewMonth]} {viewYear}
                      <svg className={`h-3.5 w-3.5 transition-transform ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    <button type="button" onClick={nextMonth}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 transition font-bold text-lg"
                      aria-label="Next month">
                      &#8250;
                    </button>
                  </div>

                  {/* ── Month / Year Picker Panel ── */}
                  {showPicker && (
                    <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={() => setPickerYear(y => y - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-700 hover:border-red-300 transition text-base font-bold">
                          &#8249;
                        </button>
                        <span className="font-bold text-slate-700 text-sm">{pickerYear}</span>
                        <button type="button" onClick={() => setPickerYear(y => y + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-700 hover:border-red-300 transition text-base font-bold">
                          &#8250;
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {MONTHS_SHORT.map((name, mIdx) => {
                          const disabled = isPickerMonthDisabled(mIdx)
                          const active   = pickerYear === viewYear && mIdx === viewMonth
                          return (
                            <button
                              key={name}
                              type="button"
                              disabled={disabled}
                              onClick={() => selectPickerMonth(mIdx)}
                              className={`rounded-xl py-1.5 text-[11px] font-semibold transition-all border ${
                                active    ? 'bg-red-700 text-white border-red-700 shadow' :
                                disabled  ? 'text-slate-300 border-transparent cursor-not-allowed' :
                                            'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
                              }`}
                            >
                              {name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`}/>)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const holiday  = isHoliday(day)
                      const disabled = isPast(day) || isSunday(day) || holiday
                      const selected = selDay === day
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={disabled}
                          title={holiday ? 'Public holiday' : undefined}
                          onClick={() => { setSelDay(day); setSelTime(''); setShowPicker(false) }}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            selected  ? 'bg-red-700 text-white shadow ring-2 ring-red-300 scale-110' :
                            disabled  ? 'text-slate-300 cursor-not-allowed' :
                                        'text-slate-700 hover:bg-red-50 hover:text-red-700'
                          } ${holiday && !isPast(day) && !isSunday(day) ? 'line-through' : ''}`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">* Sundays and public holidays are unavailable</p>

                  {/* Time Slots */}
                  {selDay && (
                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-600 mb-2">Choose a time — <span className="text-red-700">{dateLabel}</span></p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_SLOTS.map(slot => {
                          const taken = isBooked(slot)
                          return (
                            <button key={slot} type="button" disabled={taken} onClick={() => setSelTime(slot)}
                              className={`rounded-xl py-2 text-[11px] font-semibold border transition-all ${
                                selTime === slot ? 'bg-red-700 text-white border-red-700 shadow-md' :
                                taken ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' :
                                        'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
                              }`}>
                              {taken ? '🔒' : ''}{slot}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <button type="button" disabled={!selDay || !selTime} onClick={() => setStep(2)}
                    className="mt-5 w-full rounded-full bg-red-700 py-3 font-sans text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-red-700/20 transition-all hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed">
                    Continue &rarr;
                  </button>
                </div>
              )}

              {/* ── STEP 2: Form ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Selected slot badge */}
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                    <span className="text-red-600 text-base">&#128197;</span>
                    <div>
                      <span className="font-bold text-red-700 text-xs">{dateLabel}</span>
                      <span className="text-slate-400 text-xs"> &nbsp;at {selTime}</span>
                    </div>
                  </div>

                  {[
                    { label:'Full Name', key:'name', type:'text', placeholder:'Your full name', required:true },
                    { label:'Email Address', key:'email', type:'email', placeholder:'your@email.com', required:true },
                    { label:'Phone (optional)', key:'phone', type:'tel', placeholder:'+254 7XX XXX XXX', required:false },
                  ].map(({ label, key, type, placeholder, required }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
                      <input required={required} type={type} value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition"/>
                    </div>
                  ))}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Purpose</label>
                    <select required value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition appearance-none">
                      <option value="">Select a purpose...</option>
                      {PURPOSES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2} placeholder="Anything the pastor should know..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition resize-none"/>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">{error}</div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 rounded-full border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition">
                      &larr; Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 rounded-full bg-red-700 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-red-700/20 hover:bg-red-800 transition disabled:opacity-50">
                      {loading ? 'Booking...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 3: Confirmed ── */}
              {step === 3 && (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
                    <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h3 className="font-sans text-lg font-bold text-slate-800 mb-1">All Set!</h3>
                  <p className="text-red-700 font-semibold text-sm">{dateLabel} &middot; {selTime}</p>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                    Confirmation emails sent to you and the pastor.<br/>
                    You&apos;ll hear back if rescheduling is needed.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <button type="button" onClick={handleClose}
                      className="w-full rounded-full bg-red-700 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-red-700/20 hover:bg-red-800 transition">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer — Back to Home */}
          <div className="flex-shrink-0 border-t border-slate-100 px-6 py-3 bg-slate-50 rounded-b-2xl flex items-center justify-center gap-1">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/>
            </svg>
            <Link to="/" onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-red-700 transition font-medium">
              Back to Home
            </Link>
            <span className="text-slate-200 mx-1">&bull;</span>
            <button type="button" onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-red-700 transition font-medium">
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
