import React, { useState } from 'react'

const ministries = [
  {
    id: 'youth',
    title: 'Youth Ministry',
    tagline: 'Raising the Next Generation',
    description:
      'A vibrant space for teens and young adults to discover faith, build friendships, and lead with purpose. Weekly sessions, mentorship, and youth-led worship.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: '#b91c1c',
  },
  {
    id: 'women',
    title: "Women's Fellowship",
    tagline: 'Grace, Strength & Community',
    description:
      "A sisterhood rooted in God's Word. Monthly retreats, prayer circles, and outreach programs that empower women to walk boldly in their calling.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    accent: '#b91c1c',
  },
  {
    id: 'men',
    title: "Men's Ministry",
    tagline: "Faith, Family & Leadership",
    description:
      "Building men of integrity and purpose through discipleship, accountability groups, community projects, and retreats focused on godly leadership.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: '#b91c1c',
  },
  {
    id: 'children',
    title: "Children's Church",
    tagline: 'Little Hearts, Big Faith',
    description:
      'A joyful, safe environment where children ages 3–12 learn about God through creative stories, songs, crafts, and age-appropriate Bible lessons.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    accent: '#b91c1c',
  },
  {
    id: 'worship',
    title: 'Worship & Music',
    tagline: 'Sounds of Heaven',
    description:
      'Our worship team leads the congregation into the presence of God through anointed praise, choir performances, and contemporary and traditional music.',
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    accent: '#b91c1c',
  },
  {
    id: 'outreach',
    title: 'Outreach & Missions',
    tagline: 'Love Beyond the Walls',
    description:
      "Extending Christ's love into our community through food drives, medical camps, school sponsorships, and missionary work across Kiambu County and beyond.",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7.065M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    ),
    accent: '#b91c1c',
  },
]

function MinistriesSection() {
  const [hovered, setHovered] = useState(null)

  return (
    <section id="ministries" data-reveal className="bg-[#f8f7f4] py-16 sm:py-24 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center">
          <p className="font-serif italic text-lg text-[#b91c1c] sm:text-xl">
            Get Involved
          </p>
          <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Our Ministries
          </h2>
          <div className="mt-3 mx-auto h-1 w-16 rounded-full bg-[#b91c1c]" />
          <p className="mt-5 mx-auto max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Every person has a role in the body of Christ. Find your place in one of our ministries and grow alongside a community that cares.
          </p>
        </div>

        {/* Ministries Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => {
            const isHovered = hovered === ministry.id
            return (
              <div
                key={ministry.id}
                onMouseEnter={() => setHovered(ministry.id)}
                onMouseLeave={() => setHovered(null)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
              >
                {/* Red accent bar on hover */}
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
                  style={{ backgroundColor: '#b91c1c' }}
                />

                {/* Icon */}
                <div
                  className="inline-flex items-center justify-center rounded-xl p-3 text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: isHovered ? '#991b1b' : '#b91c1c' }}
                >
                  {ministry.icon}
                </div>

                {/* Text */}
                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                    {ministry.tagline}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                    {ministry.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {ministry.description}
                  </p>
                </div>

                {/* CTA link */}
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#b91c1c] transition-all duration-200 group-hover:gap-3">
                  <span>Join Ministry</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default MinistriesSection
