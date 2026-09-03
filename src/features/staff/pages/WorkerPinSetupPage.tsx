import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useWorkerStore } from '../stores/workerStore';
import { useAuthStore } from '../../../stores/authStore';

export const WorkerPinSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shop } = useAuthStore();
  const { activateWorkerFirstTime, isLoading } = useWorkerStore();

  const shopId = shop?.id || 'default_shop';

  const [emailOrPhone, setEmailOrPhone] = useState(
    (location.state as any)?.emailOrPhone || ''
  );
  const [tempCode, setTempCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if ((location.state as any)?.emailOrPhone) {
      setEmailOrPhone((location.state as any).emailOrPhone);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError('Please enter your registered email or mobile number.');
      return;
    }
    if (!tempCode || tempCode.length !== 4) {
      setError('Please enter the 4-digit temporary approval code given by your shop owner.');
      return;
    }
    if (!newPin || newPin.length !== 4) {
      setError('Please create a 4-digit personal PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match. Please re-enter.');
      return;
    }

    try {
      await activateWorkerFirstTime(shopId, emailOrPhone.trim(), tempCode.trim(), newPin.trim());
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please verify approval code.');
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
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '28px',
          border: '1px solid var(--border-color)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--glass-shadow)',
          animation: 'modal-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Worker Account Activated!
            </h3>

            <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Your personal PIN has been set. Redirecting to your Worker Dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <ShieldCheck size={28} />
              </div>

              <h2 style={{ color: 'var(--text-heading)', fontWeight: '800', fontSize: '1.35rem' }}>
                First-Time Worker Activation
              </h2>
              <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Enter your approval code to create your personal 4-digit login PIN
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email or Phone */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Registered Email or Phone</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. ramesh@gmail.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
              </div>

              {/* 4-digit Temporary Approval Code */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Owner's 4-Digit Approval Code</label>
                <input
                  type="text"
                  maxLength={4}
                  className="input-field"
                  placeholder="e.g. 4821"
                  style={{ textAlign: 'center', letterSpacing: '0.35rem', fontSize: '1.15rem', fontWeight: '800' }}
                  value={tempCode}
                  onChange={(e) => setTempCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {/* Create Personal PIN */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Create Your 4-Digit Personal PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="input-field"
                  placeholder="••••"
                  style={{ textAlign: 'center', letterSpacing: '0.35rem', fontSize: '1.15rem', fontWeight: '800' }}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {/* Confirm Personal PIN */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Confirm 4-Digit Personal PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  className="input-field"
                  placeholder="••••"
                  style={{ textAlign: 'center', letterSpacing: '0.35rem', fontSize: '1.15rem', fontWeight: '800' }}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error && (
                <div
                  className="input-error"
                  style={{
                    marginBottom: '1.25rem',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--error-light)',
                    color: 'var(--error)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Activating Account...' : 'Set PIN & Open Workspace'}
              </button>
            </form>

            <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <Link
                to="/worker-login"
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={15} />
                <span>Already have a PIN? Log In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
