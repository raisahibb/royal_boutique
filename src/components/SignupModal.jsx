import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

const inputBase =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm ' +
  'placeholder:text-white/30 focus:outline-none focus:bg-white/8 focus:border-white/25 ' +
  'transition-all duration-200 hover:bg-white/[0.07]'

/* ── Simple password-strength bar ── */
function StrengthBar({ password }) {
  const score = (() => {
    if (!password) return 0
    let s = 0
    if (password.length >= 6)  s++
    if (password.length >= 10) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-400', 'bg-green-400']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']

  if (!password) return null

  return (
    <div className="flex items-center gap-2 px-0.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] text-white/40 w-16 text-right" style={FONT}>
        {labels[score]}
      </span>
    </div>
  )
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin, onSignupSuccess }) {
  const { signup, resendVerification } = useAuth()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
  })
  const [showPass,    setShowPass]    = useState(false)
  const [showConf,    setShowConf]    = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [step,        setStep]        = useState('form') // 'form' | 'verification'
  const [resendTimer, setResendTimer] = useState(60)

  // Timer countdown
  useEffect(() => {
    let interval
    if (step === 'verification' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  const set = (field) => (e) => {
    setError('')
    setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  /* ── Body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* ── Escape key ── */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* ── Reset on close ── */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setForm({ name: '', email: '', phone: '', password: '', confirm: '' })
        setError('')
        setLoading(false)
        setStep('form')
        setResendTimer(60)
        setShowPass(false)
        setShowConf(false)
      }, 300)
    }
  }, [isOpen])

  /* ── Validation ── */
  function validate() {
    if (!form.name.trim())
      return 'Full name is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return 'Enter a valid email address.'
    if (!/^\+?[\d\s\-]{10,15}$/.test(form.phone.replace(/\s/g, '')))
      return 'Enter a valid phone number.'
    if (form.password.length < 6)
      return 'Password must be at least 6 characters.'
    if (form.password !== form.confirm)
      return 'Passwords do not match.'
    return null
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 450))

    const result = await signup(form.name, form.email, form.phone, form.password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
    } else {
      setStep('verification')
      setResendTimer(60)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    try {
      await resendVerification(form.email, form.password)
      setResendTimer(60)
    } catch (err) {
      console.error(err)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-6"
      style={{ animation: 'signupFadeIn 0.22s ease-out both' }}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]
                   border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'signupSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient accent — matches AppointmentModal */}
        <div className="w-full h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />

        {/* Close button */}
        <button
          id="signup-modal-close"
          onClick={onClose}
          aria-label="Close signup modal"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10
                     flex items-center justify-center text-white/40 hover:text-white/80
                     transition-all duration-200 cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* ── Scrollable body ── */}
        <div className="signup-scroll max-h-[88vh] overflow-y-auto px-8 pt-8 pb-8 flex flex-col gap-5">

          {step === 'verification' ? (
            /* ── Verification screen ── */
            <div className="flex flex-col items-center py-8 px-6 text-center" style={{ animation: 'signupFadeIn 0.3s ease-out both' }}>
              <div className="relative text-white mb-4 mt-2">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                <Mail size={56} strokeWidth={1.5} className="relative z-10" />
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-400 rounded-full border-2 border-[#121212] animate-pulse z-20" />
              </div>
              
              <h2 className="text-2xl font-light text-white mb-2" style={FONT}>
                Verify Your Email
              </h2>
              
              <p className="text-white/60 text-sm mb-1" style={FONT}>
                We've sent a verification link to
              </p>
              <p className="text-white font-medium mb-6 break-all tracking-wide" style={FONT}>
                {form.email}
              </p>
              
              <div className="w-full max-w-xs mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/60 text-xs leading-relaxed" style={FONT}>
                  <span className="font-bold tracking-wide text-white/80">Can't find the email?</span><br/>
                  Check your <span className="font-medium underline decoration-white/30 underline-offset-2">SPAM</span> or <span className="font-medium underline decoration-white/30 underline-offset-2">JUNK</span> folder
                </p>
              </div>
              
              <div className="mb-4 flex flex-col gap-3 w-full items-center text-center">
                {resendTimer > 0 ? (
                  <span className="text-white/40 text-sm font-medium tracking-wide" style={FONT}>
                    Resend in <span className="text-white/80 font-mono">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-white/70 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors cursor-pointer"
                    style={FONT}
                  >
                    Resend verification email
                  </button>
                )}
              </div>
              
              <p className="text-white/30 text-xs mt-4 tracking-wide" style={FONT}>
                You must verify your email to use your account
              </p>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div className="text-center space-y-1 pr-4">
                <h2 className="text-2xl font-light text-white tracking-tight" style={FONT}>
                  Create Account
                </h2>
                <p className="text-sm text-white/50" style={FONT}>
                  Join Royal Boutique
                </p>
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

                {/* Full Name */}
                <input
                  id="signup-name"
                  required
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={set('name')}
                  className={inputBase}
                  style={FONT}
                  autoComplete="name"
                />

                {/* Email */}
                <input
                  id="signup-email"
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={set('email')}
                  className={inputBase}
                  style={FONT}
                  autoComplete="email"
                />

                {/* Phone */}
                <input
                  id="signup-phone"
                  required
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={form.phone}
                  onChange={set('phone')}
                  className={inputBase}
                  style={FONT}
                  autoComplete="tel"
                />

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <input
                      id="signup-password"
                      required
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={form.password}
                      onChange={set('password')}
                      className={`${inputBase} pr-12`}
                      style={FONT}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25
                                 hover:text-white/60 transition-colors duration-150 cursor-pointer"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  <StrengthBar password={form.password} />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    id="signup-confirm"
                    required
                    type={showConf ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    className={`${inputBase} pr-12 ${
                      form.confirm && form.confirm !== form.password
                        ? 'border-red-500/40 focus:border-red-500/50'
                        : form.confirm && form.confirm === form.password
                        ? 'border-green-500/40 focus:border-green-500/50'
                        : ''
                    }`}
                    style={FONT}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf((p) => !p)}
                    tabIndex={-1}
                    aria-label={showConf ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25
                               hover:text-white/60 transition-colors duration-150 cursor-pointer"
                  >
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Inline confirm match hint */}
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-red-400/80 text-xs px-0.5 -mt-1" style={FONT}>
                    Passwords do not match
                  </p>
                )}

                {/* Error block */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                    <span className="text-red-400 text-xs leading-relaxed" style={FONT}>
                      {error}
                    </span>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 mt-1
                             bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] hover:from-white hover:to-[#f0f0f0]
                             text-[#171717] font-semibold tracking-wide py-3.5 rounded-xl text-sm
                             shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20
                             transform hover:scale-[1.02] active:scale-[0.98]
                             transition-all duration-200 cursor-pointer
                             disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  style={FONT}
                >
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Creating Account…</>
                    : 'Create Account'
                  }
                </button>

              </form>

              {/* ── Footer ── */}
              <p className="text-center text-sm text-white/35 -mt-1" style={FONT}>
                Already have an account?{' '}
                <button
                  id="signup-switch-login"
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-white/70 hover:text-white font-medium
                             underline underline-offset-2 transition-colors duration-150 cursor-pointer"
                >
                  Log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes signupFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes signupSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
        }
        .signup-scroll::-webkit-scrollbar { width: 4px; }
        .signup-scroll::-webkit-scrollbar-track { background: transparent; }
        .signup-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(255,255,255,0.05) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
        }
      `}</style>
    </div>
  )
}
