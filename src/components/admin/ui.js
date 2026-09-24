import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

/* Building blocks shared by the Tailwind admin pages (Overview, Members). */

export const PRIMARY_BUTTON =
  'inline-flex h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-lg bg-red-700 px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const BUTTON =
  'inline-flex h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50';

// Soft colour washes for the stat cards. Brand red leads; the others stay
// warm/cool so a row of cards reads as a set without competing.
export const TONES = {
  red: {
    chip: 'from-red-500 to-red-700',
    wash: 'radial-gradient(70% 85% at 88% 18%, #fecaca 0%, transparent 72%), radial-gradient(65% 80% at 70% 100%, #fbcfe8 0%, transparent 72%)',
  },
  amber: {
    chip: 'from-amber-400 to-orange-500',
    wash: 'radial-gradient(70% 85% at 88% 18%, #fed7aa 0%, transparent 72%), radial-gradient(65% 80% at 70% 100%, #fef08a 0%, transparent 72%)',
  },
  sky: {
    chip: 'from-sky-400 to-indigo-500',
    wash: 'radial-gradient(60% 75% at 92% 15%, #bae6fd 0%, transparent 72%), radial-gradient(55% 70% at 62% 50%, #bbf7d0 0%, transparent 72%), radial-gradient(60% 75% at 85% 100%, #ddd6fe 0%, transparent 72%)',
  },
  emerald: {
    chip: 'from-emerald-400 to-teal-600',
    wash: 'radial-gradient(70% 85% at 88% 18%, #a7f3d0 0%, transparent 72%), radial-gradient(65% 80% at 70% 100%, #bae6fd 0%, transparent 72%)',
  },
};

const AVATAR_TONES = [
  'bg-red-50 text-red-700',
  'bg-amber-50 text-amber-700',
  'bg-emerald-50 text-emerald-700',
  'bg-sky-50 text-sky-700',
  'bg-violet-50 text-violet-700',
  'bg-slate-100 text-slate-600',
];

export function Skeleton({ className }) {
  return <span className={`block animate-pulse rounded-md bg-slate-100 ${className}`} />;
}

export function Avatar({ name, className = 'h-7 w-7 text-[11px]' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className} ${AVATAR_TONES[hash % AVATAR_TONES.length]}`}>
      {initials || '?'}
    </span>
  );
}

export function Checkbox({ checked, indeterminate = false, disabled = false, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-700 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

// A link card when given `to`, a plain card otherwise
export function StatCard({ label, icon, value, caption, to, tone, loading }) {
  const Card = to ? Link : 'div';
  return (
    <Card
      to={to}
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 ${
        to ? 'transition hover:border-slate-300 hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200' : ''
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-4 -right-4 w-3/4"
        style={{
          background: TONES[tone].wash,
          filter: 'blur(20px)',
          WebkitMaskImage: 'linear-gradient(to left, #000 45%, transparent)',
          maskImage: 'linear-gradient(to left, #000 45%, transparent)',
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${TONES[tone].chip}`}>
              <Icon name={icon} className="h-[15px] w-[15px]" strokeWidth={2} />
            </span>
            {label}
          </span>
          {to && <Icon name="arrowUpRight" className="h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100" />}
        </div>
        {loading ? (
          <>
            <Skeleton className="mt-5 h-7 w-20" />
            <Skeleton className="mt-2.5 h-3 w-40" />
          </>
        ) : (
          <>
            <p className="mt-5 text-[28px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
            <p className="mt-2.5 truncate text-xs text-slate-500">{caption}</p>
          </>
        )}
      </div>
    </Card>
  );
}

// Right-hand panel for details and forms. Focus moves into it (to `initialFocusRef`,
// or the close button), Tab stays inside, Escape closes, and focus returns to
// whatever opened it.
export function SlideOver({ label, titleId, onClose, initialFocusRef, footer, wide = false, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    (initialFocusRef?.current || closeRef.current)?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [initialFocusRef]);

  return (
    <div className="fixed inset-0 z-60 flex justify-end font-sans">
      <div aria-hidden="true" onClick={() => onCloseRef.current()} className="admin-fade-in absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`admin-drawer-in relative flex h-full w-full ${wide ? 'max-w-3xl' : 'max-w-[440px]'} flex-col bg-white shadow-2xl shadow-slate-900/20`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3">{footer}</div>}
      </aside>
    </div>
  );
}

// A short confirmation at the bottom of the screen: const [toast, flash] = useToast()
export function useToast() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 2500);
  }, []);
  return [message, flash];
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="admin-toast-in fixed bottom-6 left-1/2 z-70 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-slate-900/20"
    >
      <Icon name="check" className="h-4 w-4 text-emerald-400" strokeWidth={2} />
      {message}
    </div>
  );
}

/* Label/value rows for the detail panels */
export function DetailSection({ title, children }) {
  return (
    <section className="px-5 py-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <dl className="mt-1 divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

export function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-200/70">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-[13px] font-medium text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

export const muted = (text) => <span className="font-normal text-slate-400">{text}</span>;

/* Image links */
export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// Live preview under an image-link field. Key it by the URL so each new link
// gets a fresh load attempt.
export function ImageLinkPreview({ url }) {
  const [failed, setFailed] = useState(false);
  const showImage = isHttpUrl(url) && !failed;

  return (
    <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-lg border border-dashed border-slate-200 bg-slate-50">
      {showImage ? (
        <img src={url} alt="Cover preview" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center text-xs text-slate-400">
          <Icon name="photo" className="h-6 w-6" />
          {failed ? 'Couldn’t load an image from that link.' : 'Paste an image link above to preview the cover.'}
        </div>
      )}
    </div>
  );
}

// Shown while a page runs on the website's built-in content because its API
// doesn't exist yet (see useAdminList).
export function PreviewBanner({ children }) {
  return (
    <div role="note" className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-[13px] text-sky-900">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
      <p>{children}</p>
    </div>
  );
}

// "Are you sure?" for deletes. Sits above slide-overs.
export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy = false, error, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);

  useEffect(() => {
    onCancelRef.current = onCancel;
    busyRef.current = busy;
  });

  useEffect(() => {
    const opener = document.activeElement;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || busyRef.current) return;
      event.stopPropagation();
      onCancelRef.current();
    };
    // Capture phase, so Escape closes this dialog and not the panel beneath it
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="admin-fade-in fixed inset-0 z-70 flex items-center justify-center bg-slate-900/40 px-4 font-sans">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl shadow-slate-900/20">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Icon name="trash" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="confirm-title" className="text-[15px] font-semibold text-slate-900">
              {title}
            </h2>
            <p id="confirm-message" className="mt-1 text-[13px] leading-relaxed text-slate-500">
              {message}
            </p>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={BUTTON}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
