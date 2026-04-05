import { createContext, useContext, useState, useCallback } from 'react'

/* ── Context ── */
const CartContext = createContext(null)

/* ── Hook ── */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

/* ── Provider ── */
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [wishlist, setWishlist] = useState([])
  const [isWishlistOpen, setWishlistOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  /* ── Toast helpers ── */
  function showToast(message) {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  /* ── Cart actions ── */
  // addToCart now requires { ...product, selectedSize }
  const addToCart = useCallback((product, selectedSize) => {
    const size = selectedSize || (product.sizes?.[0]) || 'One Size'
    const cartKey = `${product.id}-${size}`

    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey)
      if (existing) {
        // max 5 per size variant
        if (existing.quantity >= 5) return prev
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          ...product,
          // normalise: ensure `image` always points to first image
          image: product.images?.[0] || product.image || '',
          cartKey,
          selectedSize: size,
          quantity: 1,
        },
      ]
    })
    showToast(`${product.name} (${size}) added to cart`)
    setIsOpen(true)
  }, [])

  const removeFromCart = useCallback((cartKey) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey))
  }, [])

  const updateQuantity = useCallback((cartKey, delta) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.cartKey !== cartKey) return i
          const newQty = i.quantity + delta
          if (newQty > 5) return { ...i, quantity: 5 }
          return { ...i, quantity: newQty }
        })
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  /* ── Wishlist actions ── */
  const toggleWishlist = useCallback((product) => {
    const exists = wishlist.find((i) => i.id === product.id)
    
    if (exists) {
      setWishlist((prev) => prev.filter((i) => i.id !== product.id))
      showToast(`Removed from Wishlist`)
    } else {
      const image = product.images?.[0] || product.image || ''
      setWishlist((prev) => [...prev, { ...product, image }])
      showToast(`♡ Added to Wishlist`)
    }
  }, [wishlist])

  const isWishlisted = useCallback((productId) => {
    return wishlist.some((i) => i.id === productId)
  }, [wishlist])

  const wishlistCount = wishlist.length

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        totalItems,
        subtotal,
        toasts,
        wishlist,
        isWishlistOpen,
        setWishlistOpen,
        toggleWishlist,
        isWishlisted,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
