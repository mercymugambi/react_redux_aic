import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../../redux/api';
import { DEFAULT_SITE_SETTINGS } from '../../data/siteSettings';
import SiteSettingsPage, { isSiteLink, isWebLink, settingsProblems } from './SiteSettingsPage';

jest.mock('../../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  apiErrorMessage: (error, fallback) => fallback,
  apiErrorMessages: (error, fallback) => [fallback],
}));

const clone = (value) => JSON.parse(JSON.stringify(value));
const SAVED = {
  ...clone(DEFAULT_SITE_SETTINGS),
  notice: { ...DEFAULT_SITE_SETTINGS.notice, message: 'Join us for Harvest Sunday' },
};

function renderPage(section) {
  return render(
    <MemoryRouter initialEntries={[`/admin/settings${section ? `?section=${section}` : ''}`]}>
      <SiteSettingsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  api.get.mockResolvedValue({ data: clone(SAVED) });
  api.patch.mockImplementation((url, body) => Promise.resolve({ data: body.site_settings }));
});

it('loads the saved settings and previews the notice', async () => {
  renderPage();
  const message = await screen.findByLabelText('Message');
  expect(message).toHaveValue('Join us for Harvest Sunday');
  expect(api.get).toHaveBeenCalledWith('/api/v1/site_settings');
  expect(screen.getByText('Showing on the website')).toBeInTheDocument();
  expect(screen.getAllByText('Join us for Harvest Sunday')).not.toHaveLength(0);
  expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
});

it('saves every setting together and updates this browser’s copy of the site', async () => {
  renderPage();
  fireEvent.change(await screen.findByLabelText('Message'), { target: { value: 'Christmas carols on the 24th' } });
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Colour' })).getByRole('radio', { name: /Church red/ }));
  expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  const [url, body] = api.patch.mock.calls[0];
  expect(url).toBe('/api/v1/site_settings');
  expect(body.site_settings.notice).toMatchObject({ message: 'Christmas carols on the 24th', style: 'red', enabled: true });
  expect(body.site_settings.service_times).toEqual(DEFAULT_SITE_SETTINGS.service_times);
  expect(await screen.findByText(/Saved: the website shows the changes now/)).toBeInTheDocument();
  expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem('aic:site-settings')).notice.message).toBe('Christmas carols on the 24th');
});

it('discards changes', async () => {
  renderPage();
  fireEvent.change(await screen.findByLabelText('Message'), { target: { value: 'Something else' } });
  fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.getByLabelText('Message')).toHaveValue('Join us for Harvest Sunday');
  expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
});

