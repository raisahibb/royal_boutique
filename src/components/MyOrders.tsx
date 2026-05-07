import React, { useState, useMemo } from 'react'
import { ShoppingBag, ChevronRight, X, Phone, Package, Truck, CheckCircle, XCircle, MapPin } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

const WA_LINK = 'https://wa.me/917009824615?text=Hi!%20I%20have%20a%20custom%20measurement%20order%20on%20Royal%20Boutique%20and%20need%20assistance.'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=60'

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  draft:     { color: 'text-white/40 bg-white/5',     icon: <ShoppingBag size={14}/>, label: 'Draft' },
  pending:   { color: 'text-pink-300 bg-pink-500/10', icon: <Package size={14}/>, label: 'Pending' },
  confirmed: { color: 'text-amber-400 bg-amber-400/10', icon: <CheckCircle size={14}/>, label: 'Confirmed' },
  shipped:   { color: 'text-blue-400 bg-blue-400/10',   icon: <Truck size={14}/>, label: 'Shipped' },
  delivered: { color: 'text-green-400 bg-green-400/10', icon: <CheckCircle size={14}/>, label: 'Delivered' },
  cancelled: { color: 'text-red-400 bg-red-400/10',     icon: <XCircle size={14}/>, label: 'Cancelled' }
}

const TABS = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

