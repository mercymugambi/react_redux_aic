import React, { useState } from 'react'

function EventSermonHighlights() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(38)

  return (
    <section data-reveal className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        
        {/* ── Upcoming Event Card (7 cols on large) ── */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl sm:p-8 lg:col-span-7">
          {/* Top Row: Event Tag & Countdown */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Calendar Date Badge */}
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-red-700 text-white shadow-md shadow-red-700/30">
                <span className="text-2xl font-extrabold leading-none">14</span>
                <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-red-200">FEB</span>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  <svg className="h-3.5 w-3.5 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Next Upcoming Event
                </span>
                <h3 className="mt-2 font-sans text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Sharing Our Faith &amp; Love To Children
                </h3>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mt-6 space-y-2 text-sm text-slate-600 font-sans">
            <p className="flex items-center gap-2 font-medium text-slate-800">
              <svg className="h-4 w-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Speaker: <span className="font-semibold text-slate-900">Pastor Christo Job</span>
            </p>
            <p className="flex items-center gap-2">
              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location: AIC Kabuku Main Hall, Kiambu County
            </p>
          </div>

          {/* CTA Footer */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 font-sans">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Starts 9:00 AM - 1:00 PM
            </span>
            <a
              href="#event"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-700 active:scale-95 sm:w-auto"
            >
              <span>Join Us</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Latest Sermon Audio Player Card (5 cols on large) ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] p-6 text-white shadow-xl shadow-red-700/20 sm:p-8 lg:col-span-5 font-sans">
          {/* Subtle decorative background pattern */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                Latest Sermon
              </span>
            </div>
            <span className="text-xs font-medium text-white/80">Vol. 14 • 2026</span>
          </div>

          {/* Audio Info */}
          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-black/20 text-white shadow-inner backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h4 className="font-sans text-lg font-bold text-white leading-snug">
                The Law Demands, But Grace Supplies
              </h4>
              <p className="mt-1 text-xs font-medium text-white/85">
                By Pastor Ayuk Maria
              </p>
            </div>
          </div>

          {/* Player Waveform / Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-white/80">
              <span>12:45</span>
              <span>32:10</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="mt-6 flex items-center justify-between">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="ml-1 h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Quick Seek / Share Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAudioProgress(Math.max(0, audioProgress - 10))}
                className="rounded-full bg-black/15 p-2 text-white transition hover:bg-black/30"
                title="Rewind 10s"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
              <button
                onClick={() => setAudioProgress(Math.min(100, audioProgress + 10))}
                className="rounded-full bg-black/15 p-2 text-white transition hover:bg-black/30"
                title="Forward 10s"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default EventSermonHighlights
