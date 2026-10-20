import React, { useCallback, useEffect, useState } from 'react'
import api from '../redux/api'
import { formatPostDate } from '../data/blog'
import { AuthorInitials } from './BlogParts'

export const COMMENT_MAX_LENGTH = 2000
const NAME_MAX_LENGTH = 80
const COMMENTER_KEY = 'aic-commenter'
const PENDING_KEY = 'aic-pending-comments'

const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}
const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode); the comment still posts
  }
}

// "just now", "5 minutes ago", "3 days ago", then the date
export function timeAgo(value, now = new Date()) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.round((now - date) / 1000))
  const ago = (amount, unit) => `${amount} ${unit}${amount === 1 ? '' : 's'} ago`
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return ago(Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return ago(Math.floor(seconds / 3600), 'hour')
  if (seconds < 7 * 86400) return ago(Math.floor(seconds / 86400), 'day')
  return formatPostDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
}

// Comments this visitor posted that are still waiting for approval, kept on their device per post
// so they can see them after a reload. Each is dropped once it shows up in the approved list.
function usePendingComments(slug) {
  const [pending, setPending] = useState(() => readStorage(PENDING_KEY, {})[slug] || [])

  useEffect(() => setPending(readStorage(PENDING_KEY, {})[slug] || []), [slug])

  const save = useCallback(
    (next) => {
      const all = readStorage(PENDING_KEY, {})
      if (next.length) all[slug] = next
      else delete all[slug]
      writeStorage(PENDING_KEY, all)
      setPending(next)
    },
    [slug]
  )

  return [pending, save]
}

// Approved comments on a published post, oldest first.
//   status: 'loading' | 'ready' | 'error' | 'unavailable' (the server has no comments API yet)
export function usePostComments(slug) {
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    let active = true
    setStatus('loading')
    api
      .get(`/api/v1/blog_posts/${encodeURIComponent(slug)}/comments`)
      .then((response) => {
        if (!active) return
        setComments(Array.isArray(response.data) ? response.data : [])
        setStatus('ready')
      })
      .catch((error) => {
        if (!active) return
        setComments([])
        setStatus(error?.response?.status === 404 ? 'unavailable' : 'error')
      })
    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => load(), [load])

  const add = useCallback((comment) => setComments((current) => [...current, comment]), [])

  return { comments, status, reload: load, add }
}

// Posts a comment. Resolves to the saved comment; throws with `messages` to show the visitor.
export async function submitComment(slug, fields) {
  try {
    const response = await api.post(`/api/v1/blog_posts/${encodeURIComponent(slug)}/comments`, { comment: fields })
    return response.data?.comment || {}
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data || {}
    let messages = Array.isArray(data.errors) && data.errors.length ? data.errors : data.error ? [data.error] : []
    if (!messages.length) {
      if (status === 429) messages = ['You’ve posted several comments in a short time. Please try again in a few minutes.']
      else if (status === 404) messages = ['Comments aren’t open on this article yet.']
      else messages = ['We couldn’t post your comment. Please check your connection and try again.']
    }
    throw Object.assign(new Error(messages.join(' ')), { messages })
  }
}

