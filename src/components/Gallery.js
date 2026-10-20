import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Seo from './Seo'
import { categoriesIn, photoTitle, useGalleryPhotos, useSavedPhotos } from './useGallery'

// Photos are revealed in pages as the visitor scrolls, so a large gallery doesn't load every image at once
const PAGE_SIZE = 20
const SAVED = 'Saved'
const SKELETON_HEIGHTS = ['h-64', 'h-48', 'h-72', 'h-56', 'h-80', 'h-52', 'h-60', 'h-44', 'h-72', 'h-56']

function BookmarkIcon({ filled, className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3.5A2.5 2.5 0 017.5 1h9A2.5 2.5 0 0119 3.5V22l-7-4-7 4V3.5z" />
    </svg>
  )
}

function ArrowIcon({ direction }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

/* ── Masonry tile ── */
function PhotoTile({ photo, eager, saved, onOpen, onToggleSave, onFail }) {
  const imageRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const title = photoTitle(photo)

  // A cached image can finish loading before React is listening
  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth) setLoaded(true)
  }, [])

  return (
    <article
      className={`group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/15 ${
        loaded ? '' : 'animate-pulse'
      }`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200" aria-label={`Open ${title}`}>
        {/* Until the image arrives the tile holds a portrait shape, so the columns don't jump */}
        <img
          ref={imageRef}
          src={photo.image}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={onFail}
          className={`block w-full object-cover transition duration-500 group-hover:scale-[1.04] ${loaded ? 'opacity-100' : 'aspect-[4/5] opacity-0'}`}
        />
      </button>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-3.5 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-red-200">{[photo.category, photo.dateLabel].filter(Boolean).join(' · ')}</p>
        <h2 className="mt-0.5 text-sm font-bold leading-5">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onToggleSave}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition duration-300 ${
          saved ? 'bg-red-700 text-white opacity-100' : 'bg-white/95 text-slate-700 opacity-0 hover:bg-red-700 hover:text-white focus-visible:opacity-100 group-hover:opacity-100'
        }`}
      >
        <BookmarkIcon filled={saved} />
      </button>
    </article>
  )
}

/* ── Full-screen viewer ── */
function LightboxImage({ photo }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative flex min-h-[40vh] items-center justify-center bg-slate-950">
      {!loaded && <span className="absolute h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden="true" />}
      <img
        src={photo.image}
        alt={photoTitle(photo)}
        onLoad={() => setLoaded(true)}
        className={`max-h-[72vh] w-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

function Lightbox({ photo, photos, saved, onNavigate, onClose, onToggleSave }) {
  const closeRef = useRef(null)
  const touchStart = useRef(null)
  const [shareNote, setShareNote] = useState(null)
  const index = Math.max(0, photos.findIndex((item) => item.id === photo.id))
  const hasSiblings = photos.length > 1
  const title = photoTitle(photo)

  const go = useCallback(
    (step) => {
      if (hasSiblings) onNavigate(photos[(index + step + photos.length) % photos.length])
    },
    [hasSiblings, index, onNavigate, photos]
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, onClose])

  // Lock the page behind the viewer, and give focus back to whatever opened it on close
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
  }, [])

  // Fetch the neighbours ahead of time so next/previous feel instant
  useEffect(() => {
    if (!hasSiblings) return
    const neighbours = [photos[(index + 1) % photos.length], photos[(index - 1 + photos.length) % photos.length]]
    neighbours.forEach((item) => {
      const image = new Image()
      image.src = item.image
    })
  }, [hasSiblings, index, photos])

  useEffect(() => setShareNote(null), [photo.id])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · AIC Kabuku`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('Link copied')
    } catch (error) {
      if (error?.name !== 'AbortError') setShareNote('Couldn’t copy the link')
    }
  }

  const isSaved = saved.includes(photo.id)
  const iconButton = 'flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX
        }}
        onTouchEnd={(event) => {
          if (touchStart.current == null) return
          const distance = event.changedTouches[0].clientX - touchStart.current
          touchStart.current = null
          if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1)
        }}
      >
        <div className="relative">
          <LightboxImage key={photo.id} photo={photo} />
          {hasSiblings && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-red-700 hover:text-white sm:flex">
                <ArrowIcon direction="left" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-red-700 hover:text-white sm:flex">
                <ArrowIcon direction="right" />
              </button>
              <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold tabular-nums text-white">
                {index + 1} / {photos.length}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {(photo.category || photo.dateLabel) && (
              <p className="text-xs font-bold uppercase tracking-[.16em] text-red-700">{[photo.category, photo.dateLabel].filter(Boolean).join(' · ')}</p>
            )}
            <h2 id="lightbox-title" className="mt-1 text-xl font-extrabold">
              {title}
            </h2>
            {shareNote && (
              <p role="status" className="mt-1 text-xs font-medium text-slate-500">
                {shareNote}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasSiblings && (
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${iconButton} sm:hidden`}>
                <ArrowIcon direction="left" />
              </button>
            )}
            {hasSiblings && (
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${iconButton} sm:hidden`}>
                <ArrowIcon direction="right" />
              </button>
            )}
            <button type="button" onClick={() => onToggleSave(photo.id)} aria-pressed={isSaved} aria-label={isSaved ? 'Remove from saved' : 'Save photo'} className={isSaved ? 'flex h-10 w-10 items-center justify-center rounded-full bg-red-700 text-white transition hover:bg-red-800' : iconButton}>
              <BookmarkIcon filled={isSaved} />
            </button>
            <button type="button" onClick={share} aria-label="Share photo" className={iconButton}>
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="18" cy="5" r="3" strokeWidth={1.75} />
                <circle cx="6" cy="12" r="3" strokeWidth={1.75} />
                <circle cx="18" cy="19" r="3" strokeWidth={1.75} />
                <path strokeWidth={1.75} d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </button>
            <a href={photo.image} target="_blank" rel="noreferrer" aria-label="Open full size" className={iconButton}>
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
            </a>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo" className={iconButton}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Notice({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-20 text-center">
      <p className="text-base font-bold text-slate-600">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

const ACTION_BUTTON = 'rounded-full bg-red-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800'

/* ── Page ── */
function Gallery() {
  const { photos: allPhotos, status, reload } = useGalleryPhotos()
  const [saved, toggleSave] = useSavedPhotos()
  const [failedIds, setFailedIds] = useState([])
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [params, setParams] = useSearchParams()
  const sentinelRef = useRef(null)

  // Images whose file can't be loaded are dropped rather than shown broken
  const photos = useMemo(() => allPhotos.filter((photo) => !failedIds.includes(photo.id)), [allPhotos, failedIds])
  const categories = useMemo(() => categoriesIn(photos), [photos])
  const savedCount = photos.filter((photo) => saved.includes(photo.id)).length

  // The filter and the open photo live in the address, so either can be shared as a link:
  // /gallery?category=Worship, /gallery?photo=12
  const requested = (params.get('category') || '').toLowerCase()
  const active = requested === 'saved' ? SAVED : categories.find((name) => name.toLowerCase() === requested) || 'All'

  const updateParams = useCallback(
    (changes) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) => (value == null ? next.delete(key) : next.set(key, value)))
          return next
        },
        { replace: true }
      ),
    [setParams]
  )

  const needle = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      photos
        .filter((photo) => active === 'All' || (active === SAVED ? saved.includes(photo.id) : photo.category === active))
        .filter((photo) => !needle || [photoTitle(photo), photo.category, photo.dateLabel].join(' ').toLowerCase().includes(needle)),
    [photos, active, saved, needle]
  )
  const shown = visible.slice(0, limit)
  const hasMore = shown.length < visible.length

  useEffect(() => setLimit(PAGE_SIZE), [active, needle])

  // Reveal the next page shortly before the visitor reaches the end of the grid
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setLimit((current) => current + PAGE_SIZE), { rootMargin: '600px 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, shown.length])

  const openId = params.get('photo')
  const openPhoto = openId ? photos.find((photo) => String(photo.id) === openId) : null
  // Next/previous move through the filtered photos, or through all of them for a shared link outside the filter
  const lightboxPhotos = openPhoto && visible.some((photo) => photo.id === openPhoto.id) ? visible : photos

  const selectFilter = (name) => updateParams({ category: name === 'All' ? null : name === SAVED ? 'saved' : name })
  const clearFilters = () => {
    setQuery('')
    updateParams({ category: null })
  }
  const closeLightbox = useCallback(() => updateParams({ photo: null }), [updateParams])
  const navigateLightbox = useCallback((photo) => updateParams({ photo: photo.id }), [updateParams])

  const filters = ['All', ...categories, ...(savedCount || active === SAVED ? [SAVED] : [])]
  const countFor = (name) => (name === 'All' ? photos.length : name === SAVED ? savedCount : photos.filter((photo) => photo.category === name).length)
  const loading = status === 'loading'

  let grid
  if (loading) {
    grid = (
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5" aria-label="Loading photos">
        {SKELETON_HEIGHTS.map((height, index) => (
          <div key={index} className={`mb-3 break-inside-avoid animate-pulse rounded-2xl bg-slate-200 ${height}`} />
        ))}
      </div>
    )
  } else if (status === 'error') {
    grid = (
      <Notice title="We couldn’t load the gallery" action={<button type="button" onClick={() => reload()} className={ACTION_BUTTON}>Try again</button>}>
        Please check your connection and try again.
      </Notice>
    )
  } else if (!photos.length) {
    grid = (
      <Notice title="Photos are on their way" action={<Link to="/events" className={ACTION_BUTTON}>See upcoming events</Link>}>
        We’re gathering moments from worship, fellowship and outreach. Check back soon.
      </Notice>
    )
  } else if (!visible.length) {
    grid =
      active === SAVED && !needle ? (
        <Notice title="No saved photos yet" action={<button type="button" onClick={clearFilters} className={ACTION_BUTTON}>Browse all photos</button>}>
          Tap the bookmark on any photo to keep it here. Saved photos are remembered on this device.
        </Notice>
      ) : (
        <Notice title="No photos match" action={<button type="button" onClick={clearFilters} className={ACTION_BUTTON}>Clear filters</button>}>
          {needle ? `Nothing matches “${query.trim()}”${active === 'All' ? '' : ` in ${active}`}.` : 'Try a different category.'}
        </Notice>
      )
  } else {
    grid = (
      <>
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
          {shown.map((photo, index) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              eager={index < 8}
              saved={saved.includes(photo.id)}
              onOpen={() => updateParams({ photo: photo.id })}
              onToggleSave={() => toggleSave(photo.id)}
              onFail={() => setFailedIds((current) => (current.includes(photo.id) ? current : [...current, photo.id]))}
            />
          ))}
        </div>
        {hasMore && (
          <div ref={sentinelRef} className="mt-6 flex justify-center">
            <button type="button" onClick={() => setLimit((current) => current + PAGE_SIZE)} className="rounded-full bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700">
              Show more photos
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <main className="page-offset bg-[#fcfcfb] text-slate-900">
      <Seo
        page="gallery"
        title="Photo Gallery"
        path="/gallery"
        description="Photos from worship, prayer, children's ministry and community outreach at AIC Kabuku — the people, praise and purpose that make our church family feel like home."
        image={photos[0]?.image}
      />
      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-xs font-extrabold uppercase tracking-[.28em] text-red-700">AIC Kabuku · Photo journal</p>
          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Life, captured in <span className="text-red-700">moments.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Discover the people, praise and purpose that make our church family feel like home.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-end">
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                <span className={`flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-bold tabular-nums text-white ${loading ? 'animate-pulse' : ''}`}>
                  {loading ? '' : photos.length}
                </span>
                <span>
                  <strong className="font-bold">{photos.length === 1 ? 'memory' : 'memories'}</strong>
                  <br />
                  {photos[0]?.dateLabel ? `latest from ${photos[0].dateLabel}` : 'and counting'}
                </span>
              </div>
              {photos.length > 0 && (
                <label className="relative block sm:w-64">
                  <span className="sr-only">Search photos</span>
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search photos…"
                    className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky sticky-below-nav z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filter photos">
          {loading
            ? ['w-16', 'w-24', 'w-28', 'w-20'].map((width) => <span key={width} className={`h-10 shrink-0 animate-pulse rounded-full bg-slate-100 ${width}`} />)
            : filters.map((name) => {
                const isActive = name === active
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectFilter(name)}
                    aria-pressed={isActive}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                      isActive ? 'bg-red-700 text-white shadow-md shadow-red-700/20' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    {name === SAVED && <BookmarkIcon filled className="h-3.5 w-3.5" />}
                    {name}
                    <span className={`text-xs tabular-nums ${isActive ? 'text-red-100' : 'text-slate-400'}`}>{countFor(name)}</span>
                  </button>
                )
              })}
          {!loading && photos.length > 0 && (
            <span className="ml-auto hidden shrink-0 text-sm font-medium text-slate-400 sm:block" aria-live="polite">
              {visible.length} {visible.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-3 py-7 sm:px-5 lg:px-8 lg:py-10">{grid}</section>

      <section className="mx-auto max-w-[1480px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[.26em] text-red-300">More than a photo</p>
          <h2 className="mx-auto mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Come and make memories with us.</h2>
          <a href="/#contact" className="mt-7 inline-flex rounded-full bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wider transition hover:bg-red-600">
            Book appointment
          </a>
        </div>
      </section>

      {openPhoto && (
        <Lightbox photo={openPhoto} photos={lightboxPhotos} saved={saved} onNavigate={navigateLightbox} onClose={closeLightbox} onToggleSave={toggleSave} />
      )}
    </main>
  )
}

export default Gallery
