import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';
import { humanize } from '../../auth/permissions';
import Icon from './Icon';
import MemberForm from './MemberForm';
import { Avatar, BUTTON, Checkbox, ConfirmDialog, DetailRow, DetailSection, Modal, muted, PRIMARY_BUTTON, Skeleton, Toast, TONES, useToast } from './ui';
import { MONTHS, downloadCsv, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

/* ── Member fields ── */
const memberName = (m) => [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || 'Unnamed member';
// First + last only, so avatar initials don't pick up a middle name
const shortName = (m) => [m.first_name, m.last_name].filter(Boolean).join(' ') || memberName(m);
const groupsOf = (m) => m.fellowship_groups || [];
const groupNames = (m) => groupsOf(m).map((group) => group.group_name);
const birthDate = (m) => parseDate(m.date_of_birth);
const joinDate = (m) => parseDate(m.created_at);
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
const accountName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;

function ageOn(dob, today) {
  if (!dob) return null;
  const hadBirthday =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  return today.getFullYear() - dob.getFullYear() - (hadBirthday ? 0 : 1);
}

// Days until the next birthday; 0 means today
function daysToBirthday(dob, today) {
  if (!dob) return null;
  let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
  return Math.round((next - today) / 86400000);
}

const whenLabel = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);
const birthdayLabel = (days) => `Birthday ${whenLabel(days)}`;
const dayMonth = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;

function durationSince(date, today) {
  const days = Math.floor((today - startOfDay(date)) / 86400000);
  if (days < 1) return 'Joined today';
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}

/* ── Filters, sorting, paging ── */
const ALL_GROUPS = '';
const NO_GROUP = '__none__';

// Missing values always sort last, whichever way the column is sorted
const SORTS = {
  name: (m) => memberName(m).toLowerCase(),
  age: (m) => (birthDate(m) ? -birthDate(m).getTime() : null),
  joined: (m) => joinDate(m)?.getTime() ?? null,
};

function compareBy(key, dir) {
  const value = SORTS[key];
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

const PAGE_SIZES = [10, 25, 50];

// 1 … 4 5 6 … 12
function pageList(current, count) {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const pages = new Set([1, count, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= count - 2) [count - 3, count - 2, count - 1].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ['gap', page] : [page]));
}

const CSV_COLUMNS = [
  { label: 'First name', csv: (m) => m.first_name },
  { label: 'Middle name', csv: (m) => m.middle_name },
  { label: 'Last name', csv: (m) => m.last_name },
  { label: 'Phone', csv: (m) => m.phone_number },
  { label: 'Email', csv: (m) => m.email },
  { label: 'Fellowship groups', csv: (m) => groupNames(m).join('; ') },
  { label: 'Date of birth', csv: (m) => m.date_of_birth },
  { label: 'Residence', csv: (m) => m.place_of_residence },
  { label: 'Login account', csv: (m) => m.user?.email },
  { label: 'Joined', csv: (m) => (joinDate(m) ? toIsoDay(joinDate(m)) : '') },
];

/* ── Styles ── */
const SELECT =
  'h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const ICON_ACTION = 'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500';
const ICON_ACTION_ENABLED =
  'transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';
const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const BULK_BUTTON = `${BUTTON} h-7 border-red-200 text-red-800 hover:bg-red-100/60`;
// Lower-priority columns give way on narrower screens; both stay in the profile panel
const RESIDENCE_COL = 'hidden 2xl:table-cell';
const JOINED_COL = 'hidden xl:table-cell';
const LINKED_DELETE_HINT = 'Has a login account, so it can’t be deleted here';

/* ── Small building blocks ── */
function GroupChips({ member }) {
  const groups = groupsOf(member);
  if (!groups.length) return <span className="text-slate-300">—</span>;
  const [first, ...rest] = groups;
  return (
    <span className="inline-flex max-w-[180px] items-center gap-1" title={groups.map((group) => group.group_name).join(', ')}>
      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
        <Icon name="group" className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} />
        <span className="truncate">{first.group_name}</span>
      </span>
      {rest.length > 0 && <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">+{rest.length}</span>}
    </span>
  );
}

// Shown on members who can sign in to this admin console
function AccountBadge({ user, className = '' }) {
  if (!user) return null;
  const label = user.super_admin ? 'Super admin' : user.roles?.length ? humanize(user.roles[0]) : 'Login account';
  return (
    <span title={`Signs in as ${user.email}`} className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-100 ${className}`}>
      <Icon name="shield" className="h-3 w-3" strokeWidth={2} />
      {label}
    </span>
  );
}

function IconAction({ icon, label, href, onClick, disabledHint }) {
  if (!href && !onClick) {
    return (
      <span title={disabledHint || label} className={`${ICON_ACTION} cursor-not-allowed opacity-35`}>
        <Icon name={icon} className="h-3.5 w-3.5" />
        <span className="sr-only">{disabledHint || label}</span>
      </span>
    );
  }
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} type={href ? undefined : 'button'} onClick={onClick} aria-label={label} title={label} className={`${ICON_ACTION} ${ICON_ACTION_ENABLED}`}>
      <Icon name={icon} className="h-3.5 w-3.5" />
    </Tag>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className={`whitespace-nowrap px-3 py-2.5 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`-mx-1 inline-flex items-center gap-1 rounded px-1 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${active ? 'text-slate-900' : ''}`}
      >
        {label}
        <Icon
          name={active ? (sort.dir === 'asc' ? 'chevronUp' : 'chevronDown') : 'arrowsUpDown'}
          className={`h-3 w-3 ${active ? 'text-red-700' : 'text-slate-300'}`}
          strokeWidth={2}
        />
      </button>
    </th>
  );
}

