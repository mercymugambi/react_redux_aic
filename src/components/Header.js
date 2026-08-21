import React from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../images/hero-images.webp'

function Header() {
  return (
    <header id="home" className="page-offset relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-center text-white">
      <img
        src={heroImage}
        alt="AIC Kabuku church building"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-slate-950/65" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,23,42,0.72),rgba(127,29,29,0.32),rgba(15,23,42,0.72))]" />

      <div className="hero-intro mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <p data-reveal className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-red-200 sm:text-sm">
          <span className="h-px w-10 bg-red-300/80" />
          Welcome to AIC Kabuku
          <span className="h-px w-10 bg-red-300/80" />
        </p>
        <h1 data-reveal className="mt-6 max-w-4xl font-sans text-[2.6rem] font-extrabold uppercase leading-[0.96] tracking-[-0.025em] sm:text-6xl lg:text-[5.25rem]">
          Your church is your home
        </h1>
        <p data-reveal className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-100 sm:text-lg">
          Worship, grow, and serve with a community rooted in faith, hope, and the love of Christ.
        </p>
        <div data-reveal className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/contact" className="btn-blue-primary shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700">
            Plan Your Visit
          </Link>
          <Link to="/aboutus" className="btn-blue-secondary shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100">
            About us
          </Link>
        </div>

        <a data-reveal href="#event" aria-label="Scroll to upcoming events" className="mt-10 inline-flex h-11 w-7 sm:mt-14 items-start justify-center rounded-full border border-white/50 p-2 transition hover:border-red-300">
          <span className="h-2 w-1 rounded-full bg-red-300" />
        </a>
      </div>
    </header>
  )
}

export default Header