it('won’t save a switched-on notice without a message', async () => {
  renderPage();
  fireEvent.change(await screen.findByLabelText('Message'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Write the message, or switch the notice bar off')).toBeInTheDocument();
  expect(api.patch).not.toHaveBeenCalled();

  // Switching it off is fine
  fireEvent.click(screen.getByRole('switch', { name: 'Show the notice bar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  expect(api.patch.mock.calls[0][1].site_settings.notice.enabled).toBe(false);
});

it('opens the section with the problem when saving from another one', async () => {
  renderPage('seo');
  fireEvent.change(await screen.findByLabelText('Site name'), { target: { value: 'AIC Kabuku' } });
  fireEvent.click(screen.getByRole('button', { name: /Contact & social/ }));
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'not-an-email' } });
  fireEvent.click(screen.getByRole('button', { name: /Search & sharing/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Contact & social/ })).toHaveAttribute('aria-current', 'page');
  expect(api.patch).not.toHaveBeenCalled();
});

it('edits service times', async () => {
  renderPage('services');
  const firstService = await screen.findByDisplayValue('First Service');
  fireEvent.change(firstService, { target: { value: 'Early Service' } });
  const sundayCard = firstService.closest('li');
  fireEvent.change(within(sundayCard).getAllByLabelText('Early Service ends')[0], { target: { value: '08:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Ends before it starts')).toBeInTheDocument();

  fireEvent.change(within(sundayCard).getAllByLabelText('Early Service ends')[0], { target: { value: '09:45' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  const service = api.patch.mock.calls[0][1].site_settings.service_times[0].services[0];
  expect(service).toMatchObject({ name: 'Early Service', slots: [{ start: '08:30', end: '09:45' }], main: true });
});

it('works on the built-in settings before the API exists', async () => {
  api.get.mockRejectedValue({ response: { status: 404 } });
  api.patch.mockRejectedValue({ response: { status: 404 } });
  renderPage();
  expect(await screen.findByText('Not connected yet.')).toBeInTheDocument();
  expect(screen.getByLabelText('Message')).toHaveValue(DEFAULT_SITE_SETTINGS.notice.message);

  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'New' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText(/the server doesn’t have the site settings API/)).toBeInTheDocument();
});

it('ignores an earlier load that answers late, so it can’t overwrite edits', async () => {
  // React StrictMode (as in development) mounts the page twice, so it loads twice
  let answerFirst;
  api.get
    .mockReturnValueOnce(new Promise((resolve) => { answerFirst = resolve; }))
    .mockResolvedValueOnce({ data: clone(SAVED) });
  render(
    <React.StrictMode>
      <MemoryRouter initialEntries={['/admin/settings']}>
        <SiteSettingsPage />
      </MemoryRouter>
    </React.StrictMode>
  );
  const message = await screen.findByLabelText('Message');
  fireEvent.change(message, { target: { value: 'Typed before the slow answer' } });

  await act(async () => answerFirst({ data: { notice: { message: 'Stale' } } }));
  expect(screen.getByLabelText('Message')).toHaveValue('Typed before the slow answer');
  expect(api.get).toHaveBeenCalledTimes(2);
});

it('offers to retry when loading fails', async () => {
  api.get.mockRejectedValueOnce({ response: { status: 500 } });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByLabelText('Message')).toHaveValue('Join us for Harvest Sunday');
});

describe('settingsProblems', () => {
  it('passes the built-in settings', () => {
    expect(settingsProblems(DEFAULT_SITE_SETTINGS)).toEqual({});
  });

  it('checks links, dates and required names', () => {
    const settings = clone(DEFAULT_SITE_SETTINGS);
    settings.notice.link_url = 'youtube';
    settings.notice.starts_on = '2026-12-10';
    settings.notice.ends_on = '2026-12-01';
    settings.social.facebook = 'facebook.com/aic';
    settings.seo.site_name = ' ';
    settings.service_times[1].day = '';
    expect(Object.keys(settingsProblems(settings)).sort()).toEqual(
      ['notice.ends_on', 'notice.link_url', 'seo.site_name', 'service_times.1.day', 'social.facebook'].sort()
    );
  });

  it('accepts links to pages on this site', () => {
    const settings = clone(DEFAULT_SITE_SETTINGS);
    settings.notice.link_url = '/events';
    expect(settingsProblems(settings)).toEqual({});
  });

  it('checks a notice link even without button text, as the API does', () => {
    const settings = clone(DEFAULT_SITE_SETTINGS);
    settings.notice.link_text = '';
    settings.notice.link_url = 'events';
    expect(Object.keys(settingsProblems(settings))).toEqual(['notice.link_url']);
    settings.notice.link_url = '';
    expect(settingsProblems(settings)).toEqual({});
  });

  it('keeps to the API’s limits on days, services and times', () => {
    const settings = clone(DEFAULT_SITE_SETTINGS);
    const sunday = settings.service_times[0];
    sunday.services[0].slots = Array(5).fill({ start: '08:00', end: '09:00' });
    sunday.services[1].slots = [];
    sunday.services[2].slots = [{ start: '8:30', end: '10:00' }];
    sunday.services = [...sunday.services, ...Array(10).fill(sunday.services[3])];
    settings.service_times = [...settings.service_times, ...Array(5).fill(settings.service_times[2])];
    expect(Object.keys(settingsProblems(settings)).sort()).toEqual(
      ['service_times', 'service_times.0.services', 'service_times.0.services.0.slots', 'service_times.0.services.1.slots', 'service_times.0.services.2.slots.0'].sort()
    );
  });
});

describe('links', () => {
  it.each([
    ['https://youtube.com/@aickabuku', true],
    ['http://maps.app.goo.gl/abc123', true],
    ['https://localhost', false],
    ['https://localhost/a.b', false],
    ['ftp://files.example.com', false],
    ['javascript:alert(1)', false], // eslint-disable-line no-script-url
    ['https://example.com/a b', false],
    ['https://example.com/café', false],
    ['youtube.com', false],
  ])('%s is a web link: %s', (value, expected) => {
    expect(isWebLink(value)).toBe(expected);
  });

  it.each([
    ['/events', true],
    ['/', true],
    ['//evil.example', false],
    ['/a page', false],
    ['events', false],
  ])('%s is a link on this site: %s', (value, expected) => {
    expect(isSiteLink(value)).toBe(expected);
  });
});

it('stops adding times, services and days at the API’s limits', async () => {
  renderPage('services');
  const firstService = (await screen.findByDisplayValue('First Service')).closest('li');
  const addTime = () => within(firstService).queryByRole('button', { name: '+ Add another time' });
  fireEvent.click(addTime());
  fireEvent.click(addTime());
  fireEvent.click(addTime());
  expect(within(firstService).getAllByLabelText('First Service starts')).toHaveLength(4);
  expect(addTime()).not.toBeInTheDocument();

  for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Add a day' }));
  expect(screen.getByRole('button', { name: 'Add a day' })).toBeDisabled();
});

it('switches the top bar to the contact & social bar and saves it', async () => {
  api.get.mockResolvedValue({ data: { ...clone(SAVED), social: { ...SAVED.social, facebook: 'https://facebook.com/aickabuku' } } });
  renderPage();
  await screen.findByLabelText('Message');
  expect(screen.getByText('Showing: your notice')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('radio', { name: /Contact & social only/ }));
  expect(screen.getByText('Showing: contact & social bar')).toBeInTheDocument();
  // The preview uses the saved social links
  expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://facebook.com/aickabuku');
  fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Contact bar colour' })).getByRole('radio', { name: /Light/ }));
  fireEvent.click(screen.getByRole('switch', { name: 'Show staff login link' }));

  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
  expect(api.patch.mock.calls[0][1].site_settings.top_bar).toEqual({ ...DEFAULT_SITE_SETTINGS.top_bar, mode: 'contact', style: 'light', show_login: true });
  expect(await screen.findByText(/Saved: the website shows the changes now/)).toBeInTheDocument();
});

it('says so when the server doesn’t store the top bar yet, and keeps the choice in the form', async () => {
  // An older API keeps only the sections it knows
  api.patch.mockImplementation((url, body) => {
    const stored = { ...body.site_settings };
    delete stored.top_bar;
    return Promise.resolve({ data: stored });
  });
  renderPage();
  await screen.findByLabelText('Message');

  fireEvent.click(screen.getByRole('radio', { name: /^Nothing/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(await screen.findByText(/the server doesn’t store the top bar choices yet/)).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /^Nothing/ })).toBeChecked();
  expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
});

it('points to Contact & social when the bar has none of those details yet', async () => {
  renderPage();
  await screen.findByLabelText('Message');
  expect(screen.getByText('No phone number yet.')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Add it in Contact & social' })[0]);
  expect(await screen.findByLabelText(/^Phone/)).toBeInTheDocument();
});
