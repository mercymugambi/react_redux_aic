// Central place for the site's SEO defaults.
//
// NOTE: replace SITE_URL with the live domain before going to production — it is
// used as the fallback for canonical/Open Graph URLs when the page is rendered
// somewhere without a window (and inside public/sitemap.xml).
export const SITE_URL = 'https://www.aickabuku.org'

export const SITE_NAME = 'AIC Kabuku Church'

// The home page title, default description and service times are edited in the admin's
// Site settings (defaults in src/data/siteSettings.js).

export const DEFAULT_IMAGE = '/assets/header-image.jpg'

export const LOCALE = 'en_KE'

// Used by the site-wide structured data and by the contact/about pages.
export const CHURCH_INFO = {
  name: SITE_NAME,
  legalName: 'Africa Inland Church Kabuku',
  locality: 'Kabuku',
  region: 'Kiambu County',
  country: 'KE',
}
