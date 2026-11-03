import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Seo from './Seo'
import api, { apiErrorMessage } from '../redux/api'

const PAYBILL_NUMBER = '6024133'

const CONTRIBUTION_TYPES = [
  { value: 'tithe', label: 'Tithe', description: 'Your faithful tenth, given as first-fruits.' },
  { value: 'offering', label: 'Offering', description: 'A freewill gift above your tithe.' },
  { value: 'donation', label: 'Donation', description: 'Support a church project, missions or the building fund.' },
  { value: 'other', label: 'Other', description: 'Harambee, special appeals or anything else. Please tell us what it is for.' },
]

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000]

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20'
const labelClass = 'block text-sm font-semibold text-slate-700'

function Giving() {
  const [type, setType] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [stkResult, setStkResult] = useState(null) // { ok, message }

  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null) // { status, message }
  const [copied, setCopied] = useState(false)

  // Auto-verification polling
  const [pollState, setPollState] = useState(null) // null | 'polling' | 'success' | 'failed' | 'timeout'
  const [pollDetails, setPollDetails] = useState(null)
  const [pollSeconds, setPollSeconds] = useState(60)
  const pollTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    return () => stopPolling()
  }, [])

  const startPolling = (checkoutId) => {
    stopPolling()
    setPollState('polling')
    setPollSeconds(60)

    countdownTimerRef.current = setInterval(() => {
      setPollSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)

    let attempts = 0
    const maxAttempts = 18 // ~60 seconds with 3.5s interval

    pollTimerRef.current = setInterval(async () => {
      attempts += 1
      try {
        const { data } = await api.get('/api/v1/payment/status', {
          params: { checkout_request_id: checkoutId },
        })

        if (data.status === 'success') {
          stopPolling()
          setPollState('success')
          setPollDetails(data)
          if (data.transaction_id) {
            setCode(data.transaction_id)
          }
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          stopPolling()
          setPollState('failed')
          setPollDetails(data)
        } else if (attempts >= maxAttempts) {
          stopPolling()
          setPollState('timeout')
        }
      } catch {
        if (attempts >= maxAttempts) {
          stopPolling()
          setPollState('timeout')
        }
      }
    }, 3500)
  }

  const selected = CONTRIBUTION_TYPES.find((t) => t.value === type)
  const amountNumber = parseInt(amount, 10)
  const needsNote = type === 'other'
  const canSend =
    type && phone.trim().length >= 9 && amountNumber >= 1 && (!needsNote || note.trim()) && !sending && pollState !== 'polling'

  const handleSend = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setSending(true)
    setStkResult(null)
    setPollState(null)
    setPollDetails(null)
    try {
      const response = await api.post('/api/v1/payment', {
        phone: phone.replace(/\D/g, ''),
        amount: amountNumber,
        contribution_type: type,
        note: needsNote ? note.trim() : undefined,
      })
      const checkoutId = response.data.checkout_request_id
      setStkResult({ ok: true, message: response.data.message })
      if (checkoutId) {
        startPolling(checkoutId)
      }
    } catch (error) {
      setStkResult({ ok: false, message: apiErrorMessage(error, 'Payment request failed. Please try again.') })
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!clean) return
    setChecking(true)
    setVerifyResult(null)
    try {
      const { data } = await api.get('/api/v1/payment/verify', { params: { code: clean } })
      if (data.status === 'success') {
        const label = CONTRIBUTION_TYPES.find((t) => t.value === data.contribution_type)?.label
        setVerifyResult({
          status: 'success',
          message: `We have received your payment of KES ${Number(data.amount).toLocaleString()}${label ? ` (${label})` : ''}. Thank you, God bless you.`,
        })
      } else if (data.status === 'failed') {
        setVerifyResult({
          status: 'problem',
          message: 'That payment did not go through. If money left your account, keep your M-PESA message and contact the church office.',
        })
      } else {
        setVerifyResult({
          status: 'problem',
          message: 'We could not find that payment yet. Check the code against your M-PESA message and try again in a minute. If you were charged, contact the church office and quote the code.',
        })
      }
    } catch (error) {
      setVerifyResult({
        status: 'problem',
        message: apiErrorMessage(error, 'We could not check that code right now. Please try again shortly or contact the church office.'),
      })
    } finally {
      setChecking(false)
    }
  }

  const copyPaybill = async () => {
    try {
      await navigator.clipboard.writeText(PAYBILL_NUMBER)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable; the number is visible to copy by hand.
    }
  }

  return (
    <main className="page-offset bg-slate-50 font-sans text-slate-900">
      <Seo page="giving" title="Give — Support AIC Kabuku Church" path="/giving" />

      <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Give</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Choose what you are giving towards, then pay with M-PESA. Thank you for your faithfulness.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {/* ── Contribution type ── */}
          <div>
            <label htmlFor="giving-type" className={labelClass}>I am giving</label>
            <select
              id="giving-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a category</option>
              {CONTRIBUTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {selected && <p className="mt-1.5 text-xs text-slate-500">{selected.description}</p>}
          </div>

          {needsNote && (
            <div className="mt-4">
              <label htmlFor="giving-note" className={labelClass}>What is this for?</label>
              <input
                id="giving-note"
                type="text"
                maxLength={200}
                placeholder="e.g. Harambee for the new roof"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* ── STK push ── */}
          <form onSubmit={handleSend} className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold">Pay with M-PESA prompt</h2>

            <div className="mt-4">
              <label htmlFor="giving-phone" className={labelClass}>M-PESA phone number</label>
              <input
                id="giving-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="giving-amount" className={labelClass}>Amount (KES)</label>
              <input
                id="giving-amount"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
              <div className="mt-2.5 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((qa) => (
                  <button
                    key={qa}
                    type="button"
                    onClick={() => setAmount(String(qa))}
                    className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition ${
                      amount === String(qa)
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {qa.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSend}
              className="mt-5 w-full rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending
                ? 'Sending prompt…'
                : pollState === 'polling'
                ? `Awaiting M-PESA confirmation (${pollSeconds}s)…`
                : amountNumber >= 1
                ? `Send prompt for KES ${amountNumber.toLocaleString()}`
                : 'Send M-PESA prompt'}
            </button>

            <div role="status" aria-live="polite">
              {stkResult && !pollState && (
                <p
                  className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                    stkResult.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {stkResult.message}
                </p>
              )}

              {/* Polling: waiting for PIN */}
              {pollState === 'polling' && (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/90 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="relative mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-600"></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sky-950">
                          Enter your M-PESA PIN on your phone
                        </h3>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-sky-800">
                          {pollSeconds}s
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-sky-800 leading-relaxed">
                        Prompt sent to <span className="font-semibold">{phone}</span> for <span className="font-semibold">KES {amountNumber.toLocaleString()}</span>. Check your screen and enter your PIN.
                      </p>
                      <div className="mt-2.5 flex items-center justify-between border-t border-sky-200/60 pt-2 text-xs text-sky-700">
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          Auto-checking payment status…
                        </span>
                        <button
                          type="button"
                          onClick={stopPolling}
                          className="font-medium underline hover:text-sky-950"
                        >
                          Stop checking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success */}
              {pollState === 'success' && (
                <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-900">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-emerald-950">
                        Payment Confirmed! 🎉
                      </h3>
                      <p className="mt-1 text-xs text-emerald-800 sm:text-sm">
                        We received your {CONTRIBUTION_TYPES.find((t) => t.value === pollDetails?.contribution_type)?.label || 'contribution'} of <span className="font-bold">KES {Number(pollDetails?.amount || amountNumber).toLocaleString()}</span>.
                        Thank you for your generosity, God bless you!
                      </p>
                      {pollDetails?.transaction_id && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-emerald-700">Receipt:</span>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-900">
                            {pollDetails.transaction_id}
                          </span>
                        </div>
                      )}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPollState(null)
                            setStkResult(null)
                            setAmount('')
                            setPhone('')
                            setNote('')
                          }}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                        >
                          Make another contribution
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed / Cancelled */}
              {pollState === 'failed' && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <div className="flex items-start gap-3">
                    <span className="text-lg leading-none">⚠️</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-950">Payment Not Completed</h3>
                      <p className="mt-1 text-xs text-red-800">
                        {pollDetails?.result_description || 'Payment was cancelled or failed on your phone. Please try again.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPollState(null)}
                        className="mt-2.5 text-xs font-semibold text-red-700 underline hover:text-red-900"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeout after 60s */}
              {pollState === 'timeout' && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex items-start gap-3">
                    <span className="text-lg leading-none">⏱️</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-950">Still Awaiting M-PESA Confirmation</h3>
                      <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                        If you entered your PIN and money was deducted, your payment is safe! M-PESA sometimes takes a few extra moments to process. Once you receive your confirmation SMS, you can verify your receipt code below.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPollState(null)
                          document.getElementById('giving-code')?.focus()
                        }}
                        className="mt-2.5 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                      >
                        Verify with code below ↓
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* ── Paybill ── */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold">Or pay by paybill</h2>
            <p className="mt-1 text-sm text-slate-600">
              On your phone go to M-PESA, Lipa na M-PESA, Paybill, then enter:
            </p>
            <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Business number</dt>
                <dd className="flex items-center gap-3 font-bold tabular-nums">
                  {PAYBILL_NUMBER}
                  <button
                    type="button"
                    onClick={copyPaybill}
                    className="text-xs font-semibold text-red-700 hover:underline"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-slate-500">Account number</dt>
                <dd className="font-bold">Your full name</dd>
              </div>
            </dl>

            {/* ── Verify paybill payment ── */}
            <form onSubmit={handleVerify} className="mt-5">
              <label htmlFor="giving-code" className={labelClass}>Paid already? Enter your M-PESA code</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="giving-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={12}
                  placeholder="e.g. SGL4X7K2PQ"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm uppercase text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
                <button
                  type="submit"
                  disabled={!code.trim() || checking}
                  className="shrink-0 rounded-lg border border-red-700 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checking ? 'Checking…' : 'Verify'}
                </button>
              </div>
              <div role="status" aria-live="polite">
                {verifyResult && (
                  <p
                    className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                      verifyResult.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    {verifyResult.message}
                    {verifyResult.status !== 'success' && (
                      <>
                        {' '}
                        <Link to="/contact" className="font-semibold underline">Contact us</Link>
                      </>
                    )}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Giving