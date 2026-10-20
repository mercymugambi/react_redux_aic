import React, { useEffect, useRef, useState } from 'react'

const COUNT_DURATION_MS = 1800

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Counts from 0 up to a display value such as "150,045+" the first time it scrolls into view,
// keeping its comma grouping and any suffix.
function CountUp({ value }) {
  const ref = useRef(null)
  const target = Number(value.replace(/[^\d]/g, ''))
  const suffix = value.replace(/^[\d,]+/, '')
  const useCommas = value.includes(',')
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setCurrent(target)
      return undefined
    }

    let frame
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - start) / COUNT_DURATION_MS, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        setCurrent(Math.round(target * eased))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.4 })

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target])

  const formatted = useCommas ? current.toLocaleString('en-US') : String(current)

  return (
    <span ref={ref}>
      <span aria-hidden="true">{formatted}{suffix}</span>
      <span className="sr-only">{value}</span>
    </span>
  )
}

function StatsCounter() {
  const stats = [
    {
      icon: (
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      number: "200+",
      label: "Active Members"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7.065M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      ),
      number: "15+",
      label: "Ministries & Outreach"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      number: "80+",
      label: "Volunteers"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      number: "1,500+",
      label: "Lives Impacted"
    }
  ]

  return (
    <section data-reveal className="relative overflow-hidden bg-slate-950 py-10 text-white sm:py-14">
      {/* Subtle accent glow */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-red-900/20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center group"
            >
              <div className="mb-2 transition-transform duration-300 group-hover:scale-110">
                {stat.icon}
              </div>
              <div className="font-sans text-2xl font-extrabold tabular-nums tracking-tight text-white sm:text-3xl lg:text-4xl">
                <CountUp value={stat.number} />
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-300 sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsCounter
