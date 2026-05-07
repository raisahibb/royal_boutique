import React, { useState, useEffect, useCallback } from 'react'
import {
  X, User, MapPin, ShoppingBag, Calendar, Settings,
  ChevronRight, LogOut, Edit2, Plus, Trash2, Check,
  Lock, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  deleteDoc, serverTimestamp, query, orderBy, where
} from 'firebase/firestore'
import {
  updatePassword, reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { db, auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import AddressForm, { emptyAddr } from './AddressForm'
import AppointmentModal from './AppointmentModal'
import MyOrders from './MyOrders'

/* ── Types ── */
type Tab = 'profile' | 'addresses' | 'orders' | 'appointments' | 'settings'
interface Address {
  id: string; type: string; fullName: string; phone: string
  addressLine1: string; addressLine2: string; city: string
  state: string; pincode: string; isDefault: boolean
}
interface Order {
  id: string; createdAt: any; total: number; status: string; items: any[]
}
interface Appointment {
  id: string; date: string; occasion: string; message: string; status: string; createdAt: any
}

/* ── Constants ── */
const FONT = { fontFamily: 'Barlow, sans-serif' }
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all'
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',      label: 'Profile',       icon: <User size={16} /> },
  { id: 'addresses',   label: 'Addresses',     icon: <MapPin size={16} /> },
  { id: 'orders',      label: 'Orders',        icon: <ShoppingBag size={16} /> },
  { id: 'appointments',label: 'Appointments',  icon: <Calendar size={16} /> },
  { id: 'settings',    label: 'Settings',      icon: <Settings size={16} /> },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-rose-400 bg-rose-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
  placed: 'text-blue-400 bg-blue-400/10',
  shipped: 'text-purple-400 bg-purple-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  new: 'text-rose-400 bg-rose-400/10',
}

/* ════════════════════════════════════════ */
export default function UserProfile({ isOpen, onClose, initialTab }: { isOpen: boolean; onClose: () => void; initialTab?: Tab }) {
  const { user, logout, updateUserProfile } = useAuth() as any
  const [tab, setTab]           = useState<Tab>(initialTab || 'profile')

  // When initialTab changes (e.g. opened from a different button), sync it
  useEffect(() => {
    if (isOpen && initialTab) setTab(initialTab)
  }, [isOpen, initialTab])
  const [addresses, setAddrs]   = useState<Address[]>([])
  const [orders, setOrders]     = useState<Order[]>([])
  const [appts, setAppts]       = useState<Appointment[]>([])
  const [toast, setToast]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [apptModalOpen, setApptModalOpen] = useState(false)

  /* ── scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  /* ── Escape ── */
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  /* ── Firestore listeners ── */
  useEffect(() => {
    if (!user?.uid || !isOpen) return
    const uid = user.uid

    const unsubAddr = onSnapshot(
      collection(db, 'users', uid, 'addresses'),
      snap => setAddrs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Address)))
    )
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', uid)),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
        // Sort in memory to avoid needing a Firestore composite index
        docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        setOrders(docs)
      },
      err => console.error("Orders sync error:", err)
    )
    const unsubAppts = onSnapshot(
      query(collection(db, 'appointments'), where('userId', '==', uid)),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))
        docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        setAppts(docs)
      },
      err => console.error("Appts sync error:", err)
    )

    return () => { unsubAddr(); unsubOrders(); unsubAppts() }
  }, [user?.uid, isOpen])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-[300] flex" style={{ animation: 'upFade 0.2s ease-out both' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slides in from right */}
      <div
        className="relative ml-auto flex h-full w-full max-w-[480px] flex-col overflow-hidden
                   bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a]
                   border-l border-white/5 shadow-2xl shadow-black/70"
        style={{ animation: 'upSlideIn 0.3s ease-out both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full
                            bg-gradient-to-br from-amber-200 via-rose-300 to-purple-300
                            text-sm font-bold text-[#1a1a1a] shadow">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white" style={FONT}>{user.name}</p>
              <p className="text-xs text-white/40" style={FONT}>{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full
                                               bg-white/5 text-white/50 hover:bg-white/10 hover:text-white
                                               transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>


        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20
                          px-4 py-2.5 text-sm text-green-400" style={FONT}>
            <Check size={14} /> {toast}
          </div>
        )}

        {/* Tab bar — scrollable but no visible scrollbar */}
        <div className="relative shrink-0 border-b border-white/5">
          <div className="flex overflow-x-auto up-tabs-scroll px-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-3.5 text-xs whitespace-nowrap
                            transition-all duration-200 cursor-pointer shrink-0
                            ${
                              tab === t.id
                                ? 'text-white'
                                : 'text-white/35 hover:text-white/65'
                            }`}
                style={FONT}
              >
                <span className={tab === t.id ? 'text-accent' : ''}>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {/* Gradient underline for active tab */}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]
                                  bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300
                                  rounded-full" />
                )}
              </button>
            ))}
          </div>
          {/* Right fade hint */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8
                          bg-gradient-to-l from-[#0f0f0f] to-transparent sm:hidden" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 up-scroll">
          {tab === 'profile'      && <ProfileTab user={user} updateUserProfile={updateUserProfile} showToast={showToast} />}
          {tab === 'addresses'    && <AddressesTab uid={user.uid} addresses={addresses} showToast={showToast} />}
          {tab === 'orders'       && <MyOrders orders={orders} onBookAppt={() => setApptModalOpen(true)} />}
          {tab === 'appointments' && <AppointmentsTab appts={appts} onBookAppt={() => setApptModalOpen(true)} />}
          {tab === 'settings'     && <SettingsTab logout={logout} showToast={showToast} />}
        </div>
      </div>

      {/* Appointment Modal — opened from orders/appts tabs */}
      <AppointmentModal
        isOpen={apptModalOpen}
        onClose={() => setApptModalOpen(false)}
        defaultOccasion="Custom Measurements / Personal Styling"
      />

      <style>{`
        @keyframes upFade { from { opacity:0 } to { opacity:1 } }
        @keyframes upSlideIn { from { opacity:0; transform:translateX(30px) } to { opacity:1; transform:translateX(0) } }
        /* Vertical content scroll */
        .up-scroll::-webkit-scrollbar { width:4px }
        .up-scroll::-webkit-scrollbar-track { background:transparent }
        .up-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:99px }
        .up-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.15) }
        .up-scroll { scrollbar-width:thin; scrollbar-color:rgba(255,255,255,0.08) transparent }
        /* Tab bar — hide scrollbar completely */
        .up-tabs-scroll { -ms-overflow-style:none; scrollbar-width:none }
        .up-tabs-scroll::-webkit-scrollbar { display:none }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════
   PROFILE TAB
