import { X, Trash2, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }

export default function WishlistSidebar() {
  const { wishlist, isWishlistOpen, setWishlistOpen, toggleWishlist, addToCart } = useCart()

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`

  function handleMoveAllToCart() {
    wishlist.forEach((item) => {
      addToCart(item, item.sizes?.[0] || 'One Size')
      toggleWishlist(item)
    })
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
                    ${isWishlistOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setWishlistOpen(false)}
      />

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a]
                    border-l border-white/10 z-50 flex flex-col
                    transition-transform duration-300 ease-out
                    ${isWishlistOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-white/80" />
            <h2 className="text-white font-medium text-lg" style={FONT}>
              Wishlist
            </h2>
            {wishlist.length > 0 && (
              <span className="text-white/40 text-sm" style={FONT}>
                ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
          <button
            onClick={() => setWishlistOpen(false)}
            className="text-white/50 hover:text-white transition-colors duration-200 cursor-pointer p-1"
            aria-label="Close wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {wishlist.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-6">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
              <Heart size={28} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/50 text-base mb-1" style={FONT}>Your wishlist is empty</p>
              <p className="text-white/25 text-sm" style={FONT}>Save items you love</p>
            </div>
            <button
              onClick={() => {
                setWishlistOpen(false)
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
              {wishlist.map((item) => (
                <div
                  key={item.id}
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
                    <p className="text-white/50 text-xs mt-1" style={FONT}>
                      {fmt(item.price)}
                    </p>

                    <div className="mt-3 relative">
                      <button
                        onClick={() => {
                          addToCart(item, item.sizes?.[0])
                          toggleWishlist(item)
                        }}
                        className="text-[10px] uppercase tracking-wider text-white border border-white/20
                                   px-3 py-1.5 rounded-sm hover:bg-white hover:text-black hover:border-white
                                   transition-colors duration-200 cursor-pointer"
                        style={FONT}
                      >
                        Move to Cart
                      </button>
                    </div>
                  </div>

                  {/* Right side: remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button
                      onClick={() => toggleWishlist(item)}
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
            <div className="px-6 py-5 border-t border-white/10">
              <button
                onClick={handleMoveAllToCart}
                className="w-full bg-[#f8f8f8] hover:bg-white text-[#171717] text-sm font-medium
                           py-3.5 transition-colors duration-200 cursor-pointer tracking-wide"
                style={{ borderRadius: '2px', ...FONT }}
              >
                Move All to Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
