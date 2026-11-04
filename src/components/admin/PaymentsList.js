import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage } from '../../redux/api';
import Icon from './Icon';
import {
  Avatar,
  BUTTON,
  Checkbox,
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
import { MONTHS, downloadCsv, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

const PAGE_SIZES = [10, 25, 50];

const STATUS_META = {
  success: {
    label: 'Confirmed',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'Pending',
    pill: 'border-amber-200 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  failed: {
    label: 'Failed',
    pill: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'border-slate-200 bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
};

const TYPE_LABELS = {
  tithe: 'Tithe',
  offering: 'Offering',
  donation: 'Donation',
  other: 'Other',
};

const SELECT =
  'h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const DATE_INPUT =
  'h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';
const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';

const paymentDate = (p) => parseDate(p.created_at);
const telHref = (phone = '') => `tel:${String(phone).replace(/[^\d+]/g, '')}`;
const formatKes = (amount) => `KES ${Number(amount || 0).toLocaleString()}`;

function formatDateTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${time}`;
}

const SORTS = {
  date: (p) => paymentDate(p)?.getTime() ?? null,
  amount: (p) => Number(p.amount) || 0,
  type: (p) => (p.contribution_type || '').toLowerCase(),
  status: (p) => (p.status || '').toLowerCase(),
  receipt: (p) => (p.transaction_id || '').toLowerCase(),
};

function compareBy(key, dir) {
  const value = SORTS[key] || SORTS.date;
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === y) return 0;
    if (x === null || x === '') return 1;
    if (y === null || y === '') return -1;
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
  { label: 'ID', csv: (p) => p.id },
  { label: 'Date', csv: (p) => (paymentDate(p) ? toIsoDay(paymentDate(p)) : '') },
  {
    label: 'Time',
    csv: (p) =>
      paymentDate(p)
        ? paymentDate(p).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '',
  },
  { label: 'M-Pesa Receipt No.', csv: (p) => p.transaction_id || '' },
  { label: 'Phone Number', csv: (p) => p.phone_number || '' },
  { label: 'Contribution Type', csv: (p) => TYPE_LABELS[p.contribution_type] || p.contribution_type },
  { label: 'Amount (KES)', csv: (p) => p.amount },
  { label: 'Status', csv: (p) => STATUS_META[p.status]?.label || p.status },
  { label: 'Note / Purpose', csv: (p) => p.note || '' },
  { label: 'Result Description', csv: (p) => p.result_description || '' },
  { label: 'Checkout Request ID', csv: (p) => p.checkout_request_id || '' },
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

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, flash] = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState(() => new Set());
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/payments');
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load M-Pesa transactions.'));
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
    const successful = payments.filter((p) => p.status === 'success');
    const totalAmount = successful.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const titheAndOffering = successful
      .filter((p) => p.contribution_type === 'tithe' || p.contribution_type === 'offering')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingOrFailed = payments.filter((p) => p.status !== 'success').length;
    return {
      totalAmount,
      successfulCount: successful.length,
      titheAndOffering,
      pendingOrFailed,
    };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (typeFilter !== 'all' && p.contribution_type !== typeFilter) return false;
        const d = paymentDate(p);
        const dayIso = d ? toIsoDay(d) : '';
        if (fromDate && dayIso < fromDate) return false;
        if (toDate && dayIso > toDate) return false;
        if (!q) return true;
        return (
          p.transaction_id?.toLowerCase().includes(q) ||
          p.phone_number?.toLowerCase().includes(q) ||
          p.contribution_type?.toLowerCase().includes(q) ||
          p.note?.toLowerCase().includes(q) ||
          String(p.amount || '').includes(q)
        );
      })
      .sort(compareBy(sort.key, sort.dir));
  }, [payments, query, statusFilter, typeFilter, fromDate, toDate, sort]);

  const filteredSuccessTotal = useMemo(
    () =>
      filtered
        .filter((p) => p.status === 'success')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filtered]
  );

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
    typeFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const exportReport = (rows) => {
    const suffix = fromDate || toDate ? `${fromDate || 'start'}-to-${toDate || 'end'}` : todayIso;
    downloadCsv(`aic-kabuku-mpesa-transactions-${suffix}.csv`, CSV_COLUMNS, rows);
    flash(`Exported ${rows.length} M-Pesa transaction${rows.length === 1 ? '' : 's'} to CSV report`);
  };

  const pageIds = pageRows.map((p) => p.id);
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

  const selectedPayments = useMemo(
    () => payments.filter((p) => selected.has(p.id)),
    [payments, selected]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Finance & Reports</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            M-Pesa Transactions Report
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Track online giving, verify M-Pesa receipt codes, and export financial reports by contribution type or date range.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={load} disabled={loading} className={BUTTON}>
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
      <section aria-label="M-Pesa summary" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Confirmed Giving"
          icon="heart"
          tone="emerald"
          value={formatKes(stats.totalAmount)}
          caption={`${stats.successfulCount} confirmed M-Pesa payment${stats.successfulCount === 1 ? '' : 's'}`}
          loading={loading}
        />
        <StatCard
          label="Tithes & Offerings"
          icon="checkBadge"
          tone="red"
          value={formatKes(stats.titheAndOffering)}
          caption="Confirmed tithes and offerings"
          loading={loading}
        />
        <StatCard
          label="Filtered Confirmed Total"
          icon="sparkles"
          tone="sky"
          value={formatKes(filteredSuccessTotal)}
          caption={`Across ${filtered.length} matching record${filtered.length === 1 ? '' : 's'}`}
          loading={loading}
        />
        <StatCard
          label="Pending / Uncompleted"
          icon="clock"
          tone="amber"
          value={stats.pendingOrFailed}
          caption="Pending PIN, cancelled, or failed"
          loading={loading}
        />
      </section>

      {/* Main Table Card */}
      <section aria-label="Transactions list" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                placeholder="Search receipt code, phone, note…"
                aria-label="Search M-Pesa transactions"
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
              <option value="success">Confirmed (Success)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Contribution type filter */}
            <select
              aria-label="Filter by contribution type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className={SELECT}
            >
              <option value="all">All contribution types</option>
              <option value="tithe">Tithe</option>
              <option value="offering">Offering</option>
              <option value="donation">Donation</option>
              <option value="other">Other</option>
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
              {selected.size} transaction{selected.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportReport(selectedPayments)}
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
            <p className="text-[13px] font-medium text-slate-800">Couldn’t load M-Pesa transactions</p>
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
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-700">
              {hasFilters ? 'No transactions match your filter' : 'No M-Pesa transactions recorded yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {hasFilters
                ? 'Try clearing your search or adjusting the date/status filters.'
                : 'Transactions initiated on the Giving page will appear here automatically.'}
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
                  <SortHeader label="Date & Time" sortKey="date" sort={sort} onSort={toggleSort} />
                  <SortHeader label="M-Pesa Receipt" sortKey="receipt" sort={sort} onSort={toggleSort} />
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Phone Number
                  </th>
                  <SortHeader label="Type & Note" sortKey="type" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                  <th scope="col" className="w-24 pr-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((p) => {
                  const isChecked = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setViewing(p)}
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
                          onChange={() => toggleRowSelection(p.id)}
                          label={`Select transaction ${p.transaction_id || p.id}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                        {formatDateTime(p.created_at)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {p.transaction_id ? (
                          <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {p.transaction_id}
                          </span>
                        ) : (
                          muted('—')
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-800 tabular-nums">
                        {p.phone_number || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`${PILL} border-slate-200 bg-slate-50 text-slate-700`}>
                          {TYPE_LABELS[p.contribution_type] || p.contribution_type}
                        </span>
                        {p.note && (
                          <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500" title={p.note}>
                            {p.note}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-slate-900 tabular-nums">
                        {formatKes(p.amount)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                      <td
                        className="pr-4 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          {p.phone_number && (
                            <a
                              href={telHref(p.phone_number)}
                              title={`Call ${p.phone_number}`}
                              aria-label={`Call ${p.phone_number}`}
                              className={ICON_ACTION}
                            >
                              <Icon name="phone" className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewing(p)}
                            title="View transaction details"
                            aria-label="View transaction details"
                            className={ICON_ACTION}
                          >
                            <Icon name="eye" className="h-3.5 w-3.5" />
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

      {/* Transaction Detail Modal */}
      {viewing && (
        <Modal
          titleId="payment-detail-title"
          title={viewing.transaction_id ? `Receipt ${viewing.transaction_id}` : `Transaction #${viewing.id}`}
          description={formatDateTime(viewing.created_at)}
          icon={<Avatar name={TYPE_LABELS[viewing.contribution_type] || 'M'} className="h-10 w-10 text-sm" />}
          onClose={() => setViewing(null)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setViewing(null)} className={PRIMARY_BUTTON}>
                Done
              </button>
            </div>
          }
        >
          <DetailSection title="Transaction Summary">
            <DetailRow icon="heart" label="Amount">
              <span className="text-base font-semibold text-slate-900">{formatKes(viewing.amount)}</span>
            </DetailRow>
            <DetailRow icon="checkBadge" label="Status">
              <StatusBadge status={viewing.status} />
            </DetailRow>
            <DetailRow icon="tag" label="M-Pesa Receipt Number">
              {viewing.transaction_id ? (
                <span className="font-mono font-semibold text-slate-900">{viewing.transaction_id}</span>
              ) : (
                muted('Not issued (pending or uncompleted)')
              )}
            </DetailRow>
            <DetailRow icon="book" label="Contribution Type">
              {TYPE_LABELS[viewing.contribution_type] || viewing.contribution_type}
            </DetailRow>
            <DetailRow icon="phone" label="Phone Number">
              {viewing.phone_number ? (
                <a href={telHref(viewing.phone_number)} className="text-red-700 hover:underline">
                  {viewing.phone_number}
                </a>
              ) : (
                muted('—')
              )}
            </DetailRow>
            <DetailRow icon="info" label="Note / Purpose">
              {viewing.note ? viewing.note : muted('No note provided')}
            </DetailRow>
            <DetailRow icon="clock" label="Safaricom Result Description">
              {viewing.result_description ? viewing.result_description : muted('—')}
            </DetailRow>
          </DetailSection>
        </Modal>
      )}

      <Toast message={toast} />
    </div>
  );
};

export default PaymentsList;