══════════════════════════════════════ */
function ProfileTab({ user, updateUserProfile, showToast }: any) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' })
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    const res = await updateUserProfile(form)
    setLoading(false)
    if (res.ok) { showToast('Profile updated!'); setEditing(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full
                          bg-gradient-to-br from-amber-200 via-rose-300 to-purple-300
                          text-3xl font-bold text-[#1a1a1a] shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
            style={FONT}>
            <Edit2 size={12} /> Edit Profile
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3">
        <Field label="Full Name">
          {editing
            ? <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={FONT} />
            : <p className="text-white text-sm" style={FONT}>{user.name || '—'}</p>}
        </Field>
        <Field label="Email">
          <p className="text-white text-sm" style={FONT}>{user.email}</p>
          <p className="text-white/30 text-xs mt-0.5" style={FONT}>Email cannot be changed</p>
        </Field>
        <Field label="Phone">
          {editing
            ? <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={form.phone}
                     onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={FONT} />
            : <p className="text-white text-sm" style={FONT}>{user.phone || '—'}</p>}
        </Field>
      </div>

      {editing && (
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
            style={FONT}>Cancel</button>
          <button onClick={save} disabled={loading}
            className="flex-1 rounded-xl bg-white py-3 text-sm font-medium text-[#171717] hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-50"
            style={FONT}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   ADDRESSES TAB
══════════════════════════════════════ */
function AddressesTab({ uid, addresses, showToast }: any) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyAddr())
  const [loading, setLoading] = useState(false)

  async function handleSave(formData: any) {
    setLoading(true)
    try {
      if (editId) {
        await updateDoc(doc(db, 'users', uid, 'addresses', editId), { ...formData })
      } else {
        await addDoc(collection(db, 'users', uid, 'addresses'), { ...formData, isDefault: addresses.length === 0, createdAt: serverTimestamp() })
      }
      showToast(editId ? 'Address updated!' : 'Address added!')
      setAdding(false); setEditId(null); setForm(emptyAddr())
    } finally { setLoading(false) }
  }

  async function del(id: string) {
    await deleteDoc(doc(db, 'users', uid, 'addresses', id))
    showToast('Address removed')
  }

  async function setDefault(id: string) {
    for (const a of addresses) {
      await updateDoc(doc(db, 'users', uid, 'addresses', a.id), { isDefault: a.id === id })
    }
    showToast('Default address updated')
  }

  const showForm = adding || editId !== null

  return (
    <div className="flex flex-col gap-4">
      {!showForm && (
        <button onClick={() => { setAdding(true); setForm(emptyAddr()) }}
          className="flex items-center gap-2 w-full justify-center rounded-xl border border-white/10 border-dashed
                     py-3 text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
          style={FONT}>
          <Plus size={14} /> Add New Address
        </button>
      )}

      {showForm && (
        <AddressForm 
          key={editId || 'new-addr'}
          initial={form}
          onSave={handleSave}
          onCancel={() => { setAdding(false); setEditId(null) }}
          loading={loading}
        />
      )}

      {addresses.length === 0 && !showForm && (
        <EmptyState icon={<MapPin size={32} />} text="No saved addresses yet" />
      )}

      {addresses.map((a: Address) => (
        <div key={a.id} className="rounded-2xl bg-white/3 border border-white/8 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-white/60" style={FONT}>
                {a.type}
              </span>
              {a.isDefault && (
                <span className="text-xs text-rose-400" style={FONT}>★ Default</span>
              )}
            </div>
            <div className="flex gap-2">
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)}
                  className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer" style={FONT}>
                  Set Default
                </button>
              )}
              <button onClick={() => { setEditId(a.id); setForm({ ...a }); setAdding(false) }}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"><Edit2 size={13} /></button>
              <button onClick={() => del(a.id)}
                className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"><Trash2 size={13} /></button>
            </div>
          </div>
          <p className="text-sm text-white font-medium" style={FONT}>{a.fullName}</p>
          <p className="text-xs text-white/50 mt-0.5" style={FONT}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
          <p className="text-xs text-white/50" style={FONT}>{a.city}, {a.state} – {a.pincode}</p>
          <p className="text-xs text-white/40 mt-0.5" style={FONT}>{a.phone}</p>
        </div>
      ))}
    </div>
  )
}



