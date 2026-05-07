import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Ruler, Undo2, Sparkles, Droplets } from 'lucide-react'
import { useCart } from '../context/CartContext'

const FONT = { fontFamily: 'Barlow, sans-serif' }
const FALLBACK = 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=60'

const STITCHING_OPTIONS = [
  { id: 'unst', label: 'Unstitched Salwar Kameez', price: 0 },
  { id: 'std', label: 'Standard Stitching Sizes', price: 750 },
  { id: 'custom', label: 'I want Custom Measurements', price: 900 },
]

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart()

  const images = product.images || [product.image || FALLBACK]

  const [mainIdx, setMainIdx] = useState(0)
  const [selectedStitching, setSelectedStitching] = useState(STITCHING_OPTIONS[0])
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  // Zoom features (Desktop only)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false })

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  /* Escape key */
  useEffect(() => {
    function onKey(e) { 
      if (e.key === 'Escape') {
        if (showSizeGuide) setShowSizeGuide(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, showSizeGuide])

  function prevImage() {
    setMainIdx((i) => (i === 0 ? images.length - 1 : i - 1))
    setZoomPos(p => ({ ...p, show: false }))
  }
  function nextImage() {
    setMainIdx((i) => (i === images.length - 1 ? 0 : i + 1))
    setZoomPos(p => ({ ...p, show: false }))
  }

  // Zoom handlers (Desktop only lg+)
  function handleMouseMove(e) {
    if (window.innerWidth < 1024) return // Disable hover zoom on tablet and mobile
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    // Calculate percentage position
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y, show: true })
  }

  function handleMouseLeave() {
    setZoomPos((prev) => ({ ...prev, show: false }))
  }

  const isCustomizable = ['Punjabi Suits', 'Bridal Wear'].includes(product?.category)
  const activeStitching = isCustomizable ? selectedStitching : { id: 'none', label: 'Standard', price: 0 }

  const finalPrice = product.price + activeStitching.price

  function handleAddToCart() {
    addToCart(
      {
        ...product,
        price: finalPrice,
        stitching: isCustomizable ? activeStitching : null,
      },
      isCustomizable ? 'Custom/Stitched' : selectedSize
    )
    onClose()
  }

  const formattedBase = `₹${product.price.toLocaleString('en-IN')}`
  const formattedFinal = `₹${finalPrice.toLocaleString('en-IN')}`

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      {/* ── Modal card ── */}
      <div
        className="relative bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]
                   border border-white/8 rounded-xl lg:rounded-2xl
                   w-full max-w-4xl max-h-[96vh] lg:max-h-[90vh] overflow-y-auto custom-scroll lg:overflow-hidden
                   flex flex-col lg:flex-row shadow-2xl shadow-black/70"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300 z-30" />
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
        <div className="lg:w-1/2 flex flex-col shrink-0 bg-[#0d0d0d] relative">
          {/* Main image */}
          <div 
            className="relative w-full aspect-[4/5] lg:aspect-auto lg:flex-1 overflow-hidden lg:cursor-zoom-in group bg-[#0a0a0a]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              key={mainIdx}
              src={images[mainIdx] || FALLBACK}
              alt={`${product.name} – view ${mainIdx + 1}`}
              onError={(e) => { e.target.src = FALLBACK }}
              className="w-full h-full object-contain transition-opacity duration-300"
              style={{ animation: 'fadeIn 0.25s ease-out' }}
            />

            {/* Lens Overlay (Desktop only lg+) */}
            {zoomPos.show && (
              <div
                className="hidden lg:block absolute pointer-events-none border border-accent-glow bg-white/5 backdrop-blur-[1px] shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{
                  left: `calc(${zoomPos.x}% - 60px)`,
                  top: `calc(${zoomPos.y}% - 60px)`,
                  width: '120px',
                  height: '120px',
                  borderRadius: '4px'
                }}
              />
            )}

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
            <div className="flex gap-1.5 p-2 bg-[#0d0d0d] border-t border-white/5 overflow-x-auto scrollbar-none custom-scroll">
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
        <div className="flex flex-col justify-between p-5 lg:p-8 flex-1 lg:overflow-y-auto custom-scroll relative">
          
          {/* Desktop Zoomed Preview Pane */}
          {zoomPos.show && (
            <div 
              className="hidden lg:block absolute inset-0 z-50 bg-[#0a0a0a] pointer-events-none"
              style={{ animation: 'fadeIn 0.15s ease-out' }}
            >
              {/* Inner container for border and shadow */}
              <div 
                className="w-full h-full border-l border-rose-400/20 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]"
                style={{
                  backgroundImage: `url('${images[mainIdx] || FALLBACK}')`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: '250%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          )}
          
          {/* Size Guide Drawer / Inner Modal overlay */}
          {showSizeGuide && (
            <div 
              className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md z-40 p-6 flex flex-col items-center justify-center text-center"
              style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
              <button 
                onClick={() => setShowSizeGuide(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
              <Ruler size={48} className="text-accent-muted mb-4" />
              <h3 className="text-xl text-white font-medium mb-4" style={FONT}>Size Guide</h3>
              
              <div className="text-sm text-white/60 space-y-4 max-w-sm" style={FONT}>
                <p>Standard sizes are based on Indian clothing variations. Sizes may slightly differ depending on the cut and style of the garment.</p>
                <p>If you prefer a perfect fit, we highly recommend selecting <strong className="text-white/80">Custom Measurements</strong>.</p>
                
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg mt-6">
                  <p className="text-white/80 mb-2">Unsure of your size?</p>
                  <a href="https://wa.me/917009824615" target="_blank" rel="noreferrer" className="text-green-400 hover:text-green-300 transition-colors font-medium text-base">
                    WhatsApp Us at +91 7009824615
                  </a>
                </div>
                
                <p className="mt-4">
                  For further queries, email us at <br/>
                  <a href="mailto:info@royalboutique.in" className="text-white/80 underline decoration-white/30 hover:decoration-white transition-all">info@royalboutique.in</a>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5 pb-6">
            {/* Category badge */}
            <span
              className="inline-block text-[9px] font-semibold tracking-widest uppercase
                         text-white bg-white/10 border border-white/15 px-3 py-1 rounded-sm"
              style={FONT}
            >
              {product.category}
            </span>

            {/* Name */}
            <h2 className="text-white text-2xl font-light leading-snug" style={FONT}>
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-end gap-3">
              <p className="text-white text-3xl font-medium tabular-nums" style={FONT}>
                {formattedFinal}
              </p>
              {selectedStitching.price > 0 && (
                <p className="text-white/40 text-lg line-through tabular-nums mb-1" style={FONT}>
                  {formattedBase}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

            {/* Description */}
            <p className="text-white/55 text-sm leading-relaxed" style={FONT}>
              {product.description || 'Handcrafted with premium fabrics and intricate detailing.'}
            </p>

            {/* Product Benefits */}
            <div className="space-y-3.5 pt-4 mt-2 border-t border-white/5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-accent-muted">
                  <Undo2 size={18} strokeWidth={1.5} />
                </div>
                <p className="text-white/80 text-[15px] tracking-wide" style={FONT}>
                  <strong className="text-white font-medium">Free Returns</strong> within 7 days
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-accent-muted">
                  <Droplets size={18} strokeWidth={1.5} />
                </div>
                <p className="text-white/80 text-[15px] tracking-wide" style={FONT}>
                  <strong className="text-white font-medium">Care Instructions</strong> included
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-accent-muted">
                  <Sparkles size={18} strokeWidth={1.5} />
                </div>
                <p className="text-white/80 text-[15px] tracking-wide" style={FONT}>
                  <strong className="text-white font-medium">Exclusive</strong> Boutique Piece
                </p>
              </div>
            </div>

            {/* Size Selector (Only for non-customizable like Juttis, Western) */}
            {!isCustomizable && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-xs tracking-widest uppercase" style={FONT}>
                    Size
                  </p>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1.5 text-xs text-accent-muted hover:text-accent transition-colors cursor-pointer"
                    style={FONT}
                  >
                    <Ruler size={12} />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['One Size']).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 text-sm tracking-wide border rounded-sm cursor-pointer
                                  transition-all duration-200
                                  ${selectedSize === sz
                                    ? 'bg-white text-[#171717] border-white font-medium shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                    : 'text-white/60 border-white/20 hover:border-white/50 hover:text-white bg-black/20'}`}
                      style={FONT}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stitching Options (Only for Punjabi Suits & Bridal) */}
            {isCustomizable && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-xs tracking-widest uppercase" style={FONT}>
                    Stitching / Customization
                  </p>
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1.5 text-xs text-accent-muted hover:text-accent transition-colors cursor-pointer"
                    style={FONT}
                  >
                    <Ruler size={12} />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {STITCHING_OPTIONS.map(opt => (
                    <label 
                      key={opt.id}
                      onClick={() => setSelectedStitching(opt)}
                      className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all duration-200 ${
                        selectedStitching.id === opt.id 
                        ? 'border-white bg-white/5' 
                        : 'border-white/10 hover:border-white/30 bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedStitching.id === opt.id ? 'border-white' : 'border-white/40'
                        }`}>
                          {selectedStitching.id === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm ${selectedStitching.id === opt.id ? 'text-white font-medium' : 'text-white/70'}`} style={FONT}>
                          {opt.label}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${selectedStitching.id === opt.id ? 'text-white' : 'text-white/50'}`} style={FONT}>
                        {opt.price === 0 ? 'Included' : `+ ₹${opt.price.toLocaleString('en-IN')}`}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Custom Measurements note */}
                {selectedStitching.id === 'custom' && (
                  <div
                    className="flex items-start gap-2.5 bg-accent-tint border border-accent-glow rounded-lg px-3.5 py-3"
                    style={{ animation: 'fadeIn 0.25s ease-out' }}
                  >
                    <span className="text-accent-muted mt-0.5 shrink-0 text-base">✦</span>
                    <p className="text-xs text-accent-muted leading-relaxed italic" style={FONT}>
                      Our team will contact you after order confirmation to take your custom measurements.
                    </p>
                  </div>
                )}
              </div>
            )}


          </div>

          {/* CTA Buttons */}
          <div className="mt-4 space-y-3 shrink-0 pt-4 border-t border-white/5">
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] hover:from-white hover:to-[#f0f0f0] 
                         text-[#171717] text-sm font-medium py-3.5 transition-all duration-200 cursor-pointer 
                         tracking-wide rounded-md shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20
                         transform hover:scale-[1.01] active:scale-[0.99]"
              style={FONT}
            >
              Add to Cart — {formattedFinal}
            </button>
            <button
              onClick={onClose}
              className="w-full border border-white/20 hover:bg-white/5 text-white/50 hover:text-white
                         text-sm py-3 transition-colors duration-200 cursor-pointer rounded-md"
              style={FONT}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>

      {/* Cleaned up mobile fallback - zoom completely disabled on mobile */}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }                            to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  )
}
