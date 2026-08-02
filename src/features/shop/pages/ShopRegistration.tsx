/* features/shop/pages/ShopRegistration.tsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../providers/ThemeProvider';
import { ImageUploader } from '../../../components/common/ImageUploader';
import { 
  User as UserIcon, 
  Store, 
  MapPin, 
  CreditCard, 
  Sliders, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  BellRing, 
  MessageSquare, 
  PhoneCall, 
  BrainCircuit,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

const ShopRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { user, isOnboarded, registerShop, isLoading, error } = useAuthStore();

  // Enforce One Account = One Shop rule
  useEffect(() => {
    if (isOnboarded) {
      navigate('/', { replace: true });
    }
  }, [isOnboarded, navigate]);

  const [step, setStep] = useState(1);
  const [successState, setSuccessState] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  // 1. Owner Details (NO prefilled photos or dummy text)
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null);

  // 2. Shop Details
  const [shopName, setShopName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Kirana Store');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [shopLogo, setShopLogo] = useState<string | null>(null);

  // 3. Address Details
  const [doorNumber, setDoorNumber] = useState('');
  const [street, setStreet] = useState('');
  const [areaLandmark, setAreaLandmark] = useState('');
  const [villageTown, setVillageTown] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [pinCode, setPinCode] = useState('');

  // 4. Business & Tax Details
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [upiId, setUpiId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // 5. Preferences & Automations
  const [language, setLanguage] = useState('en');
  const [currency] = useState('INR');
  const [themePref, setThemePref] = useState('light');
  
  // Automations
  const [paymentReminder, setPaymentReminder] = useState(true);
  const [whatsappReminder, setWhatsappReminder] = useState(true);
  const [smsReminder, setSmsReminder] = useState(false);
  const [aiDailySummary, setAiDailySummary] = useState(true);

  const [localError, setLocalError] = useState<string | null>(null);

  const businessCategories = [
    'Kirana Store',
    'Clothing',
    'Footwear',
    'Medical',
    'Electronics',
    'Wholesale',
    'Hardware',
    'Furniture',
    'Restaurant',
    'Bakery',
    'Cosmetics'
  ];

  const indianStates = [
    'Andhra Pradesh',
    'Telangana',
    'Uttar Pradesh',
    'Maharashtra',
    'Karnataka',
    'Tamil Nadu',
    'Delhi',
    'Bihar',
    'West Bengal',
    'Rajasthan',
    'Gujarat',
    'Punjab',
    'Kerala',
    'Madhya Pradesh',
    'Haryana',
    'Odisha',
    'Assam',
    'Jharkhand',
    'Chhattisgarh'
  ];

  const filteredCategories = businessCategories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredStates = indianStates.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // Step Validation & Navigation
  const handleNext = () => {
    setLocalError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setLocalError('Please enter Full Name');
        return;
      }
      if (!mobileNumber.trim()) {
        setLocalError('Please enter Mobile Number');
        return;
      }
    } else if (step === 2) {
      if (!shopName.trim()) {
        setLocalError('Please enter Shop Name');
        return;
      }
    } else if (step === 4) {
      if (!upiId.trim()) {
        setLocalError('UPI ID is required for digital collections');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setLocalError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Registration Handler
  const handleCompleteRegistration = async () => {
    setLocalError(null);
    if (!upiId.trim()) {
      setLocalError('UPI ID is required for business settlement');
      setStep(4);
      return;
    }

    setSubmitting(true);
    try {
      const formattedAddress = [doorNumber, street, areaLandmark, villageTown, mandal, district, state]
        .filter(Boolean)
        .join(', ');

      await registerShop({
        name: shopName.trim() || 'My KhattaBook Store',
        businessType: businessCategory,
        phone: mobileNumber,
        address: formattedAddress || undefined,
        city: district || villageTown || undefined,
        state: state || undefined,
        pincode: pinCode || undefined,
        gstin: gstin.toUpperCase() || undefined,
        pan: pan.toUpperCase() || undefined,
        upiId: upiId.trim(),
        logoUrl: shopLogo || undefined,
        currency,
        theme: themePref,
        language,
      });

      // Apply theme preference
      if (themePref === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (themePref === 'light') {
        document.documentElement.classList.remove('dark');
      }

      setSubmitting(false);
      setSuccessState(true);

      // Automatic Redirect to Dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);

    } catch (err: any) {
      setSubmitting(false);
      setLocalError(err.message || 'Failed to complete registration');
    }
  };

  const stepsList = [
    { number: 1, title: 'Owner', icon: UserIcon },
    { number: 2, title: 'Shop', icon: Store },
    { number: 3, title: 'Address', icon: MapPin },
    { number: 4, title: 'Business', icon: CreditCard },
    { number: 5, title: 'Preferences', icon: Sliders },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      fontFamily: 'var(--font-sans)'
    }}>
      <div className="onboarding-card" style={{ padding: '0' }}>
        
        {/* Top Header & Brand Bar */}
        <div style={{
          padding: '2.5rem 3rem 1.5rem 3rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: 'var(--primary)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
              }}>
                K
              </div>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>
                Shop KhattaBook
              </span>
              <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>Pro Merchant</span>
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Complete your merchant ledger profile to open your digital business portal
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            <span>Bank-grade 256-bit Encryption</span>
          </div>
        </div>

        {/* Top Progress Stepper */}
        <div style={{ padding: '2rem 3rem 1rem 3rem', overflowX: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            minWidth: '600px'
          }}>
            {/* Connecting thin progress line */}
            <div style={{
              position: 'absolute',
              top: '22px',
              left: '5%',
              right: '5%',
              height: '3px',
              backgroundColor: 'var(--border-color)',
              zIndex: 0
            }} />

            {/* Filled progress bar */}
            <div style={{
              position: 'absolute',
              top: '22px',
              left: '5%',
              width: `${((step - 1) / 4) * 90}%`,
              height: '3px',
              backgroundColor: 'var(--primary)',
              zIndex: 0,
              transition: 'width var(--transition-normal)'
            }} />

            {stepsList.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.number;
              const isCurrent = step === s.number;

              return (
                <div key={s.number} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    onClick={() => { if (s.number < step) setStep(s.number); }}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: s.number < step ? 'pointer' : 'default',
                      transition: 'all var(--transition-normal)',
                      backgroundColor: isCompleted ? 'var(--primary)' : isCurrent ? 'var(--primary)' : 'var(--bg-card)',
                      color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                      border: isCompleted ? 'none' : isCurrent ? 'none' : '2px solid var(--border-color)',
                      boxShadow: isCompleted 
                        ? '0 0 15px rgba(16, 185, 129, 0.4)' 
                        : isCurrent 
                          ? '0 0 0 4px var(--primary-glow), 0 0 20px rgba(16, 185, 129, 0.5)' 
                          : 'none',
                      animation: isCurrent ? 'pulse-glow 2s infinite' : 'none'
                    }}
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--text-heading)' : 'var(--text-muted)'
                  }}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUCCESS OVERLAY STATE */}
        {successState ? (
          <div style={{ padding: '4rem 3rem', textAlign: 'center', animation: 'modal-slide 0.5s ease' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem', boxShadow: '0 0 30px var(--primary-glow)'
            }}>
              <CheckCircle2 size={54} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Merchant Setup Complete!
            </h2>
            <p style={{ color: 'var(--text-body)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Welcome to Shop KhattaBook. Opening your business dashboard...
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
          </div>
        ) : (
          /* STEP FORMS CONTAINER */
          <div style={{ padding: '2.5rem 3rem 3rem 3rem' }}>
            
            {/* STEP 1: OWNER STEP */}
            {step === 1 && (
              <div style={{ animation: 'modal-slide 0.3s ease' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Owner Profile Details
                </h2>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  Provide merchant personal details for account security and digital signatures.
                </p>

                <div className="grid grid-cols-1" style={{ gap: '2.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
                  {/* Left Side: Owner Photo Uploader */}
                  <ImageUploader
                    value={ownerAvatar}
                    onChange={setOwnerAvatar}
                    variant="avatar"
                    label="Owner Photo"
                    facingMode="user"
                  />

                  {/* Right Side: Fields */}
                  <div>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Ramesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="e.g. +91 98765 43210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="e.g. ramesh.store@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SHOP STEP */}
            {step === 2 && (
              <div style={{ animation: 'modal-slide 0.3s ease' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Shop & Branding Information
                </h2>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  Define your retail brand identity, shop logo, and business domain.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2.5rem' }}>
                  {/* Left Side: Shop Logo Uploader */}
                  <ImageUploader
                    value={shopLogo}
                    onChange={setShopLogo}
                    variant="logo"
                    label="Shop Logo"
                    facingMode="environment"
                  />

                  {/* Right Side: Shop Details */}
                  <div>
                    <div className="form-group">
                      <label className="form-label">Shop Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Balaji Kirana Store"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* Searchable Category Dropdown */}
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">Business Category *</label>
                      <div 
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="input-field"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <span>{businessCategory}</span>
                        <ChevronDown size={18} />
                      </div>

                      {showCategoryDropdown && (
                        <div className="glass-panel" style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          zIndex: 50, marginTop: '0.5rem', padding: '0.75rem',
                          backgroundColor: 'var(--bg-card)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <Search size={16} style={{ color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              placeholder="Search category..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {filteredCategories.map((c) => (
                              <div
                                key={c}
                                onClick={() => {
                                  setBusinessCategory(c);
                                  setShowCategoryDropdown(false);
                                }}
                                style={{
                                  padding: '0.6rem 0.8rem',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: businessCategory === c ? 'var(--primary-light)' : 'transparent',
                                  color: businessCategory === c ? 'var(--primary)' : 'var(--text-primary)',
                                  fontWeight: businessCategory === c ? '600' : '400'
                                }}
                              >
                                {c}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ADDRESS STEP */}
            {step === 3 && (
              <div style={{ animation: 'modal-slide 0.3s ease' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Shop Address & Location
                </h2>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  Enter store location for tax invoices, delivery bills, and local customer maps.
                </p>

                <div className="grid grid-cols-2 gap-md">
                  <div className="form-group">
                    <label className="form-label">Door Number / Shop No.</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Shop #12"
                      value={doorNumber}
                      onChange={(e) => setDoorNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Street / Road Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Main Market Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Area / Landmark</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Opposite Bus Stand"
                      value={areaLandmark}
                      onChange={(e) => setAreaLandmark(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Village / Town</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Shamli"
                      value={villageTown}
                      onChange={(e) => setVillageTown(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mandal / Tehsil</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Shamli Mandal"
                      value={mandal}
                      onChange={(e) => setMandal(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Shamli District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>

                  {/* Searchable State Dropdown */}
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label">State</label>
                    <div 
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      className="input-field"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <span>{state}</span>
                      <ChevronDown size={18} />
                    </div>

                    {showStateDropdown && (
                      <div className="glass-panel" style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        zIndex: 50, marginTop: '0.5rem', padding: '0.75rem',
                        backgroundColor: 'var(--bg-card)', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                          <Search size={16} style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            placeholder="Search state..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                          {filteredStates.map((s) => (
                            <div
                              key={s}
                              onClick={() => {
                                setState(s);
                                setShowStateDropdown(false);
                              }}
                              style={{
                                padding: '0.6rem 0.8rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: state === s ? 'var(--primary-light)' : 'transparent',
                                color: state === s ? 'var(--primary)' : 'var(--text-primary)',
                                fontWeight: state === s ? '600' : '400'
                              }}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="247776"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: BUSINESS & TAX STEP */}
            {step === 4 && (
              <div style={{ animation: 'modal-slide 0.3s ease' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Business Tax & UPI Details
                </h2>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  Configure UPI payment QR codes and optional GST/PAN numbers for tax invoices.
                </p>

                <div className="grid grid-cols-2 gap-md">
                  <div className="form-group">
                    <label className="form-label">GSTIN Number</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="09AAAAA0000A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    />
                    <span className="helper-text">GST Optional</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                    />
                    <span className="helper-text">PAN Optional</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">UPI ID for Collection *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. merchant@okaxis or 9876543210@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <span className="helper-text" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    UPI Required — Enables instant QR Code generation for customer payments
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Business Contact Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. contact@balajistore.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                  />
                  <span className="helper-text">Business Email</span>
                </div>
              </div>
            )}

            {/* STEP 5: PREFERENCES & AUTOMATIONS */}
            {step === 5 && (
              <div style={{ animation: 'modal-slide 0.3s ease' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Preferences & Smart Automations
                </h2>
                <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  Choose language, theme, and enable automated WhatsApp payment collection reminders.
                </p>

                {/* Three Dropdowns */}
                <div className="grid grid-cols-3 gap-md" style={{ marginBottom: '2rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Language</label>
                    <select
                      className="input-field"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिन्दी (Hindi / Hinglish)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Currency</label>
                    <select
                      className="input-field"
                      value={currency}
                      disabled
                    >
                      <option value="INR">INR ₹</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Theme</label>
                    <select
                      className="input-field"
                      value={themePref}
                      onChange={(e) => {
                        setThemePref(e.target.value);
                        if (e.target.value === 'dark' || e.target.value === 'light') {
                          toggleTheme();
                        }
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>

                {/* Automation Section */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
                  Smart Business Automations
                </h3>

                <div className="grid grid-cols-2 gap-md" style={{ marginBottom: '2rem' }}>
                  <div 
                    onClick={() => setPaymentReminder(!paymentReminder)}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: paymentReminder ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: paymentReminder ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    <BellRing size={24} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>Payment Reminders</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Auto alert on due credit dates</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setWhatsappReminder(!whatsappReminder)}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: whatsappReminder ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: whatsappReminder ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    <MessageSquare size={24} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>WhatsApp Reminders</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Send 1-click WhatsApp bill links</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSmsReminder(!smsReminder)}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: smsReminder ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: smsReminder ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    <PhoneCall size={24} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>SMS Alerts</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Dispatch SMS transaction receipts</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setAiDailySummary(!aiDailySummary)}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: aiDailySummary ? 'var(--primary-light)' : 'var(--bg-card)',
                      border: aiDailySummary ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    <BrainCircuit size={24} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>AI Daily Summary</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>Morning sales & collection forecast</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {(localError || error) && (
              <div className="input-error" style={{ marginBottom: '1.5rem', padding: '0.85rem', backgroundColor: 'var(--error-light)', borderRadius: '12px' }}>
                {localError || error}
              </div>
            )}

            {/* Bottom Stepper Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              {step > 1 ? (
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  <ArrowLeft size={18} /> Back
                </button>
              ) : <div />}

              {step < 5 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next Step <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleCompleteRegistration} 
                  className="btn btn-primary" 
                  disabled={submitting || isLoading}
                  style={{ gap: '0.6rem', padding: '0.9rem 2rem' }}
                >
                  <Sparkles size={20} />
                  {submitting ? 'Completing Setup...' : 'Complete Registration →'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopRegistration;
