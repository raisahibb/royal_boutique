import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft, MapPin, Plus, Trash2, Edit2, Check,
  ShoppingBag, Shield, Truck, ChevronRight, Lock, Phone, Calendar
} from 'lucide-react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import AddressForm, { emptyAddr } from './AddressForm'
import AppointmentModal from './AppointmentModal'
import OrderSuccess from './OrderSuccess'

/* ── API base URL — empty string = relative (dev proxy), or Railway URL in prod ── */
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/* ── Load Razorpay checkout script dynamically ── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const FONT = { fontFamily: 'Barlow, sans-serif' }
const SHIPPING_FEE = 0 // Free shipping

const inputCls = `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
  text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all`

/* ── Step indicator ── */
function StepBar({ step }) {
  const steps = ['Cart Review', 'Shipping', 'Payment']
  return (
    <div className="flex items-center justify-center mb-8 sm:mb-12 pt-4 px-2">
      {steps.map((label, i) => {
        const s = i + 1
        const active = step === s
        const done = step > s
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center relative">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300
                ${active ? 'bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300 text-[#1a1a1a] shadow-[0_0_20px_rgba(253,230,138,0.3)] scale-110' :
                  done ? 'bg-accent-tint text-accent border border-accent-glow' :
                  'bg-white/5 text-white/30 border border-white/10'}`} style={FONT}>
                {done ? <Check size={14} className="sm:w-4 sm:h-4" /> : s}
              </div>
              <span className={`absolute -bottom-6 text-[10px] sm:text-xs whitespace-nowrap font-medium transition-colors duration-300
                ${active ? 'text-accent' : done ? 'text-white/70' : 'text-white/30'}`} style={FONT}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-12 sm:w-20 mx-2 mb-5 transition-colors duration-300
                ${done ? 'bg-accent-tint' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN CHECKOUT PAGE
══════════════════════════════════════════════════════ */
export default function CheckoutPage({ onBack, onViewOrders }) {
  const { items, subtotal, clearCart, showToast } = useCart()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [addresses, setAddresses] = useState([])
  const [selectedAddrId, setSelectedAddrId] = useState(null)
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [editAddr, setEditAddr] = useState(null)
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrError, setAddrError] = useState('')
  const [apptOpen, setApptOpen] = useState(false)

  const hasCustomMeasurements = items.some(i => i.stitching?.id === 'custom')
  const [orderLoading, setOrderLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [rzpPaymentId, setRzpPaymentId] = useState(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [paidTotal, setPaidTotal] = useState(0)      // snapshot before clearCart
  const [paidItems, setPaidItems] = useState([])     // snapshot before clearCart
  const scrollRef = useRef(null)
  const payingRef = useRef(false)  // prevent double-click

  const total = subtotal + SHIPPING_FEE

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* ── Intercept browser back button ── */
  useEffect(() => {
    // Push initial state when checkout mounts
    window.history.pushState({ isCheckout: true, step: 1 }, '')

    function handlePopState(e) {
      if (e.state && e.state.isCheckout) {
        // User navigated back/forward between steps
        setStep(e.state.step)
      } else {
        // User navigated back to the site
        onBack()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [onBack])

  // Custom step setter that syncs with browser history
  function goToStep(newStep) {
    window.history.pushState({ isCheckout: true, step: newStep }, '')
    setStep(newStep)
  }

  /* ── Scroll container to top on step change ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  /* ── Firestore listener for addresses ── */
  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'addresses'),
      (snap) => {
        const addrs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAddresses(addrs)
        // Auto-select default or first, but only if nothing is selected yet
        setSelectedAddrId(prev => {
          if (prev && addrs.find(a => a.id === prev)) return prev // keep current if still exists
          const def = addrs.find(a => a.isDefault) || addrs[0]
          return def?.id || null
        })
      },
      (err) => { console.error('Firestore address error:', err) }
    )
    return unsub
  }, [user?.uid])

  /* ── Save Address ── */
  async function saveAddress(form) {
    setAddrLoading(true)
    setAddrError('')
    try {
      if (!user?.uid) throw new Error('Not logged in')
      if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
        setAddrError('Please fill in all required fields.')
        return
      }
      if (editAddr?.id) {
        // Update existing
        await updateDoc(doc(db, 'users', user.uid, 'addresses', editAddr.id), {
          ...form, updatedAt: serverTimestamp()
        })
      } else {
        // Clear other defaults if needed
        if (form.isDefault) {
          for (const a of addresses) {
            if (a.isDefault) {
              await updateDoc(doc(db, 'users', user.uid, 'addresses', a.id), { isDefault: false })
            }
          }
        }
        // Add new address
        const ref = await addDoc(collection(db, 'users', user.uid, 'addresses'), {
          ...form,
          createdAt: serverTimestamp()
        })
        // Auto-select the newly added address
        setSelectedAddrId(ref.id)
      }
      setShowAddrForm(false)
      setEditAddr(null)
      showToast('Address saved to your profile')
    } catch (err) {
      setAddrError(err.message || 'Failed to save address. Please try again.')
    } finally {
      setAddrLoading(false)
    }
  }

  async function deleteAddr(id) {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id))
      if (selectedAddrId === id) {
        const remaining = addresses.filter(a => a.id !== id)
        setSelectedAddrId(remaining[0]?.id || null)
      }
    } catch (err) {
      console.error('Delete address error:', err)
    }
  }

  /* ── Step 2 → 3: create a draft order in Firestore, then move to payment step ── */
  async function placeOrderDraft() {
    setOrderLoading(true)
    try {
      const addr = addresses.find(a => a.id === selectedAddrId)
      const ref = await addDoc(collection(db, 'orders'), {
        userId: user.uid, userName: user.displayName || user.email, userEmail: user.email,
        items: items.map(i => ({
          id: i.id, name: i.name, price: i.price, quantity: i.quantity,
          selectedSize: i.selectedSize, stitching: i.stitching || null, image: i.image
        })),
        shippingAddress: addr,
        subtotal, shippingFee: SHIPPING_FEE, total,
        requiresCustomMeasurement: items.some(i => i.stitching?.id === 'custom'),
        paymentStatus: 'pending',
        orderStatus:   'draft',
        status:        'pending',   // ← read by MyOrders
        createdAt: serverTimestamp()
      })
      setOrderId(ref.id)
      goToStep(3)
    } catch (err) {
      console.error('Order draft error:', err)
      showToast('Could not create order. Please try again.')
    } finally {
      setOrderLoading(false)
    }
  }

  /* ── Step 3: open Razorpay modal and handle payment ── */
  const handlePayNow = useCallback(async () => {
    if (payingRef.current || paymentLoading) return
    payingRef.current = true
    setPaymentLoading(true)

    try {
      /* 1. Load Razorpay SDK */
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        showToast('Could not load payment gateway. Check your connection.')
        payingRef.current = false
        setPaymentLoading(false)
        return
      }

      /* 2. Create Razorpay order via backend */
      let razorpayOrderId, amountInPaise
      try {
        const res = await fetch(`${API_BASE}/api/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, receipt: orderId || undefined }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Order creation failed')
        razorpayOrderId = data.razorpayOrderId
        amountInPaise   = data.amount
      } catch (err) {
        console.error('[checkout] create-order error:', err)
        showToast(`Could not initiate payment: ${err.message}`)
        payingRef.current = false
        setPaymentLoading(false)
        return
      }

      const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
      const addr   = addresses.find(a => a.id === selectedAddrId)

      /* 3. Open Razorpay modal with server-generated order_id */
      const options = {
        key:         KEY_ID,
        amount:      amountInPaise,
        currency:    'INR',
        order_id:    razorpayOrderId,          // ← server-generated, required for signature
        name:        'Royal Boutique',
        description: `Order #${(orderId || '').slice(-8).toUpperCase()}`,
        image:       'https://i.imgur.com/n5tjHFD.png',
        handler: async function (response) {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response
          try {
            /* 4. Verify payment signature on backend */
            const vRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
            })
            const vData = await vRes.json()
            if (!vRes.ok || !vData.verified) {
              throw new Error(vData.error || 'Signature verification failed')
            }

            /* 5. Verified ✅ — update Firestore (optimistic) */
            if (orderId) {
              await updateDoc(doc(db, 'orders', orderId), {
                razorpayPaymentId: razorpay_payment_id  || null,
                razorpayOrderId:   razorpay_order_id    || null,
                razorpaySignature: razorpay_signature   || null,
                paymentStatus:     'paid',
                orderStatus:       'placed',
                status:            'pending',
                paidAt:            serverTimestamp(),
              })
            }

            /* 6. Fire simulate-webhook → triggers full webhook pipeline (dev)
                  In production Razorpay calls /api/webhook directly.           */
            fetch(`${API_BASE}/api/simulate-webhook`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                event:             'payment.captured',
                firestoreOrderId:  orderId,
                razorpayOrderId:   razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
              }),
            }).catch(e => console.warn('[checkout] simulate-webhook non-critical error:', e))

            // Snapshot totals BEFORE clearing the cart
            setPaidTotal(total)
            setPaidItems([...items])
            await clearCart()
            setRzpPaymentId(razorpay_payment_id)
            setOrderSuccess(true)
          } catch (err) {
            console.error('[checkout] verify-payment error:', err)
            showToast(`Payment verification failed: ${err.message}. Contact support.`)
            payingRef.current = false
            setPaymentLoading(false)
          }
        },
        prefill: {
          name:    addr?.fullName || user?.displayName || '',
          email:   user?.email   || '',
          contact: addr?.phone   || '',
        },
        notes: { orderId: orderId || '', userId: user?.uid || '' },
        theme: { color: '#f9a8d4' },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.')
            payingRef.current = false
            setPaymentLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', async (resp) => {
        console.error('[checkout] payment.failed:', resp.error)
        if (orderId) {
          try {
            await updateDoc(doc(db, 'orders', orderId), {
              paymentStatus: 'failed',
              orderStatus:   'failed',
              status:        'cancelled',  // ← MyOrders shows as Cancelled on payment failure
              failureReason: resp.error?.description || 'Unknown',
              failedAt:      serverTimestamp(),
            })
          } catch (e) { console.error(e) }
        }
        showToast(`Payment failed: ${resp.error?.description || 'Please try again.'}`)
        payingRef.current = false
        setPaymentLoading(false)
      })
      rzp.open()

    } catch (err) {
      console.error('[checkout] handlePayNow error:', err)
      showToast('Something went wrong. Please try again.')
      payingRef.current = false
      setPaymentLoading(false)
    }
  }, [total, orderId, selectedAddrId, addresses, user, clearCart, showToast, paymentLoading])

  const fmt = n => `₹${n.toLocaleString('en-IN')}`
  const selectedAddr = addresses.find(a => a.id === selectedAddrId)

  /* ── Show success page after payment ── */
  if (orderSuccess) {
    return (
      <OrderSuccess
        orderId={orderId}
        razorpayPaymentId={rzpPaymentId}
        total={paidTotal}
        items={paidItems}
        requiresCustomMeasurement={hasCustomMeasurements}
        onContinueShopping={onBack}
        onViewOrders={onViewOrders || onBack}
      />
    )
  }

  /* ── Wrapper ── */
  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] px-4 py-10 relative"
    >
      {/* Top accent */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300 z-50" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer text-sm"
            style={FONT}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-light text-white tracking-wide" style={FONT}>
              Royal Boutique
            </h1>
            <p className="text-white/30 text-xs tracking-widest uppercase mt-0.5" style={FONT}>
              Secure Checkout
            </p>
          </div>
          <div className="w-16" />
        </div>

        <StepBar step={step} />

        {/* ─── STEP 1: Cart Review ─── */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            style={{ animation: 'coFadeIn 0.3s ease-out' }}>
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />
            <div className="p-6">
              <h2 className="text-lg font-medium text-white mb-5" style={FONT}>Order Summary</h2>

              {items.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <ShoppingBag size={40} className="text-white/15" />
                  <p className="text-white/40" style={FONT}>Your cart is empty</p>
                  <button onClick={onBack}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-all text-sm cursor-pointer"
                    style={FONT}>Browse Collections</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.cartKey} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0">
                          <img src={item.image} alt={item.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=200&q=60' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium line-clamp-2" style={FONT}>{item.name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.stitching?.id !== 'custom' && (
                              <span className="text-[10px] text-white/40 border border-white/10 px-2 py-0.5 rounded-full" style={FONT}>
                                {item.category === 'Punjabi Suits' || item.category === 'Bridal Wear' ? 'Free Size' : item.selectedSize}
                              </span>
                            )}
                            {item.stitching && item.stitching.id !== 'none' && (
                              <span className="text-[10px] text-accent-muted border border-accent-glow px-2 py-0.5 rounded-full" style={FONT}>
                                {item.stitching.label}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-1.5" style={FONT}>Qty: {item.quantity}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-white text-sm font-medium" style={FONT}>{fmt(item.price * item.quantity)}</p>
                          <p className="text-white/30 text-xs mt-0.5" style={FONT}>{fmt(item.price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price summary */}
                  <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-sm text-white/60" style={FONT}>
                      <span>Subtotal</span><span>{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/60" style={FONT}>
                      <span>Shipping</span>
                      <span className="text-green-400">{SHIPPING_FEE === 0 ? 'Free' : fmt(SHIPPING_FEE)}</span>
                    </div>
                    <div className="flex justify-between text-base text-white font-semibold pt-2 border-t border-white/10" style={FONT}>
                      <span>Total</span><span>{fmt(total)}</span>
                    </div>
                  </div>

                  <button onClick={() => goToStep(2)}
                    className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300
                      hover:from-amber-100 hover:via-rose-200 hover:to-purple-200 text-[#1a1a1a] font-semibold text-sm
                      transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                      shadow-lg shadow-black/20" style={FONT}>
                    Continue to Shipping <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Shipping Address ─── */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            style={{ animation: 'coFadeIn 0.3s ease-out' }}>
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-medium text-white" style={FONT}>Shipping Address</h2>
                {!showAddrForm && (
                  <button onClick={() => { setShowAddrForm(true); setEditAddr(null) }}
                    className="flex items-center gap-1.5 text-xs text-accent-muted hover:text-accent transition-colors cursor-pointer"
                    style={FONT}>
                    <Plus size={13} /> Add New
                  </button>
                )}
              </div>

              {showAddrForm && (
                <div className="mb-5">
                  <AddressForm
                    key={editAddr ? editAddr.id : 'new-addr'}
                    initial={editAddr || emptyAddr()}
                    onSave={saveAddress}
                    onCancel={() => { setShowAddrForm(false); setEditAddr(null); setAddrError('') }}
                    loading={addrLoading}
                    addrError={addrError}
                  />
                </div>
              )}

              {addresses.length === 0 && !showAddrForm ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <MapPin size={32} className="text-white/15" />
                  <p className="text-white/40 text-sm" style={FONT}>No saved addresses. Add one to continue.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div key={addr.id}
                      onClick={() => setSelectedAddrId(addr.id)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                        ${selectedAddrId === addr.id
                          ? 'border-accent-glow bg-accent-tint'
                          : 'border-white/8 bg-white/3 hover:border-white/15'}`}>
                      {/* Radio */}
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${selectedAddrId === addr.id ? 'border-accent-glow' : 'border-white/25'}`}>
                          {selectedAddrId === addr.id && <div className="w-2 h-2 rounded-full bg-accent-tint" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-medium text-sm" style={FONT}>{addr.fullName}</span>
                            <span className="text-[10px] uppercase text-white/40 border border-white/10 px-1.5 py-0.5 rounded-full" style={FONT}>{addr.type}</span>
                            {addr.isDefault && <span className="text-[10px] text-accent-muted" style={FONT}>★ Default</span>}
                          </div>
                          <p className="text-white/55 text-xs leading-relaxed" style={FONT}>
                            {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                            {addr.city}, {addr.state} – {addr.pincode}
                          </p>
                          <p className="text-white/40 text-xs mt-1" style={FONT}>{addr.phone}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={e => { e.stopPropagation(); setEditAddr(addr); setShowAddrForm(true) }}
                            className="text-white/30 hover:text-white transition-colors cursor-pointer p-1">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteAddr(addr.id) }}
                            className="text-white/30 hover:text-red-400 transition-colors cursor-pointer p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => goToStep(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10
                    text-white/50 hover:text-white text-sm transition-colors cursor-pointer" style={FONT}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={placeOrderDraft}
                  disabled={!selectedAddrId || orderLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300
                    hover:from-amber-100 hover:via-rose-200 hover:to-purple-200 text-[#1a1a1a] font-semibold text-sm
                    transition-all duration-200 cursor-pointer disabled:opacity-40
                    flex items-center justify-center gap-2 shadow-lg shadow-black/20" style={FONT}>
                  {orderLoading ? 'Processing…' : <>Deliver Here <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Payment ─── */}
        {step === 3 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            style={{ animation: 'coFadeIn 0.3s ease-out' }}>
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-white" style={FONT}>Review & Pay</h2>

              {/* Delivery address summary */}
              {selectedAddr && (
                <div className="bg-white/3 rounded-xl border border-white/8 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-accent-muted" />
                    <span className="text-xs uppercase tracking-widest text-white/40" style={FONT}>Delivering To</span>
                  </div>
                  <p className="text-white text-sm font-medium" style={FONT}>{selectedAddr.fullName}</p>
                  <p className="text-white/50 text-xs mt-0.5" style={FONT}>
                    {selectedAddr.addressLine1}{selectedAddr.addressLine2 ? `, ${selectedAddr.addressLine2}` : ''}, {selectedAddr.city}, {selectedAddr.state} – {selectedAddr.pincode}
                  </p>
                </div>
              )}

              {/* Order items */}
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.cartKey} className="flex items-center gap-3 text-sm" style={FONT}>
                    <div className="w-10 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=200&q=60' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 truncate">{item.name}</p>
                      <p className="text-white/35 text-xs">{item.stitching?.id === 'custom' ? 'Custom Fit' : `Size: ${item.category === 'Punjabi Suits' || item.category === 'Bridal Wear' ? 'Free Size' : item.selectedSize}`} · Qty {item.quantity}</p>
                    </div>
                    <span className="text-white font-medium shrink-0">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-white/50" style={FONT}>
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/50" style={FONT}>
                  <span>Shipping</span><span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10" style={FONT}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>

              {/* Custom Measurements Banner */}
              {hasCustomMeasurements && (
                <div className="rounded-xl border border-accent-glow bg-accent-tint p-4 space-y-3"
                  style={{ animation: 'coFadeIn 0.3s ease-out' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-accent text-lg">✦</span>
                    <div>
                      <p className="text-accent text-sm font-semibold" style={FONT}>Custom Measurements Required</p>
                      <p className="text-accent-muted text-xs mt-0.5 leading-relaxed" style={FONT}>
                        Our stylist will contact you shortly to finalize your measurements. You can also track and contact us regarding custom measurements in <span className="text-accent-muted font-medium">My Orders</span> section.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a href="https://wa.me/917009824615?text=Hi!%20I%20placed%20an%20order%20on%20Royal%20Boutique%20and%20need%20custom%20measurements."
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600/80 hover:bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
                      style={FONT}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.126 1.525 5.865L0 24l6.292-1.493A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.82 9.82 0 01-4.962-1.34l-.355-.212-3.688.875.938-3.57-.232-.367A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                      </svg>
                      WhatsApp Us
                    </a>
                    <a href="tel:+917009824615"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 hover:bg-white/5 py-2.5 text-sm text-white/70 hover:text-white transition-colors cursor-pointer"
                      style={FONT}>
                      <Phone size={14} /> Call Us
                    </a>
                    <button
                      onClick={() => setApptOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-accent-glow hover:bg-accent-tint py-2.5 text-sm text-accent-muted hover:text-accent transition-colors cursor-pointer"
                      style={FONT}>
                      <Calendar size={14} /> Book Appointment
                    </button>
                  </div>
                </div>
              )}

              {/* Razorpay CTA */}
              <button
                disabled={paymentLoading}
                onClick={handlePayNow}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1a6fe8] to-[#2d82f5]
                  hover:from-[#1560d4] hover:to-[#2272e0] text-white font-semibold text-base
                  transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5
                  shadow-lg shadow-blue-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
                style={FONT}
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Opening Payment…
                  </>
                ) : (
                  <><Lock size={16} /> Pay Securely — {fmt(total)}</>
                )}
              </button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                {[
                  { icon: <Shield size={14} />, label: 'SSL Secured' },
                  { icon: <Lock size={14} />, label: '100% Safe' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5 text-white/25 text-xs" style={FONT}>
                    {b.icon} {b.label}
                  </div>
                ))}
                <span className="text-white/25 text-xs" style={FONT}>Powered by Razorpay</span>
              </div>

              <button onClick={() => goToStep(2)}
                className="w-full text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer text-center py-1"
                style={FONT}>
                ← Change Address
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Modal for custom measurements */}
      <AppointmentModal
        isOpen={apptOpen}
        onClose={() => setApptOpen(false)}
        defaultOccasion="Custom Measurements / Personal Styling"
      />

      <style>{`
        @keyframes coFadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
