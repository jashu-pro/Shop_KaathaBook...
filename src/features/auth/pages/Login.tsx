/* features/auth/pages/Login.tsx */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, error, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // Error handled by store
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setLocalError(err.message || 'Google Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel glass-card float-animation" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.5px' }}>Shop KhattaBook</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Digital ledger for smart Indian merchants
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. store@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Forgot password?
            </Link>
          </div>

          {(localError || error) && (
            <div className="input-error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--error-light)', borderRadius: '6px' }}>
              {localError || error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={isLoading}>
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.85 5.85 0 0 1 8.1 12c0-3.217 2.61-5.83 5.891-5.83 1.545 0 2.955.58 4.023 1.53l2.437-2.437A9.782 9.782 0 0 0 14 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.73 0 9.96-4.03 9.96-9.92 0-.61-.06-1.18-.17-1.715H12.24Z"/>
          </svg>
          Sign in with Google
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