function BirthdaySoon({ days }) {
  if (days === null || days > 7) return null;
  return (
    <span title={birthdayLabel(days)} className="shrink-0 text-amber-500">
      <Icon name="cake" className="h-3.5 w-3.5" strokeWidth={2} />
      <span className="sr-only">{birthdayLabel(days)}</span>
    </span>
  );
}

function Notice({ tone = 'sky', icon = 'info', onDismiss, children }) {
  const tones = {
    sky: 'border-sky-200 bg-sky-50/70 text-sky-900',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-800',
  };
  const iconTones = { sky: 'text-sky-600', amber: 'text-amber-600', red: 'text-red-600' };
  return (
    <div role={tone === 'sky' ? 'note' : 'alert'} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] ${tones[tone]}`}>
      <Icon name={icon} className={`mt-0.5 h-4 w-4 shrink-0 ${iconTones[tone]}`} />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-50 transition hover:opacity-100">
          <Icon name="close" className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ── Member profile (modal) ── */
function ActionTile({ icon, label, href, onClick }) {
  const className =
    'flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-2 py-2.5 text-xs font-medium text-slate-700 backdrop-blur transition';
  if (!href && !onClick) {
    return (
      <span className={`${className} cursor-not-allowed opacity-40`}>
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </span>
    );
  }
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      type={href ? undefined : 'button'}
      onClick={onClick}
      className={`${className} hover:border-red-200 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </Tag>
  );
}

