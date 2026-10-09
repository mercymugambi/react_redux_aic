import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/authSlice';
import api from '../../redux/api';
import { canAccessPage } from '../../auth/permissions';
import Icon from './Icon';
import { Avatar, BUTTON, Checkbox, Skeleton, StatCard } from './ui';
import { MONTHS, dayStatus, downloadCsv, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

/* ── Data sources ── */
// `page` is the admin page that shows a source; data for pages the user can't
// open isn't requested. Users has no page here: any signed-in user may list
// them, and the overview needs them to name who created each event and devotion.
const SOURCES = [
  { key: 'members', url: '/api/v1/members', label: 'members', page: '/admin/members' },
  { key: 'users', url: '/api/v1/users', label: 'users' },
  // Drafts, cancelled and past events too (drafts are left out of the counts below)
  { key: 'events', url: '/api/v1/events?status=all&when=all', label: 'events', page: '/admin/events' },
  { key: 'devotions', url: '/api/v1/devotions', label: 'devotions', page: '/admin/devotions' },
  { key: 'fellowshipGroups', url: '/api/v1/fellowship_groups', label: 'fellowship groups', page: '/admin/fellowship-groups' },
  { key: 'leadershipPositions', url: '/api/v1/leadership_positions', label: 'leadership positions', page: '/admin/leadership-positions' },
];

const EMPTY_DATA = SOURCES.reduce((acc, { key }) => ({ ...acc, [key]: [] }), {});

// Anything other than an array (an error, or an HTML auth redirect) counts as a failed load.
async function fetchAll(sources) {
  const results = await Promise.all(
    sources.map(({ key, url }) =>
      api
        .get(url)
        .then((response) => [key, Array.isArray(response.data) ? response.data : null])
        .catch(() => [key, null])
    )
  );

  const data = { ...EMPTY_DATA };
  const failed = [];
  results.forEach(([key, rows]) => {
    data[key] = rows || [];
    if (!rows) failed.push(key);
  });
  return { data, failed };
}

/* ── Dates ── */
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatShortDate = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;
const formatLongDate = (date) => `${DAYS[date.getDay()]}, ${date.getDate()} ${FULL_MONTHS[date.getMonth()]} ${date.getFullYear()}`;

const eventDate = (event) => parseDate(event.date || event.event_date);
const devotionDate = (devotion) => parseDate(devotion.date || devotion.created_at);
const eventTitle = (event) => event.title || event.name || 'Untitled event';
const memberName = (member) => [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Unnamed member';
const userName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email || '—';

const joinList = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/* ── Shared styles ── */
// Grid columns by item count, so the rows still fill the width when a user can
// only open some pages. Written out in full so Tailwind keeps the classes.
const CARD_COLUMNS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };
const GLANCE_COLUMNS = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

const STATUS = {
  today: { label: 'Today', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  upcoming: { label: 'Upcoming', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  past: { label: 'Past', className: 'border-slate-200 bg-slate-50 text-slate-500' },
  scheduled: { label: 'Scheduled', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  published: { label: 'Published', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

/* ── Small building blocks ── */
function StatusPill({ status }) {
  if (!status) return <span className="text-slate-300">—</span>;
  const { label, className } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function DateTile({ date }) {
  return (
    <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white leading-none">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-red-600">{date ? MONTHS[date.getMonth()] : 'TBD'}</span>
      <span className="mt-0.5 text-[13px] font-semibold text-slate-900">{date ? date.getDate() : '–'}</span>
    </span>
  );
}

/* ── Records table ── */
const VIEW_ORDER = ['members', 'events', 'devotions'];
const PAGE_SIZES = [5, 10, 20];

function RecordsPanel({ views, order, loading, failed, onRetry }) {
  const [active, setActive] = useState(order[0]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(() => new Set());

  const view = views[active];
  const viewFailed = failed.includes(active);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return view.rows;
    return view.rows.filter((row) => view.search(row).toLowerCase().includes(needle));
  }, [view, query]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const pageIds = pageRows.map((row) => row.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;

  const switchView = (key) => {
    setActive(key);
    setQuery('');
    setPage(1);
    setSelected(new Set());
  };

  const toggleRow = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((current) => {
      const next = new Set(current);
      pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const handleExport = () => {
    const rows = selected.size ? view.rows.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(`aic-kabuku-${active}-${toIsoDay(new Date())}.csv`, view.columns, rows);
  };

  const colSpan = view.columns.length + 2;

  let body;
  if (loading) {
    body = Array.from({ length: 5 }, (_, index) => (
      <tr key={index}>
        <td className="py-3.5 pl-4 pr-2"><Skeleton className="h-4 w-4" /></td>
        {view.columns.map((column, columnIndex) => (
          <td key={column.key} className="px-4 py-3.5">
            <Skeleton className={`h-3.5 ${columnIndex === 0 ? 'w-40' : 'w-24'}`} />
          </td>
        ))}
        <td className="px-4 py-3.5" />
      </tr>
    ));
  } else if (viewFailed || total === 0) {
    const noMatches = !viewFailed && view.rows.length > 0;
    body = (
      <tr>
        <td colSpan={colSpan} className="px-4 py-14">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
              <Icon name={viewFailed ? 'warning' : noMatches ? 'search' : 'inbox'} className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {viewFailed
                ? `Couldn’t load ${view.label.toLowerCase()}`
                : noMatches
                  ? `No results for “${query.trim()}”`
                  : `No ${view.label.toLowerCase()} yet`}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              {viewFailed
                ? 'The server didn’t respond. Check your connection and try again.'
                : noMatches
                  ? 'Try a different name, place or date.'
                  : view.emptyHint}
            </p>
            <div className="mt-4">
              {viewFailed ? (
                <button type="button" onClick={onRetry} className={BUTTON}>
                  <Icon name="refresh" className="h-3.5 w-3.5" />
                  Try again
                </button>
              ) : noMatches ? (
                <button type="button" onClick={() => setQuery('')} className={BUTTON}>
                  Clear search
                </button>
              ) : (
                <Link to={view.to} className={BUTTON}>
                  Go to {view.label}
                  <Icon name="chevronRight" className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  } else {
    body = pageRows.map((row) => {
      const isSelected = selected.has(row.id);
      return (
        <tr key={row.id} className={`transition-colors ${isSelected ? 'bg-red-50/40' : 'hover:bg-slate-50/70'}`}>
          <td className="py-2 pl-4 pr-2 align-middle">
            <Checkbox checked={isSelected} onChange={() => toggleRow(row.id)} label={`Select ${view.rowLabel(row)}`} />
          </td>
          {view.columns.map((column, columnIndex) => (
            <td
              key={column.key}
              className={`whitespace-nowrap px-4 py-2 align-middle ${columnIndex === 0 ? 'font-medium text-slate-900' : 'text-slate-600'}`}
            >
              {column.render(row)}
            </td>
          ))}
          <td className="px-4 py-2 text-right align-middle">
            <Link
              to={view.to}
              aria-label={`Open ${view.label}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-red-200 hover:text-red-700"
            >
              <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </td>
        </tr>
      );
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[15px] font-semibold text-slate-900">Records</h2>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Choose records to show">
            {order.map((key) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchView(key)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-medium transition ${
                    isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {views[key].label}
                  {!loading && (
                    <span
                      className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${
                        isActive ? 'bg-red-50 text-red-700' : 'bg-slate-200/60 text-slate-500'
                      }`}
                    >
                      {failed.includes(key) ? '—' : views[key].rows.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex-1 lg:w-60 lg:flex-none">
            <span className="sr-only">Search {view.label.toLowerCase()}</span>
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${view.label.toLowerCase()}…`}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </label>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} className={BUTTON} aria-label="Clear selection">
              <Icon name="close" className="h-3.5 w-3.5" />
              {selected.size} selected
            </button>
          )}
          <button type="button" onClick={handleExport} disabled={loading || total === 0} className={BUTTON}>
            <Icon name="download" className="h-3.5 w-3.5" />
            {selected.size ? 'Export selected' : 'Export'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-xs text-slate-500">
              <th scope="col" className="w-10 py-2.5 pl-4 pr-2 font-medium">
                <Checkbox
                  checked={allOnPage}
                  indeterminate={selectedOnPage > 0 && !allOnPage}
                  disabled={loading || pageRows.length === 0}
                  onChange={togglePage}
                  label="Select all rows on this page"
                />
              </th>
              {view.columns.map((column) => (
                <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {column.label}
                </th>
              ))}
              <th scope="col" className="w-14 px-4 py-2.5">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{body}</tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="tabular-nums">
          {loading
            ? 'Loading…'
            : total
              ? `Showing ${start + 1} to ${Math.min(start + pageSize, total)} of ${total} ${total === 1 ? view.noun : `${view.noun}s`}`
              : `0 ${view.noun}s`}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white pl-2 pr-7 text-xs text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon name="chevronLeft" className="h-3.5 w-3.5" strokeWidth={2} />
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pageCount}
            className={`${BUTTON} h-8 px-2.5 text-xs`}
          >
            Next
            <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Page ── */
function DashboardHome() {
  const user = useSelector(selectCurrentUser);
  const [data, setData] = useState(EMPTY_DATA);
  const [failed, setFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const mountedRef = useRef(true);

  const sources = useMemo(() => SOURCES.filter(({ page }) => !page || canAccessPage(user, page)), [user]);

  const load = useCallback(async (initial = false) => {
    if (!initial) setRefreshing(true);
    const result = await fetchAll(sources);
    if (!mountedRef.current) return;
    setData(result.data);
    setFailed(result.failed);
    setUpdatedAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [sources]);

  useEffect(() => {
    mountedRef.current = true;
    load(true);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const retry = () => load();

  const today = useMemo(() => startOfDay(new Date()), []);

  const derived = useMemo(() => {
    const { members, users, events, devotions } = data;
    const usersById = new Map(users.map((u) => [u.id, u]));
    const authorOf = (id) => (usersById.has(id) ? userName(usersById.get(id)) : '—');

    // Members: newest first. created_at when the API sends it, id otherwise.
    const hasJoinDates = members.some((m) => parseDate(m.created_at));
    const sortedMembers = [...members].sort((a, b) =>
      hasJoinDates
        ? (parseDate(b.created_at)?.getTime() || 0) - (parseDate(a.created_at)?.getTime() || 0)
        : (b.id || 0) - (a.id || 0)
    );
    const joinedThisMonth = members.filter((m) => {
      const joined = parseDate(m.created_at);
      return joined && joined.getFullYear() === today.getFullYear() && joined.getMonth() === today.getMonth();
    }).length;

    // Events: soonest upcoming first, then past events newest first, undated last.
    const rank = (event) => {
      const date = eventDate(event);
      if (!date) return [2, 0];
      const upcoming = dayStatus(date, today) !== 'past';
      return upcoming ? [0, date.getTime()] : [1, -date.getTime()];
    };
    const sortedEvents = [...events].sort((a, b) => {
      const [groupA, timeA] = rank(a);
      const [groupB, timeB] = rank(b);
      return groupA - groupB || timeA - timeB;
    });
    const upcomingEvents = sortedEvents.filter(
      (e) => eventDate(e) && dayStatus(eventDate(e), today) !== 'past' && e.status !== 'draft' && e.status !== 'cancelled'
    );

    const sortedDevotions = [...devotions].sort(
      (a, b) => (devotionDate(b)?.getTime() || 0) - (devotionDate(a)?.getTime() || 0)
    );
    const latestDevotion = sortedDevotions.find((d) => dayStatus(devotionDate(d), today) !== 'upcoming');

    const memberColumns = [
      {
        key: 'name',
        label: 'Name',
        render: (m) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={memberName(m)} />
            {memberName(m)}
          </span>
        ),
        csv: memberName,
      },
      { key: 'phone', label: 'Phone', render: (m) => <span className="tabular-nums">{m.phone_number || '—'}</span>, csv: (m) => m.phone_number },
      { key: 'residence', label: 'Residence', render: (m) => m.place_of_residence || '—', csv: (m) => m.place_of_residence },
      { key: 'dob', label: 'Date of birth', render: (m) => formatDate(parseDate(m.date_of_birth)), csv: (m) => m.date_of_birth },
    ];
    if (hasJoinDates) {
      memberColumns.push({ key: 'joined', label: 'Joined', render: (m) => formatDate(parseDate(m.created_at)), csv: (m) => m.created_at });
    }

    const views = {
      members: {
        label: 'Members',
        noun: 'member',
        to: '/admin/members',
        emptyHint: 'Members added to the church directory will show up here.',
        rows: sortedMembers,
        rowLabel: memberName,
        search: (m) => [memberName(m), m.phone_number, m.place_of_residence].join(' '),
        columns: memberColumns,
      },
      events: {
        label: 'Events',
        noun: 'event',
        to: '/admin/events',
        emptyHint: 'Services, conferences and gatherings you schedule will show up here.',
        rows: sortedEvents,
        rowLabel: eventTitle,
        search: (e) => [eventTitle(e), e.location, formatDate(eventDate(e))].join(' '),
        columns: [
          {
            key: 'title',
            label: 'Event',
            render: (e) => (
              <span className="flex items-center gap-3">
                <DateTile date={eventDate(e)} />
                <span className="max-w-[260px] truncate">{eventTitle(e)}</span>
              </span>
            ),
            csv: eventTitle,
          },
          { key: 'date', label: 'Date', render: (e) => formatDate(eventDate(e)), csv: (e) => e.date || e.event_date },
          { key: 'location', label: 'Location', render: (e) => e.location || '—', csv: (e) => e.location },
          { key: 'status', label: 'Status', render: (e) => <StatusPill status={dayStatus(eventDate(e), today)} />, csv: (e) => STATUS[dayStatus(eventDate(e), today)]?.label },
          { key: 'author', label: 'Created by', render: (e) => authorOf(e.created_by_id), csv: (e) => authorOf(e.created_by_id) },
        ],
      },
      devotions: {
        label: 'Devotions',
        noun: 'devotion',
        to: '/admin/devotions',
        emptyHint: 'Daily devotions you publish for the congregation will show up here.',
        rows: sortedDevotions,
        rowLabel: (d) => d.title || 'Untitled devotion',
        search: (d) => [d.title, formatDate(devotionDate(d)), authorOf(d.created_by_id)].join(' '),
        columns: [
          { key: 'title', label: 'Title', render: (d) => <span className="block max-w-[340px] truncate">{d.title || 'Untitled devotion'}</span>, csv: (d) => d.title },
          { key: 'date', label: 'Date', render: (d) => formatDate(devotionDate(d)), csv: (d) => d.date || d.created_at },
          {
            key: 'status',
            label: 'Status',
            render: (d) => <StatusPill status={dayStatus(devotionDate(d), today) === 'upcoming' ? 'scheduled' : devotionDate(d) ? 'published' : null} />,
            csv: (d) => (dayStatus(devotionDate(d), today) === 'upcoming' ? 'Scheduled' : 'Published'),
          },
          { key: 'author', label: 'Author', render: (d) => authorOf(d.created_by_id), csv: (d) => authorOf(d.created_by_id) },
        ],
      },
    };

    return { views, hasJoinDates, joinedThisMonth, upcomingEvents, latestDevotion };
  }, [data, today]);

  const { views, hasJoinDates, joinedThisMonth, upcomingEvents, latestDevotion } = derived;
  const nextEvent = upcomingEvents[0];
  const isFailed = (key) => failed.includes(key);
  const count = (key) => (isFailed(key) ? '—' : data[key].length.toLocaleString());

  let memberCaption = 'In the church directory';
  if (isFailed('members')) memberCaption = 'Couldn’t load members';
  else if (!data.members.length) memberCaption = 'No members added yet';
  else if (hasJoinDates && joinedThisMonth) memberCaption = <><span className="font-medium text-emerald-600">+{joinedThisMonth}</span> joined this month</>;
  else if (hasJoinDates) memberCaption = 'No new members this month';

  const canOpen = (item) => canAccessPage(user, item.to);

  const cards = [
    { key: 'members', label: 'Members', icon: 'users', tone: 'red', to: '/admin/members', value: count('members'), caption: memberCaption },
    {
      key: 'events',
      label: 'Upcoming events',
      icon: 'calendar',
      tone: 'amber',
      to: '/admin/events',
      value: isFailed('events') ? '—' : upcomingEvents.length.toLocaleString(),
      caption: isFailed('events')
        ? 'Couldn’t load events'
        : nextEvent
          ? `Next: ${eventTitle(nextEvent)} · ${formatShortDate(eventDate(nextEvent))}`
          : 'Nothing scheduled yet',
    },
    {
      key: 'devotions',
      label: 'Devotions',
      icon: 'book',
      tone: 'sky',
      to: '/admin/devotions',
      value: count('devotions'),
      caption: isFailed('devotions')
        ? 'Couldn’t load devotions'
        : latestDevotion
          ? `Latest: ${latestDevotion.title || 'Untitled devotion'}`
          : 'None published yet',
    },
  ].filter(canOpen);

  const glance = [
    { key: 'users', label: 'Admin users', icon: 'shield', to: '/admin/users' },
    { key: 'fellowshipGroups', label: 'Fellowship groups', icon: 'group', to: '/admin/fellowship-groups' },
    { key: 'leadershipPositions', label: 'Leadership positions', icon: 'briefcase', to: '/admin/leadership-positions' },
  ].filter(canOpen);

  const recordViews = VIEW_ORDER.filter((key) => canOpen(views[key]));

  const failedLabels = SOURCES.filter(({ key }) => isFailed(key)).map(({ label }) => label);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {user?.firstname ? `Welcome back, ${user.firstname}. ` : ''}
            {formatLongDate(today)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="mr-1 hidden text-xs text-slate-400 md:inline">
              Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button type="button" onClick={retry} disabled={loading || refreshing} className={BUTTON}>
            <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Partial-failure notice */}
      {!loading && failedLabels.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <span className="font-medium">Some data couldn’t be loaded.</span> The server didn’t return {joinList(failedLabels)}, so
              those figures may be missing.
            </span>
          </p>
          <button type="button" onClick={retry} disabled={refreshing} className={`${BUTTON} shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100`}>
            <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Try again
          </button>
        </div>
      )}

      {/* No roles yet: nothing below applies */}
      {cards.length === 0 && glance.length === 0 && (
        <section className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
            <Icon name="lock" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-900">Nothing to manage yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
            Your account doesn’t have access to any admin pages. Ask the super admin to give you a role.
          </p>
        </section>
      )}

      {/* Headline stats */}
      {cards.length > 0 && (
        <section className={`grid gap-3 ${CARD_COLUMNS[cards.length]}`} aria-label="Key figures">
          {cards.map(({ key, ...card }) => (
            <StatCard key={key} {...card} loading={loading} />
          ))}
        </section>
      )}

      {/* At a glance */}
      {glance.length > 0 && (
        <section
          aria-label="More figures"
          className={`grid divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:divide-x sm:divide-y-0 ${GLANCE_COLUMNS[glance.length]}`}
        >
          {glance.map((item) => (
            <Link key={item.key} to={item.to} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/70">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition group-hover:text-red-700">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-slate-500">{item.label}</span>
                {loading ? (
                  <Skeleton className="mt-1 h-4 w-8" />
                ) : (
                  <span className="block text-[15px] font-semibold leading-tight text-slate-900 tabular-nums">{count(item.key)}</span>
                )}
              </span>
              <Icon name="chevronRight" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </Link>
          ))}
        </section>
      )}

      {/* Records */}
      {recordViews.length > 0 && (
        <RecordsPanel views={views} order={recordViews} loading={loading} failed={failed} onRetry={retry} />
      )}
    </div>
  );
}

export default DashboardHome;
