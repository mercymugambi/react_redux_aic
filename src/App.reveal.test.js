import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { store } from './redux/store';

// jsdom has no IntersectionObserver; report every observed element as on screen.
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    this.callback([{ isIntersecting: true, target }], this);
  }

  unobserve() {}

  disconnect() {}
}

beforeEach(() => {
  window.IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  delete window.IntersectionObserver;
});

test('reveals About Us sections after client-side navigation from the home page', async () => {
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </Provider>
  );

  fireEvent.click(screen.getAllByRole('link', { name: /about us/i })[0]);

  await screen.findByRole('heading', { level: 1, name: /welcome to aic kabuku church/i });

  const aboutSections = container.querySelectorAll('#about [data-reveal]');
  expect(aboutSections.length).toBeGreaterThan(0);
  await waitFor(() => {
    aboutSections.forEach((section) => expect(section).toHaveClass('is-visible'));
  });
});
