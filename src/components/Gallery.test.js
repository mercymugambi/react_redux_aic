import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import api from '../redux/api'
import Gallery from './Gallery'

jest.mock('../redux/api', () => ({ __esModule: true, default: { get: jest.fn() } }))

const photo = (overrides) => ({
  id: 1,
  title: 'Sunday worship',
  category: 'Worship',
  taken_on: '2026-10-01',
  image_url: 'https://cdn.example.com/1.jpg',
  created_at: '2026-10-02T09:00:00Z',
  ...overrides,
})

const PHOTOS = [
  photo({ id: 1 }),
  photo({ id: 2, title: 'Youth outreach day', category: 'Outreach', taken_on: '2026-08-15', image_url: 'https://cdn.example.com/2.jpg' }),
  photo({ id: 3, title: '834501429 122135894942736406 n', category: 'Community', taken_on: '2026-09-03', image_url: 'https://cdn.example.com/3.jpg' }),
  photo({ id: 4, title: 'No file', image_url: null }),
]

let currentLocation
function LocationSpy() {
  currentLocation = useLocation()
  return null
}

const renderAt = (path = '/gallery') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/gallery" element={<><Gallery /><LocationSpy /></>} />
      </Routes>
    </MemoryRouter>
  )

const tiles = () => screen.getAllByRole('button', { name: /^Open / }).map((button) => button.getAttribute('aria-label'))

beforeEach(() => {
  api.get.mockReset()
  window.localStorage.clear()
})

test('shows the photos from the API, newest first, leaving out photos without a file', async () => {
  api.get.mockResolvedValue({ data: PHOTOS })
  renderAt()

  await screen.findByRole('button', { name: 'Open Sunday worship' })
  expect(api.get).toHaveBeenCalledWith('/api/v1/gallery_images')
  // A file-name caption falls back to the category
  expect(tiles()).toEqual(['Open Sunday worship', 'Open Community at AIC Kabuku', 'Open Youth outreach day'])
  expect(screen.queryByRole('button', { name: 'Open No file' })).not.toBeInTheDocument()
  expect(screen.getByText(/latest from October 2026/i)).toBeInTheDocument()
})

test('builds the category filters from the photos and keeps the choice in the address', async () => {
  api.get.mockResolvedValue({ data: PHOTOS })
  renderAt()

  const filters = within(await screen.findByRole('group', { name: 'Filter photos' }))
  await filters.findByRole('button', { name: /^Worship/ })
  // Only categories that have photos get a chip
  expect(filters.queryByRole('button', { name: /^Prayer/ })).not.toBeInTheDocument()
  expect(filters.getByRole('button', { name: /^All/ })).toHaveTextContent('3')

  fireEvent.click(filters.getByRole('button', { name: /^Outreach/ }))
  expect(tiles()).toEqual(['Open Youth outreach day'])
  expect(currentLocation.search).toBe('?category=Outreach')
})

test('opens a shared photo link and moves between photos', async () => {
  api.get.mockResolvedValue({ data: PHOTOS })
  renderAt('/gallery?photo=1')

  const dialog = await screen.findByRole('dialog', { name: 'Sunday worship' })
  expect(within(dialog).getByText('1 / 3')).toBeInTheDocument()
  // Focus moves into the viewer once it's ready for the keyboard
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Close photo' })).toHaveFocus())

  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(await screen.findByRole('dialog', { name: 'Community at AIC Kabuku' })).toBeInTheDocument()
  expect(currentLocation.search).toBe('?photo=3')

  fireEvent.keyDown(window, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(currentLocation.search).toBe('')
})

test('searches captions and remembers saved photos', async () => {
  api.get.mockResolvedValue({ data: PHOTOS })
  renderAt()
  await screen.findByRole('button', { name: 'Open Sunday worship' })

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search photos' }), { target: { value: 'youth' } })
  expect(tiles()).toEqual(['Open Youth outreach day'])

  fireEvent.click(screen.getByRole('button', { name: 'Save Youth outreach day' }))
  expect(JSON.parse(window.localStorage.getItem('aic-gallery-saved'))).toEqual([2])
  expect(screen.getByRole('button', { name: /^Saved/ })).toHaveTextContent('1')
})

test('offers a retry when the gallery cannot be loaded', async () => {
  api.get.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({ data: PHOTOS })
  renderAt()

  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('button', { name: 'Open Sunday worship' })).toBeInTheDocument()
})

test('says photos are coming when there are none yet', async () => {
  api.get.mockResolvedValue({ data: [] })
  renderAt()
  expect(await screen.findByText('Photos are on their way')).toBeInTheDocument()
})