export default function MyOrders({ orders, onBookAppt }: { orders: any[]; onBookAppt: () => void }) {
  const { user } = useAuth() as any
  const [filter, setFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  const injectDummyOrder = async () => {
    if (!user?.uid) return alert('Please login first')
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    let trackingNumber = null
    let trackingUrl = null
    
    if (randomStatus === 'shipped' || randomStatus === 'delivered') {
      trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase()
    }
    if (randomStatus === 'shipped') {
      trackingUrl = 'https://www.bluedart.com/'
    }

    const dummy = {
      userId: user.uid,
      status: randomStatus,
      trackingNumber,
      trackingUrl,
      total: 8098,
      subtotal: 8098,
      shippingFee: 0,
      requiresCustomMeasurement: true,
      createdAt: serverTimestamp(),
      shippingAddress: {
        fullName: user.name || 'Test User',
        phone: '9876543210',
        addressLine1: '123 Fashion Street',
        addressLine2: 'Apt 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      items: [
        {
          id: 'test-1',
          name: 'Rani Pink Patiala Suit',
          price: 3499,
          quantity: 1,
          selectedSize: 'M',
          category: 'Punjabi Suits',
          stitching: { id: 'custom', name: 'Custom Measurements' },
          image: '/pics/Pink punjabi suit/1.jpg'
        },
        {
          id: 'test-2',
          name: 'Sharara Suit Regular',
          price: 4599,
          quantity: 1,
          selectedSize: 'L',
          category: 'Punjabi Suits',
          stitching: { id: 'std', name: 'Standard Size' },
          image: '/pics/sharara suit/1.jpg'
        }
      ]
    }
    try {
      await addDoc(collection(db, 'orders'), dummy)
      alert(`Test order injected! (Status: ${randomStatus.toUpperCase()})`)
    } catch (e) {
      console.error(e)
      alert('Failed to inject order')
    }
  }

  const filteredOrders = useMemo(() => {
    if (filter === 'All') return orders
    return orders.filter(o => o.status?.toLowerCase() === filter.toLowerCase())
  }, [orders, filter])

  return (
    <div className="flex flex-col gap-5">
      {/* ── Status Tabs & Test Button ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex overflow-x-auto pb-1 gap-2 custom-scroll scrollbar-none flex-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                filter === t 
                  ? 'bg-white/10 text-white border-white/15 shadow-sm' 
                  : 'bg-white/3 text-white/40 border-white/5 hover:bg-white/8 hover:text-white/80'
              }`} style={FONT}>
              {t}
            </button>
          ))}
        </div>
        
        {/* Temporary DEV button (Hidden for now, can be restored when needed) */}
        {/* 
        <button onClick={injectDummyOrder} className="shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer" style={FONT}>
          + Inject Test Order
        </button> 
        */}
      </div>

      {/* ── Order List ── */}
      <div className="flex flex-col gap-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.03)]">
              <ShoppingBag size={32} className="text-white/40" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg font-medium text-white tracking-wide" style={FONT}>No Orders Yet</p>
              <p className="text-sm text-white/40 mt-1" style={FONT}>Looks like you haven't made your first purchase.</p>
            </div>
            <button 
              onClick={() => {
                // Try to find and click the generic modal close button to return to shopping
                const closeBtn = document.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
                if (closeBtn) closeBtn.click();
              }} 
              className="mt-4 rounded-full bg-gradient-to-r from-white to-[#e0e0e0] text-[#1a1a1a] px-8 py-3 text-sm font-semibold tracking-wide hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer" 
              style={FONT}
            >
              Start Shopping
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/30" style={FONT}>No {filter.toLowerCase()} orders found.</div>
        ) : (
          filteredOrders.map(o => {
            const needsMeasurement = o.requiresCustomMeasurement === true
            const statusConfig = STATUS_CONFIG[o.status?.toLowerCase()] || STATUS_CONFIG.draft
            
            return (
              <div key={o.id}
                className={`rounded-2xl border flex flex-col p-4 transition-all hover:bg-white/5 ${
                  needsMeasurement && o.status !== 'cancelled' ? 'bg-accent-tint border-accent-glow shadow-[0_0_15px_rgba(249,168,212,0.05)]' 
                  : o.status === 'cancelled' ? 'bg-red-500/5 border-red-500/20 opacity-75'
                  : 'bg-white/3 border-white/8'
                }`}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div>
                    <p className="text-xs text-white/40 font-mono tracking-wider">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-white/50 mt-1" style={FONT}>
                      {o.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || '—'}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.color} ${
                    o.status === 'cancelled' ? 'border-red-500/30' :
                    o.status === 'delivered' ? 'border-green-500/30' :
                    o.status === 'shipped' ? 'border-blue-500/30' :
                    o.status === 'confirmed' ? 'border-amber-500/30' :
                    'border-pink-500/20'
                  }`} style={FONT}>
                    {statusConfig.icon}
                    <span className="text-[10px] uppercase tracking-wider font-semibold">{statusConfig.label}</span>
                  </div>
                </div>

                {/* Body (Images + Details) */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Thumbnails stack (up to 3) */}
                  <div className="flex -space-x-3 shrink-0">
                    {o.items?.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className={`w-14 h-14 rounded-lg overflow-hidden border border-[#262b31] bg-[#1a1a1a] shrink-0 z-${30 - i*10}`}>
                        <img src={item.image || item.images?.[0] || FALLBACK_IMG} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {o.items?.length > 3 && (
                      <div className="w-14 h-14 rounded-lg border border-[#262b31] bg-[#1a1a1a] flex items-center justify-center shrink-0 z-0 text-white/50 text-xs font-medium" style={FONT}>
                        +{o.items.length - 3}
                      </div>
                    )}
                  </div>
                  
                  {/* Summary text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" style={FONT}>
                      {o.items?.[0]?.name || 'Items'} {o.items?.length > 1 ? `& ${o.items.length - 1} more` : ''}
                    </p>
                    <p className="text-xs text-white/50 mt-1" style={FONT}>
                      {o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-white font-semibold mt-1.5" style={FONT}>₹{o.total?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-col gap-3">
                  {/* Custom measurement banner */}
                  {needsMeasurement && o.status !== 'cancelled' && (
                    <div className="rounded-xl bg-accent-tint border border-accent-glow p-3 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-0.5 shrink-0">✦</span>
                        <div>
                          <p className="text-accent text-xs font-semibold" style={FONT}>Custom Measurements Required</p>
                          <p className="text-accent-muted text-[10px] mt-0.5 leading-relaxed" style={FONT}>
                            Contact us to finalize your measurements for this order.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={WA_LINK} target="_blank" rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-600/80 hover:bg-green-600 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                          style={FONT}>
                          WhatsApp
                        </a>
                        <a href="tel:+917009824615"
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/12 hover:bg-white/5 py-2 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                          style={FONT}>
                          Call Us
                        </a>
                        <button onClick={onBookAppt}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-accent-glow hover:bg-accent-tint py-2 text-xs text-accent-muted hover:text-accent transition-colors cursor-pointer"
                          style={FONT}>
                          Book Appt.
                        </button>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setSelectedOrder(o)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer" style={FONT}>
                    View Order Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onBookAppt={() => { setSelectedOrder(null); onBookAppt(); }}
        />
      )}
    </div>
  )
}

function OrderDetailsModal({ order, onClose, onBookAppt }: { order: any; onClose: () => void; onBookAppt: () => void }) {
  const { user } = useAuth() as any
  const [showCancelModal, setShowCancelModal] = React.useState(false)
  const [cancelled, setCancelled] = React.useState(order.status === 'cancelled')
  const needsMeasurement = order.requiresCustomMeasurement === true
  const statusConfig = STATUS_CONFIG[(cancelled ? 'cancelled' : order.status)?.toLowerCase()] || STATUS_CONFIG.draft
  const addr = order.shippingAddress
  const canCancel = !cancelled && (order.status === 'pending' || order.status === 'confirmed')

  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scroll rounded-2xl border border-white/10 shadow-2xl shadow-black bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]"
        style={{ animation: 'slideUp 0.2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f]">
          <div>
            <h3 className="text-lg font-medium text-white" style={FONT}>Order Details</h3>
            <p className="text-xs text-white/40 font-mono mt-1">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Status Row */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1" style={FONT}>Order Status</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 ${statusConfig.color}`} style={FONT}>
                {statusConfig.icon}
                <span className="text-[10px] uppercase tracking-wider font-semibold">{statusConfig.label}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1" style={FONT}>Order Date</p>
              <p className="text-sm text-white font-medium" style={FONT}>
                {order.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || '—'}
              </p>
            </div>
          </div>

          {/* Tracking Section */}
          {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'draft' && (
            <div className="bg-white/3 rounded-xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40" style={FONT}>Tracking Progress</p>
                {order.trackingNumber && (
                  <p className="text-[10px] font-mono text-accent" style={FONT}>AWB: {order.trackingNumber}</p>
                )}
              </div>
              
              <div className="relative flex justify-between items-center mb-2">
                {/* Progress Bar Background */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 rounded-full z-0" />
                
                {/* Progress Bar Fill */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full z-0 transition-all duration-500 ${
                  order.status === 'delivered' ? 'bg-green-400' : 
                  order.status === 'shipped' ? 'bg-blue-400' : 
                  order.status === 'confirmed' ? 'bg-amber-400' : 'bg-pink-400'
                }`} 
                  style={{ 
                    width: order.status === 'delivered' ? '100%' : 
                           order.status === 'shipped' ? '66%' : 
                           order.status === 'confirmed' ? '33%' : '0%' 
                  }} 
                />

                {/* Steps */}
                {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map((step, idx) => {
                  const currentStatusIdx = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status?.toLowerCase() || 'pending');
                  const isCompleted = currentStatusIdx >= idx;
                  const isCurrent = currentStatusIdx === idx;
                  
                  const activeBg = 
                    order.status === 'delivered' ? 'bg-green-400 border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' :
                    order.status === 'shipped' ? 'bg-blue-400 border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]' :
                    order.status === 'confirmed' ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-pink-400 border-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)]';

                  const activeText = 
                    order.status === 'delivered' ? 'text-green-400' :
                    order.status === 'shipped' ? 'text-blue-400' :
                    order.status === 'confirmed' ? 'text-amber-400' : 'text-pink-300';
                  
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                        isCompleted ? activeBg : 'bg-[#1e1e1e] border-white/20'
                      }`} />
                      <span className={`absolute top-5 text-[9px] font-medium transition-colors duration-300 ${
                        isCurrent ? activeText : isCompleted ? 'text-white/80' : 'text-white/30'
                      }`} style={FONT}>
                        {step}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Track Order Button */}
              {order.status?.toLowerCase() === 'shipped' && order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noreferrer"
                  className="mt-8 flex w-full items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer" style={FONT}>
                  Track Package
                </a>
              )}
              {order.status?.toLowerCase() === 'shipped' && !order.trackingUrl && (
                <div className="mt-8 text-center text-[10px] text-white/40" style={FONT}>Tracking link will be updated shortly via Email/SMS.</div>
              )}
              {order.status?.toLowerCase() !== 'shipped' && order.status?.toLowerCase() !== 'delivered' && (
                <div className="mt-8 text-center text-[10px] text-white/40" style={FONT}>Order is being processed. Tracking details will appear once shipped.</div>
              )}
            </div>
          )}

          {/* Custom Measurement Warning */}
          {needsMeasurement && !cancelled && (
            <div className="rounded-xl bg-accent-tint border border-accent-glow p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent mt-0.5">✦</span>
                <div>
                  <p className="text-accent text-sm font-semibold" style={FONT}>Custom Measurements Required</p>
                  <p className="text-accent-muted text-xs mt-1 leading-relaxed" style={FONT}>
                    This order contains custom fit items. Our stylist needs your measurements to begin stitching.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={WA_LINK} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center rounded-lg bg-green-600/80 hover:bg-green-600 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  style={FONT}>WhatsApp</a>
                <button onClick={onBookAppt}
                  className="flex-1 flex items-center justify-center rounded-lg border border-accent-glow hover:bg-accent-tint py-2.5 text-xs text-accent-muted hover:text-accent transition-colors cursor-pointer"
                  style={FONT}>Book Appt.</button>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3" style={FONT}>Order Items ({order.items?.length || 0})</p>
            <div className="flex flex-col gap-3">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/3 border border-white/5">
                  <img src={item.image || item.images?.[0] || FALLBACK_IMG} alt="" className="w-16 h-20 object-cover rounded-lg bg-[#1a1a1a]" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm text-white font-medium truncate" style={FONT}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.stitching?.id !== 'custom' && (
                        <>
                          <p className="text-xs text-white/50" style={FONT}>Size: {item.category === 'Punjabi Suits' || item.category === 'Bridal Wear' ? 'Free Size' : item.selectedSize}</p>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                        </>
                      )}
                      <p className="text-xs text-white/50" style={FONT}>Qty: {item.quantity}</p>
                    </div>
                    {item.stitching?.id === 'custom' && (
                      <span className="inline-block mt-2 self-start text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-medium" style={FONT}>
                        Custom Fit
                      </span>
                    )}
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="text-sm font-semibold text-white" style={FONT}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3" style={FONT}>Payment Summary</p>
            <div className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-white/60" style={FONT}>
                <span>Subtotal</span>
                <span>₹{order.subtotal?.toLocaleString('en-IN') || order.total?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-white/60" style={FONT}>
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? 'Free' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="h-px w-full bg-white/10 my-2" />
              <div className="flex justify-between text-sm text-white font-semibold" style={FONT}>
                <span>Total Amount</span>
                <span>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          {addr && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3" style={FONT}>Shipping Details</p>
              <div className="bg-white/3 rounded-xl p-4 border border-white/5 flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-white/5 text-white/40"><MapPin size={16} /></div>
                <div>
                  <p className="text-sm text-white font-medium mb-1" style={FONT}>{addr.fullName}</p>
                  <p className="text-xs text-white/50 leading-relaxed" style={FONT}>
                    {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br/>
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                  <p className="text-xs text-white/40 mt-1" style={FONT}>Phone: {addr.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Order Button */}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all cursor-pointer"
              style={FONT}>
              <XCircle size={16} /> Cancel Order
            </button>
          )}

          {/* Cancelled State Banner */}
          {cancelled && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
              <p className="text-red-400 text-sm font-semibold" style={FONT}>This order has been cancelled.</p>
              <p className="text-red-400/60 text-xs mt-1" style={FONT}>Refund will be processed in 5–7 business days.</p>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* Cancellation Modal */}
    {showCancelModal && (
      <CancellationModal
        orderId={order.id}
        userId={user?.uid}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => { setShowCancelModal(false); setCancelled(true) }}
      />
    )}
    </>
  )
}

/* ══════════════════════════════════════
   CANCELLATION MODAL
══════════════════════════════════════ */
const CANCEL_REASONS = [
  'Changed my mind',
  'Wrong size / fit',
  'Custom measurement issue',
  'Found a better price elsewhere',
  'Delivery delay',
  'Other',
]

function CancellationModal({ orderId, userId, onClose, onSuccess }: {
  orderId: string; userId: string; onClose: () => void; onSuccess: () => void
}) {
  const [step, setStep] = React.useState<1|2>(1)
  const [reason, setReason] = React.useState('')
  const [otherText, setOtherText] = React.useState('')
  const [refundMethod, setRefundMethod] = React.useState<'original'|'bank'>('original')
  const [bank, setBank] = React.useState({ name: '', account: '', ifsc: '', bankName: '' })
  const [saveBankAccount, setSaveBankAccount] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const finalReason = reason === 'Other' ? otherText : reason

  async function handleSubmit() {
    if (!finalReason.trim()) { setError('Please select a reason.'); return }
    if (refundMethod === 'bank') {
      if (!bank.name.trim() || !bank.account.trim() || !bank.ifsc.trim()) {
        setError('Please fill all bank details.'); return
      }
    }
    setLoading(true)
    setError('')
    try {
      // 1. Update order
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancellationReason: finalReason,
        cancelledAt: serverTimestamp(),
        refundMethod,
        ...(refundMethod === 'bank' ? { bankDetails: bank } : {})
      })

      // 2. Optionally save bank account to user profile
      if (refundMethod === 'bank' && saveBankAccount && userId) {
        await addDoc(collection(db, 'users', userId, 'bankAccounts'), {
          ...bank,
          addedAt: serverTimestamp()
        })
      }

      onSuccess()
    } catch (e: any) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-rose-400 to-pink-400" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="text-base font-semibold text-white" style={FONT}>Cancel Order</h3>
            <p className="text-[10px] text-white/40 mt-0.5" style={FONT}>Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= s ? 'bg-red-500' : 'bg-white/10'
              }`} />
            ))}
          </div>

          {step === 1 && (
            <>
              <p className="text-sm font-medium text-white" style={FONT}>Why are you cancelling?</p>
              <div className="flex flex-col gap-2">
                {CANCEL_REASONS.map(r => (
                  <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reason === r ? 'border-red-500/40 bg-red-500/8' : 'border-white/5 bg-white/3 hover:bg-white/5'
                  }`}>
                    <input
                      type="radio" name="reason" value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-red-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-white/80" style={FONT}>{r}</span>
                  </label>
                ))}
              </div>
              {reason === 'Other' && (
                <textarea
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="Please describe your reason..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none transition-all"
                  style={FONT}
                />
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-medium text-white" style={FONT}>How would you like your refund?</p>
              <div className="flex flex-col gap-3">
                {/* Option 1: Original */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  refundMethod === 'original' ? 'border-red-500/40 bg-red-500/8' : 'border-white/5 bg-white/3 hover:bg-white/5'
                }`}>
                  <input type="radio" name="refund" value="original" checked={refundMethod === 'original'} onChange={() => setRefundMethod('original')} className="accent-red-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium" style={FONT}>Original Payment Method</p>
                    <p className="text-xs text-white/50 mt-0.5" style={FONT}>Refunded to the card / UPI / wallet used for this order.</p>
                  </div>
                </label>

                {/* Option 2: Bank */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  refundMethod === 'bank' ? 'border-red-500/40 bg-red-500/8' : 'border-white/5 bg-white/3 hover:bg-white/5'
                }`}>
                  <input type="radio" name="refund" value="bank" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} className="accent-red-500 w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium" style={FONT}>Bank Account</p>
                    <p className="text-xs text-white/50 mt-0.5" style={FONT}>Directly transferred to your bank account.</p>
                  </div>
                </label>

                {/* Bank Details Form */}
                {refundMethod === 'bank' && (
                  <div className="flex flex-col gap-3 mt-1">
                    {[
                      { key: 'name', label: 'Account Holder Name', placeholder: 'Full name as per bank' },
                      { key: 'account', label: 'Account Number', placeholder: '0000 0000 0000 0000' },
                      { key: 'ifsc', label: 'IFSC Code', placeholder: 'HDFC0001234' },
                      { key: 'bankName', label: 'Bank Name (Optional)', placeholder: 'HDFC, SBI, ICICI...' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 block" style={FONT}>{label}</label>
                        <input
                          value={(bank as any)[key]}
                          onChange={e => setBank(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all"
                          style={FONT}
                        />
                      </div>
                    ))}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveBankAccount}
                        onChange={e => setSaveBankAccount(e.target.checked)}
                        className="accent-red-500 w-4 h-4"
                      />
                      <span className="text-xs text-white/60" style={FONT}>Save this bank account for future refunds</span>
                    </label>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center" style={FONT}>{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-1">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-white/70 hover:bg-white/5 transition-colors cursor-pointer" style={FONT}>
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                onClick={() => {
                  if (!finalReason.trim()) { setError('Please select a reason.'); return }
                  setError('')
                  setStep(2)
                }}
                className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-sm font-semibold text-white transition-colors cursor-pointer"
                style={FONT}>
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={FONT}>
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