/* ══════════════════════════════════════
   APPOINTMENTS TAB
══════════════════════════════════════ */
function AppointmentsTab({ appts, onBookAppt }: { appts: Appointment[]; onBookAppt: () => void }) {
  if (appts.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="text-white/15"><Calendar size={32} /></div>
      <p className="text-sm text-white/30" style={FONT}>No appointments booked</p>
      <button onClick={onBookAppt}
        className="flex items-center gap-2 rounded-xl bg-accent-tint border border-accent-glow px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
        style={{ fontFamily: 'Barlow, sans-serif', background: 'linear-gradient(110deg, rgba(254,205,211,0.08) 0%, rgba(196,181,253,0.08) 100%)', color: 'transparent', backgroundClip: 'unset' }}>
        <span style={{
          background: 'linear-gradient(110deg, #fecdd3 0%, #f9a8d4 40%, #c4b5fd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Calendar size={12} style={{ WebkitTextFillColor: 'initial', color: '#f9a8d4' }} />
          Book One!
        </span>
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {appts.map(a => {
        const isMeasurement = a.occasion?.toLowerCase().includes('measurement') || a.occasion?.toLowerCase().includes('styling')
        return (
          <div key={a.id}
            className={`rounded-2xl border p-4 ${
              isMeasurement ? 'bg-accent-tint border-accent-glow' : 'bg-white/3 border-white/8'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isMeasurement && <span className="text-accent text-xs">✦</span>}
                <p className="text-sm font-medium text-white" style={FONT}>{a.occasion}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[a.status] || 'text-white/50 bg-white/8'}`}
                    style={FONT}>{a.status}</span>
            </div>
            <p className="text-xs text-white/50" style={FONT}>📅 {a.date}</p>
            {a.message && (
              <p className="text-xs text-white/40 mt-1.5 line-clamp-2" style={FONT}>{a.message}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════
   SETTINGS TAB
══════════════════════════════════════ */
function SettingsTab({ logout, showToast }: any) {
  const [current, setCurrent]   = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPw, setShowPw]     = useState(false)

  async function changePassword() {
    setError('')
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return }
    if (newPw !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const u = auth.currentUser!
      const cred = EmailAuthProvider.credential(u.email!, current)
      await reauthenticateWithCredential(u, cred)
      await updatePassword(u, newPw)
      showToast('Password changed successfully!')
      setCurrent(''); setNewPw(''); setConfirm('')
    } catch (err: any) {
      setError(err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to change password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Change Password */}
      <section>
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3" style={FONT}>Change Password</p>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/3 border border-white/8 p-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5" style={FONT}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="Current Password"
                   value={current} onChange={e => setCurrent(e.target.value)}
                   className={inputCls + ' pr-10'} style={FONT} />
            <button onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 cursor-pointer">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input type="password" placeholder="New Password (min 6 chars)"
                 value={newPw} onChange={e => setNewPw(e.target.value)}
                 className={inputCls} style={FONT} />
          <input type="password" placeholder="Confirm New Password"
                 value={confirm} onChange={e => setConfirm(e.target.value)}
                 className={inputCls} style={FONT} />
          <button onClick={changePassword} disabled={loading}
            className="w-full rounded-xl bg-white py-3 text-sm font-medium text-[#171717] hover:bg-white/90
                       transition-colors cursor-pointer disabled:opacity-50 mt-1"
            style={FONT}>{loading ? 'Updating…' : 'Update Password'}</button>
        </div>
      </section>

      {/* Logout */}
      <section>
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3" style={FONT}>Account</p>
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20
                     bg-red-500/8 py-3.5 text-sm font-medium text-red-400
                     hover:bg-red-500/15 hover:border-red-400/30 transition-all cursor-pointer"
          style={FONT}>
          <LogOut size={15} /> Sign Out of Account
        </button>
      </section>
    </div>
  )
}

/* ── Shared helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1" style={FONT}>{label}</p>
      {children}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-white/15">{icon}</div>
      <p className="text-sm text-white/30" style={FONT}>{text}</p>
    </div>
  )
}