function MemberPanel({ member, today, onClose, onCopy, onEdit, onDelete }) {
  const name = memberName(member);
  const dob = birthDate(member);
  const joined = joinDate(member);
  const groups = groupNames(member);
  const positions = member.leadership_positions || [];
  const age = ageOn(dob, today);
  const toBirthday = daysToBirthday(dob, today);
  const account = member.user;

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={account ? undefined : onDelete}
        disabled={Boolean(account)}
        title={account ? LINKED_DELETE_HINT : undefined}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
      >
        <Icon name="trash" className="h-3.5 w-3.5" />
        Delete
      </button>
      <button type="button" onClick={onEdit} className={PRIMARY_BUTTON}>
        <Icon name="pencil" className="h-3.5 w-3.5" />
        Edit member
      </button>
    </div>
  );

  return (
    <Modal titleId="member-panel-title" onClose={onClose} footer={footer} size="sm">
      {/* Identity */}
      <div className="relative overflow-clip border-b border-slate-100 px-5 pb-5 pt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-72 opacity-80"
          style={{ background: TONES.red.wash, filter: 'blur(28px)' }}
        />
        <div className="relative">
          <Avatar name={shortName(member)} className="h-14 w-14 text-lg ring-4 ring-white" />
          <h2 id="member-panel-title" className="mt-3 text-lg font-semibold leading-snug text-slate-900">
            {name}
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {groups.length ? groups.join(', ') : 'No fellowship group'} · Member #{member.id}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <AccountBadge user={account} />
            {toBirthday !== null && toBirthday <= 7 && (
              <span className={`${PILL} border-amber-200 bg-amber-50 text-amber-700`}>
                <Icon name="cake" className="h-3 w-3" strokeWidth={2} />
                {birthdayLabel(toBirthday)}
              </span>
            )}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <ActionTile icon="phone" label="Call" href={member.phone_number ? telHref(member.phone_number) : undefined} />
            <ActionTile icon="mail" label="Email" href={member.email ? `mailto:${member.email}` : undefined} />
            <ActionTile
              icon="copy"
              label="Copy phone"
              onClick={member.phone_number ? () => onCopy(member.phone_number, 'Phone number copied') : undefined}
            />
          </div>
        </div>
      </div>

      <DetailSection title="Contact">
        <DetailRow icon="phone" label="Phone">
          {member.phone_number ? <span className="tabular-nums">{member.phone_number}</span> : muted('Not recorded')}
        </DetailRow>
        <DetailRow icon="mail" label="Email">
          {member.email || muted('Not recorded')}
        </DetailRow>
        <DetailRow icon="mapPin" label="Place of residence">
          {member.place_of_residence || muted('Not recorded')}
        </DetailRow>
      </DetailSection>

      <DetailSection title="Personal">
        <DetailRow icon="calendar" label="Date of birth">
          {dob ? `${formatDate(dob)} · ${age} years old` : muted('Not recorded')}
        </DetailRow>
        <DetailRow icon="cake" label="Next birthday">
          {dob ? (
            <>
              {dayMonth(dob)} {muted(`· ${whenLabel(toBirthday)}`)}
            </>
          ) : (
            muted('Unknown')
          )}
        </DetailRow>
      </DetailSection>

      <DetailSection title="Church life">
        <DetailRow icon="group" label={groups.length > 1 ? 'Fellowship groups' : 'Fellowship group'}>
          {groups.length ? groups.join(', ') : muted('Not assigned')}
        </DetailRow>
        <DetailRow icon="briefcase" label="Leadership">
          {positions.length ? positions.map((position) => position.position_name).join(', ') : muted('No position')}
        </DetailRow>
        <DetailRow icon="users" label="Member since">
          {joined ? (
            <>
              {formatDate(joined)} {muted(`· ${durationSince(joined, today)}`)}
            </>
          ) : (
            muted('Unknown')
          )}
        </DetailRow>
      </DetailSection>

      <DetailSection title="Admin access">
        <DetailRow icon="shield" label="Login account">
          {account ? (
            <>
              {account.email}
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                {account.super_admin ? 'Super admin' : account.roles?.length ? account.roles.map(humanize).join(', ') : 'No roles yet'}
              </span>
            </>
          ) : (
            muted('None. This member can’t sign in to the admin console.')
          )}
        </DetailRow>
      </DetailSection>
    </Modal>
  );
}

