import React, { useState } from 'react'
import { initials } from '../data/blog'

// A post's cover photo, or a plain branded panel when it has none (or it fails to load)
export function PostCover({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-red-800 via-red-700 to-slate-900 ${className}`} aria-hidden="true">
        <svg className="h-10 w-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a2 2 0 012 2v9a2 2 0 01-2 2h-2m0-13v13M7 8h6M7 12h6" />
        </svg>
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

// The author's initials in a circle (posts don't carry author photos)
export function AuthorInitials({ name, className = 'h-7 w-7 text-[10px]' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-red-50 font-bold tracking-wide text-red-700 ring-1 ring-red-100 ${className}`}
    >
      {initials(name) || 'AIC'}
    </span>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-48 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}