function CommentItem({ comment, awaiting = false }) {
  return (
    <li className="flex gap-4">
      <AuthorInitials name={comment.author_name} className="h-10 w-10 text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm font-bold text-slate-900">{comment.author_name}</p>
          <time dateTime={comment.created_at} className="text-xs text-slate-400">
            {timeAgo(comment.created_at)}
          </time>
          {awaiting && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
              Awaiting approval
            </span>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-line break-words text-[15px] leading-7 text-slate-700">{comment.body}</p>

        {comment.reply?.body && (
          <div className="mt-4 rounded-2xl border-l-4 border-red-700 bg-red-50/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              Reply from {comment.reply.author_name || 'AIC Kabuku'}
            </p>
            <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{comment.reply.body}</p>
          </div>
        )}
      </div>
    </li>
  )
}

const FIELD =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100'

function CommentForm({ slug, onPosted }) {
  // Name and email are remembered on this device for the next comment
  const [form, setForm] = useState(() => {
    const remembered = readStorage(COMMENTER_KEY, {})
    return { author_name: remembered.author_name || '', author_email: remembered.author_email || '', body: '', website: '' }
  })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState(null)

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const remaining = COMMENT_MAX_LENGTH - form.body.length

  const submit = async (event) => {
    event.preventDefault()
    const fields = { ...form, author_name: form.author_name.trim(), author_email: form.author_email.trim(), body: form.body.trim() }
    const problems = []
    if (!fields.author_name) problems.push('Please add your name.')
    if (!fields.body) problems.push('Please write a comment.')
    if (fields.author_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.author_email)) problems.push('That email address doesn’t look right.')
    setErrors(problems)
    setNotice(null)
    if (problems.length) return

    setBusy(true)
    try {
      const saved = await submitComment(slug, fields)
      writeStorage(COMMENTER_KEY, { author_name: fields.author_name, author_email: fields.author_email })
      const comment = { id: saved.id, author_name: saved.author_name || fields.author_name, body: saved.body || fields.body, created_at: saved.created_at || new Date().toISOString(), reply: null }
      // Comments go live straight away. 'pending' is only handled in case the server is set to hold them for review.
      const approved = saved.status !== 'pending'
      onPosted(comment, approved)
      setForm((current) => ({ ...current, body: '' }))
      setNotice(approved ? 'Thank you, your comment is posted.' : 'Thank you! Your comment will appear once it has been approved.')
    } catch (error) {
      setErrors(error.messages || [error.message])
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="comment-form-title">
      <h3 id="comment-form-title" className="text-base font-bold text-slate-900">
        Leave a comment
      </h3>
      <p className="mt-1 text-xs text-slate-500">Your comment appears as soon as you post it. Your email is never shown publicly.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Name <span className="text-red-700">*</span>
          <input name="author_name" value={form.author_name} onChange={update} maxLength={NAME_MAX_LENGTH} autoComplete="name" required className={FIELD} placeholder="Your name" />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Email <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
          <input name="author_email" type="email" value={form.author_email} onChange={update} autoComplete="email" className={FIELD} placeholder="So we can reply privately" />
        </label>
      </div>

      <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500">
        Comment <span className="text-red-700">*</span>
        <textarea name="body" value={form.body} onChange={update} maxLength={COMMENT_MAX_LENGTH} rows={5} required className={`${FIELD} resize-y`} placeholder="Share your thoughts, a testimony or a question…" />
      </label>

      {/* Left empty by people; bots that fill it in are ignored by the server */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs tabular-nums ${remaining < 100 ? 'font-semibold text-amber-700' : 'text-slate-400'}`}>{remaining} characters left</span>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-red-700 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? 'Posting…' : 'Post comment'}
        </button>
      </div>
    </form>
  )
}

function BlogComments({ slug }) {
  const { comments, status, reload, add } = usePostComments(slug)
  const [pending, setPending] = usePendingComments(slug)

  // Drop the visitor's waiting comments once they've been approved
  useEffect(() => {
    if (status !== 'ready' || !pending.length) return
    const approvedIds = new Set(comments.map((comment) => comment.id))
    const stillWaiting = pending.filter((comment) => !approvedIds.has(comment.id))
    if (stillWaiting.length !== pending.length) setPending(stillWaiting)
  }, [status, comments, pending, setPending])

  const onPosted = (comment, approved) => {
    if (approved) add(comment)
    else setPending([...pending, comment])
  }

  if (status === 'unavailable') return null

  const count = comments.length

  return (
    <section id="comments" aria-labelledby="comments-title" className="mt-12 scroll-mt-28 border-t border-slate-200 pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="comments-title" className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {status === 'ready' && count > 0 ? `${count} ${count === 1 ? 'Comment' : 'Comments'}` : 'Comments'}
        </h2>
        {status === 'ready' && count === 0 && !pending.length && <p className="text-sm text-slate-400">Be the first to share your thoughts.</p>}
      </div>

      {status === 'loading' && (
        <div className="mt-6 space-y-6" aria-label="Loading comments">
          {[0, 1].map((index) => (
            <div key={index} className="flex gap-4">
              <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-32 animate-pulse rounded bg-slate-100" />
                <span className="block h-3 w-full animate-pulse rounded bg-slate-100" />
              </span>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          We couldn’t load the comments.{' '}
          <button type="button" onClick={reload} className="font-semibold text-red-700 hover:underline">
            Try again
          </button>
        </p>
      )}

      {(count > 0 || pending.length > 0) && (
        <ol className="mt-6 space-y-8">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          {pending.map((comment) => (
            <CommentItem key={`pending-${comment.id}`} comment={comment} awaiting />
          ))}
        </ol>
      )}

      <div className="mt-10">
        <CommentForm slug={slug} onPosted={onPosted} />
      </div>
    </section>
  )
}

export default BlogComments
