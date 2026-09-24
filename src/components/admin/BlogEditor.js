import React, { useMemo, useRef, useState } from 'react';
import api from '../../redux/api';
import { blogCategories } from '../../data/blogPosts';
import Icon from './Icon';
import { BUTTON, ImageLinkPreview, isHttpUrl, PRIMARY_BUTTON, SlideOver } from './ui';
import { saveErrorMessages } from './useAdminList';
import { toIsoDay } from './utils';

export const POST_CATEGORIES = blogCategories.filter((category) => category !== 'All');

/* ── Body text ⇄ blocks ──
   Posts store their body as blocks ({ type: 'paragraph' | 'heading' | 'quote' | 'list' })
   so the public article page can render it without a markdown parser. The editor
   uses a few plain-text conventions and converts on the way in and out. */
export function textToBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n').map((line) => line.trim());
      if (chunk.startsWith('## ')) return { type: 'heading', text: chunk.slice(3).replace(/\s*\n\s*/g, ' ') };
      if (lines.every((line) => /^[-*] /.test(line))) return { type: 'list', items: lines.map((line) => line.slice(2).trim()) };
      if (chunk.startsWith('>')) {
        const quoteLines = lines.map((line) => line.replace(/^>\s?/, ''));
        const last = quoteLines[quoteLines.length - 1];
        const hasCite = quoteLines.length > 1 && /^(—|--)\s*/.test(last);
        return {
          type: 'quote',
          text: (hasCite ? quoteLines.slice(0, -1) : quoteLines).join(' '),
          ...(hasCite && { cite: last.replace(/^(—|--)\s*/, '') }),
        };
      }
      return { type: 'paragraph', text: lines.join(' ') };
    });
}

export function blocksToText(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'heading') return `## ${block.text}`;
      if (block.type === 'list') return (block.items || []).map((item) => `- ${item}`).join('\n');
      if (block.type === 'quote') return `> ${block.text}${block.cite ? `\n> — ${block.cite}` : ''}`;
      return block.text || '';
    })
    .join('\n\n');
}

const blockWords = (block) => [block.text, block.cite, ...(block.items || [])].join(' ');
export const wordCount = (blocks = []) => blocks.map(blockWords).join(' ').split(/\s+/).filter(Boolean).length;
export const readMinutes = (blocks) => Math.max(1, Math.round(wordCount(blocks) / 200));

