/* features/staff/pages/WorkerLoginPage.tsx */
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, ArrowLeft, KeyRound, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useWorkerStore } from '../stores/workerStore';
import { useAuthStore } from '../../../stores/authStore';

export const WorkerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shop } = useAuthStore();
  const { loginWorkerWithPin, isLoading } = useWorkerStore();

  const queryParams = new URLSearchParams(location.search);
  const reason = queryParams.get('reason');

  const shopId = shop?.id || 'default_shop';
  const shopName = shop?.name || 'Shop KhattaBook';

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNotActivated, setIsNotActivated] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsNotActivated(false);

    if (!emailOrPhone.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit personal PIN.');
      return;
    }

    try {
      await loginWorkerWithPin(shopId, emailOrPhone.trim(), pin.trim());
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setError(msg);
      if (msg.includes('not activated') || msg.includes('temporary approval code') || msg.includes('Approval Code')) {
        setIsNotActivated(true);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '85vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '28px',
          border: '1px solid var(--border-color)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--glass-shadow)',
          animation: 'modal-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)',
            }}
          >
            👷
          </div>

          <h2 style={{ color: 'var(--text-heading)', fontWeight: '800', fontSize: '1.4rem' }}>
            Worker Space
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            {shopName}
          </p>
        </div>

        {/* Reason Banners */}
        {reason === 'inactivity' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#F59E0B',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={16} style={{ flexShrink: 0 }} />
            <span>You were logged out due to 30 minutes of inactivity. Please enter your PIN to continue.</span>
          </div>
        )}

        {reason === 'revoked' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>Active sessions were revoked by the shop owner. Please log in again.</span>
          </div>
        )}

        {reason === 'suspended' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Your worker access has been suspended by the shop owner.</span>
          </div>
        )}


        <form onSubmit={handleSubmit}>
          {/* Email or Phone Input */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Registered Email or Phone</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="ramesh@gmail.com or 9876543210"
                style={{ paddingLeft: '2.75rem' }}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>
          </div>

          {/* 4-digit PIN Input */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Personal 4-Digit PIN</label>
              <Link
                to="/worker-activate"
                style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}
              >
                First time? Activate PIN
              </Link>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="password"
                maxLength={4}
                className="input-field"
                placeholder="••••"
                style={{
                  paddingLeft: '2.75rem',
                  letterSpacing: '0.4rem',
                  fontSize: '1.2rem',
                  fontWeight: '800',
                }}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {error && (
            <div
              className="input-error"
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 0.95rem',
                backgroundColor: 'var(--error-light)',
                color: 'var(--error)',
                borderRadius: '14px',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
              {isNotActivated && (
                <button
                  type="button"
                  onClick={() => navigate('/worker-activate', { state: { emailOrPhone } })}
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    alignSelf: 'flex-start',
                    borderRadius: '10px',
                  }}
                >
                  Activate with Approval Code →
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying PIN...' : 'Enter Worker Space'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Owner Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
