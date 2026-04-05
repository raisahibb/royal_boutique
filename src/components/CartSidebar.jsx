import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, subtotal } = useCart()

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a]
                    border-l border-white/10 z-50 flex flex-col
                    transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-white/80" />
            <h2 className="text-white font-medium text-lg" style={FONT}>
              Your Cart
            </h2>
            {items.length > 0 && (
              <span className="text-white/40 text-sm" style={FONT}>
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/50 hover:text-white transition-colors duration-200 cursor-pointer p-1"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-6">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
              <ShoppingBag size={28} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-base mb-1" style={FONT}>Your cart is empty</p>
              <p className="text-white/25 text-sm" style={FONT}>Add items from the collections below</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
                document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="mt-2 bg-[#f8f8f8] hover:bg-white text-[#171717] text-sm font-medium
                         px-6 py-2.5 transition-colors duration-200 cursor-pointer"
              style={{ borderRadius: '2px', ...FONT }}
            >
              Browse Collections
            </button>
          </div>
        ) : (
          <>
            {/* ── Items list ── */}
            <div className="flex-1 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 rounded-sm overflow-hidden bg-[#1c1b1b] shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=200&q=60'
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2" style={FONT}>
                      {item.name}
                    </p>

                    {/* Size badge */}
                    <span
                      className="inline-block mt-1 text-[10px] text-white/40 border border-white/15
                                 px-2 py-0.5 rounded-sm"
                      style={FONT}
                    >
                      Size: {item.selectedSize}
                    </span>

                    <p className="text-white/50 text-xs mt-1" style={FONT}>
                      {fmt(item.price)} each
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center
                                   text-white/60 hover:border-white/50 hover:text-white
                                   transition-colors duration-200 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-white text-sm w-5 text-center tabular-nums" style={FONT}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        disabled={item.quantity >= 5}
                        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center
                                   text-white/60 hover:border-white/50 hover:text-white
                                   transition-colors duration-200 cursor-pointer
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus size={10} />
                      </button>
                      {item.quantity >= 5 && (
                        <span className="text-white/25 text-[10px]" style={FONT}>max</span>
                      )}
                    </div>
                  </div>

                  {/* Right side: total + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <p className="text-white text-sm font-medium tabular-nums" style={FONT}>
                      {fmt(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-white/30 hover:text-red-400 transition-colors duration-200 cursor-pointer p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-5 border-t border-white/10 space-y-4">
              {/* Subtotal row */}
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm" style={FONT}>Subtotal</span>
                <span className="text-white font-medium text-base tabular-nums" style={FONT}>
                  {fmt(subtotal)}
                </span>
              </div>
              <p className="text-white/25 text-xs" style={FONT}>
                Taxes and shipping calculated at checkout
              </p>

              {/* Checkout */}
              <button
                className="w-full bg-[#f8f8f8] hover:bg-white text-[#171717] text-sm font-medium
                           py-3.5 transition-colors duration-200 cursor-pointer tracking-wide"
                style={{ borderRadius: '2px', ...FONT }}
              >
                Checkout — {fmt(subtotal)}
              </button>

              {/* Continue shopping */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-white/40 hover:text-white/70 text-sm transition-colors duration-200
                           cursor-pointer py-1 text-center"
                style={FONT}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
