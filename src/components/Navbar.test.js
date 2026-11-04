import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  )

test('marks the current page link as active in red', () => {
  renderAt('/aboutus')

  const about = screen.getByRole('link', { name: 'About Us' })
  expect(about).toHaveAttribute('aria-current', 'page')
  expect(about).toHaveClass('text-red-700')

  const home = screen.getByRole('link', { name: 'Home' })
  expect(home).not.toHaveAttribute('aria-current')
  expect(home).toHaveClass('text-slate-700')
})

test('only marks Home active on the home page itself', () => {
  renderAt('/')
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'About Us' })).not.toHaveAttribute('aria-current')
})

test('keeps Blog active on an individual blog post', () => {
  renderAt('/blog/some-post')
  expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('aria-current', 'page')
})
