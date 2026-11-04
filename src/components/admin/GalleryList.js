import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../redux/api';
import galleryItems, { galleryCategories } from '../../data/galleryItems';
import GalleryUpload from './GalleryUpload';
import Icon from './Icon';
import { BUTTON, ConfirmDialog, DetailRow, DetailSection, Modal, muted, PreviewBanner, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import useAdminList, { saveErrorMessages } from './useAdminList';
import { formatDate, parseDate } from './utils';

const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "June 2026" → "2026-06-01"
function monthToIsoDate(label) {
  const [name, year] = (label || '').split(' ');
  const month = FULL_MONTHS.indexOf(name);
  return month >= 0 && year ? `${year}-${String(month + 1).padStart(2, '0')}-01` : null;
}

// The photos built into the website, shaped like the API's, shown until the gallery API exists
const PREVIEW_PHOTOS = galleryItems.map((item) => ({
  id: `site-${item.id}`,
  title: item.title,
  category: item.category,
  taken_on: monthToIsoDate(item.date),
  image_url: item.image,
  created_at: monthToIsoDate(item.date),
}));

const photoDate = (photo) => parseDate(photo.taken_on) || parseDate(photo.created_at);
const monthKey = (date) => (date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'undated');
const monthLabel = (key) => {
  if (key === 'undated') return 'Date not set';
  const [year, month] = key.split('-');
  return `${FULL_MONTHS[Number(month) - 1]} ${year}`;
};

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

/* ── Photo tile ── */
function PhotoTile({ photo, onOpen }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={[photo.title || 'Untitled photo', photo.category].filter(Boolean).join(', ')}
      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 text-left ring-1 ring-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
    >
      {photo.image_url && !failed ? (
        <img
          src={photo.image_url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 text-xs text-red-300">
          <Icon name="photo" className="h-7 w-7" />
          Image unavailable
        </span>
      )}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent px-3 pb-2.5 pt-10 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {photo.category && <span className="block text-[10px] font-semibold uppercase tracking-wider text-red-200">{photo.category}</span>}
        <span className="block truncate text-[13px] font-medium text-white">{photo.title || 'Untitled photo'}</span>
      </span>
    </button>
  );
}

/* ── Photo details (slide-over) ── */
function PhotoPanel({ photo, onClose, onSaved, onDelete }) {
  const initial = useMemo(
    () => ({ title: photo.title || '', category: photo.category || '', month: photo.taken_on ? photo.taken_on.slice(0, 7) : '' }),
    [photo]
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  // Reset when another photo is opened
  useEffect(() => {
    setForm(initial);
    setError(null);
    setImageFailed(false);
  }, [initial]);

  const update = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const requestClose = () => {
    if (saving) return;
    if (!dirty || window.confirm('Discard your changes to this photo?')) onClose();
  };

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.patch(`/api/v1/gallery_images/${photo.id}`, {
        gallery_image: { title: form.title.trim(), category: form.category || null, taken_on: form.month ? `${form.month}-01` : null },
      });
      onSaved();
    } catch (err) {
      setError(saveErrorMessages(err, 'gallery', 'Could not save the photo.').join(' '));
    } finally {
      setSaving(false);
    }
  };

  const added = parseDate(photo.created_at);

  const footer = (
    <>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
          Delete
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={requestClose} disabled={saving} className={BUTTON}>
            Close
          </button>
          <button type="submit" form="photo-form" disabled={saving || !dirty} className={PRIMARY_BUTTON}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <Modal titleId="photo-panel-title" onClose={requestClose} footer={footer}>
      <div className="flex max-h-[45vh] items-center justify-center bg-slate-950">
        {photo.image_url && !imageFailed ? (
          <img
            src={photo.image_url}
            alt={photo.title || 'Gallery photo'}
            onError={() => setImageFailed(true)}
            className="max-h-[45vh] w-full object-contain"
          />
        ) : (
          <div className="flex h-48 w-full flex-col items-center justify-center gap-1.5 px-6 text-center text-xs text-slate-400">
            <Icon name="photo" className="h-8 w-8 text-slate-500" />
            {photo.image_url ? 'This image couldn’t be loaded. The file may have been moved or deleted.' : 'No image file'}
          </div>
        )}
      </div>

      <form id="photo-form" onSubmit={save} className="space-y-4 border-b border-slate-100 px-5 py-5">
        <h2 id="photo-panel-title" className="sr-only">
          {photo.title || 'Gallery photo'}
        </h2>
        <div>
          <label htmlFor="photo-title" className="block text-[13px] font-medium text-slate-700">
            Caption
          </label>
          <input id="photo-title" name="title" value={form.title} onChange={update} placeholder="e.g. Sunday worship" className={`${inputClass()} mt-1.5 h-9`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="photo-category" className="block text-[13px] font-medium text-slate-700">
              Category
            </label>
            <select id="photo-category" name="category" value={form.category} onChange={update} className={`${inputClass()} mt-1.5 h-9 pr-8`}>
              <option value="">None</option>
              {galleryCategories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="photo-month" className="block text-[13px] font-medium text-slate-700">
              Month taken
            </label>
            <input id="photo-month" name="month" type="month" value={form.month} onChange={update} className={`${inputClass()} mt-1.5 h-9`} />
          </div>
        </div>
      </form>

      <DetailSection title="Record">
        <DetailRow icon="clock" label="Added on">
          {added ? formatDate(added) : muted('Unknown')}
        </DetailRow>
        {photo.image_url && (
          <DetailRow icon="external" label="Original file">
            <a href={photo.image_url} target="_blank" rel="noreferrer" className="text-red-700 underline-offset-2 hover:underline">
              Open full size
            </a>
          </DetailRow>
        )}
      </DetailSection>
    </Modal>
  );
}

/* ── Page ── */
function GalleryList() {
  const { rows: photos, loading, refreshing, error, preview, updatedAt, load } = useAdminList('/api/v1/gallery_images', {
    label: 'photos',
    previewRows: PREVIEW_PHOTOS,
  });

  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, flash] = useToast();

  const counts = useMemo(() => {
    const byCategory = { all: photos.length };
    galleryCategories.forEach((name) => {
      byCategory[name] = photos.filter((photo) => photo.category === name).length;
    });
    return byCategory;
  }, [photos]);

  // Newest month first, each month's photos newest first
  const months = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = photos
      .filter((photo) => category === 'all' || photo.category === category)
      .filter((photo) => !needle || [photo.title, photo.category].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => (photoDate(b)?.getTime() || 0) - (photoDate(a)?.getTime() || 0));
    const groups = new Map();
    visible.forEach((photo) => {
      const key = monthKey(photoDate(photo));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(photo);
    });
    return [...groups.entries()];
  }, [photos, category, query]);

  const visibleCount = months.reduce((sum, [, group]) => sum + group.length, 0);
  const openPhoto = photos.find((photo) => photo.id === openId) || null;
  const closePanel = useCallback(() => setOpenId(null), []);
  const closeUpload = useCallback(() => setUploading(false), []);

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/gallery_images/${deleting.id}`);
      setDeleting(null);
      setOpenId(null);
      flash('Photo deleted');
      load();
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'gallery', 'Could not delete the photo.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  const uploadButton = (
    <button type="button" onClick={() => setUploading(true)} className={PRIMARY_BUTTON}>
      <Icon name="upload" className="h-3.5 w-3.5" strokeWidth={2} />
      Upload photos
    </button>
  );

  const emptyState = (icon, title, message, action) => (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );

  let content;
  if (loading) {
    content = (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  } else if (error) {
    content = emptyState(
      'warning',
      'Couldn’t load the gallery',
      error,
      <button type="button" onClick={() => load()} className={BUTTON}>
        <Icon name="refresh" className="h-3.5 w-3.5" />
        Try again
      </button>
    );
  } else if (!photos.length) {
    content = emptyState('photo', 'No photos yet', 'Upload photos from services, fellowship and outreach to fill the website’s gallery.', uploadButton);
  } else if (!visibleCount) {
    content = emptyState(
      'search',
      'No photos match',
      'Try a different caption or category.',
      <button
        type="button"
        onClick={() => {
          setCategory('all');
          setQuery('');
        }}
        className={BUTTON}
      >
        <Icon name="close" className="h-3.5 w-3.5" />
        Clear filters
      </button>
    );
  } else {
    content = (
      <div className="space-y-7">
        {months.map(([key, group]) => (
          <section key={key} aria-labelledby={`month-${key}`}>
            <h2 id={`month-${key}`} className="mb-3 flex items-baseline gap-2 text-[13px] font-semibold text-slate-900">
              {monthLabel(key)}
              <span className="text-xs font-normal text-slate-400">
                {group.length} {group.length === 1 ? 'photo' : 'photos'}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {group.map((photo) => (
                <PhotoTile key={photo.id} photo={photo} onOpen={() => setOpenId(photo.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Gallery</h1>
            <p className="mt-1 text-[13px] text-slate-500">Photos from church life, shown on the website’s Gallery page.</p>
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
            {uploadButton}
          </div>
        </header>

        {preview && (
          <PreviewBanner>
            <span className="font-medium">Preview.</span> The gallery isn’t connected to the server yet, so you’re seeing the photos built into the website. Uploading, editing
            and deleting will start working once the gallery API is added.
          </PreviewBanner>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:pb-0">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Filter by category">
              {['all', ...galleryCategories].map((key) => {
                const active = key === category;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-[13px] font-medium transition ${
                      active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {key === 'all' ? 'All' : key}
                    {!loading && (
                      <span className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-red-50 text-red-700' : 'bg-slate-200/60 text-slate-500'}`}>
                        {counts[key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="relative lg:w-64">
            <span className="sr-only">Search photos</span>
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search captions…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </label>
        </div>

        {content}
      </div>

      {openPhoto && (
        <PhotoPanel
          photo={openPhoto}
          onClose={closePanel}
          onSaved={() => {
            flash('Photo updated');
            load();
          }}
          onDelete={() => {
            setDeleteError(null);
            setDeleting(openPhoto);
          }}
        />
      )}
      {uploading && (
        <GalleryUpload
          onClose={closeUpload}
          onUploaded={(count) => {
            setUploading(false);
            flash(`${count} ${count === 1 ? 'photo' : 'photos'} added to the gallery`);
            load();
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this photo?"
          message="It will be removed from the website’s gallery. This can’t be undone."
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

export default GalleryList;
