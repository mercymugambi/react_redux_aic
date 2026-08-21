// Central place for the site's SEO defaults.
//
// NOTE: replace SITE_URL with the live domain before going to production — it is
// used as the fallback for canonical/Open Graph URLs when the page is rendered
// somewhere without a window (and inside public/sitemap.xml).
export const SITE_URL = 'https://www.aickabuku.org'

export const SITE_NAME = 'AIC Kabuku Church'

export const DEFAULT_TITLE = 'AIC Kabuku Church | Africa Inland Church in Kiambu, Kenya'

export const DEFAULT_DESCRIPTION =
  'Africa Inland Church Kabuku is a Bible-believing church family in Kiambu County, Kenya. Join us for Sunday services at 8:00 AM and 10:30 AM, midweek Bible study, youth ministry and community outreach.'

export const DEFAULT_IMAGE = '/assets/header-image.jpg'

export const LOCALE = 'en_KE'

// Used by the site-wide structured data and by the contact/about pages.
export const CHURCH_INFO = {
  name: SITE_NAME,
  legalName: 'Africa Inland Church Kabuku',
  locality: 'Kabuku',
  region: 'Kiambu County',
  country: 'KE',
  services: [
    { day: 'Sunday', opens: '08:00', closes: '10:00', name: 'First Service' },
    { day: 'Sunday', opens: '10:30', closes: '13:00', name: 'Main Service' },
    { day: 'Wednesday', opens: '17:30', closes: '19:00', name: 'Bible Study' },
  ],
}
