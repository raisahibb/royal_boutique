import React, { useState, useEffect } from 'react'
import './index.css'
import CollectionsSection from './components/CollectionsSection'
import AppointmentModal from './components/AppointmentModal'
import { useCart } from './context/CartContext'
import { ShoppingBag, Heart, Menu, X } from 'lucide-react'

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
export default function App() {
  const { totalItems, setIsOpen, wishlistCount, setWishlistOpen } = useCart()
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [apptOpen, setApptOpen] = useState<boolean>(false)

  /* Lock scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
  }, [mobileOpen])

  function openAppt() {
    setMobileOpen(false)
    setApptOpen(true)
  }

  return (
    <div className="w-full bg-[#0e0e0e]" style={{ fontFamily: 'Barlow, sans-serif' }}>

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
        <div className="w-[100px] hidden md:flex items-center justify-end gap-2">
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
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Panel ── */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md
                    transition-opacity duration-300 flex flex-col items-center pt-24 gap-2
                    ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {NAV_LINKS.map((link) => (
          link === 'Book Appointment' ? (
            <button
              key={link}
              onClick={openAppt}
              className="w-full text-center text-white text-2xl font-light tracking-wide py-4
                         hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              {link}
            </button>
          ) : (
            <a
              key={link}
              href={link === 'Collections' ? '#collections' : '#'}
              onClick={(e) => {
                e.preventDefault()
                if (link === 'Collections') {
                  setMobileOpen(false)
                  window.location.hash = 'collections'
                } else {
                  setMobileOpen(false)
                }
              }}
              className="w-full text-center text-white text-2xl font-light tracking-wide py-4
                         hover:bg-white/5 transition-colors duration-200"
              style={{ fontFamily: 'Barlow, sans-serif' }}
            >
              {link}
            </a>
          )
        ))}

        <div className="w-full max-w-xs h-px bg-white/10 mx-8 my-4" />

        <button
          onClick={() => { setWishlistOpen(true); setMobileOpen(false) }}
          className="w-full max-w-xs mx-auto bg-white/10 hover:bg-white/15 text-white text-sm
                     tracking-widest uppercase py-3 rounded-sm transition-colors duration-200 cursor-pointer"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          View Wishlist
        </button>

        <button
          onClick={() => { setIsOpen(true); setMobileOpen(false) }}
          className="w-full max-w-xs mx-auto bg-white/10 hover:bg-white/15 text-white text-sm
                     tracking-widest uppercase py-3 rounded-sm transition-colors duration-200 cursor-pointer"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          View Cart
        </button>
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
      <CollectionsSection />

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="w-full flex items-center justify-center px-10 py-8 border-t border-white/10">
        <p
          className="text-white/30 text-xs tracking-widest uppercase"
          style={{ fontFamily: 'Barlow, sans-serif' }}
        >
          © 2025 Royal Boutique. All Rights Reserved.
        </p>
      </footer>

      {/* ── Appointment Modal ── */}
      <AppointmentModal isOpen={apptOpen} onClose={() => setApptOpen(false)} />
    </div>
  )
}
