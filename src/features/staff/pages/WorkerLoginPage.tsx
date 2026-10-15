/* features/staff/pages/WorkerLoginPage.tsx */
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, ArrowLeft, KeyRound, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useWorkerStore } from '../stores/workerStore';
import { useAuthStore } from '../../../stores/authStore';
import { describeWorkerAuthError } from '../services/workerAuthMessages';

const REASON_BANNERS: Record<string, { icon: typeof Clock; text: string; color: string; bg: string }> = {
  inactivity: {
    icon: Clock,
    text: 'You were logged out after 30 minutes of no activity. Enter your PIN to continue.',
    color: '#B45309',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  revoked: {
    icon: ShieldAlert,
    text: 'The shop owner signed you out. Please log in again.',
    color: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
  removed: {
    icon: AlertCircle,
    text: 'Your staff account was removed by the shop owner.',
    color: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
  suspended: {
    icon: AlertCircle,
    text: 'The shop owner has paused your access. Please talk to them.',
    color: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
};

export const WorkerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shop } = useAuthStore();
  const { loginWorkerWithPin, isLoading } = useWorkerStore();

  const reason = new URLSearchParams(location.search).get('reason');
  const banner = reason ? REASON_BANNERS[reason] : undefined;

  const shopId = shop?.id || 'default_shop';

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ id?: string; pin?: string }>({});
  const [isNotActivated, setIsNotActivated] = useState(false);
  const [shopChoices, setShopChoices] = useState<Array<{ id: string; name: string }> | null>(null);

  const signIn = async (targetShopId: string) => {
    try {
      await loginWorkerWithPin(targetShopId, emailOrPhone.trim(), pin.trim());
      navigate('/');
    } catch (err) {
      const info = describeWorkerAuthError(err, 'login');
      setError(info.message);
      setIsNotActivated(!!info.notActivated);
      setShopChoices(info.shops && info.shops.length > 0 ? info.shops : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShopChoices(null);
    setIsNotActivated(false);

    const nextFieldErrors: { id?: string; pin?: string } = {};
    if (!emailOrPhone.trim()) nextFieldErrors.id = 'Enter your email or phone number.';
    if (pin.length !== 4) nextFieldErrors.pin = 'Enter your 4-digit PIN.';
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.id || nextFieldErrors.pin) return;

    await signIn(shopId);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem 0.75rem',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl, 28px)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '11px', flexShrink: 0,
            backgroundColor: '#0284C7', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyRound size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Worker Login
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Sign in to your worker account.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ padding: '1.25rem 1.25rem' }}>
          {banner && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.6rem 0.85rem',
              borderRadius: '12px',
              backgroundColor: banner.bg,
              color: banner.color,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <banner.icon size={16} style={{ flexShrink: 0 }} />
              <span>{banner.text}</span>
            </div>
          )}

          {/* Phone or email */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label" htmlFor="worker-id">Email or phone number</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={17} style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-muted)' }} />
              <input
                id="worker-id"
                type="text"
                inputMode="email"
                autoComplete="username"
                className="input-field"
                placeholder="Email or phone number"
                aria-invalid={!!fieldErrors.id}
                aria-describedby={fieldErrors.id ? 'worker-id-error' : undefined}
                style={{ width: '100%', minWidth: 0, paddingLeft: '2.5rem', borderColor: fieldErrors.id ? 'var(--error)' : undefined }}
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  if (fieldErrors.id) setFieldErrors((f) => ({ ...f, id: undefined }));
                }}
                autoFocus
              />
            </div>
            {fieldErrors.id && (
              <span id="worker-id-error" style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '600' }}>
                {fieldErrors.id}
              </span>
            )}
          </div>

          {/* PIN */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem 0.75rem' }}>
              <label className="form-label" htmlFor="worker-pin">4-digit PIN</label>
              <Link
                to="/worker-activate"
                state={{ emailOrPhone }}
                style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600' }}
              >
                First time? Activate PIN
              </Link>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <KeyRound size={17} style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-muted)' }} />
              <input
                id="worker-pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={4}
                className="input-field"
                placeholder="••••"
                aria-invalid={!!fieldErrors.pin}
                aria-describedby={fieldErrors.pin ? 'worker-pin-error' : undefined}
                style={{
                  width: '100%',
                  minWidth: 0,
                  paddingLeft: '2.5rem',
                  letterSpacing: '0.4rem',
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  borderColor: fieldErrors.pin ? 'var(--error)' : undefined,
                }}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  if (fieldErrors.pin) setFieldErrors((f) => ({ ...f, pin: undefined }));
                }}
              />
            </div>
            {fieldErrors.pin && (
              <span id="worker-pin-error" style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '600' }}>
                {fieldErrors.pin}
              </span>
            )}
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginBottom: '1rem',
                padding: '0.6rem 0.85rem',
                backgroundColor: 'var(--error-light)',
                color: 'var(--error)',
                borderRadius: '12px',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
              {shopChoices && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {shopChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => signIn(choice.id)}
                      disabled={isLoading}
                      className="btn btn-secondary"
                      style={{ width: '100%', minHeight: '40px', padding: '0 0.85rem', fontSize: '0.85rem', justifyContent: 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {choice.name}
                    </button>
                  ))}
                </div>
              )}
              {isNotActivated && (
                <button
                  type="button"
                  onClick={() => navigate('/worker-activate', { state: { emailOrPhone } })}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: '700', alignSelf: 'flex-start', borderRadius: '10px' }}
                >
                  Activate PIN →
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '46px', padding: '0 1rem', borderRadius: 'var(--radius-md, 14px)', fontWeight: '700' }}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem', color: 'var(--text-muted)', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to owner login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
