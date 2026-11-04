import React, { useEffect } from 'react'
import AboutSection from './AboutSection'
import Seo from './Seo'

function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="page-offset min-h-screen bg-white font-sans antialiased text-slate-900">
      <Seo
        page="about"
        title="About Our Church"
        path="/aboutus"
        description="Learn the history, mission and beliefs of Africa Inland Church Kabuku — a Bible-believing, Christ-centred family serving Kiambu County, Kenya since 1985."
      />

      {/* ── Main About Content ── */}
      <AboutSection />
    </div>
  )
}

export default AboutUs
