import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import api from '../redux/api'
import Blog from './Blog'
import BlogPost from './BlogPost'

jest.mock('../redux/api', () => ({ __esModule: true, default: { get: jest.fn() } }))

const post = (overrides) => ({
  id: 1,
  slug: 'grace-for-monday',
  title: 'Grace for Monday',
  excerpt: 'Carrying Sunday into the week.',
  category: 'Faith & Devotion',
  status: 'published',
  featured: false,
  published_on: '2026-08-04',
  tags: ['Grace'],
  cover_image_url: null,
  author_name: 'Rev. Joseph Njuguna',
  author_role: 'Senior Pastor',
  read_minutes: 4,
  created_at: '2026-08-04T08:00:00Z',
  updated_at: '2026-08-04T08:00:00Z',
  ...overrides,
})

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>
  )

beforeEach(() => {
  window.scrollTo = jest.fn()
  api.get.mockReset()
})

describe('blog list', () => {
  test('shows published posts from the API, featured first', async () => {
    api.get.mockResolvedValue({
      data: [
        post(),
        post({ id: 2, slug: 'older-but-featured', title: 'Older but featured', published_on: '2026-05-01', featured: true, cover_image_url: 'https://res.cloudinary.com/demo/cover.jpg' }),
      ],
    })

    renderAt('/blog')

    const titles = await screen.findAllByRole('heading', { level: 3 })
    expect(titles.map((heading) => heading.textContent)).toEqual(['Older but featured', 'Grace for Monday'])
    expect(api.get).toHaveBeenCalledWith('/api/v1/blog_posts')
    expect(screen.getByText('2 articles')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Older but featured' })).toHaveAttribute('src', 'https://res.cloudinary.com/demo/cover.jpg')
    expect(screen.getAllByText('JN')).toHaveLength(2)
  })

  test('filters by category', async () => {
    api.get.mockResolvedValue({ data: [post(), post({ id: 2, slug: 'youth-day', title: 'Youth day', category: 'Youth' })] })

    renderAt('/blog')
    await screen.findByText('Youth day')
    fireEvent.click(screen.getByRole('button', { name: 'Youth' }))

    expect(screen.queryByText('Grace for Monday')).not.toBeInTheDocument()
    expect(screen.getByText('Youth day')).toBeInTheDocument()
  })

  test('shows an empty state before the blog API exists', async () => {
    api.get.mockRejectedValue(httpError(404))

    renderAt('/blog')

    expect(await screen.findByText('No articles yet')).toBeInTheDocument()
  })

  test('offers a retry when loading fails', async () => {
    api.get.mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce({ data: [post()] })

    renderAt('/blog')
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Grace for Monday')).toBeInTheDocument()
  })
})

describe('article page', () => {
  test('renders the post body and related posts', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/blog_posts/grace-for-monday') {
        return Promise.resolve({
          data: post({
            body: [
              { type: 'paragraph', text: 'Monday arrives.' },
              { type: 'heading', text: 'Grace is new every morning' },
              { type: 'quote', text: 'His mercies never come to an end.', cite: 'Lamentations 3:22' },
              { type: 'list', items: ['Begin before the noise.'] },
            ],
          }),
        })
      }
      return Promise.resolve({ data: [post(), post({ id: 2, slug: 'why-we-gather', title: 'Why we gather' })] })
    })

    renderAt('/blog/grace-for-monday')

    expect(await screen.findByRole('heading', { level: 1, name: 'Grace for Monday' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Grace is new every morning' })).toBeInTheDocument()
    expect(screen.getByText('— Lamentations 3:22')).toBeInTheDocument()
    expect(screen.getByText('Begin before the noise.')).toBeInTheDocument()
    expect(screen.getByText('#Grace')).toBeInTheDocument()

    const related = await screen.findByRole('heading', { name: 'More from the journal' })
    const section = related.closest('section')
    expect(within(section).getByText('Why we gather')).toBeInTheDocument()
    expect(within(section).queryByText('Grace for Monday')).not.toBeInTheDocument()
  })

  test('shows not found for an unknown or draft post', async () => {
    api.get.mockImplementation((url) => (url === '/api/v1/blog_posts' ? Promise.resolve({ data: [] }) : Promise.reject(httpError(404))))

    renderAt('/blog/no-such-post')

    expect(await screen.findByRole('heading', { name: /couldn.t find that article/i })).toBeInTheDocument()
  })
})
