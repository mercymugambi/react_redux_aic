import React, { useEffect, useRef, useState } from 'react';
import { COVER_IMAGE_MAX_BYTES, COVER_IMAGE_TYPES } from '../../data/blog';
import Icon from './Icon';
import { BUTTON } from './ui';

/* A cover photo for a blog post or an event. The file is uploaded with the rest of the
   form when it's saved; the backend accepts the same types and size. */

export function coverFileError(file) {
  if (!file) return '';
  if (!COVER_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG or WEBP photo. (iPhone HEIC photos need converting first.)';
  if (file.size > COVER_IMAGE_MAX_BYTES) return 'The photo must be 10 MB or smaller.';
  return '';
}

// A temporary URL for previewing a picked file, released when the file changes
export function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

/**
 * Choose, replace or remove a cover photo.
 * - `url`: what to show now (a picked file's preview, or the saved photo)
 * - `file`: the picked file, if any; `removed` and `hadCover` explain a pending removal
 */
export function CoverPicker({ url, file, removed, hadCover, error, onPick, onRemove, buttonRef }) {
  const inputRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => setFailed(false), [url]);

  const pick = (picked) => {
    if (picked) onPick(picked);
  };

  return (
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
          pick(event.dataTransfer.files?.[0]);
        }}
        className={`relative aspect-[16/9] overflow-hidden rounded-lg border ${
          dragging ? 'border-red-300 bg-red-50/60' : error ? 'border-red-300' : url && !failed ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'
        }`}
      >
        {url && !failed ? (
          <img src={url} alt="Cover" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <button
            ref={buttonRef}
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center text-xs text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-200"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-slate-200">
              <Icon name="upload" className="h-4 w-4" />
            </span>
            <span className="font-medium text-slate-700">{failed ? 'Couldn’t show this photo' : 'Add a cover photo'}</span>
            <span className="text-slate-400">Drag one here, or click to browse</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={COVER_IMAGE_TYPES.join(',')}
        aria-label="Cover photo"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {url && !failed && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button ref={buttonRef} type="button" onClick={() => inputRef.current?.click()} className={`${BUTTON} h-7 px-2.5 text-xs`}>
            <Icon name="refresh" className="h-3.5 w-3.5" />
            Replace
          </button>
          <button type="button" onClick={onRemove} className={`${BUTTON} h-7 px-2.5 text-xs`}>
            <Icon name="trash" className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      )}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : file ? (
        <p className="mt-1.5 truncate text-xs text-slate-500">{file.name} · uploads when you save</p>
      ) : removed && hadCover ? (
        <p className="mt-1.5 text-xs text-slate-500">The cover will be removed when you save.</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-400">Landscape JPG, PNG or WEBP, at least 1600 px wide, up to 10 MB.</p>
      )}
    </div>
  );
}
