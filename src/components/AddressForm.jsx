import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Check } from 'lucide-react'

const FONT = { fontFamily: 'Barlow, sans-serif' }
const inputCls = `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
  text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all`

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
]

const INDIAN_CITY_STATE_MAP = {
  "Agra": "Uttar Pradesh", "Ahmedabad": "Gujarat", "Ajmer": "Rajasthan", "Aligarh": "Uttar Pradesh", 
  "Allahabad": "Uttar Pradesh", "Amravati": "Maharashtra", "Amritsar": "Punjab", "Asansol": "West Bengal", 
  "Aurangabad": "Maharashtra", "Bareilly": "Uttar Pradesh", "Belgaum": "Karnataka", "Bengaluru": "Karnataka", 
  "Bhavnagar": "Gujarat", "Bhilai": "Chhattisgarh", "Bhiwandi": "Maharashtra", "Bhopal": "Madhya Pradesh", 
  "Bhubaneswar": "Odisha", "Bikaner": "Rajasthan", "Chandigarh": "Chandigarh", "Chennai": "Tamil Nadu", 
  "Coimbatore": "Tamil Nadu", "Cuttack": "Odisha", "Dehradun": "Uttarakhand", "Delhi": "Delhi", 
  "Dhanbad": "Jharkhand", "Durgapur": "West Bengal", "Faridabad": "Haryana", "Firozabad": "Uttar Pradesh", 
  "Ghaziabad": "Uttar Pradesh", "Gorakhpur": "Uttar Pradesh", "Gulbarga": "Karnataka", "Guntur": "Andhra Pradesh", 
  "Gurgaon": "Haryana", "Guwahati": "Assam", "Gwalior": "Madhya Pradesh", "Hubli-Dharwad": "Karnataka", 
  "Hyderabad": "Telangana", "Indore": "Madhya Pradesh", "Jabalpur": "Madhya Pradesh", "Jaipur": "Rajasthan", 
  "Jalandhar": "Punjab", "Jalgaon": "Maharashtra", "Jammu": "Jammu and Kashmir", "Jamnagar": "Gujarat", 
  "Jamshedpur": "Jharkhand", "Jhansi": "Uttar Pradesh", "Jodhpur": "Rajasthan", "Kakinada": "Andhra Pradesh", 
  "Kannur": "Kerala", "Kanpur": "Uttar Pradesh", "Kochi": "Kerala", "Kolhapur": "Maharashtra", 
  "Kolkata": "West Bengal", "Kota": "Rajasthan", "Kozhikode": "Kerala", "Kurnool": "Andhra Pradesh", 
  "Lucknow": "Uttar Pradesh", "Ludhiana": "Punjab", "Madurai": "Tamil Nadu", "Malegaon": "Maharashtra", 
  "Mangalore": "Karnataka", "Meerut": "Uttar Pradesh", "Moradabad": "Uttar Pradesh", "Mumbai": "Maharashtra", 
  "Mysore": "Karnataka", "Nagpur": "Maharashtra", "Nanded": "Maharashtra", "Nashik": "Maharashtra", 
  "Nellore": "Andhra Pradesh", "Noida": "Uttar Pradesh", "Patna": "Bihar", "Pondicherry": "Puducherry", 
  "Pune": "Maharashtra", "Raipur": "Chhattisgarh", "Rajahmundry": "Andhra Pradesh", "Rajkot": "Gujarat", 
  "Ranchi": "Jharkhand", "Rourkela": "Odisha", "Salem": "Tamil Nadu", "Sangli": "Maharashtra", 
  "Siliguri": "West Bengal", "Solapur": "Maharashtra", "Srinagar": "Jammu and Kashmir", "Surat": "Gujarat", 
  "Thiruvananthapuram": "Kerala", "Thrissur": "Kerala", "Tiruchirappalli": "Tamil Nadu", "Tirunelveli": "Tamil Nadu", 
  "Tiruppur": "Tamil Nadu", "Ujjain": "Madhya Pradesh", "Vadodara": "Gujarat", "Varanasi": "Uttar Pradesh", 
  "Vasai-Virar": "Maharashtra", "Vijayawada": "Andhra Pradesh", "Visakhapatnam": "Andhra Pradesh", "Warangal": "Telangana"
}

