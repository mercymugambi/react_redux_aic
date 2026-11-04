// Shared by the public blog pages and the admin editor. Posts themselves come
// from the API (/api/v1/blog_posts); the backend keeps the same category list.

export const BLOG_CATEGORIES = ['Faith & Devotion', 'Church Life', 'Youth', 'Family', 'Outreach', 'Testimonies']

// Cover images: the backend accepts the same types and size
export const COVER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const COVER_IMAGE_MAX_BYTES = 10 * 1024 * 1024

// "2026-08-04" → "4 August 2026", read as a local date so it never shifts a day
export function formatPostDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate || '')
  if (!match) return ''
  return new Date(+match[1], +match[2] - 1, +match[3]).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// "Rev. Joseph Njuguna" → "JN"; used instead of author photos
export function initials(name = '') {
  const words = name.replace(/^(rev|pastor|bishop|dr|mr|mrs|ms|deacon|elder)\.?\s+/i, '').split(/\s+/).filter(Boolean)
  return words.length ? (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase() : ''
}

// Up to `limit` other posts, same category first, newest first within each group
export function relatedPosts(post, posts, limit = 3) {
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, limit)
}
