import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../../../providers/LanguageProvider';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, error, isLoading, clearError } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in your Gmail/Email and password');
      return;
    }
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error state updated in store
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsGoogleLoading(true);
    try {
      // Direct redirect to real Google Account Chooser via Supabase OAuth
      await loginWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Google Sign-In failed');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '85vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          border: '1px solid var(--border-color)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--glass-shadow)',
          animation: 'modal-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '16px',
            backgroundColor: 'var(--primary)', color: '#FFFFFF',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.5rem', marginBottom: '0.75rem',
            boxShadow: '0 6px 18px var(--primary-glow)'
          }}>
            K
          </div>
          <h1 style={{ color: 'var(--text-heading)', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            {t.appName}
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Merchant Login & Management
          </p>
        </div>

        {/* Continue with Google (Gmail) */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="btn btn-secondary"
          style={{ 
            width: '100%', 
            marginBottom: '1rem', 
            padding: '0.85rem', 
            gap: '0.75rem', 
            justifyContent: 'center', 
            borderRadius: '14px',
            fontWeight: '600',
            fontSize: '0.95rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-hover, rgba(255, 255, 255, 0.04))',
            color: 'var(--text-heading)'
          }}
          disabled={isLoading || isGoogleLoading}
          id="google-signin-btn"
        >
          {isGoogleLoading ? (
            <>
              <svg style={{ width: '20px', height: '20px', animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#4285F4" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
              </svg>
              <span style={{ color: 'var(--text-muted)' }}>Opening Google Sign-In...</span>
            </>
          ) : (
            <>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google (Gmail)</span>
            </>
          )}
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span>OR SIGN IN WITH EMAIL</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Gmail / Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                placeholder="merchant@gmail.com"
                style={{ paddingLeft: '2.75rem', borderRadius: '14px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', borderRadius: '14px' }}
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
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem' }} 
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Worker Space PIN Login Section */}
        <div style={{
          marginTop: '0.5rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👷</span>
            <span style={{ fontWeight: '700', color: '#0284c7', fontSize: '0.95rem' }}>Staff & Worker Access</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
            Are you a staff member or helper assigned to this shop?
          </p>
          <button
            type="button"
            onClick={() => navigate('/worker-login')}
            className="btn"
            style={{
              width: '100%',
              padding: '0.75rem',
              gap: '0.5rem',
              justifyContent: 'center',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.875rem',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            Enter Worker Space (PIN Login) →
          </button>
        </div>

        {/* Create Account Link */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-body)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
