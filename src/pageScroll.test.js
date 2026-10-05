import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { store } from './redux/store';

// Newer browsers return a Promise from window.scrollTo. A page effect written as
// `useEffect(() => window.scrollTo(0, 0))` hands that Promise to React as its cleanup,
// which throws "destroy is not a function" when the page unmounts.
beforeEach(() => {
  window.scrollTo = jest.fn(() => Promise.resolve());
});

test.each([
  ['/contact', /contact/i],
  ['/no-such-page', /404|not found|page/i],
])('leaving %s does not crash when scrollTo returns a Promise', (path) => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>
  );

  expect(() => {
    fireEvent.click(screen.getAllByRole('link', { name: /about us/i })[0]);
  }).not.toThrow();
  expect(screen.getByRole('heading', { name: /about aic kabuku church/i })).toBeInTheDocument();
});
