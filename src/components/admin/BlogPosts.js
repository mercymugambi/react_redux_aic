import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../redux/api';
import { POST_CATEGORIES, readMinutes } from './BlogEditor';
import Icon from './Icon';
import { BUTTON, ConfirmDialog, isHttpUrl, PreviewBanner, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import useAdminList, { saveErrorMessages } from './useAdminList';
import { formatDate, parseDate } from './utils';

// Until the blog API exists the list is empty and a banner explains why (see useAdminList)
const NO_PREVIEW_POSTS = [];

const TABS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'published', label: 'Published', test: (post) => post.status !== 'draft' },
  { key: 'draft', label: 'Drafts', test: (post) => post.status === 'draft' },
];

const postDate = (post) => parseDate(post.published_on) || parseDate(post.created_at);
const newestFirst = (a, b) => (postDate(b)?.getTime() || 0) - (postDate(a)?.getTime() || 0);

const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

function StatusPill({ status }) {
  const draft = status === 'draft';
  return (
    <span className={`${PILL} ${draft ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {draft ? 'Draft' : 'Published'}
    </span>
  );
}

function Thumbnail({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 ring-1 ring-slate-200/70">
      {src && isHttpUrl(src) && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <Icon name="newspaper" className="h-5 w-5 text-red-200" />
      )}
    </span>
  );
}

function PostRow({ post, editPath, onDelete, onToggleFeatured }) {
  const date = postDate(post);
  const minutes = post.read_minutes || (post.body?.length ? readMinutes(post.body) : null);
  return (
    <li className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/70">
      <Thumbnail key={post.cover_image_url} src={post.cover_image_url} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <Link to={editPath} className="line-clamp-2 text-left text-[13px] font-medium text-slate-900 hover:text-red-700 focus-visible:outline-none focus-visible:underline">
            {post.title || 'Untitled post'}
          </Link>
          {post.featured && (
            <span title="Featured" className="mt-0.5 shrink-0 text-amber-500">
              <Icon name="star" className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="sr-only">Featured</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{post.excerpt || 'No summary yet.'}</p>
        {/* Compact details for narrow screens; the columns take over from lg */}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 lg:hidden">
          <StatusPill status={post.status} />
          {post.category && <span>{post.category}</span>}
          <span>{formatDate(date)}</span>
        </p>
      </div>
      <div className="hidden w-36 shrink-0 text-xs text-slate-600 lg:block">{post.category || <span className="text-slate-300">—</span>}</div>
      <div className="hidden w-40 shrink-0 xl:block">
        <p className="truncate text-xs font-medium text-slate-700">{post.author_name || <span className="font-normal text-slate-300">—</span>}</p>
        {post.author_role && <p className="truncate text-[11px] text-slate-400">{post.author_role}</p>}
      </div>
      <div className="hidden w-28 shrink-0 lg:block">
        <StatusPill status={post.status} />
      </div>
      <div className="hidden w-28 shrink-0 text-xs lg:block">
        <p className="text-slate-600">{formatDate(date)}</p>
        {minutes && <p className="text-[11px] text-slate-400">{minutes} min read</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onToggleFeatured}
          aria-label={post.featured ? 'Remove from featured' : 'Feature this post'}
          aria-pressed={Boolean(post.featured)}
          title={post.featured ? 'Remove from featured' : 'Feature this post'}
          className={`${ICON_ACTION} hidden sm:inline-flex ${post.featured ? 'border-amber-200 bg-amber-50 text-amber-500 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-600' : ''}`}
        >
          <Icon name="star" className="h-3.5 w-3.5" strokeWidth={post.featured ? 2.25 : 1.75} />
        </button>
        <Link to={editPath} aria-label={`Edit ${post.title}`} title="Edit" className={ICON_ACTION}>
          <Icon name="pencil" className="h-3.5 w-3.5" />
        </Link>
        <button type="button" onClick={onDelete} aria-label={`Delete ${post.title}`} title="Delete" className={ICON_ACTION}>
          <Icon name="trash" className="h-3.5 w-3.5" />
        </button>
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
function BlogPosts() {
  const { rows: posts, loading, refreshing, error, preview, updatedAt, load } = useAdminList('/api/v1/blog_posts?status=all', {
    label: 'blog posts',
    previewRows: NO_PREVIEW_POSTS,
  });
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [toast, flash] = useToast();

  // A message from the editor, e.g. after deleting a post there. Cleared from the
  // history entry so a refresh doesn't show it again.
  const arrivedWith = location.state?.flash;
  useEffect(() => {
    if (!arrivedWith) return;
    flash(arrivedWith);
    navigate(location.pathname, { replace: true, state: null });
  }, [arrivedWith, flash, navigate, location.pathname]);

  const counts = useMemo(() => Object.fromEntries(TABS.map(({ key, test }) => [key, posts.filter(test).length])), [posts]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const inTab = TABS.find(({ key }) => key === tab).test;
    return posts
      .filter((post) => inTab(post) && (!category || post.category === category))
      .filter((post) => !needle || [post.title, post.excerpt, post.author_name, ...(post.tags || [])].join(' ').toLowerCase().includes(needle))
      .sort(newestFirst);
  }, [posts, tab, category, query]);

  const filtersActive = tab !== 'all' || category || query.trim();
  const clearFilters = () => {
    setTab('all');
    setCategory('');
    setQuery('');
  };

  const toggleFeatured = async (post) => {
    setActionError(null);
    try {
      await api.patch(`/api/v1/blog_posts/${post.id}`, { blog_post: { featured: !post.featured } });
      flash(post.featured ? 'Removed from featured' : 'Now featured on the blog');
      load();
    } catch (err) {
      setActionError(saveErrorMessages(err, 'blog', 'Could not update the post.').join(' '));
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/blog_posts/${deleting.id}`);
      setDeleting(null);
      flash('Post deleted');
      load();
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'blog', 'Could not delete the post.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  const newPostButton = (
    <Link to="/admin/blog/new" className={PRIMARY_BUTTON}>
      <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
      New post
    </Link>
  );

  let list;
  if (loading) {
    list = (
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-14 w-20 rounded-lg" />
            <span className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </span>
          </li>
        ))}
      </ul>
    );
  } else if (error) {
    list = (
      <EmptyState icon="warning" title="Couldn’t load blog posts" message={error}>
        <button type="button" onClick={() => load()} className={BUTTON}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </EmptyState>
    );
  } else if (!posts.length) {
    list = (
      <EmptyState icon="newspaper" title="No posts yet" message="Share devotions, church news and testimonies with the congregation.">
        {newPostButton}
      </EmptyState>
    );
  } else if (!visible.length) {
    list = (
      <EmptyState icon="search" title="No posts match these filters" message="Try a different word, category or tab.">
        <button type="button" onClick={clearFilters} className={BUTTON}>
          <Icon name="close" className="h-3.5 w-3.5" />
          Clear filters
        </button>
      </EmptyState>
    );
  } else {
    list = (
      <>
        <div className="hidden items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-500 lg:flex">
          <span className="w-20 shrink-0" />
          <span className="flex-1">Post</span>
          <span className="w-36 shrink-0">Category</span>
          <span className="hidden w-40 shrink-0 xl:block">Author</span>
          <span className="w-28 shrink-0">Status</span>
          <span className="w-28 shrink-0">Date</span>
          <span className="w-[5.75rem] shrink-0 text-right">Actions</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {visible.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              editPath={`/admin/blog/${post.id}`}
              onDelete={() => {
                setDeleteError(null);
                setDeleting(post);
              }}
              onToggleFeatured={() => toggleFeatured(post)}
            />
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Blog</h1>
            <p className="mt-1 text-[13px] text-slate-500">Devotions, church news and testimonies published on the website.</p>
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="mr-1 hidden text-xs text-slate-400 md:inline">
                Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={() => load()} disabled={loading || refreshing} className={BUTTON}>
              <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {newPostButton}
          </div>
        </header>

        {preview && (
          <PreviewBanner>
            <span className="font-medium">Not connected yet.</span> The server doesn’t have the blog API yet, so there are no posts to show. Writing, publishing and
            deleting posts will start working once the blog API is added.
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
            <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Show posts">
              {TABS.map(({ key, label }) => {
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
                      <span className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-red-50 text-red-700' : 'bg-slate-200/60 text-slate-500'}`}>
                        {counts[key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[200px] flex-1 lg:w-64 lg:flex-none">
                <span className="sr-only">Search posts</span>
                <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, author, tag…"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label>
                <span className="sr-only">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">All categories</option>
                  {POST_CATEGORIES.map((name) => (
                    <option key={name} value={name}>
                      {name}
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
              {visible.length} of {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
          )}
        </section>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this post?"
          message={`“${deleting.title}” will be removed from the website. This can’t be undone.`}
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

export default BlogPosts;
