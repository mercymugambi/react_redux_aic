import React from 'react'
import { render, waitFor } from '@testing-library/react'
import api from '../redux/api'
import Seo from './Seo'
import { SiteSettingsProvider } from './SiteSettings'
import { DEFAULT_SITE_SETTINGS } from '../data/siteSettings'

jest.mock('../redux/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const description = () => document.head.querySelector('meta[name="description"]').getAttribute('content')

beforeEach(() => window.localStorage.clear())

it('uses the built-in settings until the API answers', () => {
  api.get.mockReturnValue(new Promise(() => {}))
  render(<Seo />)
  expect(document.title).toBe(DEFAULT_SITE_SETTINGS.seo.home_title)
  expect(description()).toBe(DEFAULT_SITE_SETTINGS.seo.description)
})

it('prefers a page’s saved title and description', async () => {
  api.get.mockResolvedValue({
    data: { seo: { site_name: 'AIC Kabuku', pages: { blog: { title: 'Stories', description: 'Stories from the church family.' } } } },
  })
  render(
    <SiteSettingsProvider>
      <Seo page="blog" title="Blog" description="Old text" path="/blog" />
    </SiteSettingsProvider>
  )
  await waitFor(() => expect(document.title).toBe('Stories | AIC Kabuku'))
  expect(description()).toBe('Stories from the church family.')
  expect(JSON.parse(window.localStorage.getItem('aic:site-settings')).seo.site_name).toBe('AIC Kabuku')
})

it('falls back to the site description for a page without one', async () => {
  api.get.mockResolvedValue({ data: { seo: { description: 'A church in Kabuku.', pages: { gallery: { title: '', description: '' } } } } })
  render(
    <SiteSettingsProvider>
      <Seo page="gallery" title="Gallery" path="/gallery" />
    </SiteSettingsProvider>
  )
  await waitFor(() => expect(description()).toBe('A church in Kabuku.'))
  expect(document.title).toBe(`Gallery | ${DEFAULT_SITE_SETTINGS.seo.site_name}`)
})
