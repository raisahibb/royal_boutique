import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase/config'
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp, getDoc
} from 'firebase/firestore'

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
  const { user } = useAuth()
  const uid = user?.uid || null   // safe uid shorthand

  const [items, setItems]             = useState([])
  const [wishlist, setWishlist]       = useState([])
  const [isOpen, setIsOpen]           = useState(false)
  const [isWishlistOpen, setWishlistOpen] = useState(false)
  const [toasts, setToasts]           = useState([])

  // Live ref of items so callbacks always see fresh data without re-creating
  const itemsRef    = useRef(items)
  const wishlistRef = useRef(wishlist)
  useEffect(() => { itemsRef.current = items },    [items])
  useEffect(() => { wishlistRef.current = wishlist }, [wishlist])

  const mergedOnce = useRef(false)   // guard: merge guest → Firestore only once per login

  /* ─────────────────────────────────────────────
     Toast
  ───────────────────────────────────────────── */
  function showToast(message) {
    const id = Date.now()
    setToasts(p => [...p, { id, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  /* ─────────────────────────────────────────────
     Guest localStorage sync (no user)
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!uid) localStorage.setItem('rb_cart', JSON.stringify(items))
  }, [items, uid])

  useEffect(() => {
    if (!uid) localStorage.setItem('rb_wishlist', JSON.stringify(wishlist))
  }, [wishlist, uid])

  /* ─────────────────────────────────────────────
     Firestore real-time listeners (logged-in)
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!uid) {
      // Reset to localStorage when user logs out
      mergedOnce.current = false
      try {
        setItems(JSON.parse(localStorage.getItem('rb_cart'))    || [])
        setWishlist(JSON.parse(localStorage.getItem('rb_wishlist')) || [])
      } catch { setItems([]); setWishlist([]) }
      return
    }

    console.log('[Cart] User logged in:', uid, '— attaching Firestore listeners')

    /* 1. Merge any guest cart/wishlist into Firestore (once per login) */
    const mergeGuestData = async () => {
      if (mergedOnce.current) return
      mergedOnce.current = true

      const localCart     = (() => { try { return JSON.parse(localStorage.getItem('rb_cart'))     || [] } catch { return [] } })()
      const localWishlist = (() => { try { return JSON.parse(localStorage.getItem('rb_wishlist')) || [] } catch { return [] } })()

      if (localCart.length === 0 && localWishlist.length === 0) return

      console.log(`[Cart] Merging ${localCart.length} guest cart + ${localWishlist.length} wishlist items → Firestore`)
      try {
        const batch = writeBatch(db)
        for (const item of localCart) {
          // Check if it already exists so we don't clobber Firestore quantity
          const existing = await getDoc(doc(db, 'users', uid, 'cart', item.cartKey))
          if (existing.exists()) continue          // skip — Firestore wins
          batch.set(
            doc(db, 'users', uid, 'cart', item.cartKey),
            { ...item, addedAt: serverTimestamp() }
          )
        }
        for (const item of localWishlist) {
          const existing = await getDoc(doc(db, 'users', uid, 'wishlist', item.id))
          if (existing.exists()) continue
          batch.set(
            doc(db, 'users', uid, 'wishlist', item.id),
            { ...item, addedAt: serverTimestamp() }
          )
        }
        await batch.commit()
        localStorage.removeItem('rb_cart')
        localStorage.removeItem('rb_wishlist')
        console.log('[Cart] Guest data merged successfully')
      } catch (err) {
        console.error('[Cart] Merge error:', err)
      }
    }

    mergeGuestData()

    /* 2. Real-time listeners */
    const unsubCart = onSnapshot(
      collection(db, 'users', uid, 'cart'),
      snap => {
        const dbItems = snap.docs.map(d => ({ ...d.data() }))
        dbItems.sort((a, b) => (a.addedAt?.toMillis?.() || 0) - (b.addedAt?.toMillis?.() || 0))
        console.log(`[Cart] Firestore cart update → ${dbItems.length} items for user ${uid}`)
        setItems(dbItems)
      },
      err => console.error('[Cart] onSnapshot cart error:', err)
    )

    const unsubWishlist = onSnapshot(
      collection(db, 'users', uid, 'wishlist'),
      snap => {
        const dbWl = snap.docs.map(d => ({ ...d.data() }))
        dbWl.sort((a, b) => (a.addedAt?.toMillis?.() || 0) - (b.addedAt?.toMillis?.() || 0))
        console.log(`[Cart] Firestore wishlist update → ${dbWl.length} items for user ${uid}`)
        setWishlist(dbWl)
      },
      err => console.error('[Cart] onSnapshot wishlist error:', err)
    )

    return () => {
      console.log('[Cart] Detaching Firestore listeners for', uid)
      unsubCart()
      unsubWishlist()
    }
  }, [uid])

  /* ─────────────────────────────────────────────
     addToCart
  ───────────────────────────────────────────── */
  const addToCart = useCallback(async (product, selectedSize) => {
    const size        = selectedSize || product.sizes?.[0] || 'One Size'
    const stitchingKey = product.stitching?.id || 'unst'
    const cartKey     = `${product.id}-${size}-${stitchingKey}`

    // Always read from live ref to avoid stale closure
    const currentItems = itemsRef.current
    const existing     = currentItems.find(i => i.cartKey === cartKey)

    if (existing && existing.quantity >= 5) {
      showToast('Maximum 5 units per item reached')
      return
    }

    const baseItem = {
      id:           product.id,
      name:         product.name,
      price:        product.price,
      image:        product.images?.[0] || product.image || '',
      category:     product.category || '',
      selectedSize: size,
      stitching:    product.stitching || null,
      cartKey,
    }

    const newQty = existing ? existing.quantity + 1 : 1

    // Optimistic UI
    setItems(prev =>
      existing
        ? prev.map(i => i.cartKey === cartKey ? { ...i, quantity: newQty } : i)
        : [...prev, { ...baseItem, quantity: 1 }]
    )

    // Firestore write
    if (uid) {
      console.log(`[Cart] Saving cart to Firestore for user: ${uid}`)
      try {
        await setDoc(
          doc(db, 'users', uid, 'cart', cartKey),
          {
            ...baseItem,
            quantity:  newQty,
            addedAt:   existing?.addedAt ?? serverTimestamp(),
          },
          { merge: true }
        )
        console.log('[Cart] Cart saved successfully — cartKey:', cartKey)
      } catch (err) {
        console.error('[Cart] addToCart Firestore error:', err)
        showToast('Failed to sync cart. Please try again.')
      }
    }

    showToast(`${product.name} (${size}) added to cart`)
    setIsOpen(true)
  }, [uid])   // uid is the only external dep — items accessed via ref

  /* ─────────────────────────────────────────────
     removeFromCart
  ───────────────────────────────────────────── */
  const removeFromCart = useCallback(async (cartKey) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey))    // optimistic

    if (uid) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'cart', cartKey))
        console.log('[Cart] Removed from Firestore — cartKey:', cartKey)
      } catch (err) {
        console.error('[Cart] removeFromCart error:', err)
      }
    }
  }, [uid])

  /* ─────────────────────────────────────────────
     updateQuantity
  ───────────────────────────────────────────── */
  const updateQuantity = useCallback(async (cartKey, delta) => {
    const existing = itemsRef.current.find(i => i.cartKey === cartKey)
    if (!existing) return

    const newQty = existing.quantity + delta
    if (newQty <= 0) { removeFromCart(cartKey); return }
    const finalQty = Math.min(newQty, 5)

    setItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity: finalQty } : i))

    if (uid) {
      try {
        await setDoc(
          doc(db, 'users', uid, 'cart', cartKey),
          { quantity: finalQty },
          { merge: true }
        )
      } catch (err) {
        console.error('[Cart] updateQuantity error:', err)
      }
    }
  }, [uid, removeFromCart])

  /* ─────────────────────────────────────────────
     clearCart
  ───────────────────────────────────────────── */
  const clearCart = useCallback(async () => {
    const snapshot = itemsRef.current
    setItems([])

    if (uid && snapshot.length > 0) {
      try {
        const batch = writeBatch(db)
        snapshot.forEach(i => batch.delete(doc(db, 'users', uid, 'cart', i.cartKey)))
        await batch.commit()
        console.log('[Cart] Cart cleared in Firestore')
      } catch (err) {
        console.error('[Cart] clearCart error:', err)
      }
    }
  }, [uid])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal   = items.reduce((s, i) => s + i.price * i.quantity, 0)

  /* ─────────────────────────────────────────────
     Wishlist
  ───────────────────────────────────────────── */
  const toggleWishlist = useCallback(async (product) => {
    // Firestore doc IDs must be strings — product.id may be a number
    const productId = String(product.id)
    const exists = wishlistRef.current.find(i => String(i.id) === productId)

    if (exists) {
      setWishlist(prev => prev.filter(i => String(i.id) !== productId))

      if (uid) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'wishlist', productId))
          console.log('[Cart] Removed from wishlist in Firestore:', productId)
        } catch (e) { console.error('[Cart] toggleWishlist remove error:', e) }
      }
      showToast('Removed from Wishlist')
    } else {
      const newItem = {
        id:       productId,          // always a string
        name:     product.name,
        price:    product.price,
        category: product.category || '',
        image:    product.images?.[0] || product.image || '',
      }
      setWishlist(prev => [...prev, newItem])

      if (uid) {
        try {
          await setDoc(
            doc(db, 'users', uid, 'wishlist', productId),
            { ...newItem, addedAt: serverTimestamp() }
          )
          console.log('[Cart] Added to wishlist in Firestore:', productId)
        } catch (e) { console.error('[Cart] toggleWishlist add error:', e) }
      }
      showToast('♡ Added to Wishlist')
    }
  }, [uid])   // wishlist accessed via ref

  const isWishlisted  = useCallback((productId) => wishlistRef.current.some(i => String(i.id) === String(productId)), [])
  const wishlistCount = wishlist.length

  return (
    <CartContext.Provider value={{
      items, isOpen, setIsOpen,
      addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, subtotal,
      toasts, showToast,
      wishlist, isWishlistOpen, setWishlistOpen,
      toggleWishlist, isWishlisted, wishlistCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}
