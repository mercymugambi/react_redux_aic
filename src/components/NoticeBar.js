import React from 'react'
import { NOTICE_STYLES } from '../data/siteSettings'

const isExternal = (url) => /^https?:\/\//i.test(url || '')

// The announcement bar across the top of the website. `preview` draws it in place (for the
// admin's live preview) instead of fixed to the top of the window.
function NoticeBar({ notice, shown = true, preview = false, onClose }) {
  const style = NOTICE_STYLES[notice.style] || NOTICE_STYLES.blue
  const position = preview ? 'relative rounded-lg' : `fixed inset-x-0 top-0 z-60 transition-transform duration-500 ${shown ? 'translate-y-0' : '-translate-y-full'}`

  return (
    <div role={preview ? undefined : 'region'} aria-label={preview ? undefined : 'Announcement'} className={`${position} ${style.bar} shadow-lg`}>
      <div className="mx-auto flex h-11 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: the announcement */}
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          {notice.label && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-sm bg-white/20 py-0.5 pl-1 pr-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                <img src="/favicon.ico" alt="" className="h-3.5 w-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">{notice.label}</span>
            </span>
          )}
          <span className="truncate text-xs font-semibold text-white/95 sm:text-sm">{notice.message}</span>
        </div>
        {/* Right: the button and close */}
        <div className="flex shrink-0 items-center gap-2">
          {notice.link_text && notice.link_url && (
            <a
              href={notice.link_url}
              {...(isExternal(notice.link_url) && { target: '_blank', rel: 'noreferrer' })}
              className={`hidden rounded-sm bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition duration-200 sm:inline-flex ${style.button}`}
            >
              {notice.link_text}
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close announcement"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-sm border border-white/30 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoticeBar
