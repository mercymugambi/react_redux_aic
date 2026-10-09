import React, { useEffect, useMemo, useState } from 'react'
import Seo from './Seo'
import galleryItems, { galleryCategories } from '../data/galleryItems'

const filters = ['All', ...galleryCategories]

function Gallery() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedItem, setSelectedItem] = useState(null)
  const [savedItems, setSavedItems] = useState([])
  const visibleItems = useMemo(() => activeFilter === 'All' ? galleryItems : galleryItems.filter((item) => item.category === activeFilter), [activeFilter])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedItem(null)
      if (!selectedItem || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
      const currentIndex = visibleItems.findIndex((item) => item.id === selectedItem.id)
      const direction = event.key === 'ArrowRight' ? 1 : -1
      setSelectedItem(visibleItems[(currentIndex + direction + visibleItems.length) % visibleItems.length])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedItem, visibleItems])

  const toggleSave = (id) => setSavedItems((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id])

  return (
    <main className="page-offset bg-[#fcfcfb] text-slate-900">
      <Seo
        page="gallery"
        title="Photo Gallery"
        path="/gallery"
        description="Photos from worship, prayer, children's ministry and community outreach at AIC Kabuku — the people, praise and purpose that make our church family feel like home."
        image={galleryItems[0].image}
      />
      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[1480px]">
          <p className="text-xs font-extrabold uppercase tracking-[.28em] text-red-700">AIC Kabuku · Photo journal</p>
          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Life, captured in <span className="text-red-700">moments.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Discover the people, praise and purpose that make our church family feel like home.</p></div>
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">{galleryItems.length}</span><span><strong className="font-bold">memories</strong><br />and counting</span></div>
          </div>
        </div>
      </section>

      <section className="sticky sticky-below-nav z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 overflow-x-auto [scrollbar-width:none]">
          {filters.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${activeFilter === filter ? 'bg-red-700 text-white shadow-md shadow-red-700/20' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'}`}>{filter}</button>)}
          <span className="ml-auto hidden shrink-0 text-sm font-medium text-slate-400 sm:block">{visibleItems.length} photos</span>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-3 py-7 sm:px-5 lg:px-8 lg:py-10">
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
          {visibleItems.map((item) => {
            const saved = savedItems.includes(item.id)
            return <article key={item.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/15">
              <button type="button" onClick={() => setSelectedItem(item)} className="block w-full text-left focus:outline-none focus:ring-4 focus:ring-red-200" aria-label={`Open ${item.title}`}><img src={item.image} alt={item.title} loading="lazy" className={`block w-full object-cover transition duration-500 group-hover:scale-[1.04] ${item.ratio}`} /></button>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-3 p-3.5 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-red-200">{item.category}</p><h2 className="mt-0.5 text-sm font-bold leading-5">{item.title}</h2></div>
              <button type="button" onClick={() => toggleSave(item.id)} aria-label={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition duration-300 ${saved ? 'bg-red-700 text-white opacity-100' : 'bg-white/95 text-slate-700 opacity-0 group-hover:opacity-100 hover:bg-red-700 hover:text-white'}`}><svg className="h-4 w-4" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3.5A2.5 2.5 0 017.5 1h9A2.5 2.5 0 0119 3.5V22l-7-4-7 4V3.5z" /></svg></button>
            </article>
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 pb-16 pt-8 sm:px-6 lg:px-8"><div className="rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-12"><p className="text-xs font-bold uppercase tracking-[.26em] text-red-300">More than a photo</p><h2 className="mx-auto mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Come and make memories with us.</h2><a href="/#contact" className="mt-7 inline-flex rounded-full bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wider transition hover:bg-red-600">Plan your visit</a></div></section>

      {selectedItem && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={selectedItem.title} onClick={() => setSelectedItem(null)}><div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><img src={selectedItem.image} alt={selectedItem.title} className="max-h-[76vh] w-full bg-slate-950 object-contain" /><div className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-700">{selectedItem.category} · {selectedItem.date}</p><h2 className="mt-1 text-xl font-extrabold">{selectedItem.title}</h2></div><div className="flex gap-2"><button type="button" onClick={() => { const i = visibleItems.findIndex((item) => item.id === selectedItem.id); setSelectedItem(visibleItems[(i - 1 + visibleItems.length) % visibleItems.length]) }} className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-red-50" aria-label="Previous photo">←</button><button type="button" onClick={() => { const i = visibleItems.findIndex((item) => item.id === selectedItem.id); setSelectedItem(visibleItems[(i + 1) % visibleItems.length]) }} className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-red-50" aria-label="Next photo">→</button><button type="button" onClick={() => setSelectedItem(null)} className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 hover:bg-red-50" aria-label="Close image">×</button></div></div></div></div>}
    </main>
  )
}

export default Gallery
