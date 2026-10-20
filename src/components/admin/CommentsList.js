import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../redux/api';
import { COMMENT_MAX_LENGTH, timeAgo } from '../BlogComments';
import Icon from './Icon';
import { Avatar, BUTTON, ConfirmDialog, PreviewBanner, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import useAdminList, { saveErrorMessages } from './useAdminList';
import { formatDate, parseDate } from './utils';

// Until the comments API exists the list is empty and a banner explains why (see useAdminList)
const NO_PREVIEW_COMMENTS = [];

// Comments go live as soon as they're posted ('approved'); admins hide the ones that shouldn't be there.
// 'pending' only exists if the server holds comments for review, so its tab shows only when some are waiting.
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Visible' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'pending', label: 'Pending' },
];

const STATUS_STYLES = {
  pending: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  approved: { label: 'Visible', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  hidden: { label: 'Hidden', className: 'border-slate-200 bg-slate-100 text-slate-600' },
};

const newestFirst = (a, b) => (parseDate(b.created_at)?.getTime() || 0) - (parseDate(a.created_at)?.getTime() || 0);

const ACTION = 'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${style.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  );
}

function CommentRow({ comment, busy, onUpdate, onDelete }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  const created = parseDate(comment.created_at);
  const post = comment.blog_post;

  const openReply = () => {
    setReply(comment.reply?.body || '');
    setReplying(true);
  };

  const saveReply = async (approve) => {
    const changes = { reply_body: reply.trim() };
    if (approve) changes.status = 'approved';
    const ok = await onUpdate(changes, approve ? 'Reply posted and comment approved' : 'Reply saved');
    if (ok) setReplying(false);
  };

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex gap-3">
        <Avatar name={comment.author_name || '?'} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[13px] font-semibold text-slate-900">{comment.author_name}</p>
            {comment.author_email && (
              <a href={`mailto:${comment.author_email}`} className="text-xs text-slate-500 hover:text-red-700 hover:underline">
                {comment.author_email}
              </a>
            )}
            <span className="text-xs text-slate-400" title={created ? created.toLocaleString() : undefined}>
              · {timeAgo(comment.created_at)}
            </span>
            <span className="ml-auto">
              <StatusPill status={comment.status} />
            </span>
          </div>
          {post && (
            <p className="mt-0.5 text-xs text-slate-500">
              on{' '}
              <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="font-medium text-slate-700 hover:text-red-700 hover:underline">
                {post.title}
              </Link>
            </p>
          )}

          <p className="mt-2 whitespace-pre-line break-words text-[13px] leading-6 text-slate-700">{comment.body}</p>

          {comment.reply?.body && !replying && (
            <div className="mt-3 rounded-lg border-l-2 border-red-600 bg-red-50/50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
                Reply from {comment.reply.author_name || 'AIC Kabuku'}
                {comment.reply.created_at && <span className="font-normal normal-case tracking-normal text-red-400"> · {timeAgo(comment.reply.created_at)}</span>}
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-6 text-slate-700">{comment.reply.body}</p>
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <label htmlFor={`reply-${comment.id}`} className="sr-only">
                Reply to {comment.author_name}
              </label>
              <textarea
                id={`reply-${comment.id}`}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                maxLength={COMMENT_MAX_LENGTH}
                rows={3}
                autoFocus
                placeholder="Write a public reply. It appears under the comment on the website."
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                {comment.reply?.body && (
                  <button type="button" onClick={() => setReply('')} disabled={busy} className={`${ACTION} mr-auto text-slate-500 hover:text-red-700`}>
                    Clear reply
                  </button>
                )}
                <button type="button" onClick={() => setReplying(false)} disabled={busy} className={BUTTON}>
                  Cancel
                </button>
                {comment.status !== 'approved' && reply.trim() && (
                  <button type="button" onClick={() => saveReply(true)} disabled={busy} className={BUTTON}>
                    Reply &amp; approve
                  </button>
                )}
                <button type="button" onClick={() => saveReply(false)} disabled={busy || (!reply.trim() && !comment.reply?.body)} className={PRIMARY_BUTTON}>
                  {busy ? 'Saving…' : reply.trim() ? 'Save reply' : 'Remove reply'}
                </button>
              </div>
            </div>
          )}

          {!replying && (
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {comment.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => onUpdate({ status: 'approved' }, comment.status === 'hidden' ? 'Comment is back on the website' : 'Comment approved')}
                  disabled={busy}
                  className={`${ACTION} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                >
                  <Icon name={comment.status === 'hidden' ? 'eye' : 'check'} className="h-3.5 w-3.5" strokeWidth={2} />
                  {comment.status === 'hidden' ? 'Show again' : 'Approve'}
                </button>
              )}
              {comment.status !== 'hidden' && (
                <button type="button" onClick={() => onUpdate({ status: 'hidden' }, 'Comment hidden from the website')} disabled={busy} className={`${ACTION} text-slate-600 hover:bg-slate-100`}>
                  <Icon name="eyeSlash" className="h-3.5 w-3.5" />
                  Hide
                </button>
              )}
              <button type="button" onClick={openReply} disabled={busy} className={`${ACTION} text-slate-600 hover:bg-slate-100`}>
                <Icon name="chatBubble" className="h-3.5 w-3.5" />
                {comment.reply?.body ? 'Edit reply' : 'Reply'}
              </button>
              <button type="button" onClick={onDelete} disabled={busy} className={`${ACTION} text-red-700 hover:bg-red-50`}>
                <Icon name="trash" className="h-3.5 w-3.5" />
                Delete
              </button>
              {created && <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline">{formatDate(created)}</span>}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({ icon, title, message, children }) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{message}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

/* ── Page ── */
function CommentsList() {
  const { rows: comments, setRows, loading, refreshing, error, preview, updatedAt, load } = useAdminList('/api/v1/blog_comments?status=all', {
    label: 'comments',
    previewRows: NO_PREVIEW_COMMENTS,
  });
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, flash] = useToast();

  // ?post=12 narrows the list to one post (the Blog page links here like that)
  const postFilter = params.get('post') || '';
  const setPostFilter = (id) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set('post', id);
      else next.delete('post');
      return next;
    }, { replace: true });

  const posts = useMemo(() => {
    const byId = new Map();
    comments.forEach((comment) => comment.blog_post && byId.set(String(comment.blog_post.id), comment.blog_post));
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [comments]);

  const forPost = useMemo(() => comments.filter((comment) => !postFilter || String(comment.blog_post?.id) === postFilter), [comments, postFilter]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map(({ key }) => [key, key === 'all' ? forPost.length : forPost.filter((comment) => comment.status === key).length])),
    [forPost]
  );

  // The Pending tab disappears once nothing is waiting, so don't leave it selected
  useEffect(() => {
    if (tab === 'pending' && !loading && counts.pending === 0) setTab('all');
  }, [tab, loading, counts.pending]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return forPost
      .filter((comment) => tab === 'all' || comment.status === tab)
      .filter((comment) => !needle || [comment.author_name, comment.author_email, comment.body, comment.blog_post?.title].join(' ').toLowerCase().includes(needle))
      .sort(newestFirst);
  }, [forPost, tab, query]);

  const filtersActive = postFilter || query.trim();
  const clearFilters = () => {
    setQuery('');
    setPostFilter('');
  };

  // Saves a change and swaps in the server's copy of the comment, so the list updates without a reload
  const updateComment = async (comment, changes, message) => {
    setBusyId(comment.id);
    setActionError(null);
    try {
      const response = await api.patch(`/api/v1/blog_comments/${comment.id}`, { blog_comment: changes });
      const saved = response.data?.blog_comment;
      setRows((current) => current.map((row) => (row.id === comment.id ? { ...row, ...(saved || changes) } : row)));
      flash(message);
      return true;
    } catch (err) {
      setActionError(saveErrorMessages(err, 'comments', 'Could not update the comment.').join(' '));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/blog_comments/${deleting.id}`);
      setRows((current) => current.filter((row) => row.id !== deleting.id));
      setDeleting(null);
      flash('Comment deleted');
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'comments', 'Could not delete the comment.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  let list;
  if (loading) {
    list = (
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex gap-3 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <span className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </span>
          </li>
        ))}
      </ul>
    );
  } else if (error) {
    list = (
      <EmptyState icon="warning" title="Couldn’t load comments" message={error}>
        <button type="button" onClick={() => load()} className={BUTTON}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </EmptyState>
    );
  } else if (!comments.length) {
    list = <EmptyState icon="chatBubble" title="No comments yet" message="When visitors comment on a blog post, their comments show up here too." />;
  } else if (!visible.length) {
    list =
      tab === 'pending' && !filtersActive ? (
        <EmptyState icon="checkBadge" title="All caught up" message="No comments are waiting for approval." />
      ) : (
        <EmptyState icon="search" title="No comments match" message="Try a different word, post or tab.">
          {filtersActive && (
            <button type="button" onClick={clearFilters} className={BUTTON}>
              <Icon name="close" className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </EmptyState>
      );
  } else {
    list = (
      <ul className="divide-y divide-slate-100">
        {visible.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            busy={busyId === comment.id}
            onUpdate={(changes, message) => updateComment(comment, changes, message)}
            onDelete={() => {
              setDeleteError(null);
              setDeleting(comment);
            }}
          />
        ))}
      </ul>
    );
  }

  const pendingTotal = comments.filter((comment) => comment.status === 'pending').length;

  return (
    <>
      <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Comments</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              What visitors say on blog posts. Comments appear on the website as soon as they’re posted; hide any that shouldn’t be there.
              {!loading && pendingTotal > 0 && <span className="font-medium text-amber-700"> {pendingTotal} waiting for approval.</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="mr-1 hidden text-xs text-slate-400 md:inline">
                Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Link to="/admin/blog" className={BUTTON}>
              <Icon name="newspaper" className="h-3.5 w-3.5" />
              Blog posts
            </Link>
            <button type="button" onClick={() => load()} disabled={loading || refreshing} className={BUTTON}>
              <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {preview && (
          <PreviewBanner>
            <span className="font-medium">Not connected yet.</span> The server doesn’t have the comments API yet, so there are no comments to show. Approving,
            replying and deleting will start working once it’s added.
          </PreviewBanner>
        )}

        {actionError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="flex-1">{actionError}</p>
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss" className="text-red-400 hover:text-red-700">
              <Icon name="close" className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Show comments">
              {TABS.filter(({ key }) => key !== 'pending' || (!loading && counts.pending > 0)).map(({ key, label }) => {
                const active = key === tab;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-[13px] font-medium transition ${
                      active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                    {!loading && (
                      <span
                        className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${
                          key === 'pending' && counts.pending > 0 ? 'bg-amber-100 text-amber-800' : active ? 'bg-red-50 text-red-700' : 'bg-slate-200/60 text-slate-500'
                        }`}
                      >
                        {counts[key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[200px] flex-1 lg:w-64 lg:flex-none">
                <span className="sr-only">Search comments</span>
                <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, comment…"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label>
                <span className="sr-only">Post</span>
                <select
                  value={postFilter}
                  onChange={(event) => setPostFilter(event.target.value)}
                  className="h-8 max-w-[16rem] rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">All posts</option>
                  {posts.map((post) => (
                    <option key={post.id} value={String(post.id)}>
                      {post.title}
                    </option>
                  ))}
                </select>
              </label>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-slate-500 transition hover:text-red-700">
                  <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {list}

          {!loading && visible.length > 0 && (
            <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              {visible.length} of {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </p>
          )}
        </section>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this comment?"
          message={`${deleting.author_name}’s comment${deleting.reply?.body ? ' and your reply' : ''} will be removed for good. To take it off the website but keep it, hide it instead.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

export default CommentsList;
