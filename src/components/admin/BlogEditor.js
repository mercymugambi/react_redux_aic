import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../redux/api';
import { selectCurrentUser } from '../../redux/authSlice';
import { BLOG_CATEGORIES, formatPostDate } from '../../data/blog';
import { AuthorInitials } from '../BlogParts';
import { ArticleBlock, ArticleHeader } from '../BlogPost';
import BlockEditor, { GrowingField, useBodyHistory } from './BlockEditor';
import { readMinutes, toEditorBlocks, toSavedBlocks, wordCount } from './blogBody';
import { coverFileError, CoverPicker, useObjectUrl } from './CoverPicker';
import Icon from './Icon';
import { BUTTON, ConfirmDialog, lockPageScroll, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import { saveErrorMessages } from './useAdminList';
import { toIsoDay } from './utils';

export { blocksToText, imageIdsFromBlocks, insertImageLine, readMinutes, textToBlocks, wordCount } from './blogBody';
export { coverFileError } from './CoverPicker';

export const POST_CATEGORIES = BLOG_CATEGORIES;

/* ── Writing checks ──
   Friendly advice shown beside the editor. None of these block saving. */
const LONG_PARAGRAPH_WORDS = 120;
const NEEDS_HEADINGS_WORDS = 400;

export function postChecks({ title = '', excerpt = '', blocks = [], hasCover = false }) {
  const words = wordCount(blocks);
  const titleLength = title.trim().length;
  const excerptLength = excerpt.trim().length;
  const paragraphs = blocks.filter((block) => block.type === 'paragraph');
  const longParagraphs = paragraphs.filter((block) => wordCount([block]) > LONG_PARAGRAPH_WORDS).length;
  const quotes = blocks.filter((block) => block.type === 'quote');
  const quotesWithoutReference = quotes.filter((block) => !block.cite).length;
  const hasHeading = blocks.some((block) => block.type === 'heading');
  const uncaptioned = blocks.filter((block) => block.type === 'image' && !block.caption).length;

  return [
    {
      id: 'title',
      ok: titleLength >= 10 && titleLength <= 70,
      label: 'Clear, short title',
      tip: titleLength > 70 ? `${titleLength} characters: aim for 70 or fewer so it isn’t cut off in search results.` : 'Say what the post is about in a few words.',
    },
    {
      id: 'excerpt',
      ok: excerptLength >= 50,
      label: 'Summary that invites reading',
      tip: 'One or two sentences on why this post matters to the reader.',
    },
    { id: 'cover', ok: hasCover, label: 'Cover photo', tip: 'Posts with a photo get read more. Use a landscape photo from church life.' },
    { id: 'length', ok: words >= 150, label: 'Enough to say something', tip: `${words} words so far. Most good posts are 300–1,200 words.` },
    {
      id: 'headings',
      ok: words <= NEEDS_HEADINGS_WORDS || hasHeading,
      label: 'Headings in longer posts',
      tip: 'Add a heading every few paragraphs so readers can scan.',
    },
    {
      id: 'paragraphs',
      ok: longParagraphs === 0,
      label: 'Short paragraphs',
      tip: longParagraphs
        ? `${longParagraphs} ${longParagraphs === 1 ? 'paragraph is' : 'paragraphs are'} over ${LONG_PARAGRAPH_WORDS} words. Split at a new idea.`
        : 'Keep one idea per paragraph, about 2–4 sentences.',
    },
    {
      id: 'references',
      ok: quotesWithoutReference === 0,
      label: 'Scripture quotes have references',
      tip: 'Add the reference under each quote, e.g. John 3:16.',
    },
    {
      id: 'captions',
      ok: uncaptioned === 0,
      label: 'Photos in the post have captions',
      tip: 'Describe each photo in the caption under it.',
    },
  ];
}

// A skeleton to start from, written in the Text editor's conventions
export const STARTER_OUTLINE = [
  'Open with a short story, a question or a verse that draws the reader in.',
  '## The main idea',
  'Explain your main point in a few short paragraphs. Keep to one idea per paragraph.',
  '> Your key Scripture verse goes here.\n> — Book 1:1',
  '## What this means for us',
  '- A practical step readers can take this week\n- Another step\n- A third step',
  'Close with an encouragement, a short prayer or an invitation to join us on Sunday.',
].join('\n\n');

/* ── Saving ──
   Posts are sent as multipart form data so a cover photo can travel with them.
   Form data has no null or arrays of objects, so: blank text means "none", the
   body blocks are sent as a JSON string, and tags as repeated tags[] fields. */
export function buildPostFormData(payload, { coverFile = null, removeCover = false } = {}) {
  const data = new FormData();
  const field = (name, value) => data.append(`blog_post[${name}]`, value == null ? '' : String(value));

  ['title', 'slug', 'excerpt', 'category', 'status', 'published_on', 'author_name', 'author_role'].forEach((name) => field(name, payload[name]));
  field('featured', payload.featured ? 'true' : 'false');
  field('body', JSON.stringify(payload.body || []));
  if (payload.tags?.length) payload.tags.forEach((tag) => data.append('blog_post[tags][]', tag));
  else data.append('blog_post[tags][]', '');
  if (coverFile) data.append('blog_post[cover_image]', coverFile);
  else if (removeCover) field('remove_cover_image', 'true');
  return data;
}

// Photos inside a post upload as soon as they are picked, so they can be placed
// and previewed while writing; saving the post then links them to it by image_id.
export async function uploadBodyImage(file) {
  const data = new FormData();
  data.append('blog_post_image[image]', file);
  const response = await api.post('/api/v1/blog_post_images', data);
  const image = response.data?.blog_post_image;
  if (!image?.id || !image?.url) throw new Error('The server did not return the uploaded photo.');
  return image;
}

export const slugify = (title) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/* ── Editor state ── */
const TITLE_LIMIT = 150;
const EXCERPT_LIMIT = 220;
const TAG_LIMIT = 10;
// In the order they appear, so a failed check focuses the first one
const FIELD_ORDER = ['title', 'excerpt', 'body', 'category', 'published_on', 'cover'];
const SETTINGS_FIELDS = ['category', 'published_on', 'cover'];

const CATEGORY_ICONS = {
  'Faith & Devotion': 'book',
  'Church Life': 'home',
  Youth: 'sparkles',
  Family: 'heart',
  Outreach: 'globe',
  Testimonies: 'chatBubble',
};

function formFromPost(post, user) {
  const today = toIsoDay(new Date());
  return {
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    category: post?.category || '',
    published_on: post?.published_on || today,
    tags: post?.tags || [],
    author_name: post ? post.author_name || '' : [user?.firstname, user?.lastname].filter(Boolean).join(' '),
    author_role: post?.author_role || '',
    featured: Boolean(post?.featured),
  };
}

// Everything a save sends except the cover photo, as one string: comparing two of
// these tells whether anything changed
const snapshotOf = (form, blocks) => JSON.stringify({ ...form, body: toSavedBlocks(blocks) });

/* Unsaved changes are kept in this browser too, so they survive a refresh, a crash or the
   Back button, and can be restored when the post is opened again. The cover photo isn't
   kept: a file can't be stored. */
const backupKey = (post) => `aic-admin:blog-backup:${post ? post.id : 'new'}`;
const SETTINGS_KEY = 'aic-admin:blog-editor-settings';

function readStored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStored(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (error) {
    // Storage can be full or blocked; the editor works without it
  }
}

function readBackup(key) {
  try {
    const backup = JSON.parse(readStored(key));
    return typeof backup?.snapshot === 'string' ? backup : null;
  } catch (error) {
    return null;
  }
}

const timeOf = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function savedLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Saved';
  const today = date.toDateString() === new Date().toDateString();
  return `Saved ${today ? timeOf(date) : date.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

/* ── Sidebar pieces ── */
function Card({ title, badge, defaultOpen = true, forceOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const expanded = open || forceOpen;
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2>
        <button
          type="button"
          onClick={() => setOpen(!expanded)}
          aria-expanded={expanded}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
        >
          <span className="text-[13px] font-semibold text-slate-900">{title}</span>
          <span className="flex items-center gap-2">
            {badge}
            <Icon name="chevronDown" className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />
          </span>
        </button>
      </h2>
      <div id={id} hidden={!expanded} className="border-t border-slate-100 px-4 pb-4 pt-3">
        {children}
      </div>
    </section>
  );
}

function SettingRow({ icon, label, action, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="mt-0.5 text-[13px] font-medium text-slate-900">{children}</div>
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}

const LINK_ACTION = 'rounded text-[13px] font-medium text-red-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 ${
        checked ? 'bg-red-700' : 'bg-slate-200'
      }`}
    >
      <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

