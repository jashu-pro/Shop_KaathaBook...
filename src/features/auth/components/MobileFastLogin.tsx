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
  ChevronDown
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
  const { sendOtp, loginWithOtp, isLoading: authLoading } = useAuth();
  const { t, language, setLanguage, languages, currentLanguage } = useLanguage();

  // Screen step: 'phone' or 'otp'
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
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
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP input state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isResendActive, setIsResendActive] = useState<boolean>(false);
  
  // Simulated incoming SMS state for auto-reading demo
  const [simulatedSmsOtp, setSimulatedSmsOtp] = useState<string | null>(null);
  const [showSmsBanner, setShowSmsBanner] = useState<boolean>(false);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);

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
    setPhoneError(null);
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(rawVal);
  };

  // Submit Phone & Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError(null);

    if (phoneNumber.length !== 10) {
      setPhoneError(t.invalidPhone);
      return;
    }

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
      const res = await sendOtp(fullPhone);

      // Move to OTP step
      setStep('otp');
      setResendTimer(30);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);

      // Simulate incoming SMS for automatic reading experience
      if (res.mockOtp) {
        setSimulatedSmsOtp(res.mockOtp);
        setShowSmsBanner(true);

        // Auto-focus first input
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to send OTP. Please try again.');
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

  // Auto-Read SMS OTP action
  const handleAutoReadSms = async () => {
    if (!simulatedSmsOtp) return;
    setIsAutoFilling(true);

    // Visual typing animation for auto-read simulation
    const chars = simulatedSmsOtp.split('');
    const animatedDigits = ['', '', '', '', '', ''];

    for (let i = 0; i < chars.length; i++) {
      animatedDigits[i] = chars[i];
      setOtpDigits([...animatedDigits]);
      await new Promise((r) => setTimeout(r, 60));
    }

    setIsAutoFilling(false);
    await handleVerify(simulatedSmsOtp);
  };

  // Verify OTP submission
  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setOtpError(t.invalidOtp);
      return;
    }

    setOtpError(null);
    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
      await loginWithOtp(fullPhone, code);
      navigate('/');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid verification code. Please check SMS.');
    }
  };

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
          marginBottom: '1.5rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.75rem', fontWeight: '700' }}>
          <ShieldCheck size={16} />
          <span>{t.fastLoginBadge}</span>
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
      {/* STEP 1: Phone Number Entry                                     */}
      {/* ------------------------------------------------------------- */}
      {step === 'phone' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.3px', margin: 0 }}>
              {t.mobileAuthTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.4' }}>
              {t.mobileAuthSubtitle}
            </p>
          </div>

          {phoneError && (
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
              {phoneError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              {t.phoneNumber}
            </label>

            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.05))',
                border: phoneError ? '2px solid #EF4444' : '1px solid var(--border-color)',
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
                placeholder={t.phonePlaceholder}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authLoading || phoneNumber.length !== 10}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.95rem',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: phoneNumber.length === 10 ? 'var(--primary, #3b82f6)' : 'rgba(59, 130, 246, 0.4)',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '0.975rem',
              cursor: phoneNumber.length === 10 ? 'pointer' : 'not-allowed',
              boxShadow: phoneNumber.length === 10 ? '0 8px 20px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {authLoading ? (
              <span>{t.sendingOtp}</span>
            ) : (
              <>
                <span>{t.sendOtp}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Guarantee Footer */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {t.termsNotice}
            </p>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: 6-Digit Auto-Reading SMS OTP Field                    */}
      {/* ------------------------------------------------------------- */}
      {step === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.3px', margin: 0 }}>
                {t.otpScreenTitle}
              </h2>
              <button
                type="button"
                onClick={() => setStep('phone')}
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
                <span>{t.changePhone}</span>
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {t.otpSentTo} <strong style={{ color: 'var(--text-heading)' }}>{selectedCountry.dialCode} {phoneNumber}</strong>
            </p>
          </div>

          {/* Simulated Auto-Reading SMS Toast Banner */}
          {showSmsBanner && simulatedSmsOtp && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
                animation: 'pulse 2s infinite'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div 
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '10px', 
                    backgroundColor: '#10B981', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    SMS Verification Code
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#10B981', letterSpacing: '0.15em' }}>
                    {simulatedSmsOtp}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoReadSms}
                disabled={isAutoFilling}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  flexShrink: 0
                }}
              >
                <Zap size={14} />
                <span>{isAutoFilling ? 'Reading...' : t.autoFillSimulated}</span>
              </button>
            </div>
          )}

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
                {t.resendOtpIn} <strong>{resendTimer}s</strong>
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
                <span>{t.resendOtp}</span>
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
              <span>{t.verifying}</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>{t.verifyAndLogin}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Switch to Email / Staff Login Footer Option                   */}
      {/* ------------------------------------------------------------- */}
      {onSwitchToEmail && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
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
            {t.orEmailLogin}
          </button>
        </div>
      )}
    </div>
  );
};
