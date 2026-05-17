import React, { useState, useEffect } from 'react'
import './index.css'
import CollectionsSection from './components/CollectionsSection'
import AppointmentModal from './components/AppointmentModal'
import ContactModal from './components/ContactModal'
import UserProfile from './components/UserProfile'
import CheckoutPage from './components/CheckoutPage'
import LoginModal from './components/LoginModal'
import SignupModal from './components/SignupModal'
import { CartProvider, useCart } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ShoppingBag, Heart, Menu, X, User, LogOut, ChevronDown, Calendar, Package, ArrowUp } from 'lucide-react'
import { auth } from './firebase/config'
import { applyActionCode } from 'firebase/auth'

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4'

const NAV_LINKS = ['Home', 'Collections', 'Book Appointment', 'Contact']

interface NavLink {
  name: string;
  href: string;
}

/* ─────────────────────────────────────────────
   Corner accent square
───────────────────────────────────────────── */
interface CornerProps {
  pos: 'tl' | 'tr' | 'bl' | 'br';
}

function Corner({ pos }: CornerProps) {
  const posMap = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }
  return (
    <span className={`hidden sm:block absolute ${posMap[pos]} w-[7px] h-[7px] bg-white`} />
  )
}

/* ─────────────────────────────────────────────
   App — CartProvider is in main.jsx, not here
───────────────────────────────────────────── */
/* ── Inner app (needs both CartContext + AuthContext) ── */
function AppInner() {
  const { totalItems, setIsOpen, wishlistCount, setWishlistOpen } = useCart()
  const { user, logout, completeSignupFromURL } = useAuth()
  const [mobileOpen,      setMobileOpen]      = useState<boolean>(false)
  const [apptOpen,        setApptOpen]        = useState<boolean>(false)
  const [contactOpen,     setContactOpen]     = useState<boolean>(false)
  const [profileOpen,     setProfileOpen]     = useState<boolean>(false)
  const [profileInitialTab, setProfileInitialTab] = useState<string>('profile')
  const [checkoutOpen,    setCheckoutOpen]    = useState<boolean>(false)
  const [authModal,       setAuthModal]       = useState<{ open: boolean; type: 'login' | 'signup' }>({ open: false, type: 'login' })
  const [pendingCheckout, setPendingCheckout] = useState<boolean>(false)
  const [userDropdown,    setUserDropdown]    = useState<boolean>(false)
  const [showScrollTop,   setShowScrollTop]   = useState<boolean>(false)

  function openLogin()  { setAuthModal({ open: true, type: 'login'  }) }
  function openSignup() { setAuthModal({ open: true, type: 'signup' }) }
  function closeAuth()  { setAuthModal((p) => ({ ...p, open: false })) }

  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 4000)
  }

  /* Check for email verification success */
  useEffect(() => {
    const handleEmailVerification = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const mode = urlParams.get('mode')
      const oobCode = urlParams.get('oobCode')
      const verified = urlParams.get('verified')
      
      if ((mode === 'verifyEmail' && oobCode) || verified === 'true') {
        try {
          // Apply the verification code
          if (oobCode) {
            await applyActionCode(auth, oobCode)
          }
          
          // Reload current user to get updated emailVerified status
          if (auth.currentUser) {
            await auth.currentUser.reload()
            
            // User is now verified AND logged in!
            if (auth.currentUser.emailVerified) {
               await completeSignupFromURL(auth.currentUser)
               showToast('Email verified! Welcome to Royal Boutique.')
               setAuthModal((p) => ({ ...p, open: false })) // Auto-close any modal
            }
          } else {
            // User not logged in (rare case) — show message to login
            showToast('Email verified! Please log in to continue.')
          }
          
          // Clean URL
          window.history.replaceState({}, '', '/')
          
        } catch (error) {
          console.error('Verification error:', error)
          showToast('Verification failed. Please try again or log in.')
          window.history.replaceState({}, '', '/')
        }
      }
    }
    
    handleEmailVerification()
  }, [completeSignupFromURL])

  /* Close dropdown on outside click — bubble phase so button handlers fire first */
  useEffect(() => {
    if (!userDropdown) return
    const handler = (e: MouseEvent) => {
      const wrap = document.getElementById('user-dropdown-wrapper')
      if (wrap && !wrap.contains(e.target as Node)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [userDropdown])

  /* Lock scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
  }, [mobileOpen])

  /* Scroll event for Back to Top button */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setShowScrollTop(window.scrollY > 300)
      }, 50)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openAppt() {
    setMobileOpen(false)
    setApptOpen(true)
  }

  function openContact() {
    setMobileOpen(false)
    setContactOpen(true)
  }

  return (
    <div className="w-full bg-[#0e0e0e]" style={{ fontFamily: 'Barlow, sans-serif' }}>

      {/* ── Toast Notification ── */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] 
                        bg-gradient-to-r from-[#f8f8f8] to-[#e8e8e8] 
                        text-[#171717] font-semibold px-8 py-3.5 rounded-full 
                        shadow-[0_10px_40px_rgba(255,255,255,0.15)] 
                        border border-white/20"
             style={{ animation: 'loginFadeIn 0.3s ease-out both' }}>
          {toast.message}
        </div>
      )}

      {/* ── Floating Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-black/20 backdrop-blur-sm">
        {/* Brand */}
        <div className="w-40 md:w-48 lg:w-56 h-10 relative flex items-center">
          <img
            src="/LOGO.png"
            alt="Royal Boutique Logo"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-auto object-contain select-none drop-shadow-lg"
          />
        </div>

        {/* Desktop Nav links */}
        <ul className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link} className="flex">
              {link === 'Book Appointment' ? (
                <button
                  onClick={openAppt}
                  className="z-10 inline-flex items-center justify-center text-white text-sm font-medium px-4 py-2 rounded-md
                             transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                  style={{ fontFamily: 'Barlow, sans-serif' }}
                >
                  {link}
                </button>
              ) : link === 'Contact' ? (
                <button
                  onClick={openContact}
                  className="inline-flex items-center justify-center text-white text-sm font-medium px-4 py-2 rounded-md
                             transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                  style={{ fontFamily: 'Barlow, sans-serif' }}
                >
                  {link}
                </button>
              ) : (
                <a
                  href={link === 'Collections' ? '#collections' : '#'}
                  className="inline-flex items-center justify-center text-white text-sm font-medium px-4 py-2 rounded-md
                             transition-colors duration-200 hover:bg-white/10"
                  style={{ fontFamily: 'Barlow, sans-serif' }}
                >
                  {link}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-2">
          {/* Wishlist */}
          <button
            onClick={() => setWishlistOpen(true)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>
          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full">
                {totalItems}
              </span>
            )}
          </button>
          {/* Auth */}
          {user ? (
            <div id="user-dropdown-wrapper" className="relative ml-1">
              {/* Trigger button */}
              <button
                id="user-menu-btn"
                onClick={() => setUserDropdown((p) => !p)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                           text-white/80 text-sm transition-all duration-200 cursor-pointer"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-purple-300
                               flex items-center justify-center text-[11px] font-bold text-[#1a1a1a] shadow-[0_2px_8px_rgba(251,191,36,0.15)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span>Hi, {user.name.split(' ')[0]}</span>
                <ChevronDown
                  size={13}
                  className={`text-white/40 transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown panel */}
              {userDropdown && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-48
                             bg-gradient-to-br from-[#1e1e1e] to-[#141414]
                             border border-white/10 rounded-xl shadow-2xl shadow-black/60
                             overflow-hidden z-[100]"
                  style={{ animation: 'ddFadeIn 0.15s ease-out both' }}
                >
                  {/* User info row */}
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-white text-sm font-medium truncate" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      {user.name}
                    </p>
                    <p className="text-white/40 text-xs truncate mt-0.5" style={{ fontFamily: 'Barlow, sans-serif' }}>
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <button
                      id="user-profile-btn"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70
                                 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                      style={{ fontFamily: 'Barlow, sans-serif' }}
                      onClick={() => {
                        setUserDropdown(false)
                        setProfileInitialTab('profile')
                        setProfileOpen(true)
                      }}
                    >
                      <User size={14} className="text-white/40" />
                      Profile
                    </button>

                    <button
                      id="user-orders-btn"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70
                                 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                      style={{ fontFamily: 'Barlow, sans-serif' }}
                      onClick={() => {
                        setUserDropdown(false)
                        setProfileInitialTab('orders')
                        setProfileOpen(true)
                      }}
                    >
                      <ShoppingBag size={14} className="text-white/40" />
                      My Orders
                    </button>

                    <button
                      id="user-appts-btn"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70
                                 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                      style={{ fontFamily: 'Barlow, sans-serif' }}
                      onClick={() => {
                        setUserDropdown(false)
                        setProfileInitialTab('appointments')
                        setProfileOpen(true)
                      }}
                    >
                      <Calendar size={14} className="text-white/40" />
                      My Appointments
                    </button>

                    <div className="mx-3 my-1 h-px bg-white/8" />

                    <button
                      id="user-logout-btn"
                      onClick={async () => {
                        console.log('[Nav] Logout button clicked')
                        setUserDropdown(false)
                        await logout()
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80
                                 hover:text-red-300 hover:bg-red-500/8 transition-colors duration-150 cursor-pointer"
                      style={{ fontFamily: 'Barlow, sans-serif' }}
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </div>
              )}

              <style>{`
                @keyframes ddFadeIn {
                  from { opacity: 0; transform: translateY(-6px) scale(0.97) }
                  to   { opacity: 1; transform: translateY(0)    scale(1)    }
                }
              `}</style>
            </div>
          ) : (
            <button
              id="navbar-login-btn"
              onClick={openLogin}
              className="inline-flex items-center justify-center text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 hover:bg-white/10 cursor-pointer"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Login
            </button>
          )}
        </div>

        {/* Action Buttons (Mobile) */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setWishlistOpen(true)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full">
                {totalItems}
              </span>
            )}
          </button>
          {!user && (
            <button
              onClick={openLogin}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
            >
              <User size={18} />
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Panel (Slide-over) ── */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm z-[110] bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] border-l border-white/5 shadow-2xl shadow-black flex flex-col transition-transform duration-500 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <img src="/LOGO.png" alt="Royal Boutique" className="h-6 w-auto object-contain drop-shadow-md" />
          <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto custom-scroll py-4 px-6 flex flex-col gap-2">
          {/* Main Links */}
          <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
            {[
              { label: 'Home', action: () => { setMobileOpen(false); window.location.hash = '' } },
              { label: 'Collections', action: () => { setMobileOpen(false); window.location.hash = 'collections' } },
              { label: 'Book Appointment', action: () => { setMobileOpen(false); openAppt() } },
              { label: 'Contact', action: () => { setMobileOpen(false); openContact() } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="group flex items-center justify-between w-full py-3.5 text-left transition-all duration-300 cursor-pointer"
              >
                <span className="text-xl text-white/70 group-hover:text-white group-hover:pl-2 transition-all duration-300 font-light tracking-wide" style={{ fontFamily: 'Barlow, sans-serif' }}>
                  {item.label}
                </span>
                <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">✦</span>
              </button>
            ))}
          </div>

          {/* User Links / Additional Links */}
          <div className="pt-4 flex flex-col gap-1.5">
            {user && <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2 ml-1" style={{ fontFamily: 'Barlow, sans-serif' }}>My Account</p>}
            
            {user && (
              <>
                <button
                  onClick={() => { setProfileInitialTab('profile'); setProfileOpen(true); setMobileOpen(false) }}
                  className="group flex items-center gap-4 w-full py-3.5 px-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <div className="text-white/30 group-hover:text-accent transition-colors duration-300">
                    <User size={18}/>
                  </div>
                  <span className="text-[15px] text-white/60 group-hover:text-white transition-colors duration-300 font-medium" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    My Profile
                  </span>
                </button>
                <button
                  onClick={() => { setProfileInitialTab('appointments'); setProfileOpen(true); setMobileOpen(false) }}
                  className="group flex items-center gap-4 w-full py-3.5 px-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <div className="text-white/30 group-hover:text-accent transition-colors duration-300">
                    <Calendar size={18}/>
                  </div>
                  <span className="text-[15px] text-white/60 group-hover:text-white transition-colors duration-300 font-medium" style={{ fontFamily: 'Barlow, sans-serif' }}>
                    My Appointments
                  </span>
                </button>
              </>
            )}

            <button
              onClick={() => { setWishlistOpen(true); setMobileOpen(false) }}
              className="group flex items-center gap-4 w-full py-3.5 px-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all text-left cursor-pointer"
            >
              <div className="text-white/30 group-hover:text-accent transition-colors duration-300">
                <Heart size={18}/>
              </div>
              <span className="text-[15px] text-white/60 group-hover:text-white transition-colors duration-300 font-medium" style={{ fontFamily: 'Barlow, sans-serif' }}>
                View Wishlist
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-[#000000] to-transparent flex flex-col gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => { setIsOpen(true); setMobileOpen(false) }}
              className="relative flex-1 flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl bg-white/3 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center w-3.5 h-3.5 bg-accent text-accent-muted text-[8px] font-bold rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ fontFamily: 'Barlow, sans-serif' }}>View Cart</span>
            </button>
            <button
              onClick={() => { 
                setMobileOpen(false)
                if (user) {
                  setProfileInitialTab('orders')
                  setProfileOpen(true)
                } else {
                  openLogin()
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl bg-white/3 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <Package size={18} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ fontFamily: 'Barlow, sans-serif' }}>My Orders</span>
            </button>
          </div>

          {user ? (
            <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-purple-300 flex items-center justify-center text-xs font-bold text-[#1a1a1a]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs text-white font-medium truncate" style={{ fontFamily: 'Barlow, sans-serif' }}>{user.name}</span>
                  <span className="text-[10px] text-white/40 truncate" style={{ fontFamily: 'Barlow, sans-serif' }}>{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); openLogin() }}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-accent-muted to-rose-500/20 border border-accent/30 text-accent font-semibold text-sm tracking-widest uppercase hover:bg-accent/20 transition-colors cursor-pointer"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative w-full h-screen overflow-hidden overflow-x-hidden">

        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8 pt-20 pb-32">

          {/* Liquid-glass Badge */}
          <div
            className="flex items-center justify-center rounded-full
                       bg-white/10 backdrop-blur-sm p-[3px]
                       transition-colors duration-200 hover:bg-white/15 cursor-default"
          >
            <div
              className="flex items-center gap-2 bg-white/90 backdrop-blur-md
                         rounded-full px-4 py-1.5"
            >
              <span
                className="text-[#171717] text-xs font-semibold tracking-wider uppercase"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              >
                New Collection Arrived
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="relative inline-block px-8 py-6">
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />

            <h1 className="text-center leading-tight">
              <span
                className="block text-white font-light tracking-tight
                           text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
                style={{ fontFamily: 'Barlow, sans-serif' }}
              >
                Wear the art of
              </span>
              <span
                className="block text-white italic
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
              >
                royal elegance
              </span>
            </h1>
          </div>

          {/* Sub-headline */}
          <p
            className="max-w-xl w-full text-center text-white/75 px-6 text-lg font-light leading-relaxed"
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            Royal Boutique brings you handcrafted fashion where every stitch tells
            your story. Explore our exclusive collections or book a personal styling session.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 px-6">
            <button
              onClick={() => setApptOpen(true)}
              className="z-10 inline-flex items-center justify-center rounded-sm bg-[#f8f8f8] hover:bg-white transition-colors duration-200
                         px-6 py-3 sm:px-10 sm:py-4 text-base font-medium text-[#171717] cursor-pointer"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Book Appointment
            </button>

            <a
              href="#collections"
              className="inline-flex items-center justify-center rounded-sm border border-white/30 hover:bg-white/10 transition-colors duration-200
                         px-6 py-3 sm:px-10 sm:py-4 text-base font-medium text-white cursor-pointer"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              Explore Collection
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span
            className="text-white/40 text-[10px] tracking-widest uppercase"
            style={{ fontFamily: 'Barlow, sans-serif' }}
          >
            Scroll
          </span>
          <div className="w-[1px] h-8 bg-white/20 relative overflow-hidden rounded-full">
            <div className="absolute inset-x-0 top-0 h-full bg-white/60 animate-bounce" />
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════
          COLLECTIONS SECTION
      ══════════════════════════════════════ */}
      <CollectionsSection onCheckout={() => setCheckoutOpen(true)} />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="w-full flex items-center justify-center px-10 py-8 border-t border-white/10">
        <p
          className="text-white/30 text-xs tracking-widest uppercase"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          © 2026 Royal Boutique. All Rights Reserved.
        </p>
      </footer>

      {/* ── Appointment Modal ── */}
      <AppointmentModal isOpen={apptOpen} onClose={() => setApptOpen(false)} />

      {/* ── Contact Modal ── */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />

      {/* ── User Profile ── */}
      <UserProfile isOpen={profileOpen} onClose={() => setProfileOpen(false)} initialTab={profileInitialTab as any} />

      {/* ── Checkout Page (full-screen overlay) ── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[250]">
          <CheckoutPage
            onBack={() => setCheckoutOpen(false)}
            onViewOrders={() => {
              setCheckoutOpen(false)
              setProfileInitialTab('orders')
              setProfileOpen(true)
            }}
          />
        </div>
      )}

      {/* ── Auth Modals ── */}
      <LoginModal
        isOpen={authModal.open && authModal.type === 'login'}
        onClose={closeAuth}
        onSwitchToSignup={() => setAuthModal({ open: true, type: 'signup' })}
        onLoginSuccess={() => {
          closeAuth()
          if (pendingCheckout) {
            setPendingCheckout(false)
            setIsOpen(true)
          }
        }}
      />
      <SignupModal
        isOpen={authModal.open && authModal.type === 'signup'}
        onClose={closeAuth}
        onSwitchToLogin={() => setAuthModal({ open: true, type: 'login' })}
        onSignupSuccess={() => {
          closeAuth()
          if (pendingCheckout) {
            setPendingCheckout(false)
            setIsOpen(true)
          }
        }}
      />

      {/* ── Back to Top Button ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 p-3.5
                    rounded-full bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 
                    backdrop-blur-md border border-accent/30 text-accent 
                    shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_15px_rgba(251,191,36,0.25)]
                    hover:bg-accent hover:text-[#1a1a1a]
                    transition-all duration-300 ease-in-out cursor-pointer group
                    ${showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Back to Top"
      >
        <ArrowUp size={20} className="md:w-5 md:h-5 transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.5} />
      </button>

    </div>
  )
}

/* ── Public default export wraps with Providers ── */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  )
}
