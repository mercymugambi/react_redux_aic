import { MONTHS, formatDate, parseDate, startOfDay, toIsoDay } from './utils';

/* The data behind the Reports page: filters, columns and summaries over the members list.
   Everything works on the rows GET /api/v1/members already returns, so reports need no extra API. */

export const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const memberName = (m) => [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || 'Unnamed member';
export const groupNames = (m) => (m.fellowship_groups || []).map((group) => group.group_name);
export const positionNames = (m) => (m.leadership_positions || []).map((position) => position.position_name);
const birthDate = (m) => parseDate(m.date_of_birth);
const joinDate = (m) => parseDate(m.created_at);

export function ageOn(dob, today) {
  if (!dob) return null;
  const hadBirthday = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  return today.getFullYear() - dob.getFullYear() - (hadBirthday ? 0 : 1);
}

export const AGE_BANDS = [
  { key: 'children', label: 'Children (0–12)', min: 0, max: 12 },
  { key: 'teens', label: 'Teens (13–17)', min: 13, max: 17 },
  { key: 'youth', label: 'Youth (18–35)', min: 18, max: 35 },
  { key: 'adults', label: 'Adults (36–59)', min: 36, max: 59 },
  { key: 'seniors', label: 'Seniors (60+)', min: 60, max: Infinity },
  { key: 'unknown', label: 'Age not recorded' },
];

export function ageBand(member, today) {
  const age = ageOn(birthDate(member), today);
  if (age === null) return 'unknown';
  return AGE_BANDS.find((band) => band.min !== undefined && age >= band.min && age <= band.max)?.key || 'unknown';
}

export const REPORT_TYPES = [
  { key: 'directory', label: 'Member directory', icon: 'users', hint: 'Everyone, or the members you filter to' },
  { key: 'groups', label: 'Fellowship rosters', icon: 'group', hint: 'Members of each fellowship group' },
  { key: 'birthdays', label: 'Birthdays', icon: 'cake', hint: 'Who celebrates in a month' },
  { key: 'new', label: 'New members', icon: 'userPlus', hint: 'Who joined in a period' },
  { key: 'summary', label: 'Summary', icon: 'checkBadge', hint: 'Totals and breakdowns' },
];

// `value` is what the table shows; `csv` (if different) is what the spreadsheet gets
export const COLUMNS = [
  { key: 'name', label: 'Name', value: (m) => memberName(m), always: true },
  { key: 'phone', label: 'Phone', value: (m) => m.phone_number || '' },
  { key: 'email', label: 'Email', value: (m) => m.email || '' },
  { key: 'groups', label: 'Fellowship groups', value: (m) => groupNames(m).join(', ') },
  { key: 'positions', label: 'Leadership', value: (m) => positionNames(m).join(', ') },
  { key: 'age', label: 'Age', value: (m, today) => ageOn(birthDate(m), today) ?? '' },
  { key: 'dob', label: 'Date of birth', value: (m) => (birthDate(m) ? formatDate(birthDate(m)) : ''), csv: (m) => m.date_of_birth || '' },
  { key: 'residence', label: 'Residence', value: (m) => m.place_of_residence || '' },
  { key: 'joined', label: 'Joined', value: (m) => (joinDate(m) ? formatDate(joinDate(m)) : ''), csv: (m) => (joinDate(m) ? toIsoDay(joinDate(m)) : '') },
  { key: 'account', label: 'Login account', value: (m) => m.user?.email || '' },
];

export const DEFAULT_COLUMNS = ['name', 'phone', 'groups', 'age', 'residence', 'joined'];

export const NO_GROUP = 'none';

export const EMPTY_FILTERS = { group: '', band: '', residence: '', leaders: false, joinedFrom: '', joinedTo: '' };

export function filterMembers(members, filters, today) {
  const residence = filters.residence.trim().toLowerCase();
  const from = filters.joinedFrom ? parseDate(filters.joinedFrom) : null;
  const to = filters.joinedTo ? parseDate(filters.joinedTo) : null;
  return members.filter((m) => {
    if (filters.group === NO_GROUP && (m.fellowship_groups || []).length) return false;
    if (filters.group && filters.group !== NO_GROUP && !(m.fellowship_groups || []).some((group) => String(group.id) === String(filters.group))) return false;
    if (filters.band && ageBand(m, today) !== filters.band) return false;
    if (residence && !(m.place_of_residence || '').toLowerCase().includes(residence)) return false;
    if (filters.leaders && !positionNames(m).length) return false;
    const joined = joinDate(m) && startOfDay(joinDate(m));
    if (from && (!joined || joined < from)) return false;
    if (to && (!joined || joined > to)) return false;
    return true;
  });
}

export const byName = (a, b) => memberName(a).localeCompare(memberName(b));
export const byJoinedNewest = (a, b) => (joinDate(b)?.getTime() || 0) - (joinDate(a)?.getTime() || 0);

// Members with a birthday in `month` (0–11), in date order, with the age they turn this year
export function birthdaysIn(members, month, today) {
  return members
    .filter((m) => birthDate(m) && birthDate(m).getMonth() === month)
    .map((m) => {
      const dob = birthDate(m);
      return { member: m, day: dob.getDate(), turning: today.getFullYear() - dob.getFullYear() };
    })
    .sort((a, b) => a.day - b.day || byName(a.member, b.member));
}

// Groups in name order, each with its members; plus members in no group
export function rosters(members, groups, groupFilter) {
  const sorted = [...groups].sort((a, b) => (a.group_name || '').localeCompare(b.group_name || ''));
  const chosen = groupFilter && groupFilter !== NO_GROUP ? sorted.filter((group) => String(group.id) === String(groupFilter)) : groupFilter === NO_GROUP ? [] : sorted;
  const sections = chosen.map((group) => ({
    group,
    members: members.filter((m) => (m.fellowship_groups || []).some((g) => g.id === group.id)).sort(byName),
  }));
  const ungrouped = !groupFilter || groupFilter === NO_GROUP ? members.filter((m) => !(m.fellowship_groups || []).length).sort(byName) : [];
  return { sections, ungrouped };
}

const countBy = (items, keyOf) =>
  items.reduce((counts, item) => {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());

export function summarize(members, groups, today) {
  const bands = countBy(members, (m) => ageBand(m, today));
  const residences = countBy(
    members.filter((m) => (m.place_of_residence || '').trim()),
    (m) => m.place_of_residence.trim().replace(/\s+/g, ' ').toLowerCase()
  );
  // The spelling most people used, for each residence
  const residenceLabel = new Map();
  members.forEach((m) => {
    const raw = (m.place_of_residence || '').trim().replace(/\s+/g, ' ');
    if (raw && !residenceLabel.has(raw.toLowerCase())) residenceLabel.set(raw.toLowerCase(), raw);
  });

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`, count: 0 };
  });
  members.forEach((m) => {
    const joined = joinDate(m);
    const month = joined && months.find((item) => item.key === `${joined.getFullYear()}-${joined.getMonth()}`);
    if (month) month.count += 1;
  });

  const withGroup = members.filter((m) => (m.fellowship_groups || []).length).length;
  const groupCounts = [...groups]
    .map((group) => ({ label: group.group_name, leader: group.leader ? [group.leader.first_name, group.leader.last_name].filter(Boolean).join(' ') : '', count: members.filter((m) => (m.fellowship_groups || []).some((g) => g.id === group.id)).length }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    totals: {
      members: members.length,
      inGroups: withGroup,
      noGroup: members.length - withGroup,
      leaders: members.filter((m) => positionNames(m).length).length,
      withPhone: members.filter((m) => (m.phone_number || '').trim()).length,
      newThisYear: members.filter((m) => joinDate(m)?.getFullYear() === today.getFullYear()).length,
    },
    groups: groupCounts,
    ages: AGE_BANDS.map((band) => ({ label: band.label, count: bands.get(band.key) || 0 })),
    residences: [...residences.entries()]
      .map(([key, count]) => ({ label: residenceLabel.get(key), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 10),
    joinedByMonth: months,
  };
}

// A plain-language line of what a report includes, for its header: "Youth fellowship · Youth (18–35)"
export function describeFilters(filters, groups) {
  const parts = [];
  if (filters.group === NO_GROUP) parts.push('Not in a fellowship group');
  else if (filters.group) parts.push(groups.find((group) => String(group.id) === String(filters.group))?.group_name || 'One group');
  if (filters.band) parts.push(AGE_BANDS.find((band) => band.key === filters.band)?.label);
  if (filters.residence.trim()) parts.push(`Living in “${filters.residence.trim()}”`);
  if (filters.leaders) parts.push('Leaders only');
  const from = parseDate(filters.joinedFrom);
  const to = parseDate(filters.joinedTo);
  if (from && to) parts.push(`Joined ${formatDate(from)} – ${formatDate(to)}`);
  else if (from) parts.push(`Joined since ${formatDate(from)}`);
  else if (to) parts.push(`Joined by ${formatDate(to)}`);
  return parts.filter(Boolean).join(' · ');
}

// Quick ranges for the New members report, as yyyy-mm-dd
export function periodPresets(today) {
  const iso = toIsoDay;
  const ago = (months) => new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
  return [
    { key: 'month', label: 'This month', from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) },
    { key: '3m', label: 'Last 3 months', from: iso(ago(3)), to: iso(today) },
    { key: '6m', label: 'Last 6 months', from: iso(ago(6)), to: iso(today) },
    { key: 'year', label: 'This year', from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) },
  ];
}
