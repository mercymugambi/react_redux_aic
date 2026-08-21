import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer data-reveal className="bg-[#0a0b0e] text-slate-400 font-sans border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Col 1: About */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white font-bold">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
                </svg>
              </div>
              <span className="font-serif text-xl font-bold text-white">AIC Kabuku</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Welcome to Africa Inland Church Kabuku. We are committed to preaching Christ, nurturing believers, and serving our local community with love.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-300">
              <svg className="h-3.5 w-3.5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kabuku, Kiambu County, Kenya
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link to="/" className="transition hover:text-red-500">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/aboutus" className="transition hover:text-red-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/events" className="transition hover:text-red-500">Events</Link>
              </li>
              <li>
                <a href="/#sermons" className="transition hover:text-red-500">Sermons</a>
              </li>
              <li>
                <Link to="/blog" className="transition hover:text-red-500">Blog</Link>
              </li>
              <li>
                <Link to="/gallery" className="transition hover:text-red-500">Gallery</Link>
              </li>
              <li>
                <a href="/#causes" className="transition hover:text-red-500">Recent Causes</a>
              </li>
              <li>
                <a href="/#faq" className="transition hover:text-red-500">FAQs</a>
              </li>
              <li><Link to="/contact" className="transition hover:text-red-500">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Service Times */}
          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              Service Times
            </h4>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-white">Sunday First Service</p>
                <p className="text-slate-400">8:00 AM - 10:00 AM</p>
              </div>
              <div>
                <p className="font-semibold text-white">Sunday Main Service</p>
                <p className="text-slate-400">10:30 AM - 1:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-white">Wednesday Bible Study</p>
                <p className="text-slate-400">5:30 PM - 7:00 PM</p>
              </div>
            </div>
          </div>

          {/* Col 4: Newsletter & Contact */}
          <div>
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              Newsletter
            </h4>
            <p className="mt-4 text-xs text-slate-400">
              Subscribe to get weekly sermon updates and event news.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full bg-white/10 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-700"
              />
              <button
                type="submit"
                className="rounded-full bg-red-700 px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-800 transition shrink-0"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} AIC Kabuku Church. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
