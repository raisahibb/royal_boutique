import React, { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

const inputBase =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm ' +
  'placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 ' +
  'transition-all duration-200 hover:bg-white/[0.07]'

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOccasion?: string;
}

export interface FormState {
  name: string;
  phone: string;
  email: string;
  date: string;
  occasion: string;
  message: string;
}

export default function AppointmentModal({ isOpen, onClose, defaultOccasion }: AppointmentModalProps) {
  const { user } = useAuth()
  const [success, setSuccess] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', email: '', date: '', occasion: defaultOccasion || '', message: '',
  })

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* ── Escape key ── */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* ── Reset form on close / seed defaultOccasion on open ── */
  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({ ...prev, occasion: defaultOccasion || prev.occasion }))
    } else {
      setTimeout(() => {
        setSuccess(false)
        setIsSubmitting(false)
        setError('')
        setForm({ name: '', phone: '', email: '', date: '', occasion: '', message: '' })
      }, 300)
    }
  }, [isOpen, defaultOccasion])

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user?.uid || null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        date: form.date,
        occasion: form.occasion,
        message: form.message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      })
      setSuccess(true)
    } catch (err: any) {
      console.error('[Appointment] Submit error:', err)
      setError('Failed to book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Don't render anything in DOM when closed ── */
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
      style={{ animation: 'apptFadeIn 0.2s ease-out both' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        style={{ animation: 'backdropFadeIn 0.2s ease-out both' }}
        onClick={onClose} 
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] border border-white/5 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        style={{ animation: 'apptScaleUp 0.3s ease-out both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient accent */}
        <div className="w-full h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 
                     flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Scrollable content */}
        <div className="custom-scroll max-h-[80vh] overflow-y-auto p-6 lg:p-8">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 text-center py-6">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-400 blur-xl opacity-20 rounded-full" />
                <CheckCircle size={56} className="text-white/80 relative z-10 mt-2" />
              </div>
              <h2 className="text-white text-xl font-light mt-2" style={FONT}>
                Appointment Confirmed!
              </h2>
              <p className="text-white/50 text-sm" style={FONT}>
                We'll contact you within 24 hours.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full max-w-xs bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] hover:from-white hover:to-[#f0f0f0]
                           text-[#171717] font-medium tracking-wide py-3.5 rounded-xl
                           shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20
                           transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                style={FONT}
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Header */}
              <div className="text-center mb-2">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <span className="text-white font-serif italic text-xl">RB</span>
                </div>
                <h2 className="text-2xl text-white font-light tracking-tight" style={FONT}>
                  Book an Appointment
                </h2>
                <p className="text-sm text-white/50 leading-relaxed mt-2 max-w-xs mx-auto" style={FONT}>
                  Our stylists will help you find the perfect outfit
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center" style={FONT}>
                  {error}
                </div>
              )}

              {/* Your Details */}
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3" style={FONT}>
                  Your Details
                </p>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={update('name')}
                      className={inputBase}
                      style={FONT}
                    />
                    <input
                      required
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={form.phone}
                      onChange={update('phone')}
                      className={inputBase}
                      style={FONT}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={update('email')}
                    className={inputBase}
                    style={FONT}
                  />
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={update('date')}
                    className={inputBase}
                    style={{ ...FONT, colorScheme: 'dark' }}
                  />
                  <select
                    required
                    value={form.occasion}
                    onChange={update('occasion')}
                    className={`${inputBase} cursor-pointer appearance-none`}
                    style={{ ...FONT, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Select Occasion</option>
                    <option className="bg-[#1a1a1a]">Custom Measurements / Personal Styling</option>
                    <option className="bg-[#1a1a1a]">Wedding</option>
                    <option className="bg-[#1a1a1a]">Festival</option>
                    <option className="bg-[#1a1a1a]">Engagement</option>
                    <option className="bg-[#1a1a1a]">Birthday</option>
                    <option className="bg-[#1a1a1a]">Casual Styling</option>
                    <option className="bg-[#1a1a1a]">Other</option>
                  </select>
                  <textarea
                    rows={3}
                    placeholder="Any specific requirements..."
                    value={form.message}
                    onChange={update('message')}
                    className={`${inputBase} resize-none min-h-[100px]`}
                    style={FONT}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] hover:from-white hover:to-[#f0f0f0]
                           text-[#171717] font-medium tracking-wide py-4 rounded-xl
                           shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20
                           transform transition-all duration-200
                           ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}`}
                style={FONT}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>

              <div className="text-center mt-2 flex flex-col items-center gap-2">
                <span className="text-white/20 text-[10px] tracking-widest">• • •</span>
                <p className="text-xs text-white/30" style={FONT}>
                  We'll call you within 24 hours
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        @keyframes apptFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes apptScaleUp {
          from { opacity: 0; transform: scale(0.95) }
          to   { opacity: 1; transform: scale(1)    }
        }
      `}</style>
    </div>
  )
}
