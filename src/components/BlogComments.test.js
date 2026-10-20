import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import api from '../redux/api'
import BlogComments, { timeAgo } from './BlogComments'

jest.mock('../redux/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }))

const COMMENTS = [
  {
    id: 1,
    author_name: 'Grace Wanjiru',
    body: 'This blessed me so much.',
    created_at: '2026-10-18T09:00:00Z',
    reply: { body: 'Thank you, Grace!', author_name: 'Pastor Joseph', created_at: '2026-10-18T10:00:00Z' },
  },
]

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  api.get.mockReset()
  api.post.mockReset()
  window.localStorage.clear()
})

test('lists approved comments with replies from the church', async () => {
  api.get.mockResolvedValue({ data: COMMENTS })
  render(<BlogComments slug="walking-in-faith" />)

  expect(await screen.findByText('This blessed me so much.')).toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/api/v1/blog_posts/walking-in-faith/comments')
  expect(screen.getByRole('heading', { name: '1 Comment' })).toBeInTheDocument()
  expect(screen.getByText('Reply from Pastor Joseph')).toBeInTheDocument()
})

test('posts a comment and shows it straight away', async () => {
  api.get.mockResolvedValue({ data: [] })
  api.post.mockResolvedValue({ data: { comment: { id: 7, author_name: 'Brian', body: 'Amen!', created_at: new Date().toISOString(), status: 'approved' } } })
  render(<BlogComments slug="walking-in-faith" />)
  await screen.findByText('Be the first to share your thoughts.')

  fill(/^Name/, ' Brian ')
  fill(/^Email/, 'brian@example.com')
  fill('Comment *', 'Amen!')
  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))

  expect(await screen.findByText('Thank you, your comment is posted.')).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/api/v1/blog_posts/walking-in-faith/comments', {
    comment: { author_name: 'Brian', author_email: 'brian@example.com', body: 'Amen!', website: '' },
  })
  expect(screen.getByText('Amen!')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '1 Comment' })).toBeInTheDocument()
  expect(screen.queryByText('Awaiting approval')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Comment *')).toHaveValue('')
  // Name and email are remembered for next time
  expect(JSON.parse(window.localStorage.getItem('aic-commenter'))).toEqual({ author_name: 'Brian', author_email: 'brian@example.com' })
})

test('checks the form before sending and shows the server’s messages', async () => {
  api.get.mockResolvedValue({ data: [] })
  render(<BlogComments slug="walking-in-faith" />)
  await screen.findByText('Be the first to share your thoughts.')

  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
  expect(screen.getByText('Please add your name.')).toBeInTheDocument()
  expect(screen.getByText('Please write a comment.')).toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled()

  api.post.mockRejectedValue({ response: { status: 429, data: { error: 'Too many comments from this connection. Please try again in a few minutes.' } } })
  fill(/^Name/, 'Brian')
  fill('Comment *', 'Hello')
  fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
  expect(await screen.findByText(/Too many comments from this connection/)).toBeInTheDocument()
})

test('stays out of the way until the server has a comments API', async () => {
  api.get.mockRejectedValue({ response: { status: 404 } })
  const { container } = render(<BlogComments slug="walking-in-faith" />)
  await waitFor(() => expect(container).toBeEmptyDOMElement())
})

test('timeAgo reads naturally and falls back to the date after a week', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  expect(timeAgo('2026-10-20T11:59:30Z', now)).toBe('just now')
  expect(timeAgo('2026-10-20T11:15:00Z', now)).toBe('45 minutes ago')
  expect(timeAgo('2026-10-17T12:00:00Z', now)).toBe('3 days ago')
  expect(timeAgo('2026-09-01T12:00:00Z', now)).toBe('1 September 2026')
})
