import React from 'react'

function StatsCounter() {
  const stats = [
    {
      icon: (
        <svg className="h-8 w-8 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      number: "2000+",
      label: "Active Members"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7.065M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      ),
      number: "1475+",
      label: "Ministries & Outreach"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      number: "5470+",
      label: "Volunteers"
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      number: "150,045+",
      label: "Lives Impacted"
    }
  ]

  return (
    <section data-reveal className="border-y border-slate-100 bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center group"
            >
              <div className="mb-2 transition-transform duration-300 group-hover:scale-110">
                {stat.icon}
              </div>
              <div className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {stat.number}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#b91c1c] sm:text-xs">
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
