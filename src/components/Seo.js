import { useEffect } from 'react'
import { DEFAULT_IMAGE, LOCALE, SITE_URL } from '../seo/siteMeta'
import { useSiteSettings } from './SiteSettings'

// Dependency-free per-route metadata. React 18 does not hoist <meta> tags from
// the tree, and react-helmet is unmaintained, so we write the head directly.
const upsertMeta = (attribute, key, content) => {
  if (!content) return
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const upsertLink = (rel, href) => {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

const absoluteUrl = (path = '/') => {
  const origin =
    typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : SITE_URL
  return `${origin}${path}`
}

// The site name, home title and default description come from Site settings. `page` names
// a page whose title and description admins can change there; saved ones win over the
// `title` and `description` passed in.
function Seo({
  page,
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
  noIndex = false,
}) {
  const { seo } = useSiteSettings()
  const saved = (page && seo.pages[page]) || {}
  const siteName = seo.site_name
  const pageTitle = saved.title || title
  const metaDescription = saved.description || description || seo.description
  const fullTitle = pageTitle ? `${pageTitle} | ${siteName}` : seo.home_title
  const canonical = absoluteUrl(path)
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image)
  const serialisedJsonLd = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    document.title = fullTitle

    upsertMeta('name', 'description', metaDescription)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertLink('canonical', canonical)

    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:locale', LOCALE)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', metaDescription)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', imageUrl)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', metaDescription)
    upsertMeta('name', 'twitter:image', imageUrl)
  }, [fullTitle, metaDescription, siteName, canonical, imageUrl, type, noIndex])

  useEffect(() => {
    const scriptId = 'route-structured-data'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()
    if (!serialisedJsonLd) return undefined

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = serialisedJsonLd
    document.head.appendChild(script)

    return () => script.remove()
  }, [serialisedJsonLd])

  return null
}

export default Seo
