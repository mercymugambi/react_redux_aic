import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage } from '../../redux/api';
import Icon from './Icon';
import EventForm from './EventForm';
import { Avatar, BUTTON, DetailRow, DetailSection, isHttpUrl, muted, PRIMARY_BUTTON, Skeleton, SlideOver, Toast, useToast } from './ui';
import { MONTHS, dayStatus, formatDate, parseDate, startOfDay } from './utils';

/* ── Event fields ── */
const eventDate = (event) => parseDate(event.date);
const eventTitle = (event) => event.title || 'Untitled event';
const userName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;
const longDate = (date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// "14:30", or a Rails time such as "2000-01-01T14:30:00.000Z" → "2:30 PM"
function formatTime(value) {
  const match = /(\d{1,2}):(\d{2})/.exec(value || '');
  if (!match) return null;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`;
}

function timeRange(event) {
  const start = formatTime(event.start_time);
  const end = formatTime(event.end_time);
  return start && end ? `${start} – ${end}` : start;
}

/* ── Tabs ── */
// Undated events count as upcoming and sort last
const byDateAsc = (a, b) => (eventDate(a)?.getTime() ?? Infinity) - (eventDate(b)?.getTime() ?? Infinity);
const byDateDesc = (a, b) => (eventDate(b)?.getTime() ?? 0) - (eventDate(a)?.getTime() ?? 0);

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

/* ── Styles ── */
const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const STATUS_TONES = {
  today: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  upcoming: 'border-sky-200 bg-sky-50 text-sky-700',
  past: 'border-slate-200 bg-slate-50 text-slate-500',
};

/* ── Small building blocks ── */
function StatusPill({ date, today, className = '' }) {
  const status = dayStatus(date, today);
  if (!status) return null;
  const days = Math.round((startOfDay(date) - today) / 86400000);
  let label = 'Past';
  if (status === 'today') label = 'Today';
  else if (days === 1) label = 'Tomorrow';
  else if (status === 'upcoming') label = days <= 14 ? `In ${days} days` : 'Upcoming';
  return (
    <span className={`${PILL} ${STATUS_TONES[status]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function DateBadge({ date, className = '' }) {
  return (
    <span className={`flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-white/95 leading-none shadow-sm ring-1 ring-slate-900/5 backdrop-blur ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">{date ? MONTHS[date.getMonth()] : 'TBD'}</span>
      <span className="mt-1 text-lg font-semibold text-slate-900">{date ? date.getDate() : '–'}</span>
    </span>
  );
}

// The event's image, or a branded placeholder when there's none or it won't load
function Cover({ src, past = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (src && isHttpUrl(src) && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${past ? 'grayscale-[40%]' : ''} ${className}`}
      />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 ${past ? 'saturate-0' : ''} ${className}`}>
      <Icon name="calendar" className="h-10 w-10 text-red-200" strokeWidth={1.25} />
    </div>
  );
}

function EventCard({ event, today, author, onOpen }) {
  const date = eventDate(event);
  const time = timeRange(event);
  const past = dayStatus(date, today) === 'past';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)] focus-within:ring-2 focus-within:ring-red-200">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover key={event.image} src={event.image} past={past} className="transition duration-300 group-hover:scale-[1.03]" />
        <DateBadge date={date} className="absolute left-3 top-3" />
        <StatusPill date={date} today={today} className="absolute right-3 top-3 shadow-sm" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {event.category && <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700">{event.category}</span>}
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-red-700">
          {/* The button stretches over the whole card, so any click opens it */}
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {eventTitle(event)}
          </button>
        </h3>
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Icon name="calendar" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {formatDate(date)}
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
              {author ? (
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

/* ── Event details (slide-over) ── */
function EventPanel({ event, today, author, onClose }) {
  const date = eventDate(event);
  const created = parseDate(event.created_at);

  return (
    <SlideOver label="Event details" titleId="event-panel-title" onClose={onClose}>
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover key={event.image} src={event.image} past={dayStatus(date, today) === 'past'} />
      </div>

      <div className="border-b border-slate-100 px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill date={date} today={today} />
          {event.category && (
            <span className={`${PILL} border-red-100 bg-red-50 text-red-700`}>
              <Icon name="tag" className="h-3 w-3" strokeWidth={2} />
              {event.category}
            </span>
          )}
        </div>
        <h2 id="event-panel-title" className="mt-2.5 text-lg font-semibold leading-snug text-slate-900">
          {eventTitle(event)}
        </h2>
      </div>

      <DetailSection title="When & where">
        <DetailRow icon="calendar" label="Date">
          {date ? longDate(date) : muted('Not set')}
        </DetailRow>
        <DetailRow icon="clock" label="Time">
          {timeRange(event) || muted('Not set')}
        </DetailRow>
        <DetailRow icon="mapPin" label="Location">
          {event.location || muted('Not set')}
        </DetailRow>
      </DetailSection>

      <section className="px-5 py-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">About</h3>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">
          {event.description || muted('No description yet.')}
        </p>
      </section>

      <DetailSection title="Record">
        <DetailRow icon="user" label="Added by">
          {author || muted('Unknown')}
        </DetailRow>
        <DetailRow icon="clock" label="Added on">
          {created ? formatDate(created) : muted('Unknown')}
        </DetailRow>
      </DetailSection>
    </SlideOver>
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
  const [adding, setAdding] = useState(false);
  const [toast, flash] = useToast();

  const today = useMemo(() => startOfDay(new Date()), []);

  const load = useCallback((initial = false) => {
    if (!initial) setRefreshing(true);
    // Names of who added each event; the page still works if this fails
    api.get('/api/v1/users')
      .then((response) => setAuthors(new Map((Array.isArray(response.data) ? response.data : []).map((u) => [u.id, userName(u)]))))
      .catch(() => {});
    api.get('/api/v1/events')
      .then((response) => {
        setEvents(Array.isArray(response.data) ? response.data : []);
        setError(null);
        setUpdatedAt(new Date());
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

  const groups = useMemo(() => {
    const upcoming = events.filter((e) => dayStatus(eventDate(e), today) !== 'past').sort(byDateAsc);
    const past = events.filter((e) => dayStatus(eventDate(e), today) === 'past').sort(byDateDesc);
    return { upcoming, past, all: [...upcoming, ...past] };
  }, [events, today]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups[tab];
    return groups[tab].filter((e) => [e.title, e.description, e.location, e.category].join(' ').toLowerCase().includes(needle));
  }, [groups, tab, query]);

  const openEvent = events.find((e) => e.id === openId) || null;
  const closePanel = useCallback(() => setOpenId(null), []);
  const closeForm = useCallback(() => setAdding(false), []);

  const handleCreated = (title) => {
    setAdding(false);
    flash(`“${title}” was added`);
    setTab('upcoming');
    load();
  };

  const addButton = (
    <button type="button" onClick={() => setAdding(true)} className={PRIMARY_BUTTON}>
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
      <EmptyState icon="search" title={`No events match “${query.trim()}”`} message="Try a different title, place or category.">
        <button type="button" onClick={() => setQuery('')} className={BUTTON}>
          <Icon name="close" className="h-3.5 w-3.5" />
          Clear search
        </button>
      </EmptyState>
    );
  } else if (!visible.length) {
    content =
      tab === 'upcoming' ? (
        <EmptyState icon="calendar" title="Nothing coming up" message="There are no upcoming events. Plan the next gathering so members can make time for it.">
          {addButton}
          <button type="button" onClick={() => setTab('past')} className={BUTTON}>
            See past events
          </button>
        </EmptyState>
      ) : (
        <EmptyState icon="inbox" title="No past events" message="Events move here once their date has passed." />
      );
  } else {
    content = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {visible.map((event) => (
          <EventCard key={event.id} event={event} today={today} author={authors.get(event.created_by_id)} onOpen={() => setOpenId(event.id)} />
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
              placeholder="Search title, place, category…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </label>
        </div>

        {content}
      </div>

      {/* Outside the space-y stack above, which would push these fixed layers down */}
      {openEvent && <EventPanel event={openEvent} today={today} author={authors.get(openEvent.created_by_id)} onClose={closePanel} />}
      {adding && <EventForm onClose={closeForm} onCreated={handleCreated} />}
      <Toast message={toast} />
    </>
  );
}

export default EventsList;
