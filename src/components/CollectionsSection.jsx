import { useState } from 'react'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'
import CartSidebar from './CartSidebar'
import WishlistSidebar from './WishlistSidebar'
import { useCart } from '../context/CartContext'
import { ShoppingBag, Heart } from 'lucide-react'

/* ─────────────────────────────────────────────
   CATEGORIES
───────────────────────────────────────────── */
const CATEGORIES = ['All', 'Punjabi Suits', 'Bridal Wear', 'Western', 'Accessories', 'Juttis']

/* ─────────────────────────────────────────────
   PRODUCT DATA
───────────────────────────────────────────── */
const ALL_COLLECTIONS = [
  // ── PUNJABI SUITS ──
  {
    id: 1,
    name: 'Rani Pink Patiala Suit',
    price: 3499,
    category: 'Punjabi Suits',
    images: [
      '/pics/Pink punjabi suit/1.jpg',
      '/pics/Pink punjabi suit/2.jpg',
      '/pics/Pink punjabi suit/3.jpg',
      '/pics/Pink punjabi suit/4.jpg',
    ],
    description: 'Traditional Patiala salwar with short kurti and heavy dupatta. Gotta patti work throughout. Perfect for weddings and festivals.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 2,
    name: 'Phulkari Embroidered Suit',
    price: 2899,
    category: 'Punjabi Suits',
    images: [
      '/pics/Phulkari suit/1.jpg',
      '/pics/Phulkari suit/2.jpg',
      '/pics/Phulkari suit/3.jpg',
      '/pics/Phulkari suit/4.jpg',
    ],
    description: 'Hand-embroidered Phulkari dupatta on cotton silk suit. Authentic Punjabi craft with vibrant colors.',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 3,
    name: 'Sharara Suit Regular',
    price: 4599,
    category: 'Punjabi Suits',
    images: [
      '/pics/sharara suit/1.jpg',
      '/pics/sharara suit/2.jpg',
      '/pics/sharara suit/3.jpg',
    ],
    description: 'Heavy sharara with mirror work kurti in bottle green. Party wear essential with traditional Abhla work.',
    sizes: ['M', 'L', 'XL', 'XXL'],
  },
  {
    id: 4,
    name: 'Cotton Kurta Salwar - Daily Wear',
    price: 1299,
    category: 'Punjabi Suits',
    images: [
      '/pics/daily wear suit/1.jpg',
      '/pics/daily wear suit/2.jpg',
      '/pics/daily wear suit/3.jpg',
    ],
    description: 'Comfortable cotton suit for daily wear. Simple dupatta included. Breathable fabric for summer.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },

  // ── BRIDAL WEAR ──
  {
    id: 5,
    name: 'Bridal Lehenga - Maroon Velvet',
    price: 28999,
    category: 'Bridal Wear',
    images: [
      '/pics/bridal lehnga/1.jpg',
      '/pics/bridal lehnga/2.jpg',
      '/pics/bridal lehnga/3.jpg',
      '/pics/bridal lehnga/4.jpg',
    ],
    description: 'Heavy velvet lehenga with gold zardozi embroidery. Punjabi bridal style with long choli and double dupatta.',
    sizes: ['M', 'L', 'XL', 'XXL'],
  },
  {
    id: 6,
    name: 'Pink Bridal Sharara Set',
    price: 24999,
    category: 'Bridal Wear',
    images: [
      '/pics/bridal sharara/1.jpg',
      '/pics/bridal sharara/2.jpg',
      '/pics/bridal sharara/3.jpg',
      '/pics/bridal sharara/4.jpg',
    ],
    description: 'Soft pink bridal sharara with heavy sequin embroidery. Modern Punjabi bride choice with dupatta set.',
    sizes: ['S', 'M', 'L', 'XL'],
  },


  // ── WESTERN ──
  {
    id: 9,
    name: 'Indo-Western Anarkali Gown',
    price: 3999,
    category: 'Western',
    images: [
      'https://images.unsplash.com/photo-DZgpFJdUMt0?w=800&q=80',
      'https://images.unsplash.com/photo-kBR3hfE4930?w=800&q=80',
    ],
    description: 'Fusion Anarkali gown with Indian hand embroidery. Best of both worlds for the modern woman.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 10,
    name: 'Floral Maxi Dress',
    price: 1799,
    category: 'Western',
    images: [
      'https://images.unsplash.com/photo-NN_tmZeM6ZM?w=800&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80',
    ],
    description: 'Flowy floral maxi dress in breathable fabric. Perfect for summer outings and casual occasions.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },

  // ── ACCESSORIES ──
  {
    id: 11,
    name: 'Hand-Embroidered Phulkari Dupatta',
    price: 899,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    ],
    description: 'Authentic hand-embroidered Phulkari dupatta. Adds vibrant color to any plain Punjabi suit.',
    sizes: ['One Size'],
  },
  {
    id: 12,
    name: 'Paranda - Traditional Hair Accessory',
    price: 299,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    ],
    description: 'Colorful silk paranda for Punjabi braided hairstyle. With decorative tassels and golden thread.',
    sizes: ['One Size'],
  },
  {
    id: 13,
    name: 'Kundan Necklace & Earrings Set',
    price: 1499,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo--05mGpLx04U?w=800&q=80',
      'https://images.unsplash.com/photo-pRpz3dTl3NA?w=800&q=80',
    ],
    description: 'Traditional Kundan necklace and earrings set. Handcrafted for Punjabi weddings and festive wear.',
    sizes: ['One Size'],
  },

  // ── JUTTIS ──
  {
    id: 14,
    name: 'Embroidered Jutti - Red & Gold',
    price: 799,
    category: 'Juttis',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    ],
    description: 'Handcrafted leather jutti with red and gold thread embroidery. Cushioned sole for all-day comfort.',
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
  },
  {
    id: 15,
    name: 'Mirror Work Jutti - Black',
    price: 999,
    category: 'Juttis',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    ],
    description: 'Black leather jutti with Abhla mirror work. Statement party wear for every ethnic outfit.',
    sizes: ['36', '37', '38', '39', '40', '41'],
  },
]