export const slugify = (title) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// How readers will see the body
export function PostBody({ blocks }) {
  if (!blocks.length) return <p className="text-[13px] text-slate-400">Nothing written yet.</p>;
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3 key={index} className="pt-2 text-lg font-semibold leading-snug text-slate-900">
              {block.text}
            </h3>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="border-l-2 border-red-600 pl-4">
              <p className="text-[15px] italic leading-7 text-slate-800">“{block.text}”</p>
              {block.cite && <cite className="mt-1 block text-xs font-semibold not-italic uppercase tracking-wider text-red-700">{block.cite}</cite>}
            </blockquote>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5 text-[14px] leading-7 text-slate-700">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-[14px] leading-7 text-slate-700">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

/* ── Form bits ── */
const EXCERPT_LIMIT = 220;
const FIELD_IDS = { title: 'post-title', excerpt: 'post-excerpt', body: 'post-body', category: 'post-category', published_on: 'post-date', image: 'post-image' };

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

function Field({ id, label, optional = false, error, hint, className = '', children }) {
  const note = error || hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {note && <p className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>{note}</p>}
    </div>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-2.5 py-1 text-[13px] font-medium transition ${
              active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const SideHeading = ({ children }) => <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>;

function formFromPost(post, user) {
  const today = toIsoDay(new Date());
  if (!post) {
    return {
      title: '',
      excerpt: '',
      bodyText: '',
      category: '',
      status: 'published',
      published_on: today,
      tagsText: '',
      image: '',
      author_name: [user?.firstname, user?.lastname].filter(Boolean).join(' '),
      author_role: '',
      featured: false,
    };
  }
  return {
    title: post.title || '',
    excerpt: post.excerpt || '',
    bodyText: blocksToText(post.body),
    category: post.category || '',
    status: post.status === 'draft' ? 'draft' : 'published',
    published_on: post.published_on || today,
    tagsText: (post.tags || []).join(', '),
    image: post.image || '',
    author_name: post.author_name || '',
    author_role: post.author_role || '',
    featured: Boolean(post.featured),
  };
}

/* ── Editor ── */
function BlogEditor({ post, user, onClose, onSaved }) {
  const initial = useMemo(() => formFromPost(post, user), [post, user]);
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState('write');
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  const editing = Boolean(post);
  const blocks = useMemo(() => textToBlocks(form.bodyText), [form.bodyText]);
  const tags = form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean);
  const slug = editing && post.slug ? post.slug : slugify(form.title);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const publishing = form.status === 'published';

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  const update = (event) => set(event.target.name, event.target.value);

  const requestClose = () => {
    if (saving) return;
    if (!dirty || window.confirm('Discard your changes to this post?')) onClose();
  };

  // A draft only needs a title; publishing needs everything readers will see
  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Give the post a title';
    if (publishing) {
      if (!form.excerpt.trim()) next.excerpt = 'Add a short summary for the blog list';
      if (!blocks.length) next.body = 'Write the post before publishing';
      if (!form.category) next.category = 'Pick a category';
      if (!form.published_on) next.published_on = 'Pick the publish date';
    }
    if (form.image.trim() && !isHttpUrl(form.image.trim())) next.image = 'Use a full link starting with http:// or https://';
    setErrors(next);
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerErrors([]);
    const invalid = Object.keys(validate());
    if (invalid.length) {
      const first = Object.keys(FIELD_IDS).find((name) => invalid.includes(name));
      if (first === 'body') setTab('write');
      setTimeout(() => document.getElementById(FIELD_IDS[first])?.focus(), 0);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim(),
      body: blocks,
      category: form.category || null,
      status: form.status,
      published_on: form.published_on || null,
      featured: form.featured,
      tags,
      image: form.image.trim() || null,
      author_name: form.author_name.trim() || null,
      author_role: form.author_role.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) await api.patch(`/api/v1/blog_posts/${post.id}`, { blog_post: payload });
      else await api.post('/api/v1/blog_posts', { blog_post: payload });
      onSaved(payload);
    } catch (err) {
      setServerErrors(saveErrorMessages(err, 'blog', 'Could not save the post. Please try again.'));
      setSaving(false);
    }
  };

  let submitLabel = publishing ? 'Publish post' : 'Save draft';
  if (editing) submitLabel = 'Save changes';

  const footer = (
    <>
      {serverErrors.length > 0 && (
        <div role="alert" className="mb-3 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800">
          <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            {serverErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-xs text-slate-400 sm:block">
          {wordCount(blocks).toLocaleString()} words · {readMinutes(blocks)} min read
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={requestClose} className={BUTTON}>
            Cancel
          </button>
          <button type="submit" form="blog-form" disabled={saving} className={PRIMARY_BUTTON}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <SlideOver label={editing ? 'Edit post' : 'New post'} titleId="blog-editor-title" onClose={requestClose} initialFocusRef={titleRef} footer={footer} wide>
      <h2 id="blog-editor-title" className="sr-only">
        {editing ? `Edit “${post.title}”` : 'Write a new post'}
      </h2>
      <form id="blog-form" onSubmit={handleSubmit} noValidate className="grid gap-6 px-5 py-5 md:grid-cols-[minmax(0,1fr)_220px]">
        {/* Writing */}
        <div className="min-w-0 space-y-4">
          <div>
            <label htmlFor="post-title" className="sr-only">
              Title
            </label>
            <input
              ref={titleRef}
              id="post-title"
              name="title"
              value={form.title}
              onChange={update}
              placeholder="Post title"
              aria-invalid={Boolean(errors.title)}
              className={`w-full border-0 border-b bg-transparent px-0 pb-2 text-xl font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 ${
                errors.title ? 'border-red-300' : 'border-slate-200 focus:border-red-300'
              }`}
            />
            {errors.title ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>
            ) : (
              <p className="mt-1.5 truncate text-xs text-slate-400">
                Web address: /blog/{slug || '…'}
                {editing && ' (stays the same so existing links keep working)'}
              </p>
            )}
          </div>

          <Field id="post-excerpt" label="Summary" error={errors.excerpt} hint="Shown on the blog list and in search results.">
            <textarea
              id="post-excerpt"
              name="excerpt"
              rows={2}
              maxLength={EXCERPT_LIMIT}
              value={form.excerpt}
              onChange={update}
              placeholder="One or two sentences that make people want to read on."
              aria-invalid={Boolean(errors.excerpt)}
              className={`${inputClass(errors.excerpt)} resize-none py-2 leading-relaxed`}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="post-body" className="text-[13px] font-medium text-slate-700">
                Post
              </label>
              <div role="tablist" aria-label="Post view" className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {[
                  { key: 'write', label: 'Write' },
                  { key: 'preview', label: 'Preview' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition ${
                      tab === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {tab === 'write' ? (
              <>
                <textarea
                  id="post-body"
                  name="bodyText"
                  rows={16}
                  value={form.bodyText}
                  onChange={(event) => set('bodyText', event.target.value)}
                  placeholder={'Start writing…\n\nLeave a blank line between paragraphs.'}
                  aria-invalid={Boolean(errors.body)}
                  className={`${inputClass(errors.body)} mt-1.5 resize-y py-2.5 leading-relaxed`}
                />
                {errors.body && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.body}</p>}
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  <code className="rounded bg-slate-100 px-1 text-slate-600">## </code> heading ·{' '}
                  <code className="rounded bg-slate-100 px-1 text-slate-600">&gt; </code> quote (end with{' '}
                  <code className="rounded bg-slate-100 px-1 text-slate-600">&gt; — Reference</code>) ·{' '}
                  <code className="rounded bg-slate-100 px-1 text-slate-600">- </code> list item · blank line for a new paragraph
                </p>
              </>
            ) : (
              <div className="mt-1.5 min-h-[20rem] rounded-lg border border-slate-200 px-5 py-4">
                {form.title.trim() && <h1 className="mb-1 text-2xl font-semibold leading-tight text-slate-900">{form.title}</h1>}
                {form.excerpt.trim() && <p className="mb-5 text-[15px] leading-relaxed text-slate-500">{form.excerpt}</p>}
                <PostBody blocks={blocks} />
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <aside className="space-y-5 md:border-l md:border-slate-100 md:pl-6">
          <div className="space-y-2">
            <SideHeading>Status</SideHeading>
            <Segmented
              label="Status"
              value={form.status}
              onChange={(value) => set('status', value)}
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <p className="text-xs text-slate-500">{publishing ? 'Visible on the website.' : 'Only admins can see it.'}</p>
          </div>

          <Field id="post-date" label="Publish date" error={errors.published_on}>
            <input id="post-date" name="published_on" type="date" value={form.published_on} onChange={update} className={`${inputClass(errors.published_on)} h-9`} />
          </Field>

          <Field id="post-category" label="Category" error={errors.category}>
            <select id="post-category" name="category" value={form.category} onChange={update} className={`${inputClass(errors.category)} h-9 pr-8`}>
              <option value="">Choose…</option>
              {POST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 transition hover:border-slate-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => set('featured', event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-700"
            />
            <span>
              <span className="flex items-center gap-1 text-[13px] font-medium text-slate-800">
                <Icon name="star" className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
                Feature this post
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">Shown at the top of the blog. Replaces the current featured post.</span>
            </span>
          </label>

          <Field id="post-tags" label="Tags" optional hint={tags.length ? undefined : 'Separate with commas.'}>
            <input id="post-tags" name="tagsText" value={form.tagsText} onChange={update} placeholder="Prayer, Hope" className={`${inputClass()} h-9`} />
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field id="post-image" label="Cover image link" optional error={errors.image}>
            <input id="post-image" name="image" type="url" value={form.image} onChange={update} placeholder="https://…" className={`${inputClass(errors.image)} h-9`} />
            <ImageLinkPreview key={form.image.trim()} url={form.image.trim()} />
          </Field>

          <div className="space-y-3">
            <SideHeading>Author</SideHeading>
            <Field id="post-author" label="Name">
              <input id="post-author" name="author_name" value={form.author_name} onChange={update} placeholder="Rev. Joseph Njuguna" className={`${inputClass()} h-9`} />
            </Field>
            <Field id="post-author-role" label="Role" optional>
              <input id="post-author-role" name="author_role" value={form.author_role} onChange={update} placeholder="Senior Pastor" className={`${inputClass()} h-9`} />
            </Field>
          </div>
        </aside>
      </form>
    </SlideOver>
  );
}

export default BlogEditor;