/* ── Page ── */
function MembersList() {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const [group, setGroup] = useState(ALL_GROUPS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(() => new Set());
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // null, { member }, or { prefill }
  const [deleting, setDeleting] = useState(null); // null, { member } or { ids }
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null); // { tone, text } after an action
  const [accountsHidden, setAccountsHidden] = useState(false);
  const [linking, setLinking] = useState(null);
  const [toast, flash] = useToast();

  const today = useMemo(() => startOfDay(new Date()), []);

  const load = useCallback((initial = false) => {
    if (!initial) setRefreshing(true);
    // Groups (for the filter and the form) and login accounts (to spot admins who
    // aren't members yet) are extras; the page works without them.
    api.get('/api/v1/fellowship_groups')
      .then((response) => setGroups(Array.isArray(response.data) ? response.data : []))
      .catch(() => {});
    api.get('/api/v1/users')
      .then((response) => setAccounts(Array.isArray(response.data) ? response.data : []))
      .catch(() => {});
    api.get('/api/v1/members')
      .then((response) => {
        setMembers(Array.isArray(response.data) ? response.data : []);
        setError(null);
        setUpdatedAt(new Date());
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load members.'));
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

  // Drop selections for members that no longer exist
  useEffect(() => {
    setSelected((current) => {
      const ids = new Set(members.map((m) => m.id));
      const next = new Set([...current].filter((id) => ids.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [members]);

  const copy = useCallback(
    async (text, message) => {
      flash((await copyText(text)) ? message : 'Couldn’t copy. Your browser blocked clipboard access.');
    },
    [flash]
  );

  /* Group filter options: every group, with how many members are in it */
  const groupOptions = useMemo(() => {
    const counts = new Map();
    const known = new Map(groups.map((g) => [g.id, g.group_name]));
    let noGroup = 0;
    members.forEach((m) => {
      if (!groupsOf(m).length) noGroup += 1;
      groupsOf(m).forEach((g) => {
        counts.set(g.id, (counts.get(g.id) || 0) + 1);
        if (!known.has(g.id)) known.set(g.id, g.group_name);
      });
    });
    const options = [...known.entries()]
      .map(([id, name]) => ({ id, name, count: counts.get(id) || 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { options, noGroup };
  }, [groups, members]);

  /* Login accounts with no member record: admins are church members too */
  const unlinkedAccounts = useMemo(() => {
    const byEmail = new Map(members.filter((m) => m.email).map((m) => [m.email.toLowerCase(), m]));
    return accounts
      .filter((user) => !user.member)
      .map((user) => ({ user, match: byEmail.get((user.email || '').toLowerCase()) || null }))
      // A matching member that's already linked to a different account isn't a match
      .map((item) => (item.match?.user ? { ...item, match: null } : item));
  }, [accounts, members]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');

    return members
      .filter((m) => {
        const ids = groupsOf(m).map((g) => String(g.id));
        if (group === NO_GROUP && ids.length) return false;
        if (group !== ALL_GROUPS && group !== NO_GROUP && !ids.includes(group)) return false;
        if (!needle) return true;
        const text = [memberName(m), m.email, m.phone_number, m.place_of_residence, ...groupNames(m), m.user?.email].join(' ').toLowerCase();
        // Match phone numbers however they're spaced: "0712 345" finds "+254712345678"
        return text.includes(needle) || (digits.length >= 3 && (m.phone_number || '').replace(/\D/g, '').includes(digits));
      })
      .sort(compareBy(sort.key, sort.dir));
  }, [members, group, query, sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const pageIds = pageRows.map((m) => m.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const selectedMembers = members.filter((m) => selected.has(m.id));
  const filtersActive = group !== ALL_GROUPS || query.trim() !== '';
  const openMember = members.find((m) => m.id === openId) || null;

  // Any change to what's shown starts again from page 1
  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeGroup = updateFilter(setGroup);
  const changeQuery = updateFilter(setQuery);

  const clearFilters = () => {
    setGroup(ALL_GROUPS);
    setQuery('');
    setPage(1);
  };

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'joined' ? 'desc' : 'asc' }
    );
    setPage(1);
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

  const selectAllMatching = () => setSelected(new Set(filtered.map((m) => m.id)));

  const handleExport = () => {
    const rows = selected.size ? selectedMembers : filtered;
    downloadCsv(`aic-kabuku-members-${toIsoDay(new Date())}.csv`, CSV_COLUMNS, rows);
    flash(`Exported ${rows.length} ${rows.length === 1 ? 'member' : 'members'}`);
  };

  const copyPhones = () => {
    const phones = selectedMembers.map((m) => m.phone_number).filter(Boolean);
    if (!phones.length) {
      flash('None of the selected members has a phone number');
      return;
    }
    copy(phones.join(', '), `Copied ${phones.length} phone ${phones.length === 1 ? 'number' : 'numbers'}`);
  };

  const closePanel = useCallback(() => setOpenId(null), []);
  const closeForm = useCallback(() => setForm(null), []);

  /* Add / edit */
  const openAdd = () => setForm({});
  const openEdit = (member) => setForm({ member });
  const addFromAccount = (user) =>
    setForm({
      prefill: { first_name: user.firstname || '', last_name: user.lastname || '', email: user.email, user_id: user.id, accountEmail: user.email },
    });

  const handleSaved = (saved, { linkRequested }) => {
    const wasEdit = Boolean(form?.member);
    setForm(null);
    setNotice(null);
    if (saved) setMembers((current) => (wasEdit ? current.map((m) => (m.id === saved.id ? saved : m)) : [...current, saved]));
    if (linkRequested && saved && !saved.user) {
      setNotice({
        tone: 'amber',
        text: `${memberName(saved)} was added as a member, but couldn’t be linked to their login account: the server doesn’t accept account links on members yet.`,
      });
    } else {
      flash(wasEdit ? 'Changes saved' : `${saved ? memberName(saved) : 'Member'} added`);
    }
    load();
  };

  /* Link an existing member record to a login account with the same email */
  const linkAccount = async (user, member) => {
    setLinking(user.id);
    setNotice(null);
    try {
      const response = await api.patch(`/api/v1/members/${member.id}`, { member: { user_id: user.id } });
      if (response.data.member?.user) flash(`${memberName(member)} is now linked to ${user.email}`);
      else setNotice({ tone: 'amber', text: 'The server doesn’t accept account links on members yet, so nothing was linked.' });
      load();
    } catch (err) {
      setNotice({ tone: 'red', text: apiErrorMessages(err, 'Could not link the account.').join(' ') });
    } finally {
      setLinking(null);
    }
  };

  /* Delete one, or many */
  const askDelete = (target) => {
    setDeleteError(null);
    setDeleting(target);
  };
  const selectedLinked = selectedMembers.filter((m) => m.user).length;

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      if (deleting.member) {
        await api.delete(`/api/v1/members/${deleting.member.id}`);
        setOpenId(null);
        flash(`${memberName(deleting.member)} was deleted`);
      } else {
        const response = await api.post('/api/v1/members/bulk_destroy', { ids: deleting.ids });
        const { message, skipped = [] } = response.data;
        flash(message);
        // Anyone kept is explained in the notice below, so start with a clean selection
        setSelected(new Set());
        if (skipped.length) {
          const names = new Map(members.map((m) => [m.id, memberName(m)]));
          setNotice({
            tone: 'amber',
            text: `Kept ${skipped.length} ${skipped.length === 1 ? 'member' : 'members'}: ${skipped
              .map((item) => `${names.get(item.id) || `#${item.id}`} (${item.reason})`)
              .join('; ')}.`,
          });
        }
      }
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(apiErrorMessages(err, 'Could not delete. Please try again.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  /* Rows: a table from md up, a card list on phones */
  const COLUMN_COUNT = 8;
  const failed = Boolean(error) && !members.length;
  const noMatches = !failed && members.length > 0;
  const addButton = (
    <button type="button" onClick={openAdd} className={PRIMARY_BUTTON}>
      <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
      Add member
    </button>
  );
  const emptyState = !loading && (failed || total === 0) && (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name={failed ? 'warning' : noMatches ? 'search' : 'users'} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">
        {failed ? 'Couldn’t load members' : noMatches ? 'No members match these filters' : 'No members yet'}
      </p>
      <p className="mt-1 text-[13px] text-slate-500">
        {failed ? error : noMatches ? 'Try a different name, phone number or group.' : 'Add the first person to the church directory.'}
      </p>
      <div className="mt-4">
        {failed ? (
          <button type="button" onClick={() => load()} className={BUTTON}>
            <Icon name="refresh" className="h-3.5 w-3.5" />
            Try again
          </button>
        ) : noMatches ? (
          <button type="button" onClick={clearFilters} className={BUTTON}>
            <Icon name="close" className="h-3.5 w-3.5" />
            Clear filters
          </button>
        ) : (
          addButton
        )}
      </div>
    </div>
  );

  let body;
  let listItems;
  if (loading) {
    listItems = Array.from({ length: 6 }, (_, index) => (
      <li key={index} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <span className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-28" />
        </span>
      </li>
    ));
    body = Array.from({ length: 8 }, (_, index) => (
      <tr key={index}>
        <td className="py-3 pl-4 pr-2"><Skeleton className="h-4 w-4" /></td>
        <td className="px-3 py-3">
          <span className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <span className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </span>
          </span>
        </td>
        {['w-28', 'w-24', 'w-24', 'w-16', 'w-20'].map((width, cell) => (
          <td key={cell} className={`px-3 py-3 ${cell === 2 ? RESIDENCE_COL : cell === 4 ? JOINED_COL : ''}`}>
            <Skeleton className={`h-3.5 ${width}`} />
          </td>
        ))}
        <td className="py-3 pl-3 pr-4"><Skeleton className="ml-auto h-7 w-24" /></td>
      </tr>
    ));
  } else if (emptyState) {
    body = (
      <tr>
        <td colSpan={COLUMN_COUNT} className="px-4 py-16">
          {emptyState}
        </td>
      </tr>
    );
    listItems = <li className="px-4 py-14">{emptyState}</li>;
  } else {
    body = pageRows.map((m) => {
      const isSelected = selected.has(m.id);
      const dob = birthDate(m);
      const toBirthday = daysToBirthday(dob, today);
      const name = memberName(m);
      return (
        <tr key={m.id} className={`transition-colors ${isSelected ? 'bg-red-50/40' : 'hover:bg-slate-50/70'}`}>
          <td className="py-2.5 pl-4 pr-2 align-middle">
            <Checkbox checked={isSelected} onChange={() => toggleRow(m.id)} label={`Select ${name}`} />
          </td>
          <td className="px-3 py-2.5 align-middle">
            <button
              type="button"
              onClick={() => setOpenId(m.id)}
              className="group flex max-w-[260px] items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
            >
              <Avatar name={shortName(m)} className="h-8 w-8 text-xs" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-slate-900 group-hover:text-red-700">{name}</span>
                  <AccountBadge user={m.user} />
                </span>
                <span className="block truncate text-xs text-slate-500">{m.email || 'No email on file'}</span>
              </span>
            </button>
          </td>
          <td className="whitespace-nowrap px-3 py-2.5 align-middle tabular-nums text-slate-600">{m.phone_number || <span className="text-slate-300">—</span>}</td>
          <td className="px-3 py-2.5 align-middle">
            <GroupChips member={m} />
          </td>
          <td className={`max-w-[160px] truncate px-3 py-2.5 align-middle text-slate-600 ${RESIDENCE_COL}`}>
            {m.place_of_residence || <span className="text-slate-300">—</span>}
          </td>
          <td className="whitespace-nowrap px-3 py-2.5 align-middle">
            {dob ? (
              <>
                <span className="flex items-center gap-1.5 font-medium tabular-nums text-slate-900">
                  {ageOn(dob, today)}
                  <BirthdaySoon days={toBirthday} />
                </span>
                <span className="block text-xs text-slate-400">{formatDate(dob)}</span>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
          <td className={`whitespace-nowrap px-3 py-2.5 align-middle text-slate-600 ${JOINED_COL}`}>{formatDate(joinDate(m))}</td>
          <td className="py-2.5 pl-3 pr-4 align-middle">
            <div className="flex justify-end gap-1">
              <IconAction icon="eye" label={`View ${name}`} onClick={() => setOpenId(m.id)} />
              <IconAction icon="pencil" label={`Edit ${name}`} onClick={() => openEdit(m)} />
              <IconAction icon="trash" label={`Delete ${name}`} onClick={m.user ? undefined : () => askDelete({ member: m })} disabledHint={LINKED_DELETE_HINT} />
            </div>
          </td>
        </tr>
      );
    });

    listItems = pageRows.map((m) => {
      const isSelected = selected.has(m.id);
      const name = memberName(m);
      return (
        <li key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-red-50/40' : ''}`}>
          <Checkbox checked={isSelected} onChange={() => toggleRow(m.id)} label={`Select ${name}`} />
          <button
            type="button"
            onClick={() => setOpenId(m.id)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          >
            <Avatar name={shortName(m)} className="h-9 w-9 text-xs" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-medium text-slate-900">{name}</span>
                <BirthdaySoon days={daysToBirthday(birthDate(m), today)} />
              </span>
              <span className="block truncate text-xs tabular-nums text-slate-500">{m.phone_number || 'No phone number'}</span>
              {(groupsOf(m).length > 0 || m.user) && (
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <AccountBadge user={m.user} />
                  {groupsOf(m).length > 0 && <GroupChips member={m} />}
                </span>
              )}
            </span>
          </button>
          <div className="flex shrink-0 gap-1">
            <IconAction icon="phone" label={m.phone_number ? `Call ${name}` : 'No phone number'} href={m.phone_number ? telHref(m.phone_number) : undefined} />
            <IconAction icon="mail" label={m.email ? `Email ${name}` : 'No email address'} href={m.email ? `mailto:${m.email}` : undefined} />
          </div>
        </li>
      );
    });
  }

  const deleteCount = deleting?.ids?.length || 0;
  const deleteLinked = deleting?.ids ? members.filter((m) => deleting.ids.includes(m.id) && m.user).length : 0;

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Members</h1>
            <p className="mt-1 text-[13px] text-slate-500">Everyone in the church directory, including admins, with their contacts and fellowship groups.</p>
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
        {error && members.length > 0 && (
          <Notice tone="amber" icon="warning">
            {error} Showing the list from {updatedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
          </Notice>
        )}

        {/* Result of the last action that needs more than a toast */}
        {notice && (
          <Notice tone={notice.tone} icon={notice.tone === 'sky' ? 'info' : 'warning'} onDismiss={() => setNotice(null)}>
            {notice.text}
          </Notice>
        )}

        {/* Admins are church members too */}
        {!loading && !failed && unlinkedAccounts.length > 0 && !accountsHidden && (
          <Notice onDismiss={() => setAccountsHidden(true)}>
            <p>
              <span className="font-medium">
                {unlinkedAccounts.length} login {unlinkedAccounts.length === 1 ? 'account isn’t' : 'accounts aren’t'} in the directory yet.
              </span>{' '}
              Admins are church members too. Add them so they appear here.
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {unlinkedAccounts.map(({ user, match }) => (
                <li key={user.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="min-w-0">
                    <span className="font-medium">{accountName(user)}</span>
                    {accountName(user) !== user.email && <span className="text-sky-800/70"> · {user.email}</span>}
                    {match && <span className="text-sky-800/70"> · matches member “{memberName(match)}”</span>}
                  </span>
                  {match ? (
                    <button
                      type="button"
                      onClick={() => linkAccount(user, match)}
                      disabled={linking === user.id}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 text-xs font-medium text-sky-800 transition hover:bg-sky-100 disabled:opacity-60"
                    >
                      {linking === user.id ? 'Linking…' : 'Link account'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addFromAccount(user)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                    >
                      <Icon name="plus" className="h-3 w-3" strokeWidth={2} />
                      Add as member
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Notice>
        )}

        {/* Directory */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Directory</h2>
              {!loading && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                  {total} {total === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[200px] flex-1 xl:w-64 xl:flex-none">
                <span className="sr-only">Search members</span>
                <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                  placeholder="Search name, phone, email…"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label className="flex items-center">
                <span className="sr-only">Fellowship group</span>
                <select value={group} onChange={(event) => changeGroup(event.target.value)} className={SELECT} disabled={loading}>
                  <option value={ALL_GROUPS}>All groups</option>
                  {groupOptions.options.map((option) => (
                    <option key={option.id} value={String(option.id)}>
                      {option.name} ({option.count})
                    </option>
                  ))}
                  {groupOptions.noGroup > 0 && <option value={NO_GROUP}>No group ({groupOptions.noGroup})</option>}
                </select>
              </label>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-slate-500 transition hover:text-red-700">
                  <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
                  Clear
                </button>
              )}
              <button type="button" onClick={handleExport} disabled={loading || (!selected.size && total === 0)} className={BUTTON}>
                <Icon name="download" className="h-3.5 w-3.5" />
                {selected.size ? 'Export selected' : 'Export'}
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-red-100 bg-red-50/50 px-4 py-2 text-[13px]">
              <span className="font-medium text-red-800">
                {selected.size} {selected.size === 1 ? 'member' : 'members'} selected
              </span>
              {selected.size < total && (
                <button type="button" onClick={selectAllMatching} className="font-medium text-red-700 underline-offset-2 hover:underline">
                  Select all {total}
                </button>
              )}
              <span className="ml-auto flex flex-wrap items-center gap-2">
                <button type="button" onClick={copyPhones} className={BULK_BUTTON}>
                  <Icon name="copy" className="h-3.5 w-3.5" />
                  <span>
                    Copy <span className="sm:hidden">phones</span>
                    <span className="hidden sm:inline">phone numbers</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => askDelete({ ids: [...selected] })}
                  disabled={selectedLinked === selected.size}
                  title={selectedLinked === selected.size ? 'All selected members have login accounts' : undefined}
                  className={BULK_BUTTON}
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                  Delete
                </button>
                <button type="button" onClick={() => setSelected(new Set())} className={BULK_BUTTON}>
                  <Icon name="close" className="h-3.5 w-3.5" />
                  <span>
                    Clear<span className="hidden sm:inline"> selection</span>
                  </span>
                </button>
              </span>
            </div>
          )}

          {/* Phones: card list */}
          <ul className="divide-y divide-slate-100 border-t border-slate-200 md:hidden" aria-label="Members">
            {listItems}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                  <th scope="col" className="w-10 py-2.5 pl-4 pr-2 font-medium">
                    <Checkbox
                      checked={allOnPage}
                      indeterminate={selectedOnPage > 0 && !allOnPage}
                      disabled={loading || pageRows.length === 0}
                      onChange={togglePage}
                      label="Select all members on this page"
                    />
                  </th>
                  <SortHeader label="Member" sortKey="name" sort={sort} onSort={toggleSort} />
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-medium">Phone</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-2.5 font-medium">Fellowship groups</th>
                  <th scope="col" className={`whitespace-nowrap px-3 py-2.5 font-medium ${RESIDENCE_COL}`}>Residence</th>
                  <SortHeader label="Age" sortKey="age" sort={sort} onSort={toggleSort} />
                  <SortHeader label="Joined" sortKey="joined" sort={sort} onSort={toggleSort} className={JOINED_COL} />
                  <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">{body}</tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p className="tabular-nums">
              {loading
                ? 'Loading…'
                : total
                  ? `Showing ${start + 1} to ${Math.min(start + pageSize, total)} of ${total} ${total === 1 ? 'member' : 'members'}`
                  : '0 members'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
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
              <nav aria-label="Pages" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Icon name="chevronLeft" className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                {pageList(currentPage, pageCount).map((item, index) =>
                  item === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-slate-400">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === currentPage ? 'page' : undefined}
                      className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium tabular-nums transition ${
                        item === currentPage ? 'bg-red-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </nav>
            </div>
          </div>
        </section>
      </div>

      {/* Outside the space-y stack above, which would push these fixed layers down */}
      {openMember && !form && (
        <MemberPanel
          member={openMember}
          today={today}
          onClose={closePanel}
          onCopy={copy}
          onEdit={() => openEdit(openMember)}
          onDelete={() => askDelete({ member: openMember })}
        />
      )}
      {form && <MemberForm member={form.member || null} prefill={form.prefill || null} groups={groups} onClose={closeForm} onSaved={handleSaved} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.member ? `Delete ${memberName(deleting.member)}?` : `Delete ${deleteCount} ${deleteCount === 1 ? 'member' : 'members'}?`}
          message={
            deleting.member
              ? 'They’ll be removed from the directory and from their fellowship groups. This can’t be undone.'
              : `They’ll be removed from the directory and their fellowship groups. This can’t be undone.${
                  deleteLinked ? ` ${deleteLinked} of them ${deleteLinked === 1 ? 'has a login account and will' : 'have login accounts and will'} be kept.` : ''
                }`
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

export default MembersList;
