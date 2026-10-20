import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../redux/api';
import { selectCurrentUser } from '../../redux/authSlice';
import Icon from './Icon';
import {
  AGE_BANDS,
  birthdaysIn,
  byJoinedNewest,
  byName,
  COLUMNS,
  DEFAULT_COLUMNS,
  describeFilters,
  EMPTY_FILTERS,
  filterMembers,
  FULL_MONTHS,
  groupNames,
  memberName,
  NO_GROUP,
  periodPresets,
  REPORT_TYPES,
  rosters,
  summarize,
} from './reportData';
import { BUTTON, PRIMARY_BUTTON, Skeleton } from './ui';
import { downloadCsv, formatDate, startOfDay, toIsoDay } from './utils';

const CHURCH = 'AIC Kabuku Church';
const COLUMNS_KEY = 'aic-report-columns';

const SELECT =
  'h-9 w-full rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const INPUT =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const TH = 'border-b-2 border-slate-200 px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
const TD = 'border-b border-slate-100 px-2.5 py-2 align-top text-[13px] text-slate-700';

const userName = (user) => [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email || 'Admin';

function readColumns() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(COLUMNS_KEY));
    const known = Array.isArray(saved) ? saved.filter((key) => COLUMNS.some((column) => column.key === key)) : [];
    return known.length ? ['name', ...known.filter((key) => key !== 'name')] : DEFAULT_COLUMNS;
  } catch (error) {
    return DEFAULT_COLUMNS;
  }
}

