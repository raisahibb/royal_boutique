import { useState } from 'react'
import { useCart } from '../context/CartContext'
import QuickViewModal from './QuickViewModal'
import { Heart } from 'lucide-react'

const FONT = { fontFamily: 'Barlow, sans-serif' }

/* Fallback image for missing local files */
const FALLBACK =
  'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=60'

export default function ProductCard({ product, onQuickView }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart, toggleWishlist, isWishlisted } = useCart()

  const images = product.images || [product.image || FALLBACK]
  const currentImg = images[imgIndex] || FALLBACK

  /* On hover: cycle to 2nd image if available */
  function handleMouseEnter() {
    setIsHovered(true)
    if (images.length > 1) setImgIndex(1)
  }
  function handleMouseLeave() {
    setIsHovered(false)
    setImgIndex(0)
  }

  /* Quick Add — picks first size; opens modal for size selection otherwise */
  function handleAddToCart() {
    const size = product.sizes?.[0] || 'One Size'
    addToCart(product, size)
  }

  const formattedPrice = `₹${product.price.toLocaleString('en-IN')}`

  return (
    <>
      <article
        className="group flex flex-col gap-3"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Image Container ── */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#1c1b1b]">
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              toggleWishlist(product)
            }}
            className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-200"
          >
            <Heart
              size={13}
              className={`transition-colors duration-200 ${
                isWishlisted(product.id)
                  ? 'fill-current text-red-400'
                  : 'text-white/50 hover:text-white'
              }`}
            />
          </button>
          <img
            src={currentImg}
            alt={product.name}
            onError={(e) => { e.target.src = FALLBACK }}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Category badge — top left */}
          <span
            className="absolute top-3 left-3 text-[9px] font-semibold tracking-widest uppercase
                       text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-sm z-10"
            style={FONT}
          >
            {product.category}
          </span>

          {/* Multi-image dots — bottom center */}
          {images.length > 1 && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-300
                    ${i === imgIndex
                      ? 'w-3 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/40'
                    }`}
                />
              ))}
            </div>
          )}

          {/* ── Hover button row ── */}
          <div
            className={`absolute bottom-0 left-0 right-0 flex gap-0 z-20
                        transition-all duration-300 ease-out
                        ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
          >
            {/* Quick View */}
            <button
              onClick={() => onQuickView ? onQuickView() : setModalOpen(true)}
              className="flex-1 text-white border-t border-r border-white/20 bg-black/60 backdrop-blur-sm
                         text-[10px] font-medium tracking-widest uppercase py-3 cursor-pointer
                         hover:bg-white/20 transition-colors duration-200"
              style={FONT}
            >
              Quick View
            </button>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="flex-1 text-[#171717] bg-[#f8f8f8] hover:bg-white border-t border-white/10
                         text-[10px] font-medium tracking-widest uppercase py-3 cursor-pointer
                         transition-colors duration-200"
              style={FONT}
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* ── Product Info ── */}
        <div className="flex items-start justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <h3
              className="text-white font-medium text-sm leading-snug truncate"
              style={FONT}
            >
              {product.name}
            </h3>
            <p className="text-white/40 text-xs mt-0.5" style={FONT}>
              {product.sizes?.length === 1 ? product.sizes[0] : `${product.sizes?.length || 0} sizes`}
            </p>
          </div>
          <span className="text-white/75 text-sm font-light shrink-0 tabular-nums" style={FONT}>
            {formattedPrice}
          </span>
        </div>
      </article>

      {/* ── Fallback Modal (no onQuickView prop) ── */}
      {modalOpen && (
        <QuickViewModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
