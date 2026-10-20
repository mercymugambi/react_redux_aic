import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '../../redux/api'
import CommentsList from './CommentsList'

jest.mock('../../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  apiErrorMessage: (error, fallback) => fallback,
  apiErrorMessages: (error, fallback) => [fallback],
}))

const POST = { id: 3, slug: 'walking-in-faith', title: 'Walking in Faith' }
const OTHER_POST = { id: 4, slug: 'youth-camp', title: 'Youth Camp Recap' }
const comment = (overrides) => ({
  id: 1,
  author_name: 'Grace Wanjiru',
  author_email: 'grace@example.com',
  body: 'This blessed me so much.',
  status: 'approved',
  created_at: '2026-10-18T09:00:00Z',
  updated_at: '2026-10-18T09:00:00Z',
  reply: null,
  blog_post: POST,
  ...overrides,
})

const COMMENTS = [
  comment({ id: 1 }),
  comment({ id: 2, author_name: 'Peter Kamau', body: 'Great camp!', blog_post: OTHER_POST }),
  comment({ id: 3, author_name: 'Spam Bot', body: 'Buy now', status: 'hidden' }),
]

const renderAt = (path = '/admin/comments') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CommentsList />
    </MemoryRouter>
  )

// The actions inside the comment that contains `text`
const rowFor = (text) => within(screen.getByText(text).closest('li'))

beforeEach(() => {
  api.get.mockReset().mockResolvedValue({ data: COMMENTS })
  api.patch.mockReset()
  api.delete.mockReset()
})

test('opens on every comment, with no approval step', async () => {
  renderAt()
  expect(await screen.findByText('This blessed me so much.')).toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/api/v1/blog_comments?status=all')
  expect(screen.getByText('Great camp!')).toBeInTheDocument()
  expect(screen.getByText('Buy now')).toBeInTheDocument()
  expect(rowFor('This blessed me so much.').getByText('grace@example.com')).toHaveAttribute('href', 'mailto:grace@example.com')
  // Nothing waits for approval, so there's no Pending tab or Approve button
  expect(screen.queryByRole('button', { name: /^Pending/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /^Hidden/ }))
  expect(screen.getByText('Buy now')).toBeInTheDocument()
  expect(screen.queryByText('Great camp!')).not.toBeInTheDocument()
})

test('hides a comment and shows it again', async () => {
  api.patch.mockResolvedValueOnce({ data: { blog_comment: comment({ status: 'hidden' }) } })
  renderAt()
  await screen.findByText('This blessed me so much.')
  fireEvent.click(rowFor('This blessed me so much.').getByRole('button', { name: 'Hide' }))

  expect(api.patch).toHaveBeenCalledWith('/api/v1/blog_comments/1', { blog_comment: { status: 'hidden' } })
  await screen.findByText('Comment hidden from the website')

  api.patch.mockResolvedValueOnce({ data: { blog_comment: comment({ status: 'approved' }) } })
  fireEvent.click(rowFor('This blessed me so much.').getByRole('button', { name: 'Show again' }))
  expect(api.patch).toHaveBeenLastCalledWith('/api/v1/blog_comments/1', { blog_comment: { status: 'approved' } })
  expect(await screen.findByText('Comment is back on the website')).toBeInTheDocument()
})

test('replies to a comment', async () => {
  const reply = { body: 'Thank you, Grace!', author_name: 'Pastor Joseph', created_at: '2026-10-19T08:00:00Z' }
  api.patch.mockResolvedValue({ data: { blog_comment: comment({ reply }) } })
  renderAt()
  await screen.findByText('This blessed me so much.')

  fireEvent.click(rowFor('This blessed me so much.').getByRole('button', { name: 'Reply' }))
  fireEvent.change(screen.getByLabelText('Reply to Grace Wanjiru'), { target: { value: ' Thank you, Grace! ' } })
  expect(screen.queryByRole('button', { name: 'Reply & approve' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save reply' }))

  expect(api.patch).toHaveBeenCalledWith('/api/v1/blog_comments/1', { blog_comment: { reply_body: 'Thank you, Grace!' } })
  expect(await screen.findByText('Thank you, Grace!')).toBeInTheDocument()
  expect(await screen.findByText(/Reply from Pastor Joseph/)).toBeInTheDocument()
})

test('narrows to one post from a ?post= link', async () => {
  renderAt('/admin/comments?post=4')
  expect(await screen.findByText('Great camp!')).toBeInTheDocument()
  expect(screen.queryByText('Buy now')).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Post' })).toHaveValue('4')
})

test('deletes a comment after confirming', async () => {
  api.delete.mockResolvedValue({ data: { id: 1 } })
  renderAt()
  await screen.findByText('This blessed me so much.')
  fireEvent.click(rowFor('This blessed me so much.').getByRole('button', { name: 'Delete' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

  expect(api.delete).toHaveBeenCalledWith('/api/v1/blog_comments/1')
  expect(await screen.findByText('Comment deleted')).toBeInTheDocument()
  expect(screen.queryByText('This blessed me so much.')).not.toBeInTheDocument()
})

test('still lets older comments that are waiting be approved', async () => {
  const waiting = comment({ id: 9, author_name: 'Mary Njeri', body: 'Waiting here', status: 'pending' })
  api.get.mockReset().mockResolvedValue({ data: [...COMMENTS, waiting] })
  api.patch.mockResolvedValue({ data: { blog_comment: { ...waiting, status: 'approved' } } })
  renderAt()

  fireEvent.click(await screen.findByRole('button', { name: /^Pending/ }))
  await screen.findByText('Waiting here')
  fireEvent.click(rowFor('Waiting here').getByRole('button', { name: 'Approve' }))
  expect(api.patch).toHaveBeenCalledWith('/api/v1/blog_comments/9', { blog_comment: { status: 'approved' } })
  // The tab goes away once nothing is waiting
  await waitFor(() => expect(screen.queryByRole('button', { name: /^Pending/ })).not.toBeInTheDocument())
})

test('explains when the server has no comments API yet', async () => {
  api.get.mockReset().mockRejectedValue({ response: { status: 404 } })
  renderAt()
  expect(await screen.findByText('Not connected yet.')).toBeInTheDocument()
})