const MAJOR_INDIAN_CITIES = Object.keys(INDIAN_CITY_STATE_MAP)

export const emptyAddr = () => ({
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', type: 'home', isDefault: false
})

export function validateAddress(form) {
  const errs = {}
  if (!form.fullName || form.fullName.trim().length < 3) errs.fullName = 'Min 3 characters required'
  if (!form.phone || !/^\d{10}$/.test(form.phone)) errs.phone = 'Exactly 10 digits required'
  if (!form.addressLine1 || form.addressLine1.trim().length < 15) errs.addressLine1 = 'Min 15 characters required (Proper street address)'
  if (!form.city || form.city.trim().length < 2) errs.city = 'Min 2 characters required'
  if (!form.state) errs.state = 'Please select a state'
  if (form.pincode && !/^[1-9][0-9]{5}$/.test(form.pincode)) errs.pincode = 'Please enter a valid 6-digit Indian PIN code'
  return errs
}

export const capitalizeWords = (str) => {
  if (!str) return ''
  return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ')
}

export default function AddressForm({ initial = emptyAddr(), onSave, onCancel, loading, addrError }) {
  const [form, setForm] = useState(initial)
  const [touched, setTouched] = useState({})
  
  // Autocomplete state
  const [citySearch, setCitySearch] = useState(initial.city || '')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [cityFocusedIndex, setCityFocusedIndex] = useState(-1)
  const cityRef = useRef(null)

  // Pincode API state
  const [pinStatus, setPinStatus] = useState('idle') // idle | loading | success | error | fallback
  const [pinMessage, setPinMessage] = useState('')
  const pinCache = useRef({})

  const errs = validateAddress(form)
  const isFormValid = Object.keys(errs).length === 0 && pinStatus !== 'error'

  const u = f => e => {
    let val = e.target.value
    if (f === 'pincode' || f === 'phone') {
      val = val.replace(/\D/g, '') // only numbers allowed
    }
    setForm(p => ({ ...p, [f]: val }))
    if (!touched[f]) setTouched(p => ({ ...p, [f]: true }))
  }
  
  const handleBlur = (f) => {
    // Auto-format text fields on blur
    if (['fullName', 'addressLine1', 'addressLine2', 'city'].includes(f)) {
      setForm(p => ({ ...p, [f]: capitalizeWords(p[f]) }))
      if (f === 'city') setCitySearch(capitalizeWords(citySearch))
    }
    
    // delay blur for city so click event on dropdown options can fire
    if (f === 'city') {
      setTimeout(() => setTouched(p => ({ ...p, [f]: true })), 200)
    } else {
      setTouched(p => ({ ...p, [f]: true }))
    }
  }

  // Pincode Auto-detect Logic
  useEffect(() => {
    const pin = form.pincode
    if (!pin || pin.length < 6) {
      setPinStatus('idle'); setPinMessage('')
      return
    }
    if (pin.length === 6 && /^[1-9][0-9]{5}$/.test(pin)) {
      if (pinCache.current[pin]) {
        applyPinData(pinCache.current[pin])
        return
      }
      
      const timeoutId = setTimeout(async () => {
        setPinStatus('loading')
        setPinMessage('Verifying PIN code...')
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
          const data = await res.json()
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const po = data[0].PostOffice[0]
            const result = { city: po.District || po.Name, state: po.State }
            pinCache.current[pin] = result
            applyPinData(result)
          } else {
            setPinStatus('error')
            setPinMessage('This PIN code is invalid. Please check and try again.')
          }
        } catch (err) {
          setPinStatus('fallback')
          setPinMessage('Unable to verify PIN code. Please enter city and state manually.')
        }
      }, 400) // 400ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [form.pincode])

  const applyPinData = (data) => {
    setForm(p => ({ ...p, city: data.city, state: data.state }))
    setCitySearch(data.city)
    setTouched(p => ({ ...p, city: true, state: true, pincode: true }))
    setPinStatus('success')
    setPinMessage('Verified successfully')
    // Auto-focus city if we can
    if (cityRef.current) {
      const input = cityRef.current.querySelector('input')
      if (input) input.focus()
    }
  }

  // Handle City Autocomplete outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCityDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCities = useMemo(() => {
    if (citySearch.length < 2) return []
    const q = citySearch.toLowerCase()
    return MAJOR_INDIAN_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 10)
  }, [citySearch])

  const handleCityChange = (e) => {
    const val = e.target.value
    setCitySearch(val)
    setForm(p => ({ ...p, city: val }))
    setShowCityDropdown(true)
    setCityFocusedIndex(-1)
    if (!touched.city) setTouched(p => ({ ...p, city: true }))
  }

  const selectCity = (city) => {
    setCitySearch(city)
    const predictedState = INDIAN_CITY_STATE_MAP[city]
    setForm(p => ({ ...p, city, state: predictedState || p.state }))
    setShowCityDropdown(false)
    setTouched(p => ({ ...p, city: true, state: true }))
  }

  const handleCityKeyDown = (e) => {
    if (!showCityDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCityFocusedIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCityFocusedIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cityFocusedIndex >= 0 && filteredCities[cityFocusedIndex]) {
        selectCity(filteredCities[cityFocusedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowCityDropdown(false)
    }
  }

  const highlightMatch = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.substring(0, idx)}
        <span className="text-accent font-semibold">{text.substring(idx, idx + q.length)}</span>
        {text.substring(idx + q.length)}
      </>
    )
  }

  const fieldsTop = [
    { key: 'fullName', label: 'Full Name', placeholder: 'Enter full name' },
    { key: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', type: 'tel' },
    { key: 'addressLine1', label: 'Address Line 1', placeholder: 'House No., Building Name, Street Name' },
    { key: 'addressLine2', label: 'Address Line 2 (optional)', placeholder: 'Area, Sector, Colony, Landmark (Optional)' }
  ]

  const formattedAddressLines = [
    form.fullName ? capitalizeWords(form.fullName) : '',
    form.addressLine1 ? capitalizeWords(form.addressLine1) : '',
    form.addressLine2 ? capitalizeWords(form.addressLine2) : '',
    [form.city ? capitalizeWords(form.city) : '', form.state].filter(Boolean).join(', '),
    form.pincode ? `India - ${form.pincode}` : '',
    form.phone ? `Phone: +91 ${form.phone}` : ''
  ].filter(Boolean)

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
      <p className="text-xs uppercase tracking-widest text-white/40" style={FONT}>
        {initial.fullName ? 'Edit' : 'New'} Address
      </p>

      <div className="space-y-3 relative z-10">
        {fieldsTop.map(f => (
          <div key={f.key}>
            <input 
              type={f.type || 'text'}
              className={`${inputCls} ${errs[f.key] && touched[f.key] ? 'border-red-400/50 focus:border-red-400' : ''}`}
              placeholder={f.label}
              value={form[f.key]} 
              onChange={u(f.key)}
              onBlur={() => handleBlur(f.key)}
              style={FONT} 
            />
            {errs[f.key] && touched[f.key] && (
              <p className="text-[10px] text-red-400 mt-1 pl-1" style={FONT}>{errs[f.key]}</p>
            )}
          </div>
        ))}

        {/* Pincode */}
        <div>
          <input 
            type="text"
            className={`${inputCls} ${errs.pincode && touched.pincode ? 'border-red-400/50 focus:border-red-400' : ''}`}
            placeholder="PIN Code (Optional - helps us verify address)"
            value={form.pincode} 
            onChange={u('pincode')}
            onBlur={() => handleBlur('pincode')}
            style={FONT} 
            maxLength={6}
          />
          {errs.pincode && touched.pincode && pinStatus !== 'error' && (
            <p className="text-[10px] text-red-400 mt-1 pl-1" style={FONT}>{errs.pincode}</p>
          )}
          {pinStatus === 'loading' && (
            <div className="flex items-center gap-1.5 mt-1.5 pl-1">
              <div className="w-3 h-3 border-2 border-accent-glow border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-accent" style={FONT}>{pinMessage}</p>
            </div>
          )}
          {pinStatus === 'success' && (
            <div className="flex items-center gap-1 mt-1.5 pl-1 text-[10px] text-green-400" style={FONT}>
              <Check size={12} /> {pinMessage}
            </div>
          )}
          {pinStatus === 'error' && (
            <p className="text-[10px] text-red-400 mt-1.5 pl-1" style={FONT}>{pinMessage}</p>
          )}
          {pinStatus === 'fallback' && (
            <p className="text-[10px] text-rose-400 mt-1.5 pl-1" style={FONT}>{pinMessage}</p>
          )}
        </div>

        {/* City Autocomplete */}
        <div className="relative" ref={cityRef}>
          <input 
            type="text"
            className={`${inputCls} ${errs.city && touched.city ? 'border-red-400/50 focus:border-red-400' : ''}`}
            placeholder="City"
            value={citySearch} 
            onChange={handleCityChange}
            onFocus={() => {
              if (citySearch.length >= 2) setShowCityDropdown(true)
            }}
            onBlur={() => handleBlur('city')}
            onKeyDown={handleCityKeyDown}
            style={FONT} 
          />
          {errs.city && touched.city && (
            <p className="text-[10px] text-red-400 mt-1 pl-1" style={FONT}>{errs.city}</p>
          )}

          {/* Autocomplete Dropdown */}
          {showCityDropdown && citySearch.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, idx) => (
                  <div
                    key={city}
                    className={`px-4 py-2.5 text-sm text-white/80 cursor-pointer transition-colors
                      ${idx === cityFocusedIndex ? 'bg-white/10 text-white' : 'hover:bg-white/5'}
                    `}
                    style={FONT}
                    onClick={() => selectCity(city)}
                  >
                    {highlightMatch(city, citySearch)}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-white/40 italic" style={FONT}>
                  No matching cities found. (Custom city will be saved)
                </div>
              )}
            </div>
          )}
        </div>

        {/* State Dropdown */}
        <div>
          <select 
            className={`${inputCls} cursor-pointer appearance-none ${errs.state && touched.state ? 'border-red-400/50 focus:border-red-400' : ''}`}
            value={form.state}
            onChange={u('state')}
            onBlur={() => handleBlur('state')}
            style={{ ...FONT, colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
          >
            <option value="" disabled className="bg-[#1a1a1a]">Select State</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
            ))}
          </select>
          {errs.state && touched.state && (
            <p className="text-[10px] text-red-400 mt-1 pl-1" style={FONT}>{errs.state}</p>
          )}
        </div>

        {/* Type selection */}
        <select className={inputCls + ' cursor-pointer appearance-none'} value={form.type}
          onChange={u('type')}
          style={{ ...FONT, colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}>
          <option value="home" className="bg-[#1a1a1a]">🏠 Home</option>
          <option value="office" className="bg-[#1a1a1a]">🏢 Office</option>
        </select>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer group pt-1">
        <div onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-all
            ${form.isDefault ? 'bg-accent-tint border-accent-glow' : 'border-white/20 group-hover:border-white/40'}`}>
          {form.isDefault && <Check size={10} className="text-[#1a1a1a]" />}
        </div>
        <span className="text-sm text-white/60" style={FONT}>Set as default address</span>
      </label>

      {addrError && (
        <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span style={FONT}>{addrError}</span>
        </div>
      )}

      {/* Standardized Format Preview */}
      <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 mt-2">
        <p className="text-[10px] uppercase tracking-widest text-accent-muted mb-2 flex items-center gap-1.5" style={FONT}>
          <Check size={10} /> Standardized Format Preview
        </p>
        <div className="text-sm text-white/70 leading-relaxed" style={FONT}>
          {formattedAddressLines.length > 0 ? (
            formattedAddressLines.map((line, i) => (
              <p key={i} className={i === 0 ? "font-medium text-white/90" : ""}>{line}</p>
            ))
          ) : (
            <p className="text-white/20 italic">Start typing to see preview...</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/50
            hover:text-white transition-colors cursor-pointer" style={FONT}>Cancel</button>
        <button onClick={() => onSave(form)} disabled={loading || !isFormValid}
          className="flex-1 rounded-xl bg-gradient-to-r from-amber-200 via-rose-300 to-purple-300
            py-3 text-sm font-semibold text-[#1a1a1a] hover:opacity-90
            transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={FONT}>
          {loading ? 'Saving…' : 'Save Address'}
        </button>
      </div>
    </div>
  )
}
