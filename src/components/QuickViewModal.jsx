import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }
const FALLBACK = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=60'

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart()

  const images = product.images || [product.image || FALLBACK]

  const [mainIdx, setMainIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || 'One Size')

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* Escape key */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function prevImage() {
    setMainIdx((i) => (i === 0 ? images.length - 1 : i - 1))
  }
  function nextImage() {
    setMainIdx((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  function handleAddToCart() {
    addToCart(product, selectedSize)
    onClose()
  }

  const formatted = `₹${product.price.toLocaleString('en-IN')}`

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      {/* ── Modal card ── */}
      <div
        className="relative bg-[#0a0a0a] border border-white/10 rounded-sm
                   w-full max-w-3xl max-h-[92vh] overflow-hidden
                   flex flex-col sm:flex-row"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 text-white/50 hover:text-white
                     transition-colors duration-200 cursor-pointer bg-black/60
                     backdrop-blur-sm rounded-full p-1.5"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* ── LEFT: Image Carousel ── */}
        <div className="sm:w-[52%] flex flex-col shrink-0 bg-[#111]">
          {/* Main image */}
          <div className="relative flex-1 overflow-hidden aspect-[4/5] sm:aspect-auto">
            <img
              key={mainIdx}
              src={images[mainIdx] || FALLBACK}
              alt={`${product.name} – view ${mainIdx + 1}`}
              onError={(e) => { e.target.src = FALLBACK }}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ animation: 'fadeIn 0.25s ease-out' }}
            />

            {/* Prev / Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20
                             w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm
                             flex items-center justify-center text-white/70 hover:text-white
                             hover:bg-black/80 transition-all duration-200 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20
                             w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm
                             flex items-center justify-center text-white/70 hover:text-white
                             hover:bg-black/80 transition-all duration-200 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div
                className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-sm
                           text-white/70 text-[10px] px-2 py-0.5 rounded-sm"
                style={FONT}
              >
                {mainIdx + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5 p-2 bg-[#0a0a0a] border-t border-white/5 overflow-x-auto scrollbar-none">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setMainIdx(i)}
                  className={`relative shrink-0 w-14 h-14 rounded-sm overflow-hidden cursor-pointer
                               transition-all duration-200
                               ${i === mainIdx
                                 ? 'ring-1 ring-white opacity-100'
                                 : 'opacity-40 hover:opacity-70'}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={src || FALLBACK}
                    alt=""
                    onError={(e) => { e.target.src = FALLBACK }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product Details ── */}
        <div className="flex flex-col justify-between p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Category badge */}
            <span
              className="inline-block text-[9px] font-semibold tracking-widest uppercase
                         text-white bg-white/10 border border-white/15 px-3 py-1 rounded-sm"
              style={FONT}
            >
              {product.category}
            </span>

            {/* Name */}
            <h2 className="text-white text-xl font-medium leading-snug" style={FONT}>
              {product.name}
            </h2>

            {/* Price */}
            <p className="text-white/80 text-2xl font-light tabular-nums" style={FONT}>
              {formatted}
            </p>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Description */}
            <p className="text-white/55 text-sm leading-relaxed" style={FONT}>
              {product.description || 'Handcrafted with premium fabrics and intricate detailing.'}
            </p>

            {/* Size Selector */}
            <div className="space-y-2">
              <p className="text-white/50 text-xs tracking-widest uppercase" style={FONT}>
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.sizes || ['One Size']).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 text-xs tracking-wide border rounded-sm cursor-pointer
                                transition-all duration-200
                                ${selectedSize === sz
                                  ? 'bg-white text-[#171717] border-white font-medium'
                                  : 'text-white/60 border-white/20 hover:border-white/50 hover:text-white'}`}
                    style={FONT}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra features */}
            <ul className="space-y-1.5">
              {['Free returns within 7 days', 'Includes care instructions', 'Exclusive boutique piece'].map(
                (feat) => (
                  <li key={feat} className="flex items-center gap-2 text-white/35 text-xs" style={FONT}>
                    <span className="w-1 h-1 rounded-full bg-white/25 shrink-0" />
                    {feat}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#f8f8f8] hover:bg-white text-[#171717] text-sm font-medium
                         py-3.5 transition-colors duration-200 cursor-pointer tracking-wide"
              style={{ borderRadius: '2px', ...FONT }}
            >
              Add to Cart — {formatted}
            </button>
            <button
              onClick={onClose}
              className="w-full border border-white/20 hover:bg-white/5 text-white/50 hover:text-white
                         text-sm py-3 transition-colors duration-200 cursor-pointer"
              style={{ borderRadius: '2px', ...FONT }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }                            to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  )
}
