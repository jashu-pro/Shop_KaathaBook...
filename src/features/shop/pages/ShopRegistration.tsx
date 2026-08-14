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
  HelpCircle
} from 'lucide-react';

export const ShopRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user, isOnboarded, registerShop, isLoading, error } = useAuthStore();

  // Onboarding Guard: If already onboarded, redirect immediately to Dashboard
  useEffect(() => {
    if (isOnboarded) {
      navigate('/', { replace: true });
    }
  }, [isOnboarded, navigate]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);

  // STEP 1 — Business Identity
  const [shopName, setShopName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Kirana');

  // STEP 2 — Location & Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState(user?.email ? '' : '');

  // STEP 3 — Financial & Credit Rules
  const currency = 'INR';
  const [creditPeriod, setCreditPeriod] = useState<number>(15);
  const [gstin, setGstin] = useState('');

  // STEP 4 — Payment & Digital UPI Setup
  const [upiId, setUpiId] = useState('');
  const [qrCodePoster, setQrCodePoster] = useState<string | null>(null);

  const businessCategories = [
    { label: 'Kirana', desc: 'Grocery & daily items' },
    { label: 'General Store', desc: 'FMCG & household goods' },
    { label: 'Apparel / Clothing', desc: 'Garments & readymades' },
    { label: 'Footwear', desc: 'Shoes & leather goods' },
    { label: 'Electronics', desc: 'Mobiles, appliances & repair' },
    { label: 'Pharmacy', desc: 'Chemist & healthcare' },
    { label: 'Hardware', desc: 'Pipes, paints & sanitaryware' },
    { label: 'Wholesale', desc: 'Bulk distribution & trading' },
    { label: 'Mobile Store', desc: 'Smartphones & accessories' },
    { label: 'Other', desc: 'Custom business category' },
  ];

  const indianStates = [
    'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra',
    'Kerala', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Delhi', 'West Bengal',
    'Bihar', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Odisha', 'Assam', 'Jharkhand'
  ];

  // STEP 1 Validation
  const validateStep1 = (): boolean => {
    if (!shopName.trim()) {
      setLocalError('Please enter your Business / Shop Name');
      return false;
    }
    if (!businessCategory) {
      setLocalError('Please select a Business Category');
      return false;
    }
    return true;
  };

  // STEP 2 Validation
  const validateStep2 = (): boolean => {
    if (!address.trim()) {
      setLocalError('Please enter Shop Address');
      return false;
    }
    if (!city.trim()) {
      setLocalError('Please enter City / Town');
      return false;
    }
    if (!state) {
      setLocalError('Please select your State');
      return false;
    }
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      setLocalError('Please enter a valid 6-digit Pincode');
      return false;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setLocalError('Please enter a valid 10-digit primary phone number');
      return false;
    }
    return true;
  };

  // STEP 3 Validation
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

  // STEP 4 Validation
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

  // Final Submission Handler
  const handleFinalSubmit = async () => {
    setLocalError(null);

    // Complete form validation
    if (!validateStep1()) { setStep(1); return; }
    if (!validateStep2()) { setStep(2); return; }
    if (!validateStep3()) { setStep(3); return; }
    if (!validateStep4()) { setStep(4); return; }

    setSubmitting(true);
    try {
      await registerShop({
        name: shopName.trim(),
        businessType: businessCategory,
        address: address.trim(),
        city: city.trim(),
        state: state,
        pincode: pincode.trim(),
        phone: phone.trim(),
        currency: currency,
        defaultCreditPeriod: creditPeriod,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        upiId: upiId.trim() || undefined,
        logoUrl: qrCodePoster || undefined,
        theme: 'light',
        language: 'en',
      });

      setSubmitting(false);
      setSuccessState(true);

      // Smooth transition to main dashboard
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);

    } catch (err: any) {
      setSubmitting(false);
      setLocalError(err.message || 'Shop account creation failed. Please try again.');
    }
  };

  const stepTitles = [
    { number: 1, title: 'Business Identity', icon: Building2 },
    { number: 2, title: 'Location & Address', icon: MapPin },
    { number: 3, title: 'Financial Rules', icon: CalendarDays },
    { number: 4, title: 'UPI Setup', icon: QrCode },
    { number: 5, title: 'Review & Activate', icon: ShieldCheck },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'var(--font-sans)'
    }}>
      <div 
        className="onboarding-card glass-panel"
        style={{
          width: '100%',
          maxWidth: '840px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header & Brand */}
        <div style={{
          padding: '1.75rem 2rem 1.25rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                backgroundColor: 'var(--primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'
              }}>
                K
              </div>
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

        {/* Step Progress Tracker Bar */}
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflowX: 'auto',
          gap: '0.5rem'
        }}>
          {stepTitles.map((st) => {
            const Icon = st.icon;
            const isDone = step > st.number;
            const isCurrent = step === st.number;

            return (
              <div 
                key={st.number}
                onClick={() => isDone && setStep(st.number as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isCurrent || isDone ? 1 : 0.45,
                  transition: 'all 200ms'
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: isDone ? 'var(--primary)' : isCurrent ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                  color: isDone || isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                  border: isCurrent ? '2px solid var(--primary)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '800'
                }}>
                  {isDone ? <CheckCircle2 size={16} style={{ color: '#FFFFFF' }} /> : <Icon size={14} />}
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? '800' : '600',
                  color: isCurrent ? 'var(--text-heading)' : 'var(--text-body)',
                  whiteSpace: 'nowrap'
                }}>
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Body Container */}
        <div style={{ padding: '2rem 2.25rem' }}>

          {/* Success Animated Feedback */}
          {successState ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CheckCircle2 size={64} style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Shop Account Activated!
              </h2>
              <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                Redirecting to your merchant digital ledger dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {(localError || error) && (
                <div className="input-error" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '14px', fontSize: '0.875rem' }}>
                  {localError || error}
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 1: BUSINESS IDENTITY                                */}
              {/* ======================================================== */}
              {step === 1 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    Step 1: Business Identity
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Tell us your shop name and category to setup your ledger.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Business / Shop Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Sri Laxmi Kirana & General Stores"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Business Type / Industry Category *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {businessCategories.map((cat) => {
                        const isSelected = businessCategory === cat.label;
                        return (
                          <div
                            key={cat.label}
                            onClick={() => setBusinessCategory(cat.label)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '16px',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                              cursor: 'pointer',
                              transition: 'all 200ms'
                            }}
                          >
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-heading)' }}>
                              {cat.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {cat.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 2: LOCATION & ADDRESS                               */}
              {/* ======================================================== */}
              {step === 2 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    Step 2: Location & Address
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Provide your physical shop location for invoice and ledger statements.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Shop Address (Building, Street, Area) *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Door No. 4-12, Main Bazaar Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
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
                        {indianStates.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
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
                      <label className="form-label">Primary Phone Number *</label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="98765 43210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 3: FINANCIAL & CREDIT RULES                         */}
              {/* ======================================================== */}
              {step === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    Step 3: Financial & Credit Rules
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Configure default credit rules for customer Udhaar calculations.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Currency</label>
                    <input
                      type="text"
                      className="input-field"
                      value="Indian Rupee (INR ₹)"
                      disabled
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Default Customer Credit Period</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      {[7, 15, 30].map((days) => {
                        const isSelected = creditPeriod === days;
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setCreditPeriod(days)}
                            style={{
                              flex: 1,
                              padding: '0.85rem',
                              borderRadius: '16px',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-heading)',
                              fontWeight: '700',
                              cursor: 'pointer',
                              fontSize: '0.95rem'
                            }}
                          >
                            {days} Days
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="form-label">GSTIN (Optional)</label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax Registration</span>
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
                      <span>GSTIN is optional. You can add or update your tax details anytime later in Settings.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 4: PAYMENT & DIGITAL UPI SETUP                       */}
              {/* ======================================================== */}
              {step === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    Step 4: Payment & Digital UPI Setup
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Setup UPI ID & QR Code for customer digital repayments.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Merchant UPI ID</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. merchant@upi or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                      Custom UPI QR Code Poster (Optional)
                    </label>
                    <ImageUploader
                      value={qrCodePoster}
                      onChange={(val) => setQrCodePoster(val)}
                      variant="logo"
                      label="UPI QR Poster"
                    />
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 5: REVIEW & ACCOUNT ACTIVATION                      */}
              {/* ======================================================== */}
              {step === 5 && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                    Step 5: Review & Activate Shop Account
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Review your business setup details before completing registration.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* BUSINESS CARD */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <button
                        onClick={() => setStep(1)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BUSINESS</h4>
                      <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-heading)' }}>{shopName}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>Category: {businessCategory}</p>
                    </div>

                    {/* LOCATION CARD */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <button
                        onClick={() => setStep(2)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LOCATION</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>{address}, {city}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>{state} - {pincode}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>Phone: {phone}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {/* FINANCIAL CARD */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <button
                        onClick={() => setStep(3)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>FINANCIAL</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>Currency: INR ₹</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>Credit Period: {creditPeriod} Days</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>GSTIN: {gstin || 'Not Provided'}</p>
                    </div>

                    {/* PAYMENT CARD */}
                    <div style={{
                      padding: '1.25rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', position: 'relative'
                    }}>
                      <button
                        onClick={() => setStep(4)}
                        style={{
                          position: 'absolute', top: '1rem', right: '1rem',
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.2rem'
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PAYMENT</h4>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>UPI ID: {upiId || 'Not Provided'}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                        QR Code Poster: {qrCodePoster ? 'Uploaded ✓' : 'Default Generator'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-color)'
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
                    {submitting ? 'Creating your shop...' : 'Create Shop Account'}
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
