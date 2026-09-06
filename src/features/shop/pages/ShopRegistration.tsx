/* features/shop/pages/ShopRegistration.tsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { ImageUploader } from '../../../components/common/ImageUploader';
import {
  Building2,
  MapPin,
  CalendarDays,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Edit3,
  HelpCircle,
  LocateFixed,
  Navigation,
  Phone,
  Loader2,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────── */
/* Business Category Chip definitions                         */
/* ─────────────────────────────────────────────────────────── */
const BUSINESS_CATEGORIES = [
  { label: 'Grocery / Kirana', emoji: '🛒', desc: 'Daily essentials & FMCG' },
  { label: 'General Store', emoji: '🏪', desc: 'Mixed goods & household' },
  { label: 'Electronics', emoji: '📱', desc: 'Mobiles, appliances & repair' },
  { label: 'Clothing / Apparel', emoji: '👕', desc: 'Garments & readymades' },
  { label: 'Pharmacy', emoji: '💊', desc: 'Medicines & healthcare' },
  { label: 'Dairy', emoji: '🥛', desc: 'Milk, eggs & dairy products' },
  { label: 'Footwear', emoji: '👟', desc: 'Shoes & leather goods' },
  { label: 'Hardware', emoji: '🔧', desc: 'Tools, pipes & sanitary' },
  { label: 'Wholesale', emoji: '📦', desc: 'Bulk distribution & trading' },
  { label: 'Mobile Store', emoji: '📲', desc: 'Smartphones & accessories' },
  { label: 'Bakery / Sweets', emoji: '🍰', desc: 'Bakery & confectionery' },
  { label: 'Other', emoji: '🏬', desc: 'Any other business type' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra',
  'Kerala', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Delhi', 'West Bengal',
  'Bihar', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Odisha', 'Assam',
  'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh',
  'Goa', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim',
  'Tripura', 'Arunachal Pradesh', 'Jammu & Kashmir', 'Ladakh',
];

const STEP_TITLES = [
  { number: 1, title: 'Business Identity', icon: Building2 },
  { number: 2, title: 'Location & Address', icon: MapPin },
  { number: 3, title: 'Financial & Tax', icon: CalendarDays },
  { number: 4, title: 'UPI Setup', icon: QrCode },
  { number: 5, title: 'Review & Activate', icon: ShieldCheck },
];

/* ─────────────────────────────────────────────────────────── */
/* Helper: extract phone from user object                     */
/* ─────────────────────────────────────────────────────────── */
const extractPhoneDigits = (user: any): string => {
  const raw: string = user?.phone || user?.phoneNumber || user?.phone_number || '';
  // Strip country code (e.g. "+91") to get 10-digit number
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

export const ShopRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user, isOnboarded, registerShop, isLoading, error } = useAuthStore();

  // Redirect if already onboarded
  useEffect(() => {
    if (isOnboarded) navigate('/', { replace: true });
  }, [isOnboarded, navigate]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  /* ── STEP 1: Business Identity ── */
  const [shopName, setShopName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Grocery / Kirana');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  /* ── STEP 2: Location & Address ── */
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState(() => extractPhoneDigits(user));
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);

  /* ── STEP 3: Financial & Tax ── */
  const currency = 'INR';
  const [gstin, setGstin] = useState('');

  /* ── STEP 4: UPI Setup ── */
  const [upiId, setUpiId] = useState('');
  const [qrCodePoster, setQrCodePoster] = useState<string | null>(null);

  /* ────────────────────────────────────────────────────────── */
  /* GPS Auto-Detection                                        */
  /* ────────────────────────────────────────────────────────── */
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('loading');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setGpsStatus('success');

        // Attempt reverse geocoding via free Nominatim API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || addr.footway || '';
            const suburb = addr.suburb || addr.neighbourhood || '';
            const city_name = addr.city || addr.town || addr.village || addr.county || '';
            const state_name = addr.state || '';
            const postcode = addr.postcode || '';

            if (road || suburb) setAddress([road, suburb].filter(Boolean).join(', '));
            if (city_name) setCity(city_name);
            if (postcode) setPincode(postcode.replace(/\D/g, '').slice(0, 6));
            if (state_name) {
              const matched = INDIAN_STATES.find(
                (s) => s.toLowerCase() === state_name.toLowerCase()
              );
              if (matched) setState(matched);
            }
          }
        } catch {
          // Geocoding failed — lat/lng still stored, user fills address manually
        }
      },
      (err) => {
        setGpsStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access and try again.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Location unavailable. Please fill in the address manually.');
        } else {
          setGpsError('Could not determine location. Please fill in the address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  /* ────────────────────────────────────────────────────────── */
  /* Validation                                                */
  /* ────────────────────────────────────────────────────────── */
  const validateStep1 = (): boolean => {
    if (!shopName.trim()) { setLocalError('Shop Name is required'); return false; }
    if (!businessCategory) { setLocalError('Please select a Business Category'); return false; }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!address.trim()) { setLocalError('Shop Address is required'); return false; }
    if (!city.trim()) { setLocalError('City / Town is required'); return false; }
    if (!state) { setLocalError('Please select your State'); return false; }
    if (!pincode.trim() || pincode.trim().length !== 6) { setLocalError('Please enter a valid 6-digit Pincode'); return false; }
    if (!phone.trim() || phone.trim().length < 10) { setLocalError('Please enter a valid 10-digit Phone Number'); return false; }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      if (!gstinRegex.test(gstin.trim())) {
        setLocalError('Please enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5) or leave it empty');
        return false;
      }
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    if (upiId.trim()) {
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(upiId.trim())) {
        setLocalError('Please enter a valid UPI ID format (e.g. merchant@upi)');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setLocalError(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    setStep((prev) => Math.min(prev + 1, 5) as any);
  };

  const handleBack = () => {
    setLocalError(null);
    setStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const handleFinalSubmit = async () => {
    setLocalError(null);
    if (!validateStep1()) { setStep(1); return; }
    if (!validateStep2()) { setStep(2); return; }
    if (!validateStep3()) { setStep(3); return; }
    if (!validateStep4()) { setStep(4); return; }

    setSubmitting(true);
    try {
      await registerShop({
        name: shopName.trim(),
        businessType: businessCategory,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim() || undefined,
        state: state || undefined,
        pincode: pincode.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        gstin: gstin.trim() || undefined,
        upiId: upiId.trim() || undefined,
        logoUrl: logoUrl || undefined,
        currency,
        theme: 'dark',
        language: 'en',
      });

      setSubmitting(false);
      setSuccessState(true);
      setTimeout(() => navigate('/', { replace: true }), 1200);
    } catch (err: any) {
      setSubmitting(false);
      setLocalError(err.message || 'Shop account creation failed. Please try again.');
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /* Render                                                    */
  /* ────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'var(--font-sans)',
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '860px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          overflow: 'hidden',
        }}
      >
        {/* ── Top Header ── */}
        <div style={{
          padding: '1.75rem 2rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                backgroundColor: 'var(--primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800',
              }}>K</div>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>
                Shop KhattaBook
              </span>
              <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Verified Merchant</span>
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              5-Step Merchant Onboarding Wizard
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
            <span>Bank-Grade Encryption</span>
          </div>
        </div>

        {/* ── Step Progress Bar ── */}
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflowX: 'auto',
          gap: '0.5rem',
        }}>
          {STEP_TITLES.map((st) => {
            const Icon = st.icon;
            const isDone = step > st.number;
            const isCurrent = step === st.number;
            return (
              <div
                key={st.number}
                onClick={() => isDone && setStep(st.number as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isCurrent || isDone ? 1 : 0.4,
                  transition: 'all 200ms',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: isDone ? 'var(--primary)' : isCurrent ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                  border: isCurrent ? '2px solid var(--primary)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '800',
                }}>
                  {isDone
                    ? <CheckCircle2 size={16} style={{ color: '#FFFFFF' }} />
                    : <Icon size={14} style={{ color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }} />
                  }
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? '800' : '600',
                  color: isCurrent ? 'var(--text-heading)' : 'var(--text-body)',
                  whiteSpace: 'nowrap',
                }}>
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Form Body ── */}
        <div style={{ padding: '2rem 2.25rem' }}>

          {/* Success State */}
          {successState ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: 'rgba(16,185,129,0.15)', border: '2px solid #10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <CheckCircle2 size={40} style={{ color: '#10B981' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Shop Account Activated! 🎉
              </h2>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                Redirecting to your merchant digital ledger dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {(localError || error) && (
                <div style={{
                  marginBottom: '1.5rem', padding: '0.75rem 1rem',
                  backgroundColor: 'var(--error-light)', color: 'var(--error)',
                  borderRadius: '14px', fontSize: '0.875rem',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  {localError || error}
                </div>
              )}

              {/* ================================================== */}
              {/* STEP 1: BUSINESS IDENTITY + LOGO                   */}
              {/* ================================================== */}
              {step === 1 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                    Step 1: Business Identity
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                    Tell us your shop name, category, and optionally upload a logo for bills & receipts.
                  </p>

                  {/* Logo Upload */}
                  <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{
                      display: 'block', fontSize: '0.8rem', fontWeight: '700',
                      color: 'var(--text-heading)', marginBottom: '0.75rem', textAlign: 'center',
                    }}>
                      Shop Logo / Profile Photo{' '}
                      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>(Optional)</span>
                    </label>
                    <ImageUploader
                      value={logoUrl}
                      onChange={setLogoUrl}
                      variant="logo"
                      label="Shop Logo"
                      facingMode="environment"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                      Your logo will appear on customer invoices & receipts
                    </p>
                  </div>

                  {/* Shop Name */}
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Business / Shop Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Sri Lakshmi General Store"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Business Category Chips */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Business Category *</label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.6rem',
                      marginTop: '0.5rem',
                    }}>
                      {BUSINESS_CATEGORIES.map((cat) => {
                        const isSelected = businessCategory === cat.label;
                        return (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => setBusinessCategory(cat.label)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem 0.9rem',
                              borderRadius: '24px',
                              border: isSelected
                                ? '2px solid var(--primary)'
                                : '1px solid var(--border-color)',
                              backgroundColor: isSelected
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'var(--bg-secondary)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-body)',
                              fontWeight: isSelected ? '800' : '600',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 150ms ease',
                              boxShadow: isSelected ? '0 0 0 1px var(--primary)' : 'none',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {businessCategory && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {BUSINESS_CATEGORIES.find((c) => c.label === businessCategory)?.desc}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* STEP 2: LOCATION & ADDRESS                         */}
              {/* ================================================== */}
              {step === 2 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                    Step 2: Location & Address
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Use GPS to auto-fill your address or enter details manually. Your location helps customers find your shop.
                  </p>

                  {/* GPS Auto-Detect Button */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={gpsStatus === 'loading'}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '16px',
                        border: gpsStatus === 'success'
                          ? '2px solid #10B981'
                          : gpsStatus === 'error'
                          ? '2px solid #EF4444'
                          : '2px dashed var(--primary)',
                        backgroundColor: gpsStatus === 'success'
                          ? 'rgba(16,185,129,0.1)'
                          : gpsStatus === 'error'
                          ? 'rgba(239,68,68,0.08)'
                          : 'rgba(59,130,246,0.08)',
                        color: gpsStatus === 'success'
                          ? '#10B981'
                          : gpsStatus === 'error'
                          ? '#EF4444'
                          : 'var(--primary)',
                        fontWeight: '700',
                        fontSize: '0.925rem',
                        cursor: gpsStatus === 'loading' ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {gpsStatus === 'loading' ? (
                        <>
                          <Loader2 size={18} className="spin" />
                          <span>Detecting your location...</span>
                        </>
                      ) : gpsStatus === 'success' ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>
                            GPS Location Captured — {latitude?.toFixed(4)}°N, {longitude?.toFixed(4)}°E
                          </span>
                        </>
                      ) : (
                        <>
                          <LocateFixed size={18} />
                          <span>Use Current GPS Location</span>
                          <Navigation size={15} style={{ opacity: 0.6 }} />
                        </>
                      )}
                    </button>

                    {gpsError && (
                      <p style={{ fontSize: '0.775rem', color: '#EF4444', marginTop: '0.4rem', fontWeight: '600' }}>
                        {gpsError}
                      </p>
                    )}
                    {gpsStatus === 'success' && (
                      <p style={{ fontSize: '0.775rem', color: '#10B981', marginTop: '0.4rem', fontWeight: '600' }}>
                        Address auto-filled from GPS. You can edit any field below.
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>OR ENTER MANUALLY</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  </div>

                  {/* Address */}
                  <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                    <label className="form-label">Shop No., Street & Area *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Door No. 4-12, Main Bazaar Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Landmark */}
                  <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                    <label className="form-label">Landmark</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Near SBI Bank, Opposite Bus Stand"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                  </div>

                  {/* City & State */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City / Town *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Srikakulam"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <select
                        className="input-field"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pincode & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="532001"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={13} />
                        <span>Shop Contact Number *</span>
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="98765 43210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      />
                      {extractPhoneDigits(user) && phone === extractPhoneDigits(user) && (
                        <p style={{ fontSize: '0.7rem', color: '#10B981', marginTop: '0.25rem', fontWeight: '600' }}>
                          ✓ Auto-filled from your login number
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* STEP 3: FINANCIAL & TAX                            */}
              {/* ================================================== */}
              {step === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                    Step 3: Financial & Tax Details
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Configure currency and optional tax registration details for your shop.
                  </p>

                  {/* Primary Currency */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Primary Currency</label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'rgba(59,130,246,0.06)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '16px',
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>₹</span>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-heading)' }}>Indian Rupee (INR)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default currency for all transactions</div>
                      </div>
                      <CheckCircle2 size={20} style={{ color: 'var(--primary)', marginLeft: 'auto' }} />
                    </div>
                  </div>

                  {/* GSTIN */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>GSTIN</label>
                      <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid' }}>Optional</span>
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      <HelpCircle size={14} />
                      <span>GSTIN is optional. You can add or update tax details later in Settings.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* STEP 4: UPI PAYMENT SETUP                          */}
              {/* ================================================== */}
              {step === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                    Step 4: Payment & Digital UPI Setup
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Setup UPI ID &amp; QR Code for seamless customer digital repayments.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Merchant UPI ID</label>
                      <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid' }}>Optional</span>
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. merchant@upi or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Custom UPI QR Code Poster</label>
                      <span className="badge" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid' }}>Optional</span>
                    </div>
                    <ImageUploader
                      value={qrCodePoster}
                      onChange={setQrCodePoster}
                      variant="logo"
                      label="UPI QR Poster"
                    />
                  </div>
                </div>
              )}

              {/* ================================================== */}
              {/* STEP 5: REVIEW & ACTIVATE                          */}
              {/* ================================================== */}
              {step === 5 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                    Step 5: Review &amp; Activate Shop Account
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Review your business setup details before completing registration.
                  </p>

                  {/* Logo preview row */}
                  {logoUrl && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem', borderRadius: '18px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '1rem',
                    }}>
                      <img
                        src={logoUrl}
                        alt="Shop Logo"
                        style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-heading)', fontSize: '1rem' }}>{shopName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{businessCategory}</div>
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Business Card */}
                    {!logoUrl && (
                      <div style={{
                        padding: '1.25rem', borderRadius: '18px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)', position: 'relative',
                      }}>
                        <button
                          onClick={() => setStep(1)}
                          style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', color: 'var(--primary)',
                            fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                          }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>BUSINESS</h4>
                        <p style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-heading)' }}>{shopName}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                          {BUSINESS_CATEGORIES.find((c) => c.label === businessCategory)?.emoji} {businessCategory}
                        </p>
                      </div>
                    )}

                    {/* Location Card */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative',
                      gridColumn: logoUrl ? 'span 2' : undefined,
                    }}>
                      <button
                        onClick={() => setStep(2)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LOCATION</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                        {address}{landmark ? `, Near ${landmark}` : ''}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>{city}, {state} — {pincode}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.1rem' }}>📞 {phone}</p>
                      {latitude && (
                        <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.1rem', fontWeight: '600' }}>
                          📍 GPS: {latitude.toFixed(5)}, {longitude?.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {/* Financial Card */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative',
                    }}>
                      <button
                        onClick={() => setStep(3)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>FINANCIAL & TAX</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>Currency: ₹ INR</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>GSTIN: {gstin || 'Not Provided'}</p>
                    </div>

                    {/* Payment Card */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative',
                    }}>
                      <button
                        onClick={() => setStep(4)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>PAYMENT</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                        UPI: {upiId || 'Not Provided'}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                        QR Poster: {qrCodePoster ? 'Uploaded ✓' : 'Default Generator'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation Buttons ── */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
              }}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : <div />}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
                    disabled={submitting || isLoading}
                  >
                    {submitting
                      ? <><Loader2 size={18} className="spin" /> Creating your shop...</>
                      : <>Create Shop Account <CheckCircle2 size={18} /></>
                    }
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopRegistration;
