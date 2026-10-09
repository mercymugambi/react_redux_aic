import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../redux/api'
import { DEFAULT_SITE_SETTINGS, readSettings } from '../data/siteSettings'

const CACHE_KEY = 'aic:site-settings'
const SiteSettingsContext = createContext(DEFAULT_SITE_SETTINGS)

function cached() {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY))
  } catch (error) {
    return null
  }
}

// Gives the public site its editable settings. The last copy this browser saw is used
// straight away (so the notice bar doesn't flicker), then refreshed from the API. Without
// the API (not built yet, or offline) the built-in defaults are used.
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readSettings(cached()))

  useEffect(() => {
    let active = true
    api
      .get('/api/v1/site_settings')
      .then((response) => {
        if (!active || !response.data || typeof response.data !== 'object') return
        setSettings(readSettings(response.data))
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(response.data))
        } catch (error) {
          // Storage full or blocked; the settings still apply for this visit
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export const useSiteSettings = () => useContext(SiteSettingsContext)