const PAGE_SIZE = 6

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function CollectionsSection({ onCheckout }) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const { totalItems, setIsOpen, wishlistCount, setWishlistOpen } = useCart()

  const filtered =
    activeCategory === 'All'
      ? ALL_COLLECTIONS
      : ALL_COLLECTIONS.filter((p) => p.category === activeCategory)

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function handleCategoryChange(cat) {
    setActiveCategory(cat)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      <section
        id="collections"
        className="relative w-full bg-[#0e0e0e] px-6 md:px-16 lg:px-24 py-24"
      >
        {/* ── Top separator ── */}
        <div className="absolute top-0 left-16 right-16 h-px bg-white/10" />

        {/* ── Section Header with Cart Icon ── */}
        <div className="mb-14">
          
          {/* Top row: empty left spacer + action buttons right */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-4">
              
              {/* Wishlist button */}
              <button
                onClick={() => setWishlistOpen(true)}
                className="flex items-center gap-2 text-white/60 hover:text-white 
                           transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: 'Barlow, sans-serif' }}
                aria-label="Open wishlist"
              >
                <div className="relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full 
                                     bg-[#f8f8f8] text-[#171717] text-[9px] font-bold 
                                     flex items-center justify-center tabular-nums leading-none">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs tracking-widest uppercase"
                      style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Wishlist
                </span>
              </button>

              {/* Cart button */}
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-white/60 hover:text-white 
                           transition-colors duration-200 cursor-pointer"
                style={{ fontFamily: 'Barlow, sans-serif' }}
                aria-label="Open cart"
              >
                <div className="relative">
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full 
                                     bg-[#f8f8f8] text-[#171717] text-[9px] font-bold 
                                     flex items-center justify-center tabular-nums leading-none">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs tracking-widest uppercase"
                      style={{ fontFamily: 'Barlow, sans-serif' }}>
                  Cart
                </span>
              </button>

            </div>
          </div>

          {/* Heading row: always centered, no overlap possible */}
          <div className="flex flex-col items-center gap-3">
            <h2
              className="text-white font-light text-4xl md:text-5xl tracking-tight text-center"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Our Collections
            </h2>
            <p
              className="text-white/60 text-lg md:text-xl text-center"
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
            >
              Authentic Punjabi craft, modern style
            </p>
          </div>

        </div>

        {/* ── Category Filter Bar ── */}
        <div className="mb-12 overflow-x-auto category-scroll">
          <div className="flex flex-row items-center gap-6 min-w-max mx-auto justify-center pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = cat === activeCategory
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`relative text-sm tracking-widest uppercase pb-2 cursor-pointer
                    transition-colors duration-200 whitespace-nowrap
                    ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                  style={{ fontFamily: 'Barlow, sans-serif' }}
                >
                  {cat}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2px] bg-white
                      transition-transform duration-300 origin-left
                      ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Product Grid ── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p
              className="text-white/40 text-lg"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              No items in this category yet.
            </p>
          </div>
        )}

        {/* ── Load More ── */}
        {hasMore && (
          <div className="flex justify-center mt-14">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="bg-[#f8f8f8] hover:bg-white text-[#171717] text-sm font-medium
                         tracking-wider uppercase px-8 py-3 transition-colors duration-200
                         cursor-pointer"
              style={{ borderRadius: '2px', fontFamily: 'Barlow, sans-serif' }}
            >
              Load More Collections
            </button>
          </div>
        )}

        {/* ── Bottom separator ── */}
        <div className="absolute bottom-0 left-16 right-16 h-px bg-white/10" />
      </section>

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* ── Sidebars ── */}
      <CartSidebar onCheckout={onCheckout} />
      <WishlistSidebar />

      {/* ── Toast Notifications ── */}
      <ToastLayer />
    </>
  )
}

/* ── Toast Layer ── */
function ToastLayer() {
  const { toasts } = useCart()
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[#f8f8f8] text-[#171717] text-sm font-medium px-5 py-3
                     rounded-sm shadow-xl animate-[slideUp_0.25s_ease-out]"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          ✓ {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}
