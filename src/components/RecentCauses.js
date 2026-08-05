import React, { useState } from 'react'

function RecentCauses() {
  const [activeDonation, setActiveDonation] = useState(null)

  const causes = [
    {
      id: 1,
      title: "Children's Adoption & Care",
      subtitle: "Empowering orphans & needy children",
      image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
      toGo: "$12,000 To Go",
      progress: 84,
      raised: "$42,000",
      needed: "$50,000",
      description: "Providing shelter, school uniforms, and loving care for vulnerable children in our region."
    },
    {
      id: 2,
      title: "Save Children From Hunger",
      subtitle: "Food drives & nutritional support",
      image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
      toGo: "$48,000 To Go",
      progress: 56,
      raised: "$45,000",
      needed: "$80,000",
      description: "Distributing food packs and daily warm meals to families facing hardship in remote villages."
    },
    {
      id: 3,
      title: "Donate For Clean Water",
      subtitle: "Boreholes & freshwater wells",
      image: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80",
      toGo: "$75,000 To Go",
      progress: 97,
      raised: "$96,000",
      needed: "$99,000",
      description: "Drilling clean drinking water boreholes for local communities to reduce waterborne illnesses."
    }
  ]

  return (
    <section id="causes" className="py-14 sm:py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div data-reveal className="text-center max-w-2xl mx-auto">
          <p className="font-serif italic text-xl sm:text-2xl text-[#b91c1c] tracking-wide">
            Donate &amp; Charity
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-4xl uppercase tracking-tight">
            Recent Causes Help Us!
          </h2>
          <div className="mx-auto mt-3 h-1 w-16 bg-[#b91c1c] rounded-full" />
        </div>

        {/* Causes Grid */}
        <div className="mt-10 sm:mt-14 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {causes.map((cause) => (
            <div
              key={cause.id}
              data-reveal
              style={{ transitionDelay: `${cause.id * 110}ms` }}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              {/* Image with overlay badge & progress line */}
              <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                <img
                  src={cause.image}
                  alt={cause.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* To Go Badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-200">
                    {cause.toGo}
                  </span>
                  <span className="text-xs font-semibold text-white/90">
                    {cause.progress}% Raised
                  </span>
                </div>

                {/* Bottom Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                  <div
                    className="h-full bg-[#b91c1c] transition-all duration-500"
                    style={{ width: `${cause.progress}%` }}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-6 font-sans">
                <div>
                  <h3 className="font-sans text-xl font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                    {cause.title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-red-700 uppercase tracking-wide">
                    {cause.subtitle}
                  </p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed font-sans">
                    {cause.description}
                  </p>
                </div>

                {/* Stats & CTA */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-sans">
                    <div>
                      <span className="text-red-700">{cause.raised}</span> Raised
                    </div>
                    <div>
                      <span className="text-[#b91c1c]">{cause.needed}</span> Goal
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    onClick={() => setActiveDonation(cause.id)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#b91c1c] py-3 font-sans text-xs font-bold uppercase tracking-widest text-white shadow transition-all hover:bg-red-800 active:scale-95"
                  >
                    Donate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal / Toast when Donate is clicked */}
        {activeDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm font-sans">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mt-3 font-sans text-xl font-bold text-slate-900">
                Thank You for Your Generosity!
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Your contribution directly empowers community projects at AIC Kabuku Church.
              </p>
              <button
                onClick={() => setActiveDonation(null)}
                className="mt-5 w-full rounded-full bg-red-700 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white hover:bg-red-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

export default RecentCauses
