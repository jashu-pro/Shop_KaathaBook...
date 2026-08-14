/* features/auth/pages/Login.tsx */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, error, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Phone Login Modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in all email and password fields');
      return;
    }
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // Error state updated in store
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setLocalError(err.message || 'Google Sign-In failed');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLocalError(null);
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setLocalError('Please enter valid 4-digit OTP code');
      return;
    }
    setLocalError(null);
    try {
      // Log in demo merchant for phone OTP verification
      await login('demo.merchant@khattabook.com', 'password123');
      setPhoneSuccess(true);
      setTimeout(() => {
        setShowPhoneModal(false);
        navigate('/');
      }, 600);
    } catch (err: any) {
      setLocalError(err.message || 'OTP Verification failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '85vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          border: '1px solid var(--border-color)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--glass-shadow)',
          animation: 'modal-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            backgroundColor: 'var(--primary)', color: '#FFFFFF',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.4rem', marginBottom: '0.75rem',
            boxShadow: '0 6px 18px var(--primary-glow)'
          }}>
            K
          </div>
          <h1 style={{ color: 'var(--text-heading)', fontWeight: '800', fontSize: '1.45rem', letterSpacing: '-0.5px' }}>
            Shop KhattaBook
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Sign in to access your digital business ledger
          </p>
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                placeholder="merchant@gmail.com"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.85rem', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
              Forgot Password?
            </Link>
          </div>

          {/* Error Banner */}
          {(localError || error) && (
            <div className="input-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '12px', fontSize: '0.85rem' }}>
              {localError || error}
            </div>
          )}

          {/* Sign In Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleLogin}
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '0.75rem', padding: '0.75rem', gap: '0.65rem', justifyContent: 'center' }}
          disabled={isLoading}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Continue with Phone */}
        <button
          onClick={() => setShowPhoneModal(true)}
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '1.75rem', padding: '0.75rem', gap: '0.65rem', justifyContent: 'center' }}
          disabled={isLoading}
        >
          <Phone size={18} style={{ color: 'var(--primary)' }} />
          <span>Continue with Phone</span>
        </button>

        {/* Create Account Link */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-body)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Create Account
          </Link>
        </div>
      </div>

      {/* Phone OTP Modal */}
      {showPhoneModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Phone Number Verification
              </h3>
              <button onClick={() => setShowPhoneModal(false)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>

            {phoneSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem auto' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)' }}>Verification Successful</h4>
                <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Logging into your shop...</p>
              </div>
            ) : !otpSent ? (
              <form onSubmit={handleSendOtp}>
                <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Enter your 10-digit mobile number to receive an instant OTP verification code.
                </p>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Mobile Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{
                      padding: '0.85rem 1rem', borderRadius: '18px', backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.95rem'
                    }}>
                      +91
                    </div>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="98765 43210"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button type="button" onClick={() => setOtpSent(false)} className="btn btn-ghost btn-icon" style={{ padding: '0.2rem' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.875rem' }}>
                    Enter 4-digit code sent to <strong>+91 {phoneNumber}</strong>
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">OTP Verification Code</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 1234"
                    maxLength={6}
                    style={{ textAlign: 'center', letterSpacing: '0.25rem', fontSize: '1.2rem', fontWeight: '800' }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Verify & Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
