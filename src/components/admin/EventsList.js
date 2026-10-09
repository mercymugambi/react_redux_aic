import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage } from '../../redux/api';
import { bySoonest, dateBadge, eventImage, eventTiming, formatDateRange, parseDay, REGISTRATION_MODES, timeRange } from '../../data/events';
import Icon from './Icon';
import EventForm from './EventForm';
import { Avatar, BUTTON, ConfirmDialog, DetailRow, DetailSection, isHttpUrl, Modal, muted, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import { saveErrorMessages } from './useAdminList';
import { downloadCsv, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

/* ── Event fields ── */
const eventTitle = (event) => event.title || 'Untitled event';
const userName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;
// Events from before statuses existed were all public
const statusOf = (event) => event.status || 'published';
const lastDay = (event) => parseDay(event.end_date) || parseDay(event.date);
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/* ── Tabs ── */
const byMostRecent = (a, b) => (lastDay(b)?.getTime() ?? 0) - (lastDay(a)?.getTime() ?? 0);

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

/* ── Styles ── */
const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const TIMING_TONES = {
  today: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  upcoming: 'border-sky-200 bg-sky-50 text-sky-700',
  past: 'border-slate-200 bg-slate-50 text-slate-500',
};

/* ── Small building blocks ── */
function TimingPill({ event, today, className = '' }) {
  const status = statusOf(event);
  if (status === 'draft') {
    return (
      <span className={`${PILL} border-amber-200 bg-amber-50 text-amber-700 ${className}`}>
        <Icon name="pencil" className="h-3 w-3" strokeWidth={2} />
        Draft
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className={`${PILL} border-red-200 bg-red-50 text-red-700 ${className}`}>
        <Icon name="close" className="h-3 w-3" strokeWidth={2.5} />
        Cancelled
      </span>
    );
  }
  const timing = eventTiming(event, today);
  const start = parseDay(event.date);
  const days = start ? Math.round((start - today) / 86400000) : null;
  let label = 'Past';
  if (timing === 'today') label = days < 0 ? 'On now' : 'Today';
  else if (timing === 'upcoming') label = days === 1 ? 'Tomorrow' : days !== null && days <= 14 ? `In ${days} days` : 'Upcoming';
  return (
    <span className={`${PILL} ${TIMING_TONES[timing]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function DateBadge({ event, className = '' }) {
  const { day, month } = dateBadge(event);
  return (
    <span className={`flex h-12 min-w-[3rem] flex-col items-center justify-center rounded-lg bg-white/95 px-1.5 leading-none shadow-sm ring-1 ring-slate-900/5 backdrop-blur ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">{month}</span>
      <span className={`mt-1 font-semibold text-slate-900 ${day.length > 2 ? 'text-sm' : 'text-lg'}`}>{day}</span>
    </span>
  );
}

// The event's photo, or a branded placeholder when there's none or it won't load
function Cover({ src, muted: dim = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (src && isHttpUrl(src) && !failed) {
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`h-full w-full object-cover ${dim ? 'grayscale-[40%]' : ''} ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 ${dim ? 'saturate-0' : ''} ${className}`}>
      <Icon name="calendar" className="h-10 w-10 text-red-200" strokeWidth={1.25} />
    </div>
  );
}

// "12 going" or "12 of 50 seats", for events that take RSVPs here
function seatsLabel(event) {
  if (event.registration !== 'rsvp') return null;
  const taken = event.seats_taken || 0;
  return event.capacity ? `${taken} of ${event.capacity} seats` : `${taken} going`;
}

function EventCard({ event, today, author, onOpen }) {
  const time = timeRange(event);
  const past = eventTiming(event, today) === 'past';
  const status = statusOf(event);
  const seats = seatsLabel(event);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white transition hover:border-slate-300 hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)] focus-within:ring-2 focus-within:ring-red-200 ${
        status === 'draft' ? 'border-dashed border-slate-300' : 'border-slate-200'
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover key={eventImage(event)} src={eventImage(event)} muted={past || status === 'cancelled'} className="transition duration-300 group-hover:scale-[1.03]" />
        <DateBadge event={event} className="absolute left-3 top-3" />
        <TimingPill event={event} today={today} className="absolute right-3 top-3 shadow-sm" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-red-700">
          {event.category || <span className="normal-case tracking-normal text-slate-400">No category</span>}
          {event.featured && (
            <span title="Featured on the home page" className="flex items-center gap-1 normal-case tracking-normal text-amber-600">
              <Icon name="star" className="h-3 w-3" strokeWidth={2.25} />
              Featured
            </span>
          )}
        </span>
        <h3 className={`mt-1 line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-red-700 ${status === 'cancelled' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
          {/* The button stretches over the whole card, so any click opens it */}
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {eventTitle(event)}
          </button>
        </h3>
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Icon name="calendar" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {formatDateRange(event)}
            {time && <span className="text-slate-400">· {time}</span>}
          </p>
          {event.location && (
            <p className="flex items-center gap-1.5">
              <Icon name="mapPin" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{event.location}</span>
            </p>
          )}
        </div>
        {event.description && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-600">{event.description}</p>}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex h-6 min-w-0 items-center gap-2">
              {seats ? (
                <>
                  <Icon name="users" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate font-medium text-slate-600">{seats}</span>
                </>
              ) : author ? (
                <>
                  <Avatar name={author} className="h-6 w-6 text-[10px]" />
                  <span className="truncate">{author}</span>
                </>
              ) : (
                <span className="text-slate-400">Added by a team member</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-0.5 font-medium text-slate-400 transition group-hover:text-red-700">
              Details
              <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, message, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{message}</p>
      {children && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}

/* ── RSVPs for one event ── */
const RSVP_COLUMNS = [
  { label: 'Name', csv: (rsvp) => rsvp.name },
  { label: 'Phone', csv: (rsvp) => rsvp.phone },
  { label: 'Email', csv: (rsvp) => rsvp.email },
  { label: 'People', csv: (rsvp) => rsvp.seats },
  { label: 'Signed up', csv: (rsvp) => (parseDate(rsvp.created_at) ? toIsoDay(parseDate(rsvp.created_at)) : '') },
];

function Registrations({ event, onChanged, flash }) {
  const [rsvps, setRsvps] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  const load = useCallback(() => {
    setStatus('loading');
    api.get(`/api/v1/events/${event.id}/registrations`)
      .then((response) => {
        setRsvps(Array.isArray(response.data) ? response.data : []);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err?.response?.status === 404 ? 'The server can’t list sign-ups yet.' : apiErrorMessage(err, 'Could not load the sign-ups.'));
        setStatus('error');
      });
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await api.delete(`/api/v1/events/${event.id}/registrations/${removing.id}`);
      setRsvps((current) => current.filter((rsvp) => rsvp.id !== removing.id));
      flash(`${removing.name} was removed`);
      setRemoving(null);
      onChanged();
    } catch (err) {
      setRemoveError(saveErrorMessages(err, 'events', 'Could not remove the sign-up.').join(' '));
    } finally {
      setRemoveBusy(false);
    }
  };

  const seats = rsvps.reduce((sum, rsvp) => sum + (rsvp.seats || 1), 0);

  return (
    <section className="px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          RSVPs {status === 'ready' && `· ${seats} ${seats === 1 ? 'person' : 'people'}`}
        </h3>
        {status === 'ready' && rsvps.length > 0 && (
          <button
            type="button"
            onClick={() => downloadCsv(`rsvps-${(event.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, RSVP_COLUMNS, rsvps)}
            className={`${BUTTON} h-7 px-2.5 text-xs`}
          >
            <Icon name="download" className="h-3.5 w-3.5" />
            Export
          </button>
        )}
      </div>
      {event.capacity ? (
        <div className="mt-2.5" aria-hidden="true">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-red-600" style={{ width: `${Math.min(100, ((event.seats_taken || 0) / event.capacity) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {event.seats_taken || 0} of {event.capacity} seats taken
          </p>
        </div>
      ) : null}

      {status === 'loading' && (
        <div className="mt-3 space-y-2.5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      )}
      {status === 'error' && (
        <p className="mt-3 text-[13px] text-slate-500">
          {error}{' '}
          <button type="button" onClick={load} className="font-medium text-red-700 hover:underline">
            Try again
          </button>
        </p>
      )}
      {status === 'ready' && !rsvps.length && <p className="mt-3 text-[13px] text-slate-500">No one has signed up yet.</p>}
      {status === 'ready' && rsvps.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {rsvps.map((rsvp) => (
            <li key={rsvp.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={rsvp.name || '?'} className="h-8 w-8 text-xs" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-medium text-slate-900">{rsvp.name}</span>
                  {rsvp.seats > 1 && <span className="shrink-0 rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">×{rsvp.seats}</span>}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {rsvp.phone && (
                    <a href={telHref(rsvp.phone)} className="tabular-nums hover:text-red-700">
                      {rsvp.phone}
                    </a>
                  )}
                  {rsvp.phone && rsvp.email && ' · '}
                  {rsvp.email && (
                    <a href={`mailto:${rsvp.email}`} className="hover:text-red-700">
                      {rsvp.email}
                    </a>
                  )}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setRemoveError(null);
                  setRemoving(rsvp);
                }}
                aria-label={`Remove ${rsvp.name}`}
                title="Remove"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700"
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          message="Their seats become free again. They aren’t told, so let them know if you need to."
          confirmLabel="Remove"
          busy={removeBusy}
          error={removeError}
          onConfirm={remove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </section>
  );
}

/* ── Event details (modal) ── */
const longDate = (event) => formatDateRange(event, { weekday: true });

function EventPanel({ event, today, author, busy, onClose, onEdit, onDelete, onSetStatus, onChanged, flash }) {
  const status = statusOf(event);
  const created = parseDate(event.created_at);
  const mode = REGISTRATION_MODES.find((option) => option.value === (event.registration || 'none'));

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" onClick={onDelete} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50">
        <Icon name="trash" className="h-3.5 w-3.5" />
        Delete
      </button>
      <div className="flex items-center gap-2">
        {status === 'published' && (
          <button type="button" onClick={() => onSetStatus('cancelled')} disabled={busy} className={BUTTON}>
            Mark as cancelled
          </button>
        )}
        {status === 'cancelled' && (
          <button type="button" onClick={() => onSetStatus('published')} disabled={busy} className={BUTTON}>
            Restore
          </button>
        )}
        <button type="button" onClick={onEdit} className={PRIMARY_BUTTON}>
          <Icon name="pencil" className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    </div>
  );

  return (
    <Modal titleId="event-panel-title" onClose={onClose} footer={footer} size="sm">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover key={eventImage(event)} src={eventImage(event)} muted={eventTiming(event, today) === 'past' || status === 'cancelled'} />
      </div>

      <div className="border-b border-slate-100 px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <TimingPill event={event} today={today} />
          {event.category && (
            <span className={`${PILL} border-red-100 bg-red-50 text-red-700`}>
              <Icon name="tag" className="h-3 w-3" strokeWidth={2} />
              {event.category}
            </span>
          )}
          {event.featured && (
            <span className={`${PILL} border-amber-200 bg-amber-50 text-amber-700`}>
              <Icon name="star" className="h-3 w-3" strokeWidth={2} />
              Featured
            </span>
          )}
        </div>
        <h2 id="event-panel-title" className="mt-2.5 text-lg font-semibold leading-snug text-slate-900">
          {eventTitle(event)}
        </h2>
        {status === 'draft' && <p className="mt-1 text-[13px] text-amber-700">A draft: only admins can see it until it’s published.</p>}
        {status === 'cancelled' && <p className="mt-1 text-[13px] text-red-700">Shown on the website as cancelled, so people who planned to come know.</p>}
      </div>

      <DetailSection title="When & where">
        <DetailRow icon="calendar" label="Date">
          {event.date ? longDate(event) : muted('Not set')}
        </DetailRow>
        <DetailRow icon="clock" label="Time">
          {timeRange(event) || muted('Not set')}
        </DetailRow>
        <DetailRow icon="mapPin" label="Location">
          {event.location || muted('Not set')}
        </DetailRow>
        <DetailRow icon="user" label="Speaker or host">
          {event.speaker ? (
            <>
              {event.speaker}
              {event.speaker_role && <span className="block text-xs font-normal text-slate-500">{event.speaker_role}</span>}
            </>
          ) : (
            muted('Not set')
          )}
        </DetailRow>
        <DetailRow icon="users" label="Who it’s for">
          {event.audience || muted('Everyone')}
        </DetailRow>
      </DetailSection>

      <section className="px-5 py-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">About</h3>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">{event.description || muted('No description yet.')}</p>
      </section>

      <DetailSection title="Sign-ups">
        <DetailRow icon="checkBadge" label="How people sign up">
          {mode?.label || muted('Not set')}
          {event.registration === 'external' && event.registration_url && (
            <a href={event.registration_url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs font-normal text-red-700 hover:underline">
              {event.registration_url}
            </a>
          )}
        </DetailRow>
      </DetailSection>
      {event.registration === 'rsvp' && <Registrations key={event.id} event={event} onChanged={onChanged} flash={flash} />}

      <DetailSection title="Record">
        <DetailRow icon="user" label="Added by">
          {author || muted('Unknown')}
        </DetailRow>
        <DetailRow icon="clock" label="Added on">
          {created ? formatDate(created) : muted('Unknown')}
        </DetailRow>
      </DetailSection>
    </Modal>
  );
}

/* ── Page ── */
function EventsList() {
  const [events, setEvents] = useState([]);
  const [authors, setAuthors] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [tab, setTab] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // null, { event: null } to add, or { event } to edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [toast, flash] = useToast();

  const today = useMemo(() => startOfDay(new Date()), []);

  const load = useCallback((initial = false) => {
    if (!initial) setRefreshing(true);
    api.get('/api/v1/events?status=all&when=all')
      .then((response) => {
        const rows = Array.isArray(response.data) ? response.data : [];
        setEvents(rows);
        setError(null);
        setUpdatedAt(new Date());
        // Older API responses carry only the creator's id; their names come from the users list
        if (rows.some((event) => !event.created_by && event.created_by_id)) {
          api.get('/api/v1/users')
            .then((users) => setAuthors(new Map((Array.isArray(users.data) ? users.data : []).map((user) => [user.id, userName(user)]))))
            .catch(() => {});
        }
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load events.'));
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const authorOf = (event) => event.created_by?.name || authors.get(event.created_by_id) || null;

  const groups = useMemo(() => {
    const live = events.filter((event) => statusOf(event) !== 'draft');
    const upcoming = live.filter((event) => eventTiming(event, today) !== 'past').sort(bySoonest);
    const past = live.filter((event) => eventTiming(event, today) === 'past').sort(byMostRecent);
    const drafts = events.filter((event) => statusOf(event) === 'draft').sort(bySoonest);
    return { upcoming, drafts, past, all: [...upcoming, ...drafts, ...past] };
  }, [events, today]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups[tab];
    return groups[tab].filter((event) => [event.title, event.description, event.location, event.category, event.speaker].join(' ').toLowerCase().includes(needle));
  }, [groups, tab, query]);

  const openEvent = events.find((event) => event.id === openId) || null;
  const closePanel = useCallback(() => setOpenId(null), []);
  const closeForm = useCallback(() => setForm(null), []);

  const handleSaved = (saved, { status, created }) => {
    setForm(null);
    const title = saved?.title || 'The event';
    if (created) flash(status === 'draft' ? `“${title}” was saved as a draft` : `“${title}” was published`);
    else flash(status === 'published' && openEvent && statusOf(openEvent) === 'draft' ? `“${title}” was published` : 'Changes saved');
    if (created) setTab(status === 'draft' ? 'drafts' : 'upcoming');
    if (saved) setEvents((current) => (created ? [...current, saved] : current.map((event) => (event.id === saved.id ? saved : event))));
    load();
  };

  const setStatus = async (event, status) => {
    setStatusBusy(true);
    setActionError(null);
    try {
      const response = await api.patch(`/api/v1/events/${event.id}`, { event: { status } });
      if (response.data?.event) setEvents((current) => current.map((item) => (item.id === event.id ? response.data.event : item)));
      flash(status === 'cancelled' ? 'Marked as cancelled. You can restore it at any time.' : 'Restored: it’s back on the calendar');
      load();
    } catch (err) {
      setOpenId(null);
      setActionError(saveErrorMessages(err, 'events', 'Could not update the event.').join(' '));
    } finally {
      setStatusBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/events/${deleting.id}`);
      setEvents((current) => current.filter((event) => event.id !== deleting.id));
      setOpenId(null);
      flash(`“${eventTitle(deleting)}” was deleted`);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'events', 'Could not delete the event.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  const addButton = (
    <button type="button" onClick={() => setForm({ event: null })} className={PRIMARY_BUTTON}>
      <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
      Add event
    </button>
  );

  let content;
  if (loading) {
    content = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  } else if (error && !events.length) {
    content = (
      <EmptyState icon="warning" title="Couldn’t load events" message={error}>
        <button type="button" onClick={() => load()} className={BUTTON}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </EmptyState>
    );
  } else if (!events.length) {
    content = (
      <EmptyState icon="calendar" title="No events yet" message="Add your first event so the congregation knows what’s coming up.">
        {addButton}
      </EmptyState>
    );
  } else if (!visible.length && query.trim()) {
    content = (
      <EmptyState icon="search" title={`No events match “${query.trim()}”`} message="Try a different title, place, speaker or category.">
        <button type="button" onClick={() => setQuery('')} className={BUTTON}>
          <Icon name="close" className="h-3.5 w-3.5" />
          Clear search
        </button>
      </EmptyState>
    );
  } else if (!visible.length) {
    const empty = {
      upcoming: { icon: 'calendar', title: 'Nothing coming up', message: 'There are no upcoming events. Plan the next gathering so members can make time for it.' },
      drafts: { icon: 'pencil', title: 'No drafts', message: 'Save an event as a draft to prepare it before it appears on the website.' },
      past: { icon: 'inbox', title: 'No past events', message: 'Events move here once their last day has passed.' },
    }[tab];
    content = (
      <EmptyState icon={empty.icon} title={empty.title} message={empty.message}>
        {tab === 'upcoming' && (
          <>
            {addButton}
            <button type="button" onClick={() => setTab('past')} className={BUTTON}>
              See past events
            </button>
          </>
        )}
      </EmptyState>
    );
  } else {
    content = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {visible.map((event) => (
          <EventCard key={event.id} event={event} today={today} author={authorOf(event)} onOpen={() => setOpenId(event.id)} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Events</h1>
            <p className="mt-1 text-[13px] text-slate-500">Services, conferences, youth nights and outreach — everything on the church calendar.</p>
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
            {addButton}
          </div>
        </header>

        {/* A refresh failed but older data is still on screen */}
        {error && events.length > 0 && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900">
            <Icon name="warning" className="h-4 w-4 shrink-0 text-amber-600" />
            {error} Showing the events from {updatedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
          </div>
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

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Show events">
            {TABS.map(({ key, label }) => {
              const isActive = key === tab;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-[13px] font-medium transition ${
                    isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                  {!loading && (
                    <span className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${isActive ? 'bg-red-50 text-red-700' : 'bg-slate-200/60 text-slate-500'}`}>
                      {groups[key].length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="relative sm:w-72">
            <span className="sr-only">Search events</span>
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, place, speaker…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </label>
        </div>

        {content}
      </div>

      {/* Outside the space-y stack above, which would push these fixed layers down */}
      {openEvent && !form && !deleting && (
        <EventPanel
          event={openEvent}
          today={today}
          author={authorOf(openEvent)}
          busy={statusBusy}
          onClose={closePanel}
          onEdit={() => setForm({ event: openEvent })}
          onDelete={() => {
            setDeleteError(null);
            setDeleting(openEvent);
          }}
          onSetStatus={(status) => setStatus(openEvent, status)}
          onChanged={() => load()}
          flash={flash}
        />
      )}
      {form && <EventForm event={form.event} onClose={closeForm} onSaved={handleSaved} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete “${eventTitle(deleting)}”?`}
          message={
            deleting.registrations_count
              ? `It will be removed from the website, along with its ${deleting.registrations_count} RSVP${deleting.registrations_count === 1 ? '' : 's'}. To keep it visible as called off, mark it as cancelled instead. This can’t be undone.`
              : 'It will be removed from the website. To keep it visible as called off, mark it as cancelled instead. This can’t be undone.'
          }
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

export default EventsList;