function TagInput({ tags, onChange }) {
  const [draft, setDraft] = useState('');

  const add = (text) => {
    const next = [...tags];
    text
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        if (next.length < TAG_LIMIT && !next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag);
      });
    onChange(next);
    setDraft('');
  };

  return (
    <div>
      <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 py-0.5 pl-2 pr-0.5 text-xs font-medium text-slate-700">
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((other) => other !== tag))}
              aria-label={`Remove the tag ${tag}`}
              className="rounded p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <Icon name="close" className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        {tags.length < TAG_LIMIT && (
          <input
            id="post-tags"
            value={draft}
            onChange={(event) => (event.target.value.includes(',') ? add(event.target.value) : setDraft(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add(draft);
              } else if (event.key === 'Backspace' && !draft && tags.length) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            placeholder={tags.length ? 'Add another…' : 'e.g. Prayer, Hope'}
            className="min-w-[7rem] flex-1 border-0 bg-transparent px-1.5 py-0.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        )}
      </div>
      <p className="mt-1.5 flex justify-between gap-2 text-xs text-slate-400">
        <span>Press Enter or a comma after each tag.</span>
        <span className="tabular-nums">
          {tags.length}/{TAG_LIMIT}
        </span>
      </p>
    </div>
  );
}

function Checklist({ checks }) {
  return (
    <ul className="space-y-2">
      {checks.map((check) => (
        <li key={check.id} className="flex gap-2.5 text-xs">
          <span
            className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              check.ok ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-500 ring-1 ring-amber-200'
            }`}
          >
            <Icon name={check.ok ? 'check' : 'info'} className="h-2.5 w-2.5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className={check.ok ? 'text-slate-500' : 'font-medium text-slate-800'}>{check.label}</span>
            {!check.ok && <span className="mt-0.5 block leading-snug text-slate-500">{check.tip}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const GUIDE = [
  {
    title: 'Before you start',
    points: [
      'Know the one thing you want readers to take away, and write toward it.',
      'Write for someone reading on a phone between other things: short, warm and clear.',
    ],
  },
  {
    title: 'Structure',
    points: [
      'Open with a story, a question or a verse that draws the reader in.',
      'Keep paragraphs to one idea and 2–4 sentences.',
      'In posts over about 400 words, add a heading every few paragraphs so readers can scan.',
      'Use a list for practical steps, prayer points or event details.',
      'End with something to do: an encouragement, a short prayer or an invitation.',
    ],
  },
  {
    title: 'Scripture and quotes',
    points: ['Put a key verse in a quote block and give its reference underneath.', 'Check every reference and quote before publishing.'],
  },
  {
    title: 'Photos and people',
    points: [
      'Use real photos from church life. Ask before featuring someone, and get a parent’s permission for children.',
      'Choose a landscape cover photo that is sharp and well lit; it is cropped to a wide banner.',
      'Give every photo in the post a caption.',
      'Ask permission before sharing someone’s personal story or testimony, and use only the names they agree to.',
    ],
  },
  {
    title: 'Before you publish',
    points: [
      'Use Preview and read the post aloud once: it catches most mistakes.',
      'Check names, dates, times and places in church news.',
      'Not ready? Save it as a draft. Only admins can see drafts.',
    ],
  },
];

/* ── Preview: the post as the website shows it ── */
function PostPreview({ post, draft, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const unlockScroll = lockPageScroll();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Preview of the post" data-post-preview className="admin-fade-in fixed inset-0 z-60 overflow-y-auto bg-white font-sans text-slate-900 antialiased">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
          <Icon name="eye" className="h-3.5 w-3.5" />
          Preview
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] text-slate-500">
          This is how the post will look on the website.{draft && ' It’s a draft, so only admins can see it.'}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className={BUTTON}>
          <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
          Close preview
        </button>
      </div>
      {/* Links in the article would leave the editor, so they don't go anywhere here */}
      <div
        onClickCapture={(event) => {
          if (event.target.closest('a')) event.preventDefault();
        }}
      >
        <ArticleHeader post={post} />
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          {post.body.length ? (
            post.body.map((block, index) => <ArticleBlock key={`${block.type}-${index}-${block.url || ''}`} block={block} />)
          ) : (
            <p className="text-base text-slate-400">Nothing written yet.</p>
          )}
          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-8">
              <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Tags</span>
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>,
    document.body
  );
}

/* ── The editor ── */
// Bar buttons: one shape, and a complete set of colours per kind, so no two colour
// classes ever compete on the same button
const BAR_BUTTON =
  'shrink-0 items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';
const BAR_COLORS = {
  plain: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
  on: 'border-red-200 bg-red-50 text-red-700',
  danger: 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700',
  dark: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700',
};
const barButton = (colors, layout = 'inline-flex h-8 w-8') => `${BAR_BUTTON} ${BAR_COLORS[colors]} ${layout}`;

const STATUS_STYLES = {
  published: { label: 'Published', dot: 'bg-emerald-500', chip: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  draft: { label: 'Draft', dot: 'bg-amber-500', chip: 'border-amber-200 bg-amber-50 text-amber-700' },
  new: { label: 'New', dot: 'bg-slate-400', chip: 'border-slate-200 bg-slate-50 text-slate-600' },
};

function PostEditor({ post, onSaved }) {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [initial] = useState(() => {
    const form = formFromPost(post, user);
    const blocks = toEditorBlocks(post?.body);
    return { form, blocks, snapshot: snapshotOf(form, blocks) };
  });
  const [form, setForm] = useState(initial.form);
  const history = useBodyHistory(() => initial.blocks);
  const { blocks } = history;
  const [baseline, setBaseline] = useState(initial.snapshot);
  const [restorable, setRestorable] = useState(() => {
    const backup = readBackup(backupKey(post));
    return backup && backup.snapshot !== initial.snapshot ? backup : null;
  });
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [showSettings, setShowSettings] = useState(() => readStored(SETTINGS_KEY) !== 'hidden');
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toolbarTop, setToolbarTop] = useState(0);
  const [toast, flash] = useToast();
  const barRef = useRef(null);
  const titleRef = useRef(null);
  const excerptRef = useRef(null);
  const dateRef = useRef(null);
  const coverRef = useRef(null);
  const bodyFocus = useRef(null);
  const quickSave = useRef(null);

  const editing = Boolean(post);
  const status = post?.status === 'published' ? 'published' : editing ? 'draft' : 'new';
  const slug = editing && post.slug ? post.slug : slugify(form.title);
  const savedBlocks = toSavedBlocks(blocks);
  const snapshot = snapshotOf(form, blocks);
  const dirty = snapshot !== baseline || Boolean(coverFile) || removeCover;
  const coverPreview = useObjectUrl(coverFile);
  const coverUrl = coverPreview || (removeCover ? null : post?.cover_image_url || null);
  const checks = postChecks({ title: form.title, excerpt: form.excerpt, blocks: savedBlocks, hasCover: Boolean(coverUrl) });
  const checksDone = checks.filter((check) => check.ok).length;
  const storageKey = backupKey(post);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Writing in the body answers "write the post before publishing"
  useEffect(() => {
    setErrors((prev) => (prev.body ? { ...prev, body: '' } : prev));
  }, [blocks]);

  /* Keep the formatting toolbar just below the sticky bar */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const measure = () => setToolbarTop(bar.offsetHeight + (parseFloat(getComputedStyle(bar).top) || 0));
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(bar);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    writeStored(SETTINGS_KEY, showSettings ? null : 'hidden');
  }, [showSettings]);

  /* Unsaved changes: a backup in this browser, and a warning before leaving the page */
  useEffect(() => {
    if (!dirty) {
      if (!restorable) writeStored(storageKey, null);
      return undefined;
    }
    const timer = setTimeout(() => writeStored(storageKey, JSON.stringify({ savedAt: Date.now(), postUpdatedAt: post?.updated_at || null, snapshot })), 800);
    return () => clearTimeout(timer);
  }, [dirty, snapshot, storageKey, restorable, post]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    // Links inside the admin (the sidebar, "All posts") ask first
    const guardLinks = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || link.closest('[data-post-preview]') || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (window.confirm('Leave this page? Your changes to this post haven’t been saved.')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    document.addEventListener('click', guardLinks, true);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      document.removeEventListener('click', guardLinks, true);
    };
  }, [dirty]);

  const restoreBackup = () => {
    const { body, ...fields } = JSON.parse(restorable.snapshot);
    setForm({ ...initial.form, ...fields });
    history.change(toEditorBlocks(body));
    setRestorable(null);
  };

  const dismissBackup = () => {
    writeStored(storageKey, null);
    setRestorable(null);
  };

  /* Cover photo */
  const pickCover = (file) => {
    setCoverFile(file);
    setRemoveCover(false);
    setErrors((prev) => ({ ...prev, cover: coverFileError(file) }));
  };
  const clearCover = () => {
    setCoverFile(null);
    setRemoveCover(Boolean(post?.cover_image_url));
    setErrors((prev) => ({ ...prev, cover: '' }));
  };

  const uploadImage = useCallback(async (file) => {
    const problem = coverFileError(file);
    if (problem) throw new Error(problem);
    try {
      return await uploadBodyImage(file);
    } catch (err) {
      throw new Error(saveErrorMessages(err, 'blog photo', 'Could not upload the photo. Please try again.').join(' '));
    }
  }, []);

  /* Saving. A draft only needs a title; publishing needs everything readers will see. */
  const focusers = {
    title: () => titleRef.current?.focus(),
    excerpt: () => excerptRef.current?.focus(),
    body: () => bodyFocus.current?.(),
    category: () => document.querySelector('input[name="post-category"]')?.focus(),
    published_on: () => {
      setEditingDate(true);
      setTimeout(() => dateRef.current?.focus(), 0);
    },
    cover: () => coverRef.current?.focus(),
  };

  const validate = (publishing) => {
    const next = {};
    if (!form.title.trim()) next.title = 'Give the post a title';
    if (publishing) {
      if (!form.excerpt.trim()) next.excerpt = 'Add a short summary for the blog list';
      if (!savedBlocks.length) next.body = 'Write the post before publishing';
      if (!form.category) next.category = 'Pick a category';
      if (!form.published_on) next.published_on = 'Pick the publish date';
    }
    if (savedBlocks.some((block) => block.type === 'image' && !block.image_id)) {
      next.body = 'A photo in the text wasn’t uploaded here. Remove its ![…](…) line and use Add photo instead.';
    }
    const coverError = coverFileError(coverFile);
    if (coverError) next.cover = coverError;
    setErrors(next);
    return next;
  };

  const save = async (nextStatus) => {
    if (saving) return;
    setServerErrors([]);
    const invalid = validate(nextStatus === 'published');
    const first = FIELD_ORDER.find((name) => invalid[name]);
    if (first) {
      if (SETTINGS_FIELDS.includes(first)) setShowSettings(true);
      setTimeout(() => focusers[first](), 0);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim(),
      body: savedBlocks,
      category: form.category || null,
      status: nextStatus,
      published_on: form.published_on || null,
      featured: form.featured,
      tags: form.tags,
      author_name: form.author_name.trim() || null,
      author_role: form.author_role.trim() || null,
    };
    const sentSnapshot = snapshot;
    const sentCover = coverFile;

    setSaving(nextStatus);
    try {
      const data = buildPostFormData(payload, { coverFile, removeCover });
      const response = editing ? await api.patch(`/api/v1/blog_posts/${post.id}`, data) : await api.post('/api/v1/blog_posts', data);
      // Anything typed while the save was on its way still counts as unsaved
      setBaseline(sentSnapshot);
      setCoverFile((current) => (current === sentCover ? null : current));
      setRemoveCover(false);
      writeStored(storageKey, null);
      if (nextStatus === 'draft') flash(status === 'published' ? 'Moved to drafts: it’s no longer on the website' : 'Draft saved');
      else flash(status === 'published' ? 'Changes published' : 'Post published');
      onSaved(response.data?.blog_post || { ...post, ...payload, cover_image_url: post?.cover_image_url || null });
    } catch (err) {
      setServerErrors(saveErrorMessages(err, 'blog', 'Could not save the post. Please try again.'));
    } finally {
      setSaving(null);
    }
  };

  // Ctrl+S / ⌘S saves: an update for a published post, a draft otherwise
  quickSave.current = () => {
    if (!previewing && !confirming) save(status === 'published' ? 'published' : 'draft');
  };
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        quickSave.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* Delete, or throw away a post that was never saved */
  const requestDelete = () => {
    if (!editing && !dirty) navigate('/admin/blog');
    else setConfirming(editing ? 'delete' : 'discard');
  };

  const confirmDelete = async () => {
    if (!editing) {
      writeStored(storageKey, null);
      navigate('/admin/blog');
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/blog_posts/${post.id}`);
      writeStored(storageKey, null);
      navigate('/admin/blog', { state: { flash: 'Post deleted' } });
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'blog', 'Could not delete the post.').join(' '));
      setDeleteBusy(false);
    }
  };

  const problems = [
    ...FIELD_ORDER.filter((name) => errors[name]).map((name) => ({ name, message: errors[name] })),
    ...serverErrors.map((message) => ({ message })),
  ];
  const statusStyle = STATUS_STYLES[status];
  const publishLabel = status === 'published' ? 'Update' : 'Publish';
  const draftLabel = status === 'published' ? 'Switch to draft' : 'Save draft';
  let saveState = editing ? savedLabel(post.updated_at) : 'Not saved yet';
  if (dirty) saveState = 'Unsaved changes';
  if (saving) saveState = 'Saving…';
  const publicPath = `/blog/${slug}`;
  const today = toIsoDay(new Date());

  const previewPost = {
    title: form.title.trim() || 'Untitled post',
    excerpt: form.excerpt.trim(),
    category: form.category,
    author_name: form.author_name.trim(),
    author_role: form.author_role.trim(),
    published_on: form.published_on,
    read_minutes: readMinutes(savedBlocks),
    cover_image_url: coverUrl,
    body: savedBlocks,
    tags: form.tags,
  };

  return (
    <>
      <div className="-mx-4 -my-6 min-h-[calc(100%+3rem)] bg-slate-50 font-sans text-slate-900 antialiased sm:-mx-6 lg:-mx-8 lg:-my-7 lg:min-h-[calc(100%+3.5rem)]">
        {/* Sticky bar: where you are, what state the post is in, and the actions. From lg the
            page scrolls inside <main>, whose top padding sticky positions keep clear of, so the
            bar sits that much higher to stay flush with the top. */}
        <div ref={barRef} className="sticky top-14 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:-top-7 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2.5">
            <Link to="/admin/blog" aria-label="All posts" title="All posts" className={barButton('plain', 'inline-flex h-9 w-9')}>
              <Icon name="arrowLeft" className="h-4 w-4" />
            </Link>
            {/* Keeps enough room for the title; on narrow screens the buttons wrap below instead */}
            <div className="min-w-[11rem] flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-[22px] sm:leading-7">{editing ? 'Edit post' : 'New post'}</h1>
              <p className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-px text-[11px] font-medium ${statusStyle.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
                <span className={`truncate ${dirty && !saving ? 'text-amber-700' : ''}`}>{saveState}</span>
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              <button type="button" onClick={() => setPreviewing(true)} aria-label="Preview" title="Preview the post as readers will see it" className={barButton('plain', 'inline-flex h-8 px-2.5')}>
                <Icon name="eye" className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSettings((shown) => !shown)}
                aria-pressed={showSettings}
                aria-label={showSettings ? 'Hide the settings panel' : 'Show the settings panel'}
                title={showSettings ? 'Hide settings' : 'Show settings'}
                className={barButton(showSettings ? 'on' : 'plain', 'hidden h-8 w-8 min-[1240px]:inline-flex')}
              >
                <Icon name="panelRight" className="h-4 w-4" />
              </button>
              <button type="button" onClick={requestDelete} aria-label={editing ? 'Delete post' : 'Discard post'} title={editing ? 'Delete post' : 'Discard post'} className={barButton('danger')}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
              {editing && (
                <Link to="/admin/blog/new" aria-label="New post" title="New post" className={barButton('dark')}>
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2} />
                </Link>
              )}
              <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
              <button type="button" onClick={() => save('draft')} disabled={Boolean(saving)} className={BUTTON}>
                {saving === 'draft' ? 'Saving…' : draftLabel}
              </button>
              <button type="button" onClick={() => save('published')} disabled={Boolean(saving)} className={PRIMARY_BUTTON}>
                {saving === 'published' ? (status === 'published' ? 'Updating…' : 'Publishing…') : publishLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <div className={`grid items-start gap-6 ${showSettings ? 'min-[1240px]:grid-cols-[minmax(0,1fr)_20rem]' : ''}`}>
            {/* Writing */}
            <div className={`min-w-0 space-y-4 ${showSettings ? '' : 'min-[1240px]:mx-auto min-[1240px]:w-full min-[1240px]:max-w-4xl'}`}>
              {restorable && (
                <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-[13px] text-sky-900">
                  <Icon name="clock" className="h-4 w-4 shrink-0 text-sky-600" />
                  <p className="min-w-0 flex-1">
                    <span className="font-medium">You have unsaved changes from {new Date(restorable.savedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.</span>{' '}
                    {post?.updated_at && restorable.postUpdatedAt && post.updated_at !== restorable.postUpdatedAt
                      ? 'The post has been saved since then, so restoring will replace those changes.'
                      : 'They were kept in this browser.'}
                  </p>
                  <span className="flex gap-2">
                    <button type="button" onClick={dismissBackup} className={`${BUTTON} h-7 border-sky-200 text-sky-800 hover:bg-sky-100`}>
                      Discard
                    </button>
                    <button type="button" onClick={restoreBackup} className="inline-flex h-7 items-center rounded-lg bg-sky-700 px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-sky-800">
                      Restore
                    </button>
                  </span>
                </div>
              )}

              {problems.length > 0 && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                  <p className="flex items-center gap-2 font-medium">
                    <Icon name="warning" className="h-4 w-4 shrink-0 text-red-600" />
                    {serverErrors.length && problems.length === serverErrors.length ? 'The post couldn’t be saved' : 'A few things need fixing first'}
                  </p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-10">
                    {problems.map((problem) => (
                      <li key={problem.message}>
                        {problem.name ? (
                          <button type="button" onClick={() => focusers[problem.name]()} className="text-left underline-offset-2 hover:underline">
                            {problem.message}
                          </button>
                        ) : (
                          problem.message
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Title and summary */}
              <section aria-label="Title and summary" className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="relative px-5 pt-5 sm:px-8 sm:pt-7">
                  <label htmlFor="post-title" className="sr-only">
                    Title
                  </label>
                  <GrowingField
                    ref={titleRef}
                    id="post-title"
                    value={form.title}
                    onChange={(event) => set('title', event.target.value.replace(/\s*\n\s*/g, ' '))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        excerptRef.current?.focus();
                      }
                    }}
                    maxLength={TITLE_LIMIT}
                    placeholder="Add a title"
                    aria-invalid={Boolean(errors.title)}
                    wrapperClassName="pr-8 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[28px]"
                    className="placeholder:text-slate-300"
                  />
                  <Icon name="pencil" className="pointer-events-none absolute right-5 top-6 h-4 w-4 text-slate-300 sm:right-8 sm:top-9" />
                  {errors.title && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>}
                </div>
                <div className="mx-5 my-4 border-t border-dashed border-slate-200 sm:mx-8" />
                <div className="px-5 pb-5 sm:px-8 sm:pb-6">
                  <label htmlFor="post-excerpt" className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Summary
                    <span className={`font-medium normal-case tracking-normal tabular-nums ${form.excerpt.length > EXCERPT_LIMIT - 20 ? 'text-amber-600' : ''}`}>
                      {form.excerpt.length}/{EXCERPT_LIMIT}
                    </span>
                  </label>
                  <GrowingField
                    ref={excerptRef}
                    id="post-excerpt"
                    value={form.excerpt}
                    onChange={(event) => set('excerpt', event.target.value.replace(/\s*\n\s*/g, ' '))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        bodyFocus.current?.();
                      }
                    }}
                    maxLength={EXCERPT_LIMIT}
                    placeholder="One or two sentences that make people want to read on."
                    aria-invalid={Boolean(errors.excerpt)}
                    aria-describedby="post-excerpt-hint"
                    wrapperClassName="mt-1.5 text-[15px] leading-relaxed text-slate-600"
                    className="placeholder:text-slate-300"
                  />
                  {errors.excerpt ? (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.excerpt}</p>
                  ) : (
                    <p id="post-excerpt-hint" className="mt-1.5 text-xs text-slate-400">
                      Shown under the title, on the blog page and in search results.
                    </p>
                  )}
                </div>
              </section>

              <p className="flex min-w-0 items-center gap-1.5 px-1 text-xs text-slate-500">
                <Icon name="link" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">
                  {window.location.host}/blog/<span className="font-medium text-slate-700">{slug || '…'}</span>
                </span>
                {!editing && <span className="shrink-0 text-slate-400">· made from the title</span>}
              </p>

              <BlockEditor history={history} uploadImage={uploadImage} error={errors.body} outline={STARTER_OUTLINE} stickyTop={toolbarTop} focusRef={bodyFocus} />
            </div>

            {/* Settings */}
            <aside aria-label="Post settings" className={`space-y-4 ${showSettings ? '' : 'min-[1240px]:hidden'}`}>
              <Card title="Publishing" forceOpen={Boolean(errors.published_on)}>
                <div className="-my-1 divide-y divide-slate-100">
                  <SettingRow icon="clock" label="Status">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                      {status === 'new' ? 'Not saved yet' : statusStyle.label}
                    </span>
                  </SettingRow>
                  <SettingRow icon="eye" label="Visibility">
                    {status === 'published' ? 'Everyone on the website' : 'Only admins'}
                  </SettingRow>
                  <SettingRow
                    icon="calendar"
                    label="Publish date"
                    action={
                      !editingDate && (
                        <button type="button" onClick={() => focusers.published_on()} className={LINK_ACTION}>
                          Edit
                        </button>
                      )
                    }
                  >
                    {editingDate ? (
                      <div className="mt-1 flex items-center gap-2">
                        <label htmlFor="post-date" className="sr-only">
                          Publish date
                        </label>
                        <input
                          ref={dateRef}
                          id="post-date"
                          type="date"
                          value={form.published_on}
                          onChange={(event) => set('published_on', event.target.value)}
                          aria-invalid={Boolean(errors.published_on)}
                          className={`h-8 min-w-0 flex-1 rounded-lg border bg-white px-2.5 text-[13px] font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-100 ${
                            errors.published_on ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'
                          }`}
                        />
                        <button type="button" onClick={() => setEditingDate(false)} className={LINK_ACTION}>
                          Done
                        </button>
                      </div>
                    ) : (
                      formatPostDate(form.published_on) || <span className="font-normal text-slate-400">Not set</span>
                    )}
                    {errors.published_on && <p className="mt-1 text-xs font-medium text-red-600">{errors.published_on}</p>}
                    {form.published_on > today && <p className="mt-1 text-xs font-normal text-slate-500">A future date doesn’t delay publishing: the post goes live when you publish it.</p>}
                  </SettingRow>
                  <SettingRow icon="star" label="Featured" action={<Switch checked={form.featured} onChange={(value) => set('featured', value)} label="Feature this post" />}>
                    {form.featured ? 'At the top of the blog page' : 'No'}
                    {form.featured && <span className="mt-0.5 block text-xs font-normal text-slate-500">Replaces the post featured now.</span>}
                  </SettingRow>
                  <SettingRow
                    icon="link"
                    label="Web address"
                    action={
                      status === 'published' && (
                        <a href={publicPath} target="_blank" rel="noreferrer" className={`${LINK_ACTION} inline-flex items-center gap-0.5`}>
                          View
                          <Icon name="arrowUpRight" className="h-3 w-3" strokeWidth={2} />
                        </a>
                      )
                    }
                  >
                    <span className="block truncate font-normal text-slate-700">{slug ? publicPath : 'Add a title first'}</span>
                  </SettingRow>
                </div>
              </Card>

              <Card title="Category" forceOpen={Boolean(errors.category)} badge={form.category ? null : <span className="text-[11px] font-medium text-slate-400">Needed to publish</span>}>
                <div role="radiogroup" aria-label="Category" className="space-y-1">
                  {POST_CATEGORIES.map((name) => {
                    const selected = form.category === name;
                    return (
                      <label
                        key={name}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition ${
                          selected ? 'bg-red-50/70 ring-1 ring-red-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-red-700 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon name={CATEGORY_ICONS[name] || 'tag'} className="h-3.5 w-3.5" />
                        </span>
                        <span className={`flex-1 text-[13px] font-medium ${selected ? 'text-red-900' : 'text-slate-700'}`}>{name}</span>
                        <input type="radio" name="post-category" value={name} checked={selected} onChange={() => set('category', name)} className="h-4 w-4 shrink-0 cursor-pointer accent-red-700" />
                      </label>
                    );
                  })}
                </div>
                {errors.category && <p className="mt-2 text-xs font-medium text-red-600">{errors.category}</p>}
              </Card>

              <Card title="Cover photo" forceOpen={Boolean(errors.cover)}>
                <CoverPicker
                  url={coverUrl}
                  file={coverFile}
                  removed={removeCover}
                  hadCover={Boolean(post?.cover_image_url)}
                  error={errors.cover}
                  onPick={pickCover}
                  onRemove={clearCover}
                  buttonRef={coverRef}
                />
              </Card>

              <Card title="Tags">
                <label htmlFor="post-tags" className="sr-only">
                  Tags
                </label>
                <TagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
              </Card>

              <Card title="Author">
                <div className="flex items-center gap-3">
                  <AuthorInitials name={form.author_name} className="h-10 w-10 text-xs" />
                  <div className="min-w-0 text-[13px] leading-tight">
                    <p className="truncate font-semibold text-slate-900">{form.author_name.trim() || 'No author shown'}</p>
                    <p className="truncate text-xs text-slate-500">{form.author_role.trim() || 'Shown on the post as the writer'}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <label htmlFor="post-author" className="block text-xs font-medium text-slate-600">
                      Name
                    </label>
                    <input
                      id="post-author"
                      value={form.author_name}
                      onChange={(event) => set('author_name', event.target.value)}
                      placeholder="Rev. Joseph Njuguna"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="post-author-role" className="block text-xs font-medium text-slate-600">
                      Role <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="post-author-role"
                      value={form.author_role}
                      onChange={(event) => set('author_role', event.target.value)}
                      placeholder="Senior Pastor"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </Card>

              <Card
                title="Ready to publish?"
                badge={
                  <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${checksDone === checks.length ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {checksDone}/{checks.length}
                  </span>
                }
              >
                <div aria-hidden="true" className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(checksDone / checks.length) * 100}%` }} />
                </div>
                <Checklist checks={checks} />
                <p className="mt-3 text-[11px] text-slate-400">Suggestions only: you can still save.</p>
              </Card>

              <Card title="Writing guide" defaultOpen={false}>
                <div className="space-y-3.5">
                  {GUIDE.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-xs font-semibold text-slate-800">{section.title}</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {previewing && <PostPreview post={previewPost} draft={status !== 'published'} onClose={() => setPreviewing(false)} />}
      {confirming && (
        <ConfirmDialog
          title={confirming === 'delete' ? 'Delete this post?' : 'Discard this post?'}
          message={
            confirming === 'delete'
              ? `“${post.title}” will be removed from the website. This can’t be undone.`
              : 'It has never been saved, so what you’ve written will be lost.'
          }
          confirmLabel={confirming === 'delete' ? 'Delete' : 'Discard'}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(null)}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

/* ── Page: /admin/blog/new, or /admin/blog/:id to edit ── */
function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the post" className="mx-auto w-full max-w-[1600px] space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <span className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-24" />
        </span>
      </div>
      <div className="grid gap-6 min-[1240px]:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function EditorMessage({ icon, title, message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center font-sans">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h1 className="mt-3 text-base font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-[13px] text-slate-500">{message}</p>
      <div className="mt-5 flex gap-2">
        <Link to="/admin/blog" className={BUTTON}>
          <Icon name="arrowLeft" className="h-3.5 w-3.5" />
          All posts
        </Link>
        {onRetry && (
          <button type="button" onClick={onRetry} className={PRIMARY_BUTTON}>
            <Icon name="refresh" className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

function BlogEditor() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(() => ({ key: `new-${Date.now()}`, id: postId, status: postId === 'new' ? 'ready' : 'loading', post: null, error: null }));
  const [attempt, setAttempt] = useState(0);
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;

  useEffect(() => {
    const current = loadedRef.current;
    // Already showing this post, e.g. a new post that was just saved and got its id
    if (current.id === postId && current.status === 'ready') return undefined;
    if (postId === 'new') {
      setLoaded({ key: `new-${Date.now()}`, id: 'new', status: 'ready', post: null, error: null });
      return undefined;
    }
    let active = true;
    setLoaded({ key: `post-${postId}`, id: postId, status: 'loading', post: null, error: null });
    // Readers' requests find published posts by their web address; the admin list has
    // every post, drafts included, with its full text
    api
      .get('/api/v1/blog_posts?status=all')
      .then((response) => {
        if (!active) return;
        const post = (Array.isArray(response.data) ? response.data : []).find((item) => String(item.id) === postId);
        setLoaded({ key: `post-${postId}`, id: postId, status: post ? 'ready' : 'missing', post: post || null, error: null });
      })
      .catch((err) => {
        if (!active) return;
        const message = err?.response?.status === 404 ? 'The server doesn’t have the blog API yet.' : apiErrorMessage(err, 'Could not load the post.');
        setLoaded({ key: `post-${postId}`, id: postId, status: 'error', post: null, error: message });
      });
    return () => {
      active = false;
    };
  }, [postId, attempt]);

  const handleSaved = useCallback(
    (saved) => {
      const id = String(saved.id);
      setLoaded((current) => ({ ...current, id, status: 'ready', post: saved }));
      if (id !== postId) navigate(`/admin/blog/${id}`, { replace: true });
    },
    [navigate, postId]
  );

  if (loaded.status === 'loading') return <EditorSkeleton />;
  if (loaded.status === 'missing') return <EditorMessage icon="search" title="This post doesn’t exist" message="It may have been deleted. Go back to the list to find another post." />;
  if (loaded.status === 'error') return <EditorMessage icon="warning" title="Couldn’t load the post" message={loaded.error} onRetry={() => setAttempt((count) => count + 1)} />;
  return <PostEditor key={loaded.key} post={loaded.post} onSaved={handleSaved} />;
}

export default BlogEditor;
