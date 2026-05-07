import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

const inputBase =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm ' +
  'placeholder:text-white/30 focus:outline-none focus:bg-white/8 focus:border-white/25 ' +
  'transition-all duration-200 hover:bg-white/[0.07] autofill:bg-white/5'

/* ── Google SVG icon ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup, onLoginSuccess }) {
  const { login, googleLogin, resendVerification } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

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
        setEmail('')
        setPassword('')
        setError('')
        setLoading(false)
        setGLoading(false)
        setShowPass(false)
      }, 300)
    }
  }, [isOpen])

  /* ── Email / password login ── */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise((r) => setTimeout(r, 400)) // feel of async latency
    const result = await login(email, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
    } else {
      onClose()
      onLoginSuccess?.()
    }
  }

  /* ── Google login ── */
  async function handleGoogle() {
    setError('')
    setGLoading(true)
    const result = await googleLogin()
    setGLoading(false)

    if (!result.ok) {
      setError(result.error)
    } else {
      onClose()
      onLoginSuccess?.()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-6"
      style={{ animation: 'loginFadeIn 0.22s ease-out both' }}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        style={{ animation: 'loginFadeIn 0.2s ease-out both' }}
        onClick={onClose}
      />

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]
                   border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'loginSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient accent */}
        <div className="w-full h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />

        {/* Close button */}
        <button
          id="login-modal-close"
          onClick={onClose}
          aria-label="Close login modal"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10
                     flex items-center justify-center text-white/40 hover:text-white/80
                     transition-all duration-200 cursor-pointer"
        >
          <X size={15} />
        </button>

        <div className="px-8 pt-8 pb-8 flex flex-col gap-6">

          {/* ── Header ── */}
          <div className="text-center space-y-1 pr-4">
            <h2
              className="text-2xl font-light text-white tracking-tight"
              style={FONT}
            >
              Welcome Back
            </h2>
            <p className="text-sm text-white/50" style={FONT}>
              Sign in to continue to Royal Boutique
            </p>
          </div>

          {/* ── Google button ── */}
          <button
            id="login-google-btn"
            type="button"
            onClick={handleGoogle}
            disabled={loading || gLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90
                       text-[#1a1a1a] text-sm font-medium py-3 rounded-xl
                       border border-white/10 shadow-md shadow-black/20
                       transition-all duration-200 cursor-pointer
                       hover:shadow-lg hover:shadow-black/30 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={FONT}
          >
            {gLoading
              ? <Loader2 size={16} className="animate-spin text-[#555]" />
              : <GoogleIcon />
            }
            {gLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* ── "or" divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/25 text-xs tracking-widest" style={FONT}>or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── Email / Password form ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>

            <input
              id="login-email"
              required
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              style={FONT}
              autoComplete="email"
            />

            <div className="relative">
              <input
                id="login-password"
                required
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputBase} pr-12`}
                style={FONT}
                autoComplete="current-password"
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

            {/* Error message */}
            {error && (
              <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-center">
                <span className="text-red-400 text-xs leading-relaxed" style={FONT}>
                  {error}
                </span>
                {error.includes('verify') && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true)
                        await resendVerification(email, password)
                        setError('Verification email resent. Please check your inbox.')
                      } catch (err) {
                        setError('Failed to resend. Check credentials or try again later.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="text-rose-400 hover:text-accent text-xs underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || gLoading}
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
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : 'Continue'
              }
            </button>

          </form>

          {/* ── Footer ── */}
          <p className="text-center text-sm text-white/35 -mt-1" style={FONT}>
            Don't have an account?{' '}
            <button
              id="login-switch-signup"
              type="button"
              onClick={onSwitchToSignup}
              className="text-white/70 hover:text-white font-medium
                         underline underline-offset-2 transition-colors duration-150 cursor-pointer"
            >
              Sign up
            </button>
          </p>

        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
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
