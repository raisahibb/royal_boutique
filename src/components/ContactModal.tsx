import React, { useState, useEffect } from 'react'
import { X, CheckCircle, Phone, MessageCircle, Mail } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

/* ─── Constants ─── */
const FONT = { fontFamily: 'Barlow, sans-serif' }
const SERIF = { fontFamily: "'Instrument Serif', serif" }

const MIN_MSG = 30
const MAX_MSG = 500

const inputBase =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm ' +
  'placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-rose-400/40 ' +
  'transition-all duration-200 hover:bg-white/[0.07]'

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`

/* ─── Types ─── */
interface Props {
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  name: string
  phone: string
  email: string
  subject: string
  message: string
}

const emptyForm = (user?: { name?: string; phone?: string; email?: string } | null): FormState => ({
  name: user?.name || '',
  phone: user?.phone || '',
  email: user?.email || '',
  subject: '',
  message: '',
})

/* ─── Component ─── */
export default function ContactModal({ isOpen, onClose }: Props) {
  const { user } = useAuth()

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm(user))

  /* Auto-fill when user or modal opens */
  useEffect(() => {
    if (user && isOpen && step === 'form') {
      setForm(prev => ({
        ...prev,
        name:  prev.name  || user.name  || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any).phone || '',
      }))
    }
  }, [user, isOpen, step])

  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* Escape key */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep('form')
        setIsSubmitting(false)
        setError('')
        setForm(emptyForm(user))
      }, 350)
      return () => clearTimeout(t)
    }
  }, [isOpen, user])

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setError('')
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedMsg = form.message.trim()
    if (trimmedMsg.length < MIN_MSG) {
      setError(`Message must be at least ${MIN_MSG} characters.`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await addDoc(collection(db, 'inquiries'), {
        userId:    user?.uid || null,
        name:      form.name.trim(),
        phone:     form.phone.trim(),
        email:     form.email.trim(),
        subject:   form.subject,
        message:   trimmedMsg,
        status:    'new',
        createdAt: serverTimestamp(),
      })
      setStep('success')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  /* ──────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
      style={{ animation: 'ctFadeIn 0.2s ease-out both' }}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        style={{ animation: 'ctFadeIn 0.2s ease-out both' }}
        onClick={onClose}
      />

      {/* ── Modal Card ── */}
      <div
        className={[
          'relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5',
          'bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]',
          'shadow-2xl shadow-black/50',
        ].join(' ')}
        style={{ animation: 'ctScaleUp 0.3s ease-out both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center
                     rounded-full bg-white/5 text-white/50 transition-colors
                     hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* ── Scrollable Inner ── */}
        <div className="ct-scroll max-h-[85vh] overflow-y-auto p-6 lg:p-8">

          {/* ══════════ SUCCESS STEP ══════════ */}
          {step === 'success' ? (
            <div
              className="flex flex-col items-center text-center py-2"
              style={{ animation: 'ctScaleUp 0.3s ease-out both' }}
            >
              {/* Animated check icon */}
              <div className="relative mb-6 mt-2">
                <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400 opacity-20 blur-xl" />
                <CheckCircle size={68} className="relative z-10 text-accent-muted" />
              </div>

              <h2 className="mb-1 text-2xl font-light text-white" style={FONT}>
                Thank You!
              </h2>
              <p className="text-sm text-white/60 px-2" style={FONT}>
                Your inquiry has been received successfully.
              </p>
              <p className="mt-1 mb-8 text-sm text-white/40 px-2" style={FONT}>
                Our team will get back to you within 24 hours.
              </p>

              {/* ── Quick Contact Cards ── */}
              <div className="w-full flex flex-col gap-3 mb-6">

                {/* Call */}
                <a
                  href="tel:+917009824615"
                  className="group flex items-center gap-3.5 w-full rounded-xl border border-white/10
                             bg-white/5 px-5 py-4 text-white transition-all duration-200
                             hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  style={FONT}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10
                                  group-hover:bg-white/15 transition-colors">
                    <Phone size={16} className="text-accent-muted" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] uppercase tracking-widest text-white/40 leading-none mb-0.5">Call Us</p>
                    <p className="text-sm font-medium">+91 70098 24615</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/917009824615"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3.5 w-full rounded-xl border border-green-500/20
                             bg-green-500/8 px-5 py-4 text-green-300 transition-all duration-200
                             hover:bg-green-500/15 hover:border-green-400/30
                             hover:shadow-[0_0_24px_rgba(34,197,94,0.12)]"
                  style={FONT}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15
                                  group-hover:bg-green-500/25 transition-colors">
                    <MessageCircle size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] uppercase tracking-widest text-green-400/60 leading-none mb-0.5">WhatsApp</p>
                    <p className="text-sm font-medium">Message Us Directly</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:sidhuc888@gmail.com"
                  className="group flex items-center gap-3.5 w-full rounded-xl border border-white/10
                             bg-white/5 px-5 py-4 text-white transition-all duration-200
                             hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  style={FONT}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10
                                  group-hover:bg-white/15 transition-colors">
                    <Mail size={16} className="text-rose-200/80" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] uppercase tracking-widest text-white/40 leading-none mb-0.5">Email Us</p>
                    <p className="text-sm font-medium">sidhuc888@gmail.com</p>
                  </div>
                </a>

              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm
                           text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                style={FONT}
              >
                Close Modal
              </button>
            </div>

          ) : (
          /* ══════════ FORM STEP ══════════ */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full
                                border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                  <span className="text-xl italic text-white" style={SERIF}>RB</span>
                </div>
                <h2 className="text-2xl font-light tracking-tight text-white" style={FONT}>
                  Get In Touch
                </h2>
                <p className="mt-1.5 text-sm text-white/50" style={FONT}>
                  Our team will respond within 24 hours
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3
                                text-center text-sm text-red-400"
                     style={FONT}>
                  {error}
                </div>
              )}

              {/* Full Name */}
              <input
                required
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={update('name')}
                className={inputBase}
                style={FONT}
              />

              {/* Phone + Email grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  type="tel"
                  placeholder="Phone (+91 XXXXX XXXXX)"
                  value={form.phone}
                  onChange={update('phone')}
                  className={inputBase}
                  style={FONT}
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={update('email')}
                  className={inputBase}
                  style={FONT}
                />
              </div>

              {/* Subject dropdown */}
              <select
                required
                value={form.subject}
                onChange={update('subject')}
                className={`${inputBase} cursor-pointer appearance-none`}
                style={{
                  ...FONT,
                  backgroundImage: CHEVRON_SVG,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                }}
              >
                <option value="" disabled className="bg-[#262b31]">Select a Subject</option>
                <option className="bg-[#262b31]">General Inquiry</option>
                <option className="bg-[#262b31]">Product Customization / Personal Styling</option>
                <option className="bg-[#262b31]">Wholesale / Bulk Orders</option>
                <option className="bg-[#262b31]">Appointment Related</option>
                <option className="bg-[#262b31]">Feedback / Suggestion</option>
                <option className="bg-[#262b31]">Other</option>
              </select>

              {/* Message + character counter */}
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  maxLength={MAX_MSG}
                  placeholder={`Your message (min ${MIN_MSG} characters)...`}
                  value={form.message}
                  onChange={update('message')}
                  className={`${inputBase} resize-none pb-7`}
                  style={FONT}
                />
                {/* Counter — turns amber when close, red when at limit */}
                <span
                  className={[
                    'absolute bottom-3 right-4 text-[10px] transition-colors',
                    form.message.length >= MAX_MSG
                      ? 'text-red-400'
                      : form.message.length >= MAX_MSG * 0.8
                      ? 'text-rose-400/70'
                      : 'text-white/25',
                  ].join(' ')}
                  style={FONT}
                >
                  {form.message.length} / {MAX_MSG}
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={[
                  'w-full rounded-xl py-4 font-medium tracking-wide transition-all duration-200',
                  'bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] text-[#171717]',
                  'shadow-lg shadow-white/10',
                  isSubmitting
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:from-white hover:to-[#f0f0f0] hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
                ].join(' ')}
                style={FONT}
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </button>

              {/* Divider hint */}
              <div className="text-center">
                <span className="text-[10px] tracking-widest text-white/15">• • •</span>
                <p className="mt-1 text-[11px] text-white/25" style={FONT}>
                  We'll reach out via phone or email
                </p>
              </div>

            </form>
          )}
        </div>
      </div>

      {/* ── Animations ── */}
      <style>{`
        @keyframes ctFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes ctScaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(8px) }
          to   { opacity: 1; transform: scale(1)    translateY(0)   }
        }
        .ct-scroll::-webkit-scrollbar { width: 5px }
        .ct-scroll::-webkit-scrollbar-track { background: transparent }
        .ct-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px }
        .ct-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15) }
        .ct-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent }
      `}</style>
    </div>
  )
}
