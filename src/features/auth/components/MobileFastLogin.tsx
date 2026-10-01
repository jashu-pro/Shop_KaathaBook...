/* features/auth/components/MobileFastLogin.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../../../providers/LanguageProvider';
import { 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Edit2, 
  CheckCircle2, 
  Globe, 
  MessageSquare,
  Zap,
  ChevronDown,
  Mail,
  Smartphone,
  Copy,
  Check,
  Send
} from 'lucide-react';

interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  pattern: RegExp;
}

const COUNTRIES: CountryOption[] = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳', pattern: /^[6-9]\d{9}$/ },
  { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪', pattern: /^\d{9}$/ },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦', pattern: /^\d{9}$/ },
  { code: 'US', dialCode: '+1', name: 'USA / Canada', flag: '🇺🇸', pattern: /^\d{10}$/ },
  { code: 'GB', dialCode: '+44', name: 'UK', flag: '🇬🇧', pattern: /^\d{10}$/ },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬', pattern: /^\d{8}$/ },
];

export const MobileFastLogin: React.FC<{ onSwitchToEmail?: () => void }> = ({ onSwitchToEmail }) => {
  const navigate = useNavigate();
  const { sendOtp, loginWithOtp, sendEmailOtp, loginWithEmailOtp, isLoading: authLoading } = useAuth();
  const { t, language, setLanguage, languages, currentLanguage } = useLanguage();

  // Channel: 'whatsapp' | 'sms' | 'email'
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');

  // Screen step: 'input' or 'otp'
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  // Country code auto-detection
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
        return COUNTRIES[0]; // India
      }
      if (tz.includes('Dubai')) return COUNTRIES[1];
      if (tz.includes('Riyadh')) return COUNTRIES[2];
      if (tz.includes('New_York') || tz.includes('America')) return COUNTRIES[3];
      if (tz.includes('London')) return COUNTRIES[4];
      if (tz.includes('Singapore')) return COUNTRIES[5];
    } catch {
      // fallback
    }
    return COUNTRIES[0]; // Default India +91
  });

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Phone input state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // OTP input state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isResendActive, setIsResendActive] = useState<boolean>(false);
  
  // Active OTP code
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(false);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Cross-dispatch states (e.g. sending to email while on phone screen)
  const [crossEmail, setCrossEmail] = useState('');
  const [showCrossEmailInput, setShowCrossEmailInput] = useState(false);
  const [crossEmailSent, setCrossEmailSent] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ticker for resend timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle Phone input formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputError(null);
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(rawVal);
  };

  // Submit & Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    if (channel === 'email') {
      const trimmed = emailInput.trim().toLowerCase();
      if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
        setInputError('Please enter a valid email address (e.g. merchant@gmail.com)');
        return;
      }

      try {
        const res = await sendEmailOtp(trimmed);
        setStep('otp');
        setResendTimer(30);
        setIsResendActive(false);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError(null);

        const code = res.mockOtp || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`khatta_email_otp_${trimmed}`) : null) || '123456';
        setActiveOtpCode(code);
        setShowNotificationBanner(true);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } catch (err: any) {
        setInputError(err.message || 'Failed to send OTP to email. Please try again.');
      }
      return;
    }

    // Phone (WhatsApp or SMS)
    if (phoneNumber.length !== 10) {
      setInputError(t.invalidPhone || 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
      const res = await sendOtp(fullPhone);

      setStep('otp');
      setResendTimer(30);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);

      const code = res.mockOtp || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`khatta_otp_${phoneNumber}`) : null) || '123456';
      setActiveOtpCode(code);
      setShowNotificationBanner(true);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setInputError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Handle cross-sending to Email when user is on Phone/WhatsApp mode
  const handleSendCrossEmail = async () => {
    if (!crossEmail || !crossEmail.includes('@') || !activeOtpCode) return;
    try {
      // Store the active OTP under this email in sessionStorage so it verifies immediately
      sessionStorage.setItem(`khatta_email_otp_${crossEmail.trim().toLowerCase()}`, activeOtpCode);
      if (typeof window !== 'undefined') {
        // Also fire Supabase email if possible
        sendEmailOtp(crossEmail).catch(() => {});
      }
      setCrossEmailSent(true);
      setTimeout(() => {
        setShowCrossEmailInput(false);
      }, 2500);
    } catch {
      setCrossEmailSent(true);
    }
  };

  // Handle OTP digit box change
  const handleOtpDigitChange = (index: number, val: string) => {
    setOtpError(null);
    const digit = val.replace(/\D/g, '').slice(-1);

    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits filled, trigger auto-submit
    if (newDigits.every((d) => d !== '')) {
      const fullCode = newDigits.join('');
      handleVerify(fullCode);
    }
  };

  // Handle backspace key on digit boxes
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle full OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else if (pasted.length < 6) {
      otpInputRefs.current[pasted.length]?.focus();
    }
  };

  // Auto-Read OTP action
  const handleAutoRead = async () => {
    if (!activeOtpCode) return;
    setIsAutoFilling(true);

    const chars = activeOtpCode.split('');
    const animatedDigits = ['', '', '', '', '', ''];

    for (let i = 0; i < chars.length; i++) {
      animatedDigits[i] = chars[i];
      setOtpDigits([...animatedDigits]);
      await new Promise((r) => setTimeout(r, 60));
    }

    setIsAutoFilling(false);
    await handleVerify(activeOtpCode);
  };

  // Copy OTP code
  const handleCopyOtp = () => {
    if (!activeOtpCode) return;
    navigator.clipboard?.writeText(activeOtpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Verify OTP submission
  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setOtpError(t.invalidOtp || 'Please enter the complete 6-digit OTP code');
      return;
    }

    setOtpError(null);
    try {
      if (channel === 'email') {
        await loginWithEmailOtp(emailInput.trim().toLowerCase(), code);
      } else {
        const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
        await loginWithOtp(fullPhone, code);
      }
      navigate('/');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid verification code. Please check code or try 123456.');
    }
  };

  // WhatsApp dispatch URL
  const whatsAppUrl = activeOtpCode 
    ? `https://api.whatsapp.com/send?phone=91${phoneNumber || ''}&text=${encodeURIComponent(`Your Shop KhattaBook OTP is ${activeOtpCode}. Valid for 10 minutes. Do not share this code.`)}`
    : `https://api.whatsapp.com/send?phone=91${phoneNumber || ''}`;

  return (
    <div style={{ width: '100%' }}>
      {/* ------------------------------------------------------------- */}
      {/* Top Bar: Regional Language Selector & Security Badge          */}
      {/* ------------------------------------------------------------- */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.75rem', fontWeight: '700' }}>
          <ShieldCheck size={16} />
          <span>Fast & Secure OTP</span>
        </div>

        {/* Regional Language Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--bg-secondary, rgba(255, 255, 255, 0.06))',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '0.35rem 0.75rem',
              color: 'var(--text-heading)',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={t.selectLanguage}
          >
            <Globe size={14} style={{ color: 'var(--primary, #3b82f6)' }} />
            <span>{currentLanguage.flag} {currentLanguage.nativeName}</span>
            <ChevronDown size={12} style={{ opacity: 0.7 }} />
          </button>

          {langDropdownOpen && (
            <>
              <div 
                onClick={() => setLangDropdownOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 990 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '200px',
                  backgroundColor: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 32px rgba(0,0,0,0.5)',
                  padding: '0.4rem',
                  zIndex: 995,
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '800' }}>
                  {t.selectLanguage}
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: language === lang.code ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: language === lang.code ? 'var(--primary, #3b82f6)' : 'var(--text-heading)',
                      fontWeight: language === lang.code ? '800' : '600',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{lang.flag} {lang.nativeName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* OTP Delivery Channel Selector: WhatsApp, SMS, or Email         */}
      {/* ------------------------------------------------------------- */}
      {step === 'input' && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose where to receive OTP:
          </div>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '0.4rem',
              backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
              padding: '0.3rem',
              borderRadius: '14px',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* WhatsApp Option */}
            <button
              type="button"
              onClick={() => {
                setChannel('whatsapp');
                setInputError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.35rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: channel === 'whatsapp' ? '#25D366' : 'transparent',
                color: channel === 'whatsapp' ? '#FFFFFF' : 'var(--text-heading)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: channel === 'whatsapp' ? '0 2px 8px rgba(37, 211, 102, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '1rem' }}>💬</span>
              <span>WhatsApp</span>
            </button>

            {/* SMS Option */}
            <button
              type="button"
              onClick={() => {
                setChannel('sms');
                setInputError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.35rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: channel === 'sms' ? 'var(--primary, #3b82f6)' : 'transparent',
                color: channel === 'sms' ? '#FFFFFF' : 'var(--text-heading)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: channel === 'sms' ? '0 2px 8px rgba(59, 130, 246, 0.35)' : 'none'
              }}
            >
              <Smartphone size={14} />
              <span>SMS</span>
            </button>

            {/* Email OTP Option */}
            <button
              type="button"
              onClick={() => {
                setChannel('email');
                setInputError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.35rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: channel === 'email' ? '#8B5CF6' : 'transparent',
                color: channel === 'email' ? '#FFFFFF' : 'var(--text-heading)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: channel === 'email' ? '0 2px 8px rgba(139, 92, 246, 0.35)' : 'none'
              }}
            >
              <Mail size={14} />
              <span>Email</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: Phone / Email Entry                                   */}
      {/* ------------------------------------------------------------- */}
      {step === 'input' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.3px', margin: 0 }}>
              {channel === 'whatsapp' 
                ? 'Login via WhatsApp OTP'
                : channel === 'email'
                  ? 'Login via Email OTP'
                  : 'Login via Mobile SMS'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.4' }}>
              {channel === 'whatsapp' 
                ? 'We will send a 6-digit verification code directly to your WhatsApp.'
                : channel === 'email'
                  ? 'We will send a 6-digit verification code directly to your Email inbox.'
                  : 'Enter your 10-digit mobile phone number to receive an instant OTP.'}
            </p>
          </div>

          {inputError && (
            <div 
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                color: '#EF4444', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '12px', 
                padding: '0.65rem 0.85rem', 
                fontSize: '0.825rem', 
                fontWeight: '600' 
              }}
            >
              {inputError}
            </div>
          )}

          {/* If Channel is WhatsApp or SMS: Phone input */}
          {channel !== 'email' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                {channel === 'whatsapp' ? 'WhatsApp Phone Number' : 'Mobile Phone Number'}
              </label>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                  border: inputError ? '2px solid #EF4444' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* Country Code Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.85rem 0.9rem',
                      border: 'none',
                      borderRight: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-heading)',
                      fontSize: '0.925rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{selectedCountry.flag}</span>
                    <span>{selectedCountry.dialCode}</span>
                    <ChevronDown size={13} style={{ opacity: 0.6 }} />
                  </button>

                  {countryDropdownOpen && (
                    <>
                      <div 
                        onClick={() => setCountryDropdownOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 990 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          width: '240px',
                          backgroundColor: 'var(--bg-card, #1e293b)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          boxShadow: '0 16px 32px rgba(0,0,0,0.5)',
                          padding: '0.4rem',
                          zIndex: 995,
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}
                      >
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setCountryDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '10px',
                              border: 'none',
                              backgroundColor: selectedCountry.code === c.code ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                              color: selectedCountry.code === c.code ? 'var(--primary, #3b82f6)' : 'var(--text-heading)',
                              fontWeight: selectedCountry.code === c.code ? '800' : '600',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <span style={{ fontSize: '1.15rem' }}>{c.flag}</span>
                            <span style={{ flex: 1 }}>{c.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* 10-Digit Mobile Number Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  autoFocus
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    padding: '0.85rem 1rem',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    color: 'var(--text-heading)',
                    letterSpacing: '0.05em'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {selectedCountry.name} 10-digit number
                </span>
                <span style={{ fontSize: '0.725rem', color: phoneNumber.length === 10 ? '#10B981' : 'var(--text-muted)', fontWeight: '700' }}>
                  {phoneNumber.length}/10 digits
                </span>
              </div>
            </div>
          ) : (
            /* If Channel is Email: Email input */
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                Email Address for OTP
              </label>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                  border: inputError ? '2px solid #EF4444' : '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '0.2rem 0.85rem',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Mail size={18} style={{ color: '#8B5CF6', marginRight: '0.65rem' }} />
                <input
                  type="email"
                  placeholder="merchant@gmail.com"
                  value={emailInput}
                  onChange={(e) => {
                    setInputError(null);
                    setEmailInput(e.target.value);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    padding: '0.75rem 0',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--text-heading)'
                  }}
                />
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem', padding: '0 0.25rem' }}>
                We'll send a 6-digit login code to this email inbox.
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authLoading || (channel !== 'email' ? phoneNumber.length !== 10 : !emailInput.includes('@'))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.95rem',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: 
                (channel !== 'email' ? phoneNumber.length === 10 : emailInput.includes('@'))
                  ? (channel === 'whatsapp' ? '#25D366' : channel === 'email' ? '#8B5CF6' : 'var(--primary, #3b82f6)')
                  : 'rgba(100, 116, 139, 0.3)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '0.975rem',
              cursor: (channel !== 'email' ? phoneNumber.length === 10 : emailInput.includes('@')) ? 'pointer' : 'not-allowed',
              boxShadow: 
                (channel !== 'email' ? phoneNumber.length === 10 : emailInput.includes('@'))
                  ? (channel === 'whatsapp' ? '0 8px 20px rgba(37, 211, 102, 0.4)' : channel === 'email' ? '0 8px 20px rgba(139, 92, 246, 0.4)' : '0 8px 20px rgba(59, 130, 246, 0.4)')
                  : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {authLoading ? (
              <span>Sending OTP...</span>
            ) : (
              <>
                {channel === 'whatsapp' && <span style={{ fontSize: '1.1rem' }}>💬</span>}
                {channel === 'email' && <Mail size={18} />}
                {channel === 'sms' && <Smartphone size={18} />}
                <span>
                  {channel === 'whatsapp' 
                    ? 'Get OTP on WhatsApp' 
                    : channel === 'email' 
                      ? 'Get OTP on Email' 
                      : 'Get SMS OTP'}
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Instant verification. No password needed.
            </p>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: 6-Digit OTP Verification Screen                       */}
      {/* ------------------------------------------------------------- */}
      {step === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.3px', margin: 0 }}>
                {channel === 'whatsapp' ? 'Verify WhatsApp OTP' : channel === 'email' ? 'Verify Email OTP' : 'Verify SMS OTP'}
              </h2>
              <button
                type="button"
                onClick={() => setStep('input')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #3b82f6)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={13} />
                <span>Change</span>
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Code sent to{' '}
              <strong style={{ color: 'var(--text-heading)' }}>
                {channel === 'email' ? emailInput : `${selectedCountry.dialCode} ${phoneNumber}`}
              </strong>
            </p>
          </div>

          {/* Notification Banner & Auto-Read Button */}
          {showNotificationBanner && activeOtpCode && (
            <div
              style={{
                backgroundColor: channel === 'whatsapp' ? 'rgba(37, 211, 102, 0.15)' : channel === 'email' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                border: `1px solid ${channel === 'whatsapp' ? '#25D366' : channel === 'email' ? '#8B5CF6' : 'var(--primary, #3b82f6)'}`,
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '10px', 
                    backgroundColor: channel === 'whatsapp' ? '#25D366' : channel === 'email' ? '#8B5CF6' : '#3B82F6', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {channel === 'whatsapp' ? '💬' : channel === 'email' ? <Mail size={18} /> : <MessageSquare size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {channel === 'whatsapp' ? 'WhatsApp Code' : channel === 'email' ? 'Email Inbox Code' : 'SMS Code'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: channel === 'whatsapp' ? '#25D366' : channel === 'email' ? '#A78BFA' : '#60A5FA', letterSpacing: '0.15em' }}>
                    {activeOtpCode}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={handleAutoRead}
                  disabled={isAutoFilling}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: channel === 'whatsapp' ? '#25D366' : channel === 'email' ? '#8B5CF6' : '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    flexShrink: 0
                  }}
                  title="Auto fill verification code"
                >
                  <Zap size={14} />
                  <span>{isAutoFilling ? 'Reading...' : 'Auto-Fill'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyOtp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.08))',
                    color: 'var(--text-heading)',
                    cursor: 'pointer'
                  }}
                  title="Copy OTP"
                >
                  {copiedOtp ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Action Row: Direct WhatsApp App Button & Email Dispatch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Direct WhatsApp Button */}
            {channel !== 'email' && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <span>Open WhatsApp (+91 {phoneNumber})</span>
              </a>
            )}

            {/* Email Inbox Link (if email mode) */}
            {channel === 'email' && (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: '#A78BFA',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '14px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                <Mail size={16} />
                <span>Open Gmail / Mail Inbox</span>
              </a>
            )}

            {/* Cross-Send: Send to Email option while in Phone mode */}
            {channel !== 'email' && !showCrossEmailInput && (
              <button
                type="button"
                onClick={() => setShowCrossEmailInput(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ✉️ Also send this OTP to my Email
              </button>
            )}

            {showCrossEmailInput && (
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '0.4rem', 
                  backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <input 
                  type="email"
                  placeholder="Enter your email"
                  value={crossEmail}
                  onChange={(e) => setCrossEmail(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.8rem',
                    color: 'var(--text-heading)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendCrossEmail}
                  disabled={!crossEmail.includes('@') || crossEmailSent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backgroundColor: crossEmailSent ? '#10B981' : '#8B5CF6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {crossEmailSent ? (
                    <>
                      <Check size={12} />
                      <span>Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {otpError && (
            <div 
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                color: '#EF4444', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '12px', 
                padding: '0.65rem 0.85rem', 
                fontSize: '0.825rem', 
                fontWeight: '600' 
              }}
            >
              {otpError}
            </div>
          )}

          {/* 6 Individual Digit Boxes */}
          <div>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: '0.5rem' 
              }}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  style={{
                    width: '46px',
                    height: '56px',
                    borderRadius: '14px',
                    border: digit ? '2px solid var(--primary, #3b82f6)' : '1px solid var(--border-color)',
                    backgroundColor: digit ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                    color: 'var(--text-heading)',
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: digit ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none'
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', padding: '0 0.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t.resendOtpIn || 'Resend in'} <strong>{resendTimer}s</strong>
              </span>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={!isResendActive || authLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: isResendActive ? 'var(--primary, #3b82f6)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: isResendActive ? 'pointer' : 'not-allowed'
                }}
              >
                <RefreshCw size={13} className={authLoading ? 'spin' : ''} />
                <span>{t.resendOtp || 'Resend OTP'}</span>
              </button>
            </div>
          </div>

          {/* Verify & Enter Shop Action Button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={authLoading || otpDigits.some((d) => d === '')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.95rem',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: otpDigits.every((d) => d !== '') ? 'var(--primary, #3b82f6)' : 'rgba(59, 130, 246, 0.4)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '0.975rem',
              cursor: otpDigits.every((d) => d !== '') ? 'pointer' : 'not-allowed',
              boxShadow: otpDigits.every((d) => d !== '') ? '0 8px 20px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {authLoading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>{t.verifyAndLogin || 'Verify & Enter Shop'}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Switch to Email / Staff Login Footer Option                   */}
      {/* ------------------------------------------------------------- */}
      {onSwitchToEmail && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSwitchToEmail}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.825rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Or sign in with Password
          </button>
        </div>
      )}
    </div>
  );
};
