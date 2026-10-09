import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import api from '../../redux/api';
import authReducer from '../../redux/authSlice';
import BlogEditor from './BlogEditor';

jest.mock('../../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  apiErrorMessage: (error, fallback) => fallback,
  apiErrorMessages: (error, fallback) => [fallback],
}));

const USER = { firstname: 'Grace', lastname: 'Wanjiru', email: 'grace@aickabuku.org', super_admin: true, roles: [] };

const POST = {
  id: 7,
  slug: 'grace-for-monday',
  title: 'Grace for Monday',
  excerpt: 'Carrying Sunday into the week, one ordinary day at a time.',
  body: [
    { type: 'paragraph', text: 'There is a quiet after the last song.' },
    { type: 'quote', text: 'Be still, and know that I am God.', cite: 'Psalm 46:10' },
  ],
  category: 'Faith & Devotion',
  tags: ['Grace'],
  status: 'published',
  featured: false,
  published_on: '2026-08-04',
  author_name: 'Rev. Joseph Njuguna',
  author_role: 'Senior Pastor',
  cover_image_url: null,
  read_minutes: 1,
  updated_at: '2026-08-04T08:00:00Z',
};

function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderEditor(path) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: USER, token: 'token', sessionStatus: 'ready', sessionExpired: false, loading: false, error: null } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/blog" element={<p>All posts</p>} />
          <Route path="/admin/blog/:postId" element={<BlogEditor />} />
        </Routes>
        <Location />
      </MemoryRouter>
    </Provider>
  );
}

const sent = (call) => {
  const data = call[1];
  return { title: data.get('blog_post[title]'), status: data.get('blog_post[status]'), body: JSON.parse(data.get('blog_post[body]')) };
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

test('a new post saves as a draft, then carries on at its own address', async () => {
  api.post.mockResolvedValue({ data: { blog_post: { ...POST, id: 42, status: 'draft', title: 'Bread for the journey', slug: 'bread-for-the-journey' } } });
  renderEditor('/admin/blog/new');

  expect(screen.getByRole('heading', { name: 'New post' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Bread for the journey' } });
  fireEvent.change(screen.getByLabelText('Paragraph'), { target: { value: 'Give us this day our daily bread.' } });
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/blog/42'));
  expect(api.post).toHaveBeenCalledWith('/api/v1/blog_posts', expect.any(FormData));
  expect(sent(api.post.mock.calls[0])).toEqual({
    title: 'Bread for the journey',
    status: 'draft',
    body: [{ type: 'paragraph', text: 'Give us this day our daily bread.' }],
  });
  expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
  // The same editor carries on: what was typed is still there and counts as saved
  expect(screen.getByLabelText('Title')).toHaveValue('Bread for the journey');
  expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Draft saved');
});

test('publishing first checks what readers will see', async () => {
  renderEditor('/admin/blog/new');
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Bread for the journey' } });

  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

  const [alert] = await screen.findAllByRole('alert');
  expect(within(alert).getByText('Add a short summary for the blog list')).toBeInTheDocument();
  expect(within(alert).getByText('Write the post before publishing')).toBeInTheDocument();
  expect(within(alert).getByText('Pick a category')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByLabelText(/^Summary/)).toHaveFocus());
  expect(api.post).not.toHaveBeenCalled();
});

test('an existing post loads from the admin list and updates in place', async () => {
  api.get.mockResolvedValue({ data: [{ ...POST, id: 3, title: 'Another post' }, POST] });
  api.patch.mockResolvedValue({ data: { blog_post: { ...POST, title: 'Grace for every Monday' } } });
  renderEditor('/admin/blog/7');

  expect(await screen.findByDisplayValue('Grace for Monday')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/api/v1/blog_posts?status=all');
  expect(screen.getByLabelText('Quote reference')).toHaveValue('Psalm 46:10');

  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Grace for every Monday' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));

  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/v1/blog_posts/7', expect.any(FormData)));
  expect(sent(api.patch.mock.calls[0])).toEqual({ title: 'Grace for every Monday', status: 'published', body: POST.body });
  expect(await screen.findByText('Changes published')).toBeInTheDocument();
});

test('a post that no longer exists says so', async () => {
  api.get.mockResolvedValue({ data: [POST] });
  renderEditor('/admin/blog/99');
  expect(await screen.findByRole('heading', { name: 'This post doesn’t exist' })).toBeInTheDocument();
});

test('in the Visual editor, Enter splits a paragraph and Backspace joins it back', () => {
  renderEditor('/admin/blog/new');
  const first = screen.getByLabelText('Paragraph');
  fireEvent.change(first, { target: { value: 'Hello world' } });
  act(() => first.focus());
  first.setSelectionRange(5, 5);
  fireEvent.keyDown(first, { key: 'Enter' });

  const split = screen.getAllByLabelText('Paragraph');
  expect(split.map((field) => field.value)).toEqual(['Hello', 'world']);
  expect(split[1]).toHaveFocus();

  fireEvent.keyDown(split[1], { key: 'Backspace' });
  const joined = screen.getAllByLabelText('Paragraph');
  expect(joined.map((field) => field.value)).toEqual(['Helloworld']);
  expect(joined[0]).toHaveFocus();
  expect(joined[0].selectionStart).toBe(5);

  // Typing "## " at the start of a paragraph makes it a heading
  fireEvent.change(joined[0], { target: { value: '## Helloworld', selectionStart: 3 } });
  expect(screen.getByRole('textbox', { name: 'Heading' })).toHaveValue('Helloworld');
});

test('unsaved changes are kept in the browser and offered back next time', async () => {
  const first = renderEditor('/admin/blog/new');
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A post I was writing' } });
  await waitFor(() => expect(window.localStorage.getItem('aic-admin:blog-backup:new')).not.toBeNull(), { timeout: 2000 });
  first.unmount();

  renderEditor('/admin/blog/new');
  expect(screen.getByLabelText('Title')).toHaveValue('');
  expect(screen.getByText(/You have unsaved changes from/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
  expect(screen.getByLabelText('Title')).toHaveValue('A post I was writing');
});
