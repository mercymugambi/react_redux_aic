import React, { useEffect, useRef, useState } from 'react';
import api from '../../redux/api';
import { galleryCategories } from '../../data/galleryItems';
import Icon from './Icon';
import { BUTTON, Modal, PRIMARY_BUTTON } from './ui';
import { saveErrorMessages } from './useAdminList';

const MAX_FILES = 20;
const MAX_BYTES = 10 * 1024 * 1024;

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

const thisMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// "youth-camp_bonfire.jpg" → "Youth camp bonfire"; camera names like IMG_2034 → ""
function captionFromFilename(name) {
  const base = name.replace(/\.[^.]+$/, '');
  if (/^(img|dsc|dcim|pxl|photo|image|screenshot|whatsapp)[\s_-]*\d/i.test(base)) return '';
  const words = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

const formatBytes = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

let nextKey = 0;

function UploadRow({ item, disabled, onTitle, onRemove }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70">
        <img src={item.url} alt="" className="h-full w-full object-cover" />
        {item.status === 'done' && (
          <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/70 text-white">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.5} />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor={`caption-${item.key}`}>
          Caption for {item.file.name}
        </label>
        <input
          id={`caption-${item.key}`}
          value={item.title}
          onChange={(event) => onTitle(event.target.value)}
          disabled={disabled || item.status === 'done'}
          placeholder="Add a caption (optional)"
          className={`${inputClass()} h-8 disabled:bg-slate-50 disabled:text-slate-500`}
        />
        {item.status === 'uploading' ? (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-red-600 transition-[width]" style={{ width: `${item.progress}%` }} />
          </div>
        ) : (
          <p className={`mt-1 truncate text-[11px] ${item.status === 'failed' ? 'font-medium text-red-600' : 'text-slate-400'}`}>
            {item.status === 'failed' ? item.error : item.status === 'done' ? 'Uploaded' : `${item.file.name} · ${formatBytes(item.file.size)}`}
          </p>
        )}
      </div>
      {item.status !== 'done' && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${item.file.name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </li>
  );
}

function GalleryUpload({ onClose, onUploaded }) {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(thisMonth);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  });

  // Free the preview images' memory when the panel closes
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  const pending = items.filter((item) => item.status !== 'done');
  const failed = items.filter((item) => item.status === 'failed');

  const addFiles = (fileList) => {
    const skipped = [];
    const room = MAX_FILES - items.length;
    const accepted = [];
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/')) skipped.push(`${file.name} isn’t an image`);
      else if (file.size > MAX_BYTES) skipped.push(`${file.name} is over 10 MB`);
      else if (accepted.length >= room) skipped.push(`${file.name} (you can upload ${MAX_FILES} at a time)`);
      else accepted.push(file);
    });
    setRejected(skipped);
    if (errors.files) setErrors((prev) => ({ ...prev, files: '' }));
    setItems((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        key: (nextKey += 1),
        file,
        url: URL.createObjectURL(file),
        title: captionFromFilename(file.name),
        status: 'ready',
        progress: 0,
        error: null,
      })),
    ]);
  };

  const patchItem = (key, changes) => setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  const removeItem = (key) => {
    setItems((prev) => {
      const gone = prev.find((item) => item.key === key);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((item) => item.key !== key);
    });
  };

  const requestClose = () => {
    if (uploading) return;
    if (!pending.length || window.confirm('Close without uploading these photos?')) onClose();
  };

  const upload = async () => {
    const next = {};
    if (!pending.length) next.files = 'Choose at least one photo';
    if (!category) next.category = 'Pick a category';
    setErrors(next);
    if (Object.keys(next).length) return;

    setUploading(true);
    let uploaded = items.length - pending.length;
    // One at a time, so a slow connection shows steady progress and a single
    // failure doesn't cancel the rest
    for (const item of pending) {
      patchItem(item.key, { status: 'uploading', progress: 0, error: null });
      const body = new FormData();
      body.append('gallery_image[image]', item.file);
      body.append('gallery_image[title]', item.title.trim());
      body.append('gallery_image[category]', category);
      if (month) body.append('gallery_image[taken_on]', `${month}-01`);
      try {
        await api.post('/api/v1/gallery_images', body, {
          onUploadProgress: (event) => event.total && patchItem(item.key, { progress: Math.round((event.loaded / event.total) * 100) }),
        });
        patchItem(item.key, { status: 'done', progress: 100 });
        uploaded += 1;
      } catch (err) {
        patchItem(item.key, { status: 'failed', error: saveErrorMessages(err, 'gallery', 'Upload failed.')[0] });
      }
    }
    setUploading(false);
    if (uploaded === items.length) onUploaded(uploaded);
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-xs text-slate-500">
        {failed.length > 0 && !uploading
          ? `${failed.length} of ${items.length} didn’t upload`
          : items.length
            ? `${items.length} ${items.length === 1 ? 'photo' : 'photos'} selected`
            : 'Up to 20 photos, 10 MB each'}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={requestClose} disabled={uploading} className={BUTTON}>
          Cancel
        </button>
        <button type="button" onClick={upload} disabled={uploading} className={PRIMARY_BUTTON}>
          <Icon name="upload" className="h-3.5 w-3.5" strokeWidth={2} />
          {uploading ? 'Uploading…' : failed.length ? 'Retry failed' : pending.length > 1 ? `Upload ${pending.length} photos` : 'Upload photo'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      titleId="gallery-upload-title"
      title="Add photos to the gallery"
      description="Moments from services, fellowship and outreach, shown on the website’s Gallery page."
      icon="upload"
      onClose={requestClose}
      footer={footer}
    >
      <div className="space-y-5 px-5 py-5">
        {/* Drop zone */}
        <div>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!uploading) addFiles(event.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragging ? 'border-red-300 bg-red-50/60' : errors.files ? 'border-red-300 bg-white' : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-slate-200">
              <Icon name="upload" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-slate-800">Drag photos here</p>
            <p className="mt-0.5 text-xs text-slate-500">
              or{' '}
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="font-medium text-red-700 underline-offset-2 hover:underline">
                browse your files
              </button>{' '}
              · JPG, PNG or WEBP
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </div>
          {errors.files && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.files}</p>}
          {rejected.length > 0 && (
            <div role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p className="font-medium">Skipped {rejected.length === 1 ? 'one file' : `${rejected.length} files`}:</p>
              <ul className="mt-0.5 list-disc pl-4">
                {rejected.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Shared details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="upload-category" className="block text-[13px] font-medium text-slate-700">
              Category
            </label>
            <select
              id="upload-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
              }}
              disabled={uploading}
              className={`${inputClass(errors.category)} mt-1.5 h-9 pr-8`}
            >
              <option value="">Choose…</option>
              {galleryCategories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="upload-month" className="block text-[13px] font-medium text-slate-700">
              Month taken
            </label>
            <input
              id="upload-month"
              type="month"
              value={month}
              max={thisMonth()}
              onChange={(event) => setMonth(event.target.value)}
              disabled={uploading}
              className={`${inputClass()} mt-1.5 h-9`}
            />
          </div>
          <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">These apply to every photo in this upload.</p>
        </div>

        {/* Selected photos */}
        {items.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Selected photos</h3>
            <ul className="mt-1 divide-y divide-slate-100">
              {items.map((item) => (
                <UploadRow
                  key={item.key}
                  item={item}
                  disabled={uploading}
                  onTitle={(title) => patchItem(item.key, { title })}
                  onRemove={() => removeItem(item.key)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default GalleryUpload;
