import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../../redux/api';
import Reports from './Reports';
import { downloadCsv } from './utils';

jest.mock('../../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  apiErrorMessage: (error, fallback) => fallback,
}));
jest.mock('react-redux', () => ({ useSelector: (select) => select({ auth: { user: { firstname: 'Brian', lastname: 'Gitonga', email: 'brian@example.com' } } }) }));
jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), downloadCsv: jest.fn() }));

const YOUTH = { id: 1, group_name: 'Youth Fellowship', group_code: 'YF', leader: { id: 2, first_name: 'Peter', last_name: 'Kamau' }, member_count: 2 };
const member = (id, overrides) => ({
  id,
  first_name: 'Member',
  last_name: String(id),
  phone_number: '0712 000 000',
  date_of_birth: null,
  place_of_residence: 'Kabuku',
  fellowship_groups: [],
  leadership_positions: [],
  user: null,
  created_at: new Date().toISOString(),
  ...overrides,
});
const MEMBERS = [
  member(1, { first_name: 'Grace', last_name: 'Wanjiru', fellowship_groups: [YOUTH] }),
  member(2, { first_name: 'Peter', last_name: 'Kamau', fellowship_groups: [YOUTH] }),
  member(3, { first_name: 'Mary', last_name: 'Njeri' }),
];

const renderAt = (path = '/admin/reports') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Reports />
    </MemoryRouter>
  );

beforeEach(() => {
  window.localStorage.clear();
  downloadCsv.mockClear();
  api.get.mockReset().mockImplementation((url) => Promise.resolve({ data: url.includes('fellowship_groups') ? [YOUTH] : MEMBERS }));
});

test('opens on the member directory and narrows it to a fellowship group', async () => {
  renderAt();
  const report = await screen.findByRole('article', { name: 'Member directory' });
  expect(within(report).getByText('3 members')).toBeInTheDocument();
  expect(within(report).getByText('By Brian Gitonga')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Members'), { target: { value: '1' } });
  const narrowed = screen.getByRole('article', { name: 'Members: Youth Fellowship' });
  expect(within(narrowed).getByText('2 members')).toBeInTheDocument();
  expect(within(narrowed).queryByText('Mary Njeri')).not.toBeInTheDocument();
});

test('downloads what the report shows as a spreadsheet', async () => {
  renderAt();
  await screen.findByRole('article', { name: 'Member directory' });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Email' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

  const [filename, columns, rows] = downloadCsv.mock.calls[0];
  expect(filename).toMatch(/^aic-kabuku-member-directory-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(columns.map((column) => column.label)).toContain('Email');
  expect(rows.map((row) => row.first_name)).toEqual(['Grace', 'Mary', 'Peter']);
  // The column choice is remembered
  expect(JSON.parse(window.localStorage.getItem('aic-report-columns'))).toContain('email');
});

test('opens a group roster from a link, with the leader and the members', async () => {
  renderAt('/admin/reports?type=groups&group=1');
  const report = await screen.findByRole('article', { name: 'Fellowship roster: Youth Fellowship' });
  expect(within(report).getByText(/Leader: Peter Kamau/)).toBeInTheDocument();
  expect(within(report).getByText('Grace Wanjiru')).toBeInTheDocument();
  expect(within(report).queryByText('Mary Njeri')).not.toBeInTheDocument();
});

test('prints a clean copy of the report', async () => {
  const print = jest.spyOn(window, 'print').mockImplementation(() => {});
  renderAt('/admin/reports?type=summary');
  await screen.findByRole('article', { name: 'Membership summary' });

  fireEvent.click(screen.getByRole('button', { name: 'Print / PDF' }));
  expect(document.getElementById('report-print-root')).toBeInTheDocument();
  await waitFor(() => expect(print).toHaveBeenCalled());
  await waitFor(() => expect(document.getElementById('report-print-root')).not.toBeInTheDocument());
  print.mockRestore();
});

test('explains when the server won’t let this account read members', async () => {
  api.get.mockReset().mockRejectedValue({ response: { status: 403 } });
  renderAt();
  expect(await screen.findByText(/the server won’t let it read the member list yet/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
});
