import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../redux/api'
import { galleryCategories } from '../data/galleryItems'

// "2026-10-01" is read as a local date (not UTC midnight, which can land on the previous day);
// full timestamps such as created_at are read as-is.
function parseDay(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Uploads default their caption to the file name, so phone and camera names such as
// "834501429 122135894942736406 n" or "IMG 20240512" are treated as having no caption.
function cleanCaption(title) {
  const text = (title || '').trim()
  if (!text) return null
  const digits = text.replace(/\D/g, '').length
  if (digits / text.replace(/\s/g, '').length > 0.5) return null
  if (/^(img|dsc|pxl|dcim|whatsapp image|screenshot)[\s_-]*\d/i.test(text)) return null
  return text
}

export function photoTitle(photo) {
  if (photo.title) return photo.title
  return photo.category ? `${photo.category} at AIC Kabuku` : 'Life at AIC Kabuku'
}

export const monthLabel = (date) => (date ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null)

function toPhoto(row) {
  const date = parseDay(row.taken_on) || parseDay(row.created_at)
  return {
    id: row.id,
    title: cleanCaption(row.title),
    category: row.category || null,
    image: row.image_url,
    date,
    dateLabel: monthLabel(date),
  }
}

// Categories that have photos, in the site's usual order, then any others the server sends
export function categoriesIn(photos) {
  const present = new Set(photos.map((photo) => photo.category).filter(Boolean))
  return [...galleryCategories.filter((name) => present.has(name)), ...[...present].filter((name) => !galleryCategories.includes(name)).sort()]
}

// Loads the public gallery, newest first. Photos without a file are left out.
//   status: 'loading' | 'ready' | 'error'
// When the visitor comes back to the tab the list is refreshed quietly, so new uploads appear
// without a reload. A 404 (an API without the gallery) is treated as "no photos yet".
export function useGalleryPhotos() {
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('loading')
  const request = useRef(0)

  const load = useCallback(({ silent = false } = {}) => {
    const id = ++request.current
    if (!silent) setStatus('loading')
    return api
      .get('/api/v1/gallery_images')
      .then((response) => {
        if (id !== request.current) return
        const rows = Array.isArray(response.data) ? response.data : []
        const list = rows
          .filter((row) => row && row.image_url)
          .map(toPhoto)
          .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
        setPhotos(list)
        setStatus('ready')
      })
      .catch((error) => {
        if (id !== request.current || silent) return
        setPhotos([])
        setStatus(error?.response?.status === 404 ? 'ready' : 'error')
      })
  }, [])

  useEffect(() => {
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      request.current += 1 // ignore any answer that arrives after leaving the page
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  return { photos, status, reload: load }
}

const SAVED_KEY = 'aic-gallery-saved'

// Photos the visitor bookmarked, remembered in this browser only
export function useSavedPhotos() {
  const [saved, setSaved] = useState(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(SAVED_KEY))
      return Array.isArray(value) ? value : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
    } catch {
      // Storage can be unavailable (private mode); saving then lasts until the page closes
    }
  }, [saved])

  const toggle = useCallback((id) => {
    setSaved((current) => (current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]))
  }, [])

  return [saved, toggle]
}
