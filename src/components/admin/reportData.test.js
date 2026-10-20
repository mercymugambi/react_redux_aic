import { ageBand, birthdaysIn, describeFilters, EMPTY_FILTERS, filterMembers, NO_GROUP, rosters, summarize } from './reportData';

const TODAY = new Date(2026, 9, 20); // 20 October 2026
const YOUTH = { id: 1, group_name: 'Youth Fellowship', group_code: 'YF', leader: { id: 2, first_name: 'Peter', last_name: 'Kamau' } };
const WOMEN = { id: 2, group_name: 'Women’s Guild', group_code: 'WG', leader: null };

const member = (id, overrides) => ({
  id,
  first_name: 'Member',
  middle_name: null,
  last_name: String(id),
  phone_number: '0712000000',
  email: null,
  date_of_birth: null,
  place_of_residence: null,
  fellowship_groups: [],
  leadership_positions: [],
  user: null,
  created_at: '2026-01-10T08:00:00Z',
  ...overrides,
});

const MEMBERS = [
  member(1, { first_name: 'Grace', last_name: 'Wanjiru', date_of_birth: '2000-10-05', place_of_residence: 'Kabuku', fellowship_groups: [YOUTH], created_at: '2026-09-01T08:00:00Z' }),
  member(2, { first_name: 'Peter', last_name: 'Kamau', date_of_birth: '1980-10-25', place_of_residence: 'kabuku ', fellowship_groups: [YOUTH, WOMEN], leadership_positions: [{ id: 1, position_name: 'Elder' }] }),
  member(3, { first_name: 'Mary', last_name: 'Njeri', date_of_birth: '2015-03-14', place_of_residence: 'Kiambu', created_at: '2025-06-01T08:00:00Z' }),
  member(4, { first_name: 'John', last_name: 'Otieno', phone_number: '' }),
];

test('puts members in age groups, with unknown ages apart', () => {
  expect(MEMBERS.map((m) => ageBand(m, TODAY))).toEqual(['youth', 'adults', 'children', 'unknown']);
});

test('filters by group, no group, age, residence, leaders and join date', () => {
  const ids = (filters) => filterMembers(MEMBERS, { ...EMPTY_FILTERS, ...filters }, TODAY).map((m) => m.id);
  expect(ids({ group: '1' })).toEqual([1, 2]);
  expect(ids({ group: NO_GROUP })).toEqual([3, 4]);
  expect(ids({ band: 'youth' })).toEqual([1]);
  expect(ids({ residence: 'KABUKU' })).toEqual([1, 2]);
  expect(ids({ leaders: true })).toEqual([2]);
  expect(ids({ joinedFrom: '2026-08-01', joinedTo: '2026-10-20' })).toEqual([1]);
});

test('lists birthdays in a month in date order, with the age each turns', () => {
  expect(birthdaysIn(MEMBERS, 9, TODAY).map((row) => [row.member.first_name, row.day, row.turning])).toEqual([
    ['Grace', 5, 26],
    ['Peter', 25, 46],
  ]);
});

test('builds rosters per group, plus members in no group', () => {
  const all = rosters(MEMBERS, [WOMEN, YOUTH], '');
  expect(all.sections.map((section) => [section.group.group_name, section.members.map((m) => m.first_name)])).toEqual([
    ['Women’s Guild', ['Peter']],
    ['Youth Fellowship', ['Grace', 'Peter']],
  ]);
  expect(all.ungrouped.map((m) => m.first_name)).toEqual(['John', 'Mary']);

  const one = rosters(MEMBERS, [WOMEN, YOUTH], '1');
  expect(one.sections).toHaveLength(1);
  expect(one.ungrouped).toEqual([]);
});

test('summarizes totals, groups, ages, residences and joins per month', () => {
  const summary = summarize(MEMBERS, [YOUTH, WOMEN], TODAY);
  expect(summary.totals).toEqual({ members: 4, inGroups: 2, noGroup: 2, leaders: 1, withPhone: 3, newThisYear: 3 });
  expect(summary.groups).toEqual([
    { label: 'Youth Fellowship', leader: 'Peter Kamau', count: 2 },
    { label: 'Women’s Guild', leader: '', count: 1 },
  ]);
  // "Kabuku" and "kabuku " are the same place
  expect(summary.residences).toEqual([
    { label: 'Kabuku', count: 2 },
    { label: 'Kiambu', count: 1 },
  ]);
  expect(summary.ages.find((row) => row.label === 'Age not recorded').count).toBe(1);
  expect(summary.joinedByMonth).toHaveLength(12);
  expect(summary.joinedByMonth[11]).toMatchObject({ label: 'Oct 2026', count: 0 });
  expect(summary.joinedByMonth.find((row) => row.label === 'Jan 2026').count).toBe(2);
});

test('describes the filters in plain words for the report header', () => {
  expect(describeFilters({ ...EMPTY_FILTERS, group: '1', band: 'youth', leaders: true }, [YOUTH])).toBe('Youth Fellowship · Youth (18–35) · Leaders only');
  expect(describeFilters({ ...EMPTY_FILTERS, group: NO_GROUP, joinedFrom: '2026-01-01' }, [YOUTH])).toBe('Not in a fellowship group · Joined since 1 Jan 2026');
  expect(describeFilters(EMPTY_FILTERS, [])).toBe('');
});
