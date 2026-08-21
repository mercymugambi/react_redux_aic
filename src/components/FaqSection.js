import React, { useState } from 'react'

const faqs = [
  {
    question: 'I have never been to church before. What should I expect?',
    answer:
      'Come exactly as you are — there is no dress code and no expectation that you know when to stand or sing. A service runs about ninety minutes and nobody will single you out.',
  },
  {
    question: 'What time are your services?',
    answer:
      'Sundays at 8:00 AM and 10:30 AM. Bible study meets on Wednesday from 5:30 PM to 7:00 PM.',
  },
  {
    question: 'Where are you, and is there parking?',
    answer:
      'On the main road at Kabuku, Kiambu County. Parking on the church grounds is free, with stewards on duty on Sunday mornings.',
  },
  {
    question: 'Is there somewhere for my children during the service?',
    answer:
      'Sunday school runs alongside the main service for ages three to twelve. Younger children are welcome to stay with you — we do not mind the noise.',
  },
  {
    question: 'Can I watch a service online?',
    answer:
      'Yes. The Sunday main service is streamed on our YouTube channel, and past sermons stay available afterwards.',
  },
  {
    question: 'How do I get to know people here?',
    answer:
      'Join a small group. They meet during the week in homes across Kabuku — speak to any leader after a service and we will place you in one near you.',
  },
]

function FaqSection() {
  const [openQuestion, setOpenQuestion] = useState(null)

  return (
    <section id="faq" className="bg-white py-16 sm:py-20">
      {/* FAQPage structured data — makes these eligible for FAQ rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 data-reveal className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Frequently asked questions
        </h2>

        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq, index) => {
            const isOpen = openQuestion === faq.question
            const panelId = `faq-panel-${index}`

            return (
              <div key={faq.question} data-reveal style={{ transitionDelay: `${index * 60}ms` }}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span
                      className={`text-sm font-bold leading-snug transition-colors duration-200 sm:text-base ${
                        isOpen ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {faq.question}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                        isOpen ? 'rotate-180 text-red-700' : 'text-slate-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </h3>

                {/* 0fr → 1fr animates to the panel's natural height */}
                <div
                  id={panelId}
                  role="region"
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-10 text-sm leading-7 text-slate-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
