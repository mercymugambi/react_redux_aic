import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage } from '../../redux/api';
import Icon from './Icon';
import {
  Avatar,
  BUTTON,
  Checkbox,
  ConfirmDialog,
  DetailRow,
  DetailSection,
  Modal,
  muted,
  PRIMARY_BUTTON,
  Skeleton,
  StatCard,
  Toast,
  useToast,
} from './ui';
import { MONTHS, dayStatus, downloadCsv, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

const PAGE_SIZES = [10, 25, 50];

const STATUS_META = {
  pending: {
    label: 'Pending',
    pill: 'border-amber-200 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  reschedule_requested: {
    label: 'Reschedule requested',
    pill: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  completed: {
    label: 'Completed',
    pill: 'border-slate-200 bg-slate-100 text-slate-700',
    dot: 'bg-slate-500',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
};

const SELECT =
  'h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const DATE_INPUT =
  'h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';
const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';

const apptDate = (a) => parseDate(a.appointment_date);
const bookedDate = (a) => parseDate(a.created_at);
const telHref = (phone = '') => `tel:${String(phone).replace(/[^\d+]/g, '')}`;
const dayMonth = (date) => (date ? `${date.getDate()} ${MONTHS[date.getMonth()]}` : '—');

function buildGmailComposeUrl(appt) {
  if (appt.gmail_reschedule_url) return appt.gmail_reschedule_url;
  const dateObj = apptDate(appt);
  const dateLabel = dateObj ? formatDate(dateObj) : appt.appointment_date;
  const subject = `Reschedule Request: Appointment at AIC Kabuku Church (${dateLabel})`;
  const body = [
    `Dear ${appt.name},`,
    '',
    `Thank you for booking an appointment for ${appt.purpose} on ${dateLabel} at ${appt.appointment_time}.`,
    '',
    'Unfortunately, I will not be available at that time. Could we please reschedule to another date and time that works for you?',
    '',
    'God bless you,',
    'Pastor — AIC Kabuku Church',
  ].join('\n');
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: appt.email || '',
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

const SORTS = {
  name: (a) => (a.name || '').toLowerCase(),
  date: (a) => apptDate(a)?.getTime() ?? null,
  purpose: (a) => (a.purpose || '').toLowerCase(),
  status: (a) => (a.status || '').toLowerCase(),
  booked: (a) => bookedDate(a)?.getTime() ?? null,
};

function compareBy(key, dir) {
  const value = SORTS[key] || SORTS.date;
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sign;
  };
}

function pageList(current, count) {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const pages = new Set([1, count, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  return sorted.flatMap((p, index) => (index > 0 && p - sorted[index - 1] > 1 ? ['gap', p] : [p]));
}

const CSV_COLUMNS = [
  { label: 'ID', csv: (a) => a.id },
  { label: 'Appointment Date', csv: (a) => a.appointment_date },
  { label: 'Appointment Time', csv: (a) => a.appointment_time },
  { label: 'Visitor Name', csv: (a) => a.name },
  { label: 'Phone Number', csv: (a) => a.phone || '' },
  { label: 'Email Address', csv: (a) => a.email },
  { label: 'Purpose', csv: (a) => a.purpose },
  { label: 'Status', csv: (a) => STATUS_META[a.status]?.label || a.status },
  { label: 'Visitor Notes', csv: (a) => a.notes || '' },
  { label: 'Pastor / Reschedule Note', csv: (a) => a.reschedule_note || '' },
  { label: 'Booked On', csv: (a) => (bookedDate(a) ? toIsoDay(bookedDate(a)) : '') },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status || 'Pending',
    pill: 'border-slate-200 bg-slate-50 text-slate-600',
    dot: 'bg-slate-400',
  };
  return (
    <span className={`${PILL} ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center gap-1 rounded text-left uppercase tracking-wider transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
      >
        {label}
        <span
          aria-hidden="true"
          className={`text-[10px] transition ${
            active ? 'text-red-700' : 'text-slate-300 opacity-0 group-hover:opacity-100'
          }`}
        >
          {active && sort.dir === 'desc' ? '↓' : '↑'}
        </span>
      </button>
    </th>
  );
}

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, flash] = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState(() => new Set());
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load pastor schedules.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayIso = useMemo(() => toIsoDay(today), [today]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => {
      const d = apptDate(a);
      const status = dayStatus(d, today);
      return (status === 'today' || status === 'upcoming') && ['pending', 'confirmed'].includes(a.status);
    }).length;
    const todayCount = appointments.filter((a) => {
      const d = apptDate(a);
      return dayStatus(d, today) === 'today' && a.status !== 'cancelled';
    }).length;
    const rescheduleCount = appointments.filter((a) => a.status === 'reschedule_requested').length;
    return { total, upcoming, todayCount, rescheduleCount };
  }, [appointments, today]);

  const purposes = useMemo(() => {
    const set = new Set();
    appointments.forEach((a) => {
      if (a.purpose) set.add(a.purpose);
    });
    return [...set].sort();
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (purposeFilter !== 'all' && a.purpose !== purposeFilter) return false;
        const d = apptDate(a);
        const rel = dayStatus(d, today);
        if (timeFilter === 'upcoming' && rel !== 'upcoming' && rel !== 'today') return false;
        if (timeFilter === 'today' && rel !== 'today') return false;
        if (timeFilter === 'past' && rel !== 'past') return false;
        if (fromDate && a.appointment_date < fromDate) return false;
        if (toDate && a.appointment_date > toDate) return false;
        if (!q) return true;
        return (
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q) ||
          a.purpose?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
        );
      })
      .sort(compareBy(sort.key, sort.dir));
  }, [appointments, query, statusFilter, purposeFilter, timeFilter, fromDate, toDate, sort, today]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== 'all' ||
    timeFilter !== 'all' ||
    purposeFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setTimeFilter('all');
    setPurposeFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleStatusChange = async (appt, newStatus, extra = {}) => {
    setUpdatingId(appt.id);
    try {
      const res = await api.patch(`/api/v1/appointments/${appt.id}`, {
        appointment: { status: newStatus, ...extra },
      });
      const updated = res.data;
      setAppointments((prev) => prev.map((row) => (row.id === appt.id ? updated : row)));
      if (viewing?.id === appt.id) setViewing(updated);
      if (newStatus === 'confirmed') {
        flash(`Appointment confirmed & confirmation email sent to ${appt.name}`);
      } else {
        flash(`Appointment marked as ${STATUS_META[newStatus]?.label || newStatus}`);
      }
      return updated;
    } catch (err) {
      flash(apiErrorMessage(err, 'Could not update appointment.'));
      return null;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRescheduleInGmail = async (appt) => {
    const gmailUrl = buildGmailComposeUrl(appt);
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (appt.status !== 'reschedule_requested') {
      await handleStatusChange(appt, 'reschedule_requested');
    } else {
      flash('Opened Gmail compose window');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/appointments/${confirmDelete.id}`);
      setAppointments((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(confirmDelete.id);
        return next;
      });
      if (viewing?.id === confirmDelete.id) setViewing(null);
      flash(`Deleted ${confirmDelete.name}’s appointment`);
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete appointment.'));
    } finally {
      setDeleting(false);
    }
  };

  const exportReport = (rows) => {
    const suffix = fromDate || toDate ? `${fromDate || 'start'}-to-${toDate || 'end'}` : todayIso;
    downloadCsv(`aic-kabuku-schedules-report-${suffix}.csv`, CSV_COLUMNS, rows);
    flash(`Exported ${rows.length} schedule${rows.length === 1 ? '' : 's'} to CSV report`);
  };

  const pageIds = pageRows.map((a) => a.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  const togglePageSelection = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRowSelection = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedAppointments = useMemo(
    () => appointments.filter((a) => selected.has(a.id)),
    [appointments, selected]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Congregation</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Pastor Appointments & Schedules
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            View booked appointments, confirm or request a reschedule in Gmail, and generate CSV schedule reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={BUTTON}
          >
            <Icon name="refresh" className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => exportReport(filtered)}
            disabled={filtered.length === 0}
            className={PRIMARY_BUTTON}
          >
            <Icon name="download" className="h-3.5 w-3.5" strokeWidth={2} />
            Generate Report (CSV)
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <section aria-label="Schedule summary" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          icon="calendar"
          tone="red"
          value={stats.total}
          caption="All saved schedules in database"
          loading={loading}
        />
        <StatCard
          label="Upcoming Schedules"
          icon="clock"
          tone="emerald"
          value={stats.upcoming}
          caption="Confirmed or pending from today"
          loading={loading}
        />
        <StatCard
          label="Today's Appointments"
          icon="check"
          tone="sky"
          value={stats.todayCount}
          caption={formatDate(today)}
          loading={loading}
        />
        <StatCard
          label="Reschedule Requested"
          icon="mail"
          tone="amber"
          value={stats.rescheduleCount}
          caption="Awaiting new date or time"
          loading={loading}
        />
      </section>

      {/* Main Table Card */}
      <section aria-label="Schedules list" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Toolbar */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Icon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, phone, email, purpose…"
                aria-label="Search appointments"
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-7 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Icon name="close" className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={SELECT}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="reschedule_requested">Reschedule requested</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Time filter */}
            <select
              aria-label="Filter by timeline"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(1);
              }}
              className={SELECT}
            >
              <option value="all">All dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
            </select>

            {/* Purpose filter */}
            <select
              aria-label="Filter by purpose"
              value={purposeFilter}
              onChange={(e) => {
                setPurposeFilter(e.target.value);
                setPage(1);
              }}
              className={SELECT}
            >
              <option value="all">All purposes</option>
              {purposes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Date range for reports */}
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <span>From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className={DATE_INPUT}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <span>To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className={DATE_INPUT}
                />
              </label>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-red-700 hover:underline px-1.5"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 bg-red-50/70 px-4 py-2 text-[13px]">
            <span className="font-medium text-red-950">
              {selected.size} schedule{selected.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportReport(selectedAppointments)}
                className={`${BUTTON} h-7 border-red-200 text-red-800 hover:bg-red-100/60`}
              >
                <Icon name="download" className="h-3.5 w-3.5" />
                Export selected CSV
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table / States */}
        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-800">Couldn’t load pastor appointments</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button type="button" onClick={load} className={`mt-3 ${BUTTON}`}>
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-700">
              {hasFilters ? 'No appointments match your filter' : 'No appointments booked yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hasFilters
                ? 'Try adjusting the search, status, or date range filters.'
                : 'When visitors book an appointment on the website, their schedule will appear here automatically.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2.5 text-xs font-medium text-red-700 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60">
                  <th scope="col" className="w-10 pl-4 pr-2 py-2.5">
                    <Checkbox
                      checked={allOnPageSelected}
                      indeterminate={someOnPageSelected}
                      onChange={togglePageSelection}
                      label="Select all on this page"
                    />
                  </th>
                  <SortHeader label="Visitor" sortKey="name" sort={sort} onSort={toggleSort} />
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Phone & Email
                  </th>
                  <SortHeader label="Schedule Date & Time" sortKey="date" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Purpose" sortKey="purpose" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                  <th scope="col" className="w-48 pr-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((appt) => {
                  const isChecked = selected.has(appt.id);
                  const dateObj = apptDate(appt);
                  const rel = dayStatus(dateObj, today);
                  const createdObj = bookedDate(appt);
                  return (
                    <tr
                      key={appt.id}
                      onClick={() => {
                        setViewing(appt);
                        setNoteDraft(appt.reschedule_note || '');
                      }}
                      className={`group cursor-pointer transition-colors ${
                        isChecked ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td
                        className="w-10 pl-4 pr-2 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleRowSelection(appt.id)}
                          label={`Select ${appt.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={appt.name || '?'} className="h-8 w-8 text-xs" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{appt.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              Booked {createdObj ? dayMonth(createdObj) : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 tabular-nums">
                            {appt.phone || muted('No phone')}
                          </p>
                          <p className="truncate text-xs text-slate-500 max-w-[200px]">{appt.email}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900">
                            {dateObj ? formatDate(dateObj) : appt.appointment_date}
                          </span>
                          {rel === 'today' && (
                            <span className={`${PILL} border-emerald-200 bg-emerald-50 text-emerald-700`}>
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-red-700">{appt.appointment_time}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`${PILL} border-slate-200 bg-slate-50 text-slate-700`}>
                          {appt.purpose}
                        </span>
                        {appt.notes && (
                          <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-500" title={appt.notes}>
                            {appt.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td
                        className="pr-4 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          {appt.status !== 'confirmed' && appt.status !== 'completed' && (
                            <button
                              type="button"
                              disabled={updatingId === appt.id}
                              onClick={() => handleStatusChange(appt, 'confirmed')}
                              title="Confirm appointment"
                              className="inline-flex h-7 items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={updatingId === appt.id}
                            onClick={() => handleRescheduleInGmail(appt)}
                            title="Open Gmail compose to request reschedule"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2 text-xs font-medium text-red-800 transition hover:bg-red-100"
                          >
                            <Icon name="mail" className="h-3.5 w-3.5" />
                            Reschedule
                          </button>
                          {appt.phone && (
                            <a
                              href={telHref(appt.phone)}
                              title={`Call ${appt.phone}`}
                              aria-label={`Call ${appt.name}`}
                              className={ICON_ACTION}
                            >
                              <Icon name="phone" className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(appt)}
                            title="Delete appointment"
                            aria-label={`Delete ${appt.name}'s appointment`}
                            className={ICON_ACTION}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination */}
        {!error && !loading && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="font-medium text-slate-700">{start + 1}</strong>–
                <strong className="font-medium text-slate-700">{Math.min(start + pageSize, total)}</strong> of{' '}
                <strong className="font-medium text-slate-700">{total}</strong>
              </span>
              <span className="text-slate-300">·</span>
              <label className="inline-flex items-center gap-1">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 focus:border-red-300 focus:outline-none"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                {pageList(currentPage, pageCount).map((item, idx) =>
                  item === 'gap' ? (
                    <span key={`gap-${idx}`} className="px-1 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`h-7 min-w-[1.75rem] rounded-md px-1.5 text-xs font-medium ${
                        item === currentPage
                          ? 'bg-red-700 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Detail & Status Management Modal */}
      {viewing && (
        <Modal
          titleId="appointment-detail-title"
          title={viewing.name}
          description={`${formatDate(apptDate(viewing))} at ${viewing.appointment_time}`}
          icon={<Avatar name={viewing.name || '?'} className="h-10 w-10 text-sm" />}
          onClose={() => setViewing(null)}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(viewing)}
                className={`${BUTTON} border-red-200 text-red-700 hover:bg-red-50`}
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
                Delete
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRescheduleInGmail(viewing)}
                  className={BUTTON}
                >
                  <Icon name="mail" className="h-3.5 w-3.5 text-red-700" />
                  Reschedule in Gmail
                </button>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className={PRIMARY_BUTTON}
                >
                  Done
                </button>
              </div>
            </div>
          }
        >
          <DetailSection title="Appointment Details">
            <DetailRow icon="calendar" label="Scheduled Date & Time">
              {formatDate(apptDate(viewing))} · <span className="text-red-700">{viewing.appointment_time}</span>
            </DetailRow>
            <DetailRow icon="book" label="Purpose">
              {viewing.purpose}
            </DetailRow>
            <DetailRow icon="phone" label="Phone Number">
              {viewing.phone ? (
                <a href={telHref(viewing.phone)} className="text-red-700 hover:underline">
                  {viewing.phone}
                </a>
              ) : (
                muted('Not provided')
              )}
            </DetailRow>
            <DetailRow icon="mail" label="Visitor Email">
              <a href={`mailto:${viewing.email}`} className="text-red-700 hover:underline">
                {viewing.email}
              </a>
            </DetailRow>
            <DetailRow icon="info" label="Visitor Notes">
              {viewing.notes ? viewing.notes : muted('No additional notes')}
            </DetailRow>
          </DetailSection>

          <section className="border-t border-slate-100 px-5 py-4 space-y-4">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Schedule Status
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(STATUS_META).map(([statusKey, meta]) => {
                  const active = viewing.status === statusKey;
                  return (
                    <button
                      key={statusKey}
                      type="button"
                      disabled={updatingId === viewing.id}
                      onClick={() => handleStatusChange(viewing, statusKey, { reschedule_note: noteDraft })}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-red-700 bg-red-700 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="pastor-schedule-note"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Pastor / Admin Note
              </label>
              <textarea
                id="pastor-schedule-note"
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note about rescheduling or follow-up (included in CSV reports)…"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={updatingId === viewing.id}
                  onClick={() => handleStatusChange(viewing, viewing.status, { reschedule_note: noteDraft })}
                  className={BUTTON}
                >
                  Save Note
                </button>
              </div>
            </div>
          </section>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.name}’s appointment?`}
          message={`This will permanently remove the schedule on ${formatDate(apptDate(confirmDelete))} at ${confirmDelete.appointment_time}.`}
          confirmLabel="Delete appointment"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirmDelete(null);
            setDeleteError(null);
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
};

export default AppointmentsList;
