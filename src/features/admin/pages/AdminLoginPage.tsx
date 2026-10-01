/* features/admin/pages/AdminLoginPage.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await loginAsAdmin(email.trim(), password);
      if (success) {
        navigate('/admin', { replace: true });
      } else {
        setError('Access denied: Invalid credentials or account lacks administrator privileges.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#111827',
        borderRadius: '24px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            margin: '0 auto 1rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
          }}>
            <ShieldAlert size={26} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
            Administrator Access Portal
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Shop KhattaBook Platform Governance & Security
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.4rem' }}>
                Administrator Email
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <Mail size={16} style={{ color: '#9ca3af' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@khattabook.com"
                  autoComplete="username"
                  required
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.4rem' }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}>
                <Lock size={16} style={{ color: '#9ca3af' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                marginTop: '0.5rem',
              }}
            >
              <span>{loading ? 'Verifying Authorization...' : 'Sign In as Administrator'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '0.82rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Back to Merchant Portal Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminLoginPage;
