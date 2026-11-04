/* Helpers shared by the admin pages. */

/* ── Dates ── */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// API dates are either "YYYY-MM-DD" or ISO timestamps. Parse the former as a
// local date so it doesn't shift by a day in timezones behind UTC.
export function parseDate(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// 'today', 'upcoming' or 'past' relative to `today` (a start-of-day date)
export function dayStatus(date, today) {
  if (!date) return null;
  const diff = startOfDay(date).getTime() - today.getTime();
  if (diff === 0) return 'today';
  return diff > 0 ? 'upcoming' : 'past';
}

export const formatDate = (date) => (date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : '—');
export const toIsoDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/* ── CSV export ── */
// Leading = + - @ can make spreadsheet apps evaluate a cell as a formula.
// Plain numbers such as "+254 712 345 678" are left alone.
function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^[+-]?[\d\s()-]+$/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename, columns, rows) {
  const lines = [
    columns.map((column) => csvCell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => csvCell(column.csv(row))).join(',')),
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
