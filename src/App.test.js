import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AIC Kabuku brand name', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/AIC Kabuku/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
