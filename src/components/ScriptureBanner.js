import React, { useCallback, useEffect, useRef, useState } from 'react'

// Curated encouragement passages fetched live from the public Bible API (bible-api.com),
// with instant fallback text so the banner never flickers or fails offline.
const ENCOURAGEMENT_VERSES = [
  {
    reference: 'Jeremiah 29:11',
    translation: 'NIV',
    text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
  },
  {
    reference: 'Isaiah 41:10',
    translation: 'NIV',
    text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
  },
  {
    reference: 'Joshua 1:9',
    translation: 'NIV',
    text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
  },
  {
    reference: 'Philippians 4:13',
    translation: 'NKJV',
    text: 'I can do all things through Christ who strengthens me.',
  },
  {
    reference: 'Romans 8:28',
    translation: 'NIV',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
  },
  {
    reference: 'Isaiah 40:31',
    translation: 'NIV',
    text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
  },
  {
    reference: 'Proverbs 3:5-6',
    translation: 'NIV',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
  },
  {
    reference: 'Psalm 46:1',
    translation: 'NIV',
    text: 'God is our refuge and strength, an ever-present help in trouble.',
  },
  {
    reference: 'Matthew 11:28',
    translation: 'NIV',
    text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
  },
  {
    reference: 'Deuteronomy 31:6',
    translation: 'NIV',
    text: 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.',
  },
  {
    reference: 'Psalm 121:1-2',
    translation: 'NIV',
    text: 'I lift up my eyes to the mountains—where does my help come from? My help comes from the Lord, the Maker of heaven and earth.',
  },
  {
    reference: 'Romans 15:13',
    translation: 'NIV',
    text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
  },
  {
    reference: 'John 14:27',
    translation: 'NIV',
    text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
  },
  {
    reference: '1 Peter 5:7',
    translation: 'NIV',
    text: 'Cast all your anxiety on him because he cares for you.',
  },
]

const ROTATE_INTERVAL_MS = 5000

function pickRandomVerse(excludeRef) {
  const pool = ENCOURAGEMENT_VERSES.filter((v) => v.reference !== excludeRef)
  const list = pool.length > 0 ? pool : ENCOURAGEMENT_VERSES
  return list[Math.floor(Math.random() * list.length)]
}

function cleanVerseText(raw = '') {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^["“”']+|["“”']+$/g, '')
    .trim()
}

function ScriptureBanner() {
  const [verse, setVerse] = useState(() => pickRandomVerse())
  const currentRef = useRef(verse.reference)

  useEffect(() => {
    currentRef.current = verse.reference
  }, [verse.reference])

  const loadNextEncouragementVerse = useCallback(async () => {
    const fallback = pickRandomVerse(currentRef.current)

    // 1. Try OurManna random encouragement verse API
    try {
      const res = await fetch(
        `https://beta.ourmanna.com/api/v1/get?format=json&order=random&_=${Date.now()}`
      )
      if (res.ok) {
        const data = await res.json()
        const details = data?.verse?.details
        if (details?.text && details?.reference && details.reference !== currentRef.current) {
          setVerse({
            text: cleanVerseText(details.text),
            reference: details.reference,
            translation: details.version || 'NIV',
          })
          return
        }
      }
    } catch (_) {
      // Fall through to bible-api.com
    }

    // 2. Try bible-api.com for the randomly chosen encouragement passage
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(fallback.reference)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.text && data?.reference) {
          setVerse({
            text: cleanVerseText(data.text),
            reference: data.reference,
            translation: data.translation_id ? data.translation_id.toUpperCase() : fallback.translation,
          })
          return
        }
      }
    } catch (_) {
      // Fall through to local curated verse
    }

    setVerse(fallback)
  }, [])

  useEffect(() => {
    loadNextEncouragementVerse()
    const timer = window.setInterval(loadNextEncouragementVerse, ROTATE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [loadNextEncouragementVerse])

  return (
    <section
      data-reveal
      className="relative overflow-hidden bg-black py-20 sm:py-28 font-sans"
    >
      {/* Decorative cross watermark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 select-none fill-white/[0.03] sm:h-[600px] sm:w-[600px]"
        viewBox="0 0 24 24"
      >
        <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
      </svg>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">

        {/* Opening quotation mark */}
        <svg
          className="mx-auto mb-4 h-10 w-10 text-white sm:h-12 sm:w-12"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.498 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.364z" />
        </svg>

        {/* Scripture verse */}
        <blockquote
          className="font-serif text-2xl font-bold italic leading-snug text-white sm:text-3xl lg:text-4xl transition-opacity duration-500"
          style={{ textShadow: '0 2px 30px #0000' }}
        >
          {verse.text}
        </blockquote>

        {/* Divider */}
        <div className="mx-auto mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-red-500" />
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
          </svg>
          <div className="h-px flex-1 bg-red-500" />
        </div>

        {/* Bible reference */}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
          {verse.reference}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{verse.translation}
        </p>

        {/* Sub-copy */}
        <p className="mt-6 text-sm leading-relaxed text-white/50 sm:text-base">
          This is the foundation on which AIC Kabuku stands — a church built on God&apos;s promises and His unending faithfulness.
        </p>
      </div>
    </section>
  )
}

export default ScriptureBanner
