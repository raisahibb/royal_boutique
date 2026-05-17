import { useEffect, useRef } from 'react'
import {
  CheckCircle2, ShoppingBag, ArrowRight, Phone,
  MessageCircle, Package, Copy, Sparkles
} from 'lucide-react'

const FONT = { fontFamily: 'Barlow, sans-serif' }

/* ── Confetti particle ── */
function Particle({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />
}

/* ── Generate confetti particles ── */
function Confetti() {
  const colors = [
    '#fde68a', '#f9a8d4', '#c4b5fd', '#6ee7b7',
    '#93c5fd', '#fca5a5', '#fdba74', '#a5f3fc',
  ]
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    width: `${Math.random() * 6 + 4}px`,
    height: `${Math.random() * 6 + 4}px`,
    backgroundColor: colors[i % colors.length],
    animationDelay: `${Math.random() * 0.8}s`,
    animationDuration: `${Math.random() * 1.5 + 1}s`,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <Particle
          key={p.id}
          style={{
            left: p.left,
            top: '-10px',
            width: p.width,
            height: p.height,
            backgroundColor: p.backgroundColor,
            animation: `confettiFall ${p.animationDuration} ease-in ${p.animationDelay} forwards`,
          }}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ORDER SUCCESS PAGE
══════════════════════════════════════════════════════ */
export default function OrderSuccess({
  orderId,
  razorpayPaymentId,
  total,
  items = [],
  requiresCustomMeasurement = false,
  onContinueShopping,
  onViewOrders,
}) {
  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
  const shortId = orderId ? orderId.slice(-8).toUpperCase() : '—'
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [])

  function copyOrderId() {
    navigator.clipboard.writeText(orderId || '').catch(() => {})
    // Tiny feedback via title flick — no extra state needed
  }

  const whatsappMsg = encodeURIComponent(
    `Hi! I just placed an order on Royal Boutique.\nOrder ID: ${orderId}\nPayment ID: ${razorpayPaymentId || 'N/A'}\n\nI need custom measurements for my order. Please guide me further.`
  )

  return (
    <div
      ref={scrollRef}
      className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] px-4 py-10 relative overflow-y-auto"
    >
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300 z-50" />

      <Confetti />

      <div className="max-w-xl mx-auto relative z-10">

        {/* ── Success Icon + Brand ── */}
        <div className="flex flex-col items-center text-center mb-8 pt-6">
          <div className="relative mb-5">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(253,230,138,0.15) 0%, rgba(249,168,212,0.15) 50%, rgba(196,181,253,0.15) 100%)',
                border: '1px solid rgba(253,230,138,0.25)',
                animation: 'successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}
            >
              <CheckCircle2 size={48} className="text-amber-200" strokeWidth={1.5} />
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 40px rgba(253,230,138,0.2)',
                animation: 'glowPulse 2s ease-in-out infinite',
              }}
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-amber-200/60" />
            <span
              className="text-xs uppercase tracking-[0.3em] text-amber-200/60 font-medium"
              style={FONT}
            >
              Order Confirmed
            </span>
            <Sparkles size={14} className="text-amber-200/60" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-light text-white mb-2 tracking-wide"
            style={FONT}
          >
            Thank you!
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs" style={FONT}>
            Your order has been placed successfully. You'll receive updates shortly.
          </p>
        </div>

        {/* ── Order Details Card ── */}
        <div
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4"
          style={{ animation: 'coFadeIn 0.5s ease-out 0.2s both' }}
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />
          <div className="p-5 space-y-4">

            {/* Order ID row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1" style={FONT}>
                  Order ID
                </p>
                <p className="text-white font-mono text-sm font-medium tracking-wider">
                  #{shortId}
                </p>
              </div>
              <button
                onClick={copyOrderId}
                title="Copy full order ID"
                className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors cursor-pointer text-xs"
                style={FONT}
              >
                <Copy size={13} /> Copy
              </button>
            </div>

            {/* Payment ID */}
            {razorpayPaymentId && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1" style={FONT}>
                  Payment Reference
                </p>
                <p className="text-white/60 font-mono text-xs">{razorpayPaymentId}</p>
              </div>
            )}

            {/* Total paid */}
            <div className="flex items-center justify-between pt-3 border-t border-white/8">
              <span className="text-white/50 text-sm" style={FONT}>Amount Paid</span>
              <span
                className="text-xl font-semibold text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #fde68a, #f9a8d4)',
                  ...FONT,
                }}
              >
                {fmt(total)}
              </span>
            </div>

            {/* Item count */}
            {items.length > 0 && (
              <div className="flex items-center gap-2 text-white/40 text-xs" style={FONT}>
                <Package size={13} />
                {items.length} item{items.length > 1 ? 's' : ''} · Free Shipping
              </div>
            )}
          </div>
        </div>

        {/* ── Custom Measurements Banner ── */}
        {requiresCustomMeasurement && (
          <div
            className="rounded-2xl border border-amber-200/25 mb-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(253,230,138,0.06) 0%, rgba(249,168,212,0.06) 100%)',
              animation: 'coFadeIn 0.5s ease-out 0.4s both',
            }}
          >
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-200/60 via-rose-300/60 to-purple-300/60" />
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-amber-200 text-xl mt-0.5">✦</span>
                <div>
                  <p className="text-amber-200 text-sm font-semibold mb-1" style={FONT}>
                    Custom Measurements Required
                  </p>
                  <p className="text-amber-200/60 text-xs leading-relaxed" style={FONT}>
                    One or more items in your order require custom measurements. Our expert stylist will
                    contact you within 24 hours. You can also reach us directly below.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/917009824615?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl
                    bg-green-600/80 hover:bg-green-600 py-3 text-sm font-semibold text-white
                    transition-all duration-200 cursor-pointer"
                  style={FONT}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.126 1.525 5.865L0 24l6.292-1.493A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.82 9.82 0 01-4.962-1.34l-.355-.212-3.688.875.938-3.57-.232-.367A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  WhatsApp Us
                </a>
                <a
                  href="tel:+917009824615"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl
                    border border-white/15 hover:bg-white/5 py-3 text-sm text-white/70
                    hover:text-white transition-all duration-200 cursor-pointer"
                  style={FONT}
                >
                  <Phone size={15} /> Call Us
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA Buttons ── */}
        <div
          className="space-y-3"
          style={{ animation: 'coFadeIn 0.5s ease-out 0.5s both' }}
        >
          <button
            onClick={onViewOrders}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
              bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300
              hover:from-amber-100 hover:via-rose-200 hover:to-purple-200
              text-[#1a1a1a] font-semibold text-sm transition-all duration-200 cursor-pointer
              shadow-lg shadow-black/20"
            style={FONT}
          >
            <ShoppingBag size={16} /> View My Orders
          </button>
          <button
            onClick={onContinueShopping}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
              border border-white/10 text-white/50 hover:text-white hover:border-white/20
              text-sm transition-all duration-200 cursor-pointer"
            style={FONT}
          >
            Continue Shopping <ArrowRight size={14} />
          </button>
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-white/20 text-[10px] mt-8 tracking-widest uppercase" style={FONT}>
          © 2025 Royal Boutique · All orders are subject to availability
        </p>
      </div>

      <style>{`
        @keyframes successPop {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes confettiFall {
          from { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          to   { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes coFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
