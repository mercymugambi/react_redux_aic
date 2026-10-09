import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import api from '../redux/api'
import EventHighlight from './EventHighlight'
import Events from './Events'

jest.mock('../redux/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }))

// Dates relative to today, so "upcoming" stays upcoming whenever the tests run
const day = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const event = (overrides) => ({
  id: 1,
  title: 'Youth Revival & Worship Night',
  category: 'Youth',
  status: 'published',
  featured: false,
  date: day(10),
  end_date: null,
  start_time: '17:00',
  end_time: '21:00',
  location: 'Youth Fellowship Center',
  speaker: 'Pastor Timothy Mwangi',
  speaker_role: 'Youth Pastor',
  audience: 'Teens and young adults',
  description: 'An evening of praise, testimonies and the Word.',
  cover_image_url: null,
  registration: 'none',
  registration_url: null,
  capacity: null,
  seats_taken: 0,
  seats_left: null,
  registration_open: false,
  ...overrides,
})

const UPCOMING = [
  event({ id: 12, title: 'Couples Seminar', category: 'Worship & Services', date: day(5), registration: 'rsvp', capacity: 40, seats_taken: 38, seats_left: 2, registration_open: true }),
  event({ id: 13 }),
  event({ id: 14, title: 'Community Outreach', category: 'Outreach', date: day(20), status: 'cancelled' }),
]

const respondWith = (lists) =>
  api.get.mockImplementation((url) => {
    const when = new URL(url, 'http://test').searchParams.get('when')
    return Promise.resolve({ data: lists[when] || [] })
  })

const renderAt = (path, element = <Events />) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events" element={element} />
        <Route path="/" element={element} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  jest.clearAllMocks()
  window.scrollTo = jest.fn()
})

test('the events page lists what the API returns, soonest first, and filters by category', async () => {
  respondWith({ upcoming: UPCOMING })
  renderAt('/events')

  const titles = await screen.findAllByRole('heading', { level: 3 })
  expect(titles.map((heading) => heading.textContent)).toEqual(['Couples Seminar', 'Youth Revival & Worship Night', 'Community Outreach'])
  expect(api.get).toHaveBeenCalledWith('/api/v1/events?when=upcoming')
  expect(screen.getByText('Cancelled')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Youth' }))
  expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Youth Revival & Worship Night'])
})

test('visitors can reserve places, and the seats left update', async () => {
  respondWith({ upcoming: UPCOMING })
  api.post.mockResolvedValue({ data: { registration: { id: 1, seats: 2 }, event: { id: 12, seats_taken: 40, seats_left: 0, registration_open: false } } })
  renderAt('/events')

  fireEvent.click(await screen.findByRole('button', { name: 'Details & RSVP' }))
  const dialog = screen.getByRole('dialog', { name: 'Couples Seminar' })
  expect(within(dialog).getByText(/2 seats left/)).toBeInTheDocument()

  // A name and a way to reach them come first
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reserve my place' }))
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Please enter your name.')
  expect(api.post).not.toHaveBeenCalled()

  fireEvent.change(within(dialog).getByPlaceholderText('Your full name'), { target: { value: 'Grace Wanjiru' } })
  fireEvent.change(within(dialog).getByPlaceholderText('Phone number'), { target: { value: '0712 345 678' } })
  fireEvent.change(within(dialog).getByLabelText('How many people are coming'), { target: { value: '2' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Reserve my place' }))

  expect(await within(dialog).findByText('✓ You’re on the list, Grace!')).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/api/v1/events/12/registrations', {
    registration: { name: 'Grace Wanjiru', phone: '0712 345 678', email: '', seats: 2, website: '' },
  })
  // The card no longer offers an RSVP now that it's full
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.queryByRole('button', { name: 'Details & RSVP' })).not.toBeInTheDocument()
})

test('a shared link opens that event, and a cancelled one says so instead of taking sign-ups', async () => {
  respondWith({ upcoming: UPCOMING })
  renderAt('/events?event=14')

  const dialog = await screen.findByRole('dialog', { name: 'Community Outreach' })
  expect(within(dialog).getByText('This event has been cancelled. We’re sorry for any inconvenience.')).toBeInTheDocument()
  expect(within(dialog).queryByRole('button', { name: 'Reserve my place' })).not.toBeInTheDocument()
})

test('when there is nothing coming up, the page says so and shows the weekly services', async () => {
  respondWith({ upcoming: [] })
  renderAt('/events')
  expect(await screen.findByText('No upcoming events right now')).toBeInTheDocument()
  expect(screen.getByText('Wednesdays')).toBeInTheDocument()
})

test('the home page features the chosen event, or the soonest one', async () => {
  respondWith({ upcoming: [...UPCOMING, event({ id: 20, title: 'Easter Sunday Celebration', date: day(30), featured: true })] })
  renderAt('/', <EventHighlight />)
  expect(await screen.findByRole('heading', { name: 'Easter Sunday Celebration' })).toBeInTheDocument()
  expect(screen.getByText('Featured event')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Event details' })).toHaveAttribute('href', '/events?event=20')
})

test('with no events, the home page invites people to Sunday worship', async () => {
  respondWith({ upcoming: [] })
  renderAt('/', <EventHighlight />)
  expect(await screen.findByRole('heading', { name: 'Worship with us this Sunday' })).toBeInTheDocument()
  expect(screen.getByText('First Service')).toBeInTheDocument()
})
