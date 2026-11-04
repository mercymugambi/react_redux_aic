import { useCallback, useEffect, useState } from 'react'
import api from '../redux/api'

// Loads the published posts for the public blog pages.
//   status: 'loading' | 'ready' | 'error'
// Until the blog API exists the server answers 404; that is treated as "no posts yet"
// rather than an error, so the page simply shows its empty state.
export function usePublishedPosts() {
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    let active = true
    setStatus('loading')
    api
      .get('/api/v1/blog_posts')
      .then((response) => {
        if (!active) return
        setPosts(Array.isArray(response.data) ? response.data : [])
        setStatus('ready')
      })
      .catch((error) => {
        if (!active) return
        setPosts([])
        setStatus(error?.response?.status === 404 ? 'ready' : 'error')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => load(), [load])

  return { posts, status, reload: load }
}

// Loads one published post by its slug.
//   status: 'loading' | 'ready' | 'not-found' | 'error'
export function usePublishedPost(slug) {
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    let active = true
    setStatus('loading')
    api
      .get(`/api/v1/blog_posts/${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!active) return
        setPost(response.data)
        setStatus('ready')
      })
      .catch((error) => {
        if (!active) return
        setPost(null)
        setStatus(error?.response?.status === 404 ? 'not-found' : 'error')
      })
    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => load(), [load])

  return { post, status, reload: load }
}
