import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  applyActionCode
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

/* ── Context ── */
const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/* ── Helper: fetch Firestore profile ── */
async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch (err) {
    console.error('[Auth] fetchProfile error:', err)
    return null
  }
}

// Ensure persistence
setPersistence(auth, browserLocalPersistence).catch(console.error)

/* ── Provider ── */
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)   // merged Firebase + Firestore user
  const [isLoading, setIsLoading] = useState(true)

  /* ── Session listener — single source of truth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchProfile(firebaseUser.uid)
        setUser({
          uid:       firebaseUser.uid,
          email:     firebaseUser.email,
          name:      profile?.name  || firebaseUser.displayName || 'User',
          phone:     profile?.phone || '',
          addresses: profile?.addresses || [],
          orders:    profile?.orders || [],
          photoURL:  firebaseUser.photoURL || null,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })
    return unsub
  }, [])

  /* ─────────────────────────────────────────────
     login(email, password) → { ok, error }
  ───────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    console.log('[Auth] Login started:', email)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      
      await cred.user.reload()

      if (!cred.user.emailVerified) {
        // Send verification email again
        await sendEmailVerification(cred.user, {
          url: window.location.origin + '?verified=true',
          handleCodeInApp: true
        })
        
        await signOut(auth)
        return { ok: false, error: 'Please verify your email before logging in. Check your inbox (and SPAM folder).' }
      }
      
      try {
        await updateDoc(doc(db, 'users', cred.user.uid), {
          lastLogin: serverTimestamp()
        })
      } catch (err) {
        console.error('[Auth] Failed to update lastLogin:', err)
      }

      console.log('[Auth] Login success, UID:', cred.user.uid)
      return { ok: true }
    } catch (err) {
      console.error('[Auth] Login error:', err.code, err.message)
      return { ok: false, error: friendlyError(err.code) }
    }
  }, [])

  /* ─────────────────────────────────────────────
     signup(name, email, phone, password) → { ok, error }
  ───────────────────────────────────────────── */
  const signup = useCallback(async (name, email, phone, password) => {
    console.log('[Auth] Starting signup:', email)
    try {
      /* 1 — Create Firebase Auth user */
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const { uid } = cred.user
      console.log('[Auth] Auth created, UID:', uid)

      /* 2 — Set displayName on the auth profile */
      await firebaseUpdateProfile(cred.user, { displayName: name.trim() })

      /* 3 — Store pending data in sessionStorage (NOT Firestore yet) */
      console.log('[Auth] Saving pending data to session storage...')
      sessionStorage.setItem('pendingSignup', JSON.stringify({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim()
      }))

      /* 4 — Send verification email immediately */
      await sendEmailVerification(cred.user, {
        url: window.location.origin + '?verified=true',
        handleCodeInApp: true
      })
      
      return { ok: true }
    } catch (err) {
      console.error('[Auth] Signup error:', err.code, err.message)
      return { ok: false, error: friendlyError(err.code) }
    }
  }, [])

  /* ─────────────────────────────────────────────
     googleLogin() → { ok, error }
  ───────────────────────────────────────────── */
  const googleLogin = useCallback(async () => {
    console.log('[Auth] Google login started')
    try {
      const provider = new GoogleAuthProvider()
      const cred     = await signInWithPopup(auth, provider)
      const { uid, displayName, email, photoURL } = cred.user

      /* Upsert Firestore doc — only on first Google sign-in */
      const snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) {
        console.log('[Auth] First Google login — creating Firestore doc')
        await setDoc(doc(db, 'users', uid), {
          uid,
          name:      displayName || 'User',
          email:     email || '',
          phone:     '',
          addresses: [],
          orders:    [],
          emailVerified: true,
          photoURL:  photoURL || null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(db, 'users', uid), {
          lastLogin: serverTimestamp()
        })
      }

      console.log('[Auth] Google login success, UID:', uid)
      return { ok: true }
    } catch (err) {
      console.error('[Auth] Google login error:', err.code, err.message)
      // User closed popup — don't show error
      if (err.code === 'auth/popup-closed-by-user') return { ok: false, error: '' }
      return { ok: false, error: friendlyError(err.code) }
    }
  }, [])

  /* ─────────────────────────────────────────────
     logout()
  ───────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logout started')
      await signOut(auth)
      setUser(null)
      console.log('[Auth] Logout successful')
    } catch (err) {
      console.error('[Auth] Logout error:', err)
    }
  }, [])

  /* ─────────────────────────────────────────────
     isAuthenticated()
  ───────────────────────────────────────────── */
  const isAuthenticated = useCallback(() => !!user, [user])

  /* ─────────────────────────────────────────────
     resendVerification(email, password)
  ───────────────────────────────────────────── */
  const resendVerification = useCallback(async (email, password) => {
    try {
      // Need to sign in again to get the user object to send email
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(cred.user, {
        url: window.location.origin + '?verified=true',
        handleCodeInApp: true
      })
      await signOut(auth)
      return { ok: true }
    } catch (err) {
      console.error('[Auth] Resend error:', err)
      return { ok: false, error: friendlyError(err.code) }
    }
  }, [])

  /* ─────────────────────────────────────────────
     completeSignupFromURL()
  ───────────────────────────────────────────── */
  const completeSignupFromURL = useCallback(async (updatedUser) => {
    const currentUser = updatedUser || auth.currentUser
    if (currentUser && currentUser.emailVerified) {
      
      const userRef = doc(db, 'users', currentUser.uid)
      const snap = await getDoc(userRef)
      
      if (!snap.exists()) {
        const pendingData = JSON.parse(sessionStorage.getItem('pendingSignup') || '{}')
        
        const userData = {
          uid: currentUser.uid,
          name: pendingData.name || currentUser.displayName || 'User',
          email: currentUser.email || pendingData.email || '',
          phone: pendingData.phone || '',
          addresses: [],
          orders: [],
          photoURL: currentUser.photoURL || null,
          emailVerified: true,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        }
        
        await setDoc(userRef, userData)
        sessionStorage.removeItem('pendingSignup')
        
        setUser({
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          addresses: userData.addresses,
          orders: userData.orders,
          photoURL: userData.photoURL
        })
      } else {
        // Doc exists, just update verified status and lastLogin
        await updateDoc(userRef, {
          emailVerified: true,
          lastLogin: serverTimestamp()
        })
        
        const data = snap.data()
        setUser({
          uid: currentUser.uid,
          name: data.name || currentUser.displayName || 'User',
          email: data.email || currentUser.email || '',
          phone: data.phone || '',
          addresses: data.addresses || [],
          orders: data.orders || [],
          photoURL: data.photoURL || currentUser.photoURL || null,
        })
      }
    }
  }, [])

  /* ─────────────────────────────────────────────
     updateUserProfile(updates)
  ───────────────────────────────────────────── */
  const updateUserProfile = useCallback(async (updates) => {
    if (!auth.currentUser) return { ok: false, error: 'Not logged in' }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates)
      setUser(prev => prev ? { ...prev, ...updates } : null)
      return { ok: true }
    } catch (err) {
      console.error('[Auth] Update profile error:', err)
      return { ok: false, error: err.message }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, googleLogin, resendVerification, isAuthenticated, completeSignupFromURL, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ── Firebase error code → human-friendly message ── */
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-blocked':           'Popup was blocked. Allow popups and try again.',
    'auth/user-disabled':           'This account has been disabled.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