/* ── Loading the data ── */
// Members and fellowship groups, loaded together. A 403 is kept apart: it means this account may open
// reports but the API won't let it read the member list (see the backend note in the page).
function useReportData() {
  const [state, setState] = useState({ status: 'loading', members: [], groups: [], error: null });

  const load = useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, status: 'loading', error: null }));
    Promise.all([api.get('/api/v1/members'), api.get('/api/v1/fellowship_groups')])
      .then(([members, groups]) => {
        if (!active) return;
        setState({
          status: 'ready',
          members: Array.isArray(members.data) ? members.data : [],
          groups: Array.isArray(groups.data) ? groups.data : [],
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        const forbidden = error?.response?.status === 403;
        setState({ status: forbidden ? 'forbidden' : 'error', members: [], groups: [], error: apiErrorMessage(error, 'Could not load the members.') });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);
  return { ...state, reload: load };
}

/* ── Pieces of the report document ── */
function MembersTable({ members, columns, today, empty = 'No members match.' }) {
  if (!members.length) return <p className="py-6 text-center text-[13px] text-slate-400">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} w-8`}>#</th>
            {columns.map((column) => (
              <th key={column.key} className={TH}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member.id}>
              <td className={`${TD} tabular-nums text-slate-400`}>{index + 1}</td>
              {columns.map((column) => (
                <td key={column.key} className={`${TD} ${column.key === 'name' ? 'font-medium text-slate-900' : ''} ${column.key === 'age' ? 'tabular-nums' : ''}`}>
                  {column.value(member, today)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTable({ title, rows, total, extra }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="report-keep-together">
      <h3 className="mb-2 text-[13px] font-semibold text-slate-900">{title}</h3>
      {rows.length ? (
        <table className="w-full border-collapse">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className={`${TD} w-1/2`}>
                  {row.label}
                  {extra && extra(row)}
                </td>
                <td className={`${TD} w-1/3`}>
                  <span className="block h-2 rounded-full bg-red-100 print:border print:border-red-300" aria-hidden="true">
                    <span className="block h-2 rounded-full bg-red-600" style={{ width: `${(row.count / max) * 100}%` }} />
                  </span>
                </td>
                <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>
                  {row.count}
                  {total ? <span className="ml-1 font-normal text-slate-400">({Math.round((row.count / total) * 100)}%)</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px] text-slate-400">Nothing recorded yet.</p>
      )}
    </section>
  );
}

// The report itself: on screen as a page preview, and the same markup is printed
function ReportDocument({ type, title, subtitle, generatedBy, generatedAt, children, count }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-8 print:border-0 print:p-0 print:shadow-none" aria-label={title}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-red-700 pb-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="" className="h-9 w-9" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-700">{CHURCH}</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="text-right text-[11px] leading-5 text-slate-500">
          <p>
            Generated {formatDate(generatedAt)}, {generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p>By {generatedBy}</p>
          {count !== undefined && <p className="font-semibold text-slate-700">{count}</p>}
        </div>
      </header>
      <div className="mt-5 space-y-6" data-report={type}>
        {children}
      </div>
      <footer className="mt-8 border-t border-slate-200 pt-3 text-[10px] text-slate-400">
        Confidential: members’ contact details are for church use only.
      </footer>
    </article>
  );
}

/* ── Filter controls ── */
function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function GroupSelect({ id = 'report-group', value, groups, onChange, allLabel = 'All members' }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT}>
      <option value="">{allLabel}</option>
      {groups.map((group) => (
        <option key={group.id} value={String(group.id)}>
          {group.group_name}
        </option>
      ))}
      <option value={NO_GROUP}>Not in any group</option>
    </select>
  );
}

function ColumnPicker({ selected, onChange }) {
  const toggle = (key) => onChange(selected.includes(key) ? selected.filter((item) => item !== key) : COLUMNS.map((column) => column.key).filter((item) => item === key || selected.includes(item)));
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-slate-600">Columns</legend>
      <div className="flex flex-wrap gap-1.5">
        {COLUMNS.map((column) => {
          const on = selected.includes(column.key);
          return (
            <label
              key={column.key}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${column.always ? 'cursor-default' : ''} ${
                on ? 'border-red-200 bg-red-50 font-medium text-red-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <input type="checkbox" checked={on} disabled={column.always} onChange={() => toggle(column.key)} className="h-3.5 w-3.5 accent-red-700" />
              {column.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Page ── */
function Reports() {
  const { status, members, groups, error, reload } = useReportData();
  const user = useSelector(selectCurrentUser);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, group: params.get('group') || '' }));
  const [columnKeys, setColumnKeys] = useState(readColumns);
  const [month, setMonth] = useState(() => {
    const fromUrl = Number(params.get('month'));
    return Number.isInteger(fromUrl) && fromUrl >= 1 && fromUrl <= 12 ? fromUrl - 1 : new Date().getMonth();
  });
  const [printing, setPrinting] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());

  const type = REPORT_TYPES.some(({ key }) => key === params.get('type')) ? params.get('type') : 'directory';
  const today = useMemo(() => startOfDay(new Date()), []);
  const presets = useMemo(() => periodPresets(today), [today]);
  const sortedGroups = useMemo(() => [...groups].sort((a, b) => (a.group_name || '').localeCompare(b.group_name || '')), [groups]);
  const columns = COLUMNS.filter((column) => columnKeys.includes(column.key));

  // The report type and group live in the address, so a report can be bookmarked or linked to
  const updateParams = (changes) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => (value === '' || value == null ? next.delete(key) : next.set(key, value)));
        return next;
      },
      { replace: true }
    );
  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    if (name === 'group') updateParams({ group: value });
  };
  const chooseColumns = (keys) => {
    setColumnKeys(keys);
    try {
      window.localStorage.setItem(COLUMNS_KEY, JSON.stringify(keys));
    } catch (storageError) {
      // Not remembered; the choice still applies now
    }
  };

  // The New members report always covers a period (the last 3 months to start with). It's kept apart from
  // the directory's optional join dates, so switching reports doesn't carry a date range across.
  const [period, setPeriod] = useState(() => ({ from: presets[1].from, to: presets[1].to }));

  // Print once the printable copy has rendered, then remove it
  useEffect(() => {
    if (!printing) return undefined;
    const timer = window.setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [printing]);

  const filtered = useMemo(() => filterMembers(members, filters, today), [members, filters, today]);
  const groupFilterOnly = useMemo(() => filterMembers(members, { ...EMPTY_FILTERS, group: filters.group }, today), [members, filters.group, today]);
  const newFilters = useMemo(() => ({ ...filters, joinedFrom: period.from, joinedTo: period.to }), [filters, period]);
  const newMembers = useMemo(() => filterMembers(members, newFilters, today), [members, newFilters, today]);

  /* Each report: what it shows, and its spreadsheet */
  const report = useMemo(() => {
    const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
    const groupLabel = filters.group === NO_GROUP ? 'Members not in any group' : sortedGroups.find((group) => String(group.id) === filters.group)?.group_name;

    if (type === 'groups') {
      const { sections, ungrouped } = rosters(members, sortedGroups, filters.group);
      const total = sections.reduce((sum, section) => sum + section.members.length, 0) + ungrouped.length;
      const csvColumns = [{ label: 'Fellowship group', csv: (row) => row.group }, ...columns.map((column) => ({ label: column.label, csv: (row) => (column.csv || column.value)(row.member, today) }))];
      const csvRows = [...sections.flatMap((section) => section.members.map((member) => ({ group: section.group.group_name, member }))), ...ungrouped.map((member) => ({ group: 'Not in any group', member }))];
      return {
        title: groupLabel ? `Fellowship roster: ${groupLabel}` : 'Fellowship group rosters',
        subtitle: filters.group ? '' : `${plural(sections.length, 'group')}`,
        count: plural(total, 'member'),
        csv: { name: 'fellowship-rosters', columns: csvColumns, rows: csvRows },
        body: (
          <>
            {sections.map(({ group, members: groupMembers }) => (
              <section key={group.id} className="report-keep-together">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    {group.group_name}
                    {group.group_code && <span className="ml-2 text-xs font-normal text-slate-400">{group.group_code}</span>}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {group.leader ? `Leader: ${[group.leader.first_name, group.leader.last_name].filter(Boolean).join(' ')} · ` : 'No leader set · '}
                    {plural(groupMembers.length, 'member')}
                  </p>
                </div>
                <MembersTable members={groupMembers} columns={columns} today={today} empty="No members in this group yet." />
              </section>
            ))}
            {ungrouped.length > 0 && (
              <section className="report-keep-together">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-slate-900">Not in any group</h3>
                  <p className="text-xs text-slate-500">{plural(ungrouped.length, 'member')}</p>
                </div>
                <MembersTable members={ungrouped} columns={columns} today={today} />
              </section>
            )}
            {!sections.length && !ungrouped.length && <p className="py-6 text-center text-[13px] text-slate-400">No fellowship groups yet.</p>}
          </>
        ),
      };
    }

    if (type === 'birthdays') {
      const rows = birthdaysIn(groupFilterOnly, month, today);
      const csvColumns = [
        { label: 'Date', csv: (row) => `${row.day} ${FULL_MONTHS[month]}` },
        { label: 'Name', csv: (row) => memberName(row.member) },
        { label: 'Turning', csv: (row) => row.turning },
        { label: 'Phone', csv: (row) => row.member.phone_number || '' },
        { label: 'Fellowship groups', csv: (row) => groupNames(row.member).join(', ') },
      ];
      return {
        title: `Birthdays in ${FULL_MONTHS[month]}`,
        subtitle: groupLabel || '',
        count: plural(rows.length, 'birthday'),
        csv: { name: `birthdays-${FULL_MONTHS[month].toLowerCase()}`, columns: csvColumns, rows },
        body: rows.length ? (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Date', 'Name', 'Turning', 'Phone', 'Fellowship groups'].map((label) => (
                  <th key={label} className={TH}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isToday = month === today.getMonth() && row.day === today.getDate();
                return (
                  <tr key={row.member.id} className={isToday ? 'bg-amber-50/60' : ''}>
                    <td className={`${TD} whitespace-nowrap font-semibold tabular-nums text-slate-900`}>
                      {row.day} {FULL_MONTHS[month].slice(0, 3)}
                      {isToday && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">Today</span>}
                    </td>
                    <td className={`${TD} font-medium text-slate-900`}>{memberName(row.member)}</td>
                    <td className={`${TD} tabular-nums`}>{row.turning}</td>
                    <td className={TD}>{row.member.phone_number || ''}</td>
                    <td className={TD}>{groupNames(row.member).join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="py-6 text-center text-[13px] text-slate-400">No birthdays recorded in {FULL_MONTHS[month]}.</p>
        ),
      };
    }

    if (type === 'new') {
      const rows = [...newMembers].sort(byJoinedNewest);
      const joinedFirst = [COLUMNS.find((column) => column.key === 'joined'), ...columns.filter((column) => column.key !== 'joined')];
      return {
        title: 'New members',
        subtitle: describeFilters(newFilters, sortedGroups),
        count: plural(rows.length, 'new member'),
        csv: { name: 'new-members', columns: joinedFirst.map((column) => ({ label: column.label, csv: (m) => (column.csv || column.value)(m, today) })), rows },
        body: <MembersTable members={rows} columns={joinedFirst} today={today} empty="Nobody joined in this period." />,
      };
    }

    if (type === 'summary') {
      const summary = summarize(members, sortedGroups, today);
      const { totals } = summary;
      const csvRows = [
        ...Object.entries({
          'Total members': totals.members,
          'In a fellowship group': totals.inGroups,
          'Not in any group': totals.noGroup,
          'Holding a leadership position': totals.leaders,
          'With a phone number': totals.withPhone,
          [`Joined in ${today.getFullYear()}`]: totals.newThisYear,
        }).map(([item, count]) => ({ section: 'Totals', item, count })),
        ...summary.groups.map((row) => ({ section: 'Fellowship groups', item: row.label, count: row.count })),
        ...summary.ages.map((row) => ({ section: 'Age groups', item: row.label, count: row.count })),
        ...summary.residences.map((row) => ({ section: 'Top residences', item: row.label, count: row.count })),
        ...summary.joinedByMonth.map((row) => ({ section: 'Joined per month', item: row.label, count: row.count })),
      ];
      const stats = [
        ['Total members', totals.members],
        ['In a fellowship group', totals.inGroups],
        ['Not in any group', totals.noGroup],
        ['Leaders', totals.leaders],
        ['With a phone number', totals.withPhone],
        [`Joined in ${today.getFullYear()}`, totals.newThisYear],
      ];
      return {
        title: 'Membership summary',
        subtitle: 'All members',
        count: plural(totals.members, 'member'),
        csv: {
          name: 'membership-summary',
          columns: [
            { label: 'Section', csv: (row) => row.section },
            { label: 'Item', csv: (row) => row.item },
            { label: 'Count', csv: (row) => row.count },
          ],
          rows: csvRows,
        },
        body: (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 px-3.5 py-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-6 lg:grid-cols-2">
              <SummaryTable
                title="Fellowship groups"
                rows={summary.groups}
                total={totals.members}
                extra={(row) => row.leader && <span className="block text-[11px] text-slate-400">Leader: {row.leader}</span>}
              />
              <SummaryTable title="Age groups" rows={summary.ages} total={totals.members} />
              <SummaryTable title="Top residences" rows={summary.residences} total={totals.members} />
              <SummaryTable title="Joined in the last 12 months" rows={summary.joinedByMonth} />
            </div>
          </>
        ),
      };
    }

    // Member directory
    const rows = [...filtered].sort(byName);
    return {
      title: groupLabel && !describeFilters({ ...filters, group: '' }, sortedGroups) ? `Members: ${groupLabel}` : 'Member directory',
      subtitle: describeFilters(filters, sortedGroups) || 'All members',
      count: plural(rows.length, 'member'),
      csv: { name: 'member-directory', columns: columns.map((column) => ({ label: column.label, csv: (m) => (column.csv || column.value)(m, today) })), rows },
      body: <MembersTable members={rows} columns={columns} today={today} />,
    };
  }, [type, members, sortedGroups, filters, filtered, groupFilterOnly, newFilters, newMembers, columns, month, today]);

  const exportCsv = () => downloadCsv(`aic-kabuku-${report.csv.name}-${toIsoDay(new Date())}.csv`, report.csv.columns, report.csv.rows);
  const print = () => {
    setGeneratedAt(new Date());
    setPrinting(true);
  };

  const filtersActive = Object.entries(filters).some(([key, value]) => (type === 'new' && key.startsWith('joined') ? false : value !== EMPTY_FILTERS[key]));
  const documentProps = { type, title: report.title, subtitle: report.subtitle, count: report.count, generatedBy: userName(user), generatedAt };

  /* Filter panel for the chosen report */
  const filterPanel = (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {type !== 'summary' && (
          <Field label={type === 'groups' ? 'Fellowship group' : 'Members'} htmlFor="report-group">
            <GroupSelect value={filters.group} groups={sortedGroups} onChange={(value) => setFilter('group', value)} allLabel={type === 'groups' ? 'All groups' : 'All members'} />
          </Field>
        )}
        {type === 'birthdays' && (
          <Field label="Month" htmlFor="report-month">
            <select
              id="report-month"
              value={month}
              onChange={(event) => {
                setMonth(Number(event.target.value));
                updateParams({ month: Number(event.target.value) + 1 });
              }}
              className={SELECT}
            >
              {FULL_MONTHS.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {(type === 'directory' || type === 'new') && (
          <>
            <Field label="Age group" htmlFor="report-age">
              <select id="report-age" value={filters.band} onChange={(event) => setFilter('band', event.target.value)} className={SELECT}>
                <option value="">Any age</option>
                {AGE_BANDS.map((band) => (
                  <option key={band.key} value={band.key}>
                    {band.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Residence" htmlFor="report-residence">
              <input id="report-residence" value={filters.residence} onChange={(event) => setFilter('residence', event.target.value)} placeholder="e.g. Kabuku" className={INPUT} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-slate-700">
              <input type="checkbox" checked={filters.leaders} onChange={(event) => setFilter('leaders', event.target.checked)} className="h-4 w-4 accent-red-700" />
              Leaders only
            </label>
          </>
        )}
      </div>

      {(type === 'directory' || type === 'new') && (
        <div className="flex flex-wrap items-end gap-3">
          {type === 'new' ? (
            <>
              <Field label="Joined from" htmlFor="report-from">
                <input id="report-from" type="date" value={period.from} max={period.to || undefined} onChange={(event) => setPeriod((current) => ({ ...current, from: event.target.value }))} className={`${INPUT} w-40`} />
              </Field>
              <Field label="to" htmlFor="report-to">
                <input id="report-to" type="date" value={period.to} min={period.from || undefined} onChange={(event) => setPeriod((current) => ({ ...current, to: event.target.value }))} className={`${INPUT} w-40`} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Joined from (optional)" htmlFor="report-from">
                <input id="report-from" type="date" value={filters.joinedFrom} max={filters.joinedTo || undefined} onChange={(event) => setFilter('joinedFrom', event.target.value)} className={`${INPUT} w-40`} />
              </Field>
              <Field label="to" htmlFor="report-to">
                <input id="report-to" type="date" value={filters.joinedTo} min={filters.joinedFrom || undefined} onChange={(event) => setFilter('joinedTo', event.target.value)} className={`${INPUT} w-40`} />
              </Field>
            </>
          )}
          {type === 'new' && (
            <div className="flex flex-wrap gap-1.5 pb-0.5" role="group" aria-label="Quick periods">
              {presets.map((preset) => {
                const active = period.from === preset.from && period.to === preset.to;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPeriod({ from: preset.from, to: preset.to })}
                    className={`h-8 rounded-lg border px-2.5 text-xs font-medium transition ${active ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(type === 'directory' || type === 'groups' || type === 'new') && <ColumnPicker selected={columnKeys} onChange={chooseColumns} />}

      {filtersActive && (
        <button
          type="button"
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            updateParams({ group: '' });
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-700"
        >
          <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
          Clear filters
        </button>
      )}
    </div>
  );

  let content;
  if (status === 'loading') {
    content = (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  } else if (status === 'forbidden') {
    content = (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] text-amber-900">
        <p className="font-medium">Your account can open reports, but the server won’t let it read the member list yet.</p>
        <p className="mt-1 text-amber-800">
          Right now only people who manage members or fellowship groups can load members. Once the backend lets the “View reports” permission read them too, this page will work for you.
        </p>
      </div>
    );
  } else if (status === 'error') {
    content = (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-900">Couldn’t load the members</p>
        <p className="mt-1 text-[13px] text-slate-500">{error}</p>
        <button type="button" onClick={reload} className={`${BUTTON} mt-4`}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  } else if (!members.length) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-900">No members yet</p>
        <p className="mt-1 text-[13px] text-slate-500">Reports fill in once members are added.</p>
        <Link to="/admin/members" className={`${BUTTON} mt-4`}>
          Go to Members
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="space-y-4">
        {filterPanel}
        <ReportDocument {...documentProps}>{report.body}</ReportDocument>
      </div>
    );
  }

  const ready = status === 'ready' && members.length > 0;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Reports</h1>
            <p className="mt-1 text-[13px] text-slate-500">Member lists and summaries to download for Excel, or print and save as PDF.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCsv} disabled={!ready} className={BUTTON}>
              <Icon name="download" className="h-3.5 w-3.5" />
              Download CSV
            </button>
            <button type="button" onClick={print} disabled={!ready} className={PRIMARY_BUTTON}>
              <Icon name="printer" className="h-3.5 w-3.5" />
              Print / PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Reports" className="min-w-0 lg:sticky lg:top-0">
            <ul className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 lg:flex-col">
              {REPORT_TYPES.map((item) => {
                const active = item.key === type;
                return (
                  <li key={item.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => updateParams({ type: item.key === 'directory' ? '' : item.key })}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${active ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon name={item.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap text-[13px] font-medium">{item.label}</span>
                        <span className="hidden text-[11px] text-slate-400 lg:block">{item.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="min-w-0">{content}</div>
        </div>
      </div>

      {printing && ready && createPortal(<div id="report-print-root"><ReportDocument {...documentProps}>{report.body}</ReportDocument></div>, document.body)}
    </>
  );
}

export default Reports;
