import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import api from '../../redux/api';
import EventForm from './EventForm';

jest.mock('../../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  apiErrorMessage: (error, fallback) => fallback,
  apiErrorMessages: (error, fallback) => [fallback],
}));

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
const sent = (call) => Object.fromEntries([...call[1].entries()]);

beforeEach(() => {
  jest.clearAllMocks();
  // jsdom can't make preview URLs for picked files
  global.URL.createObjectURL = jest.fn(() => 'blob:cover-preview');
  global.URL.revokeObjectURL = jest.fn();
});

test('a new event is published with its uploaded cover photo', async () => {
  api.post.mockResolvedValue({ data: { event: { id: 9, title: 'Youth Revival & Worship Night' } } });
  const onSaved = jest.fn();
  render(<EventForm onClose={jest.fn()} onSaved={onSaved} />);

  fill('Title', 'Youth Revival & Worship Night');
  fill('Category', 'Youth');
  fill('Date', '2026-11-07');
  fill('Starts', '17:00');
  fill('Ends', '21:00');
  fill('Location', 'Youth Fellowship Center');
  fill('Speaker or host', 'Pastor Timothy Mwangi');
  fill('Description', 'An evening of praise and testimonies.');
  const photo = new File(['photo'], 'revival.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Cover photo'), { target: { files: [photo] } });
  expect(screen.getByText('revival.jpg · uploads when you save')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

  await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 9, title: 'Youth Revival & Worship Night' }, { status: 'published', created: true }));
  expect(api.post).toHaveBeenCalledWith('/api/v1/events', expect.any(FormData));
  expect(sent(api.post.mock.calls[0])).toEqual({
    'event[title]': 'Youth Revival & Worship Night',
    'event[category]': 'Youth',
    'event[status]': 'published',
    'event[featured]': 'false',
    'event[date]': '2026-11-07',
    'event[end_date]': '',
    'event[start_time]': '17:00',
    'event[end_time]': '21:00',
    'event[location]': 'Youth Fellowship Center',
    'event[speaker]': 'Pastor Timothy Mwangi',
    'event[speaker_role]': '',
    'event[audience]': '',
    'event[description]': 'An evening of praise and testimonies.',
    'event[registration]': 'none',
    'event[registration_url]': '',
    'event[capacity]': '',
    'event[cover_image]': photo,
  });
});

test('a draft needs only a title and a date; publishing needs the details people will see', async () => {
  api.post.mockResolvedValue({ data: { event: { id: 3 } } });
  render(<EventForm onClose={jest.fn()} onSaved={jest.fn()} />);
  fill('Title', 'Easter Sunday');
  fill('Date', '2027-03-28');

  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(screen.getByText('Pick a category so people can find it')).toBeInTheDocument();
  expect(screen.getByText('Say what’s happening and who it’s for')).toBeInTheDocument();
  expect(screen.getByLabelText('Category')).toHaveFocus();
  expect(api.post).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(api.post).toHaveBeenCalled());
  expect(sent(api.post.mock.calls[0])['event[status]']).toBe('draft');
});

test('an event that runs past midnight is caught, with a one-click fix', () => {
  render(<EventForm onClose={jest.fn()} onSaved={jest.fn()} />);
  fill('Title', 'Night of Prayer');
  fill('Date', '2026-04-03');
  fill('Starts', '21:00');
  fill('Ends', '05:00');
  expect(screen.getByText('Ends before it starts. If it runs past midnight, set the last day.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'It ends the next day' }));

  expect(screen.getByLabelText('Last day', { exact: false })).toHaveValue('2026-04-04');
  expect(screen.queryByText(/Ends before it starts/)).not.toBeInTheDocument();
});

test('editing keeps the event’s status, and removing the cover is sent along', async () => {
  const event = {
    id: 5,
    title: 'Couples Seminar',
    category: 'Worship & Services',
    status: 'published',
    date: '2026-11-21',
    start_time: '14:00',
    end_time: '17:30',
    description: 'For engaged and married couples.',
    registration: 'rsvp',
    capacity: 80,
    seats_taken: 30,
    cover_image_url: 'https://res.cloudinary.com/demo/couples.jpg',
  };
  api.patch.mockResolvedValue({ data: { event: { ...event, cover_image_url: null } } });
  const onSaved = jest.fn();
  render(<EventForm event={event} onClose={jest.fn()} onSaved={onSaved} />);

  expect(screen.getByRole('dialog', { name: 'Edit “Couples Seminar”' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  expect(screen.getByText('The cover will be removed when you save.')).toBeInTheDocument();

  // Fewer seats than are already taken isn't allowed
  fill('Seats available', '20');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByText('30 seats are already taken')).toBeInTheDocument();

  fill('Seats available', '100');
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(api.patch).toHaveBeenCalledWith('/api/v1/events/5', expect.any(FormData));
  const fields = sent(api.patch.mock.calls[0]);
  expect(fields).toMatchObject({ 'event[status]': 'published', 'event[remove_cover_image]': 'true', 'event[capacity]': '100', 'event[registration]': 'rsvp' });
  expect(fields['event[cover_image]']).toBeUndefined();
  expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }), { status: 'published', created: false });
});

test('a sign-up link must be a full web address', () => {
  render(<EventForm onClose={jest.fn()} onSaved={jest.fn()} />);
  fill('Title', 'Missions conference');
  fill('Date', '2026-11-14');
  const signups = screen.getByRole('radiogroup', { name: 'Sign-ups' });
  fireEvent.click(within(signups).getByLabelText(/Link to another site/));
  fill('Sign-up link', 'forms.gle/abc');

  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

  expect(screen.getByText('Use a full link starting with http:// or https://')).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
