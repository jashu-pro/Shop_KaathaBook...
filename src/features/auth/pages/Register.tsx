/* features/auth/pages/Register.tsx */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signup, error, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await signup(email, password, fullName);
      navigate('/shop-setup');
    } catch (err: any) {
      // Error handled by store
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
            width: '48px', height: '48px', borderRadius: '16px',
            backgroundColor: 'var(--primary)', color: '#FFFFFF',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.4rem', marginBottom: '0.75rem',
            boxShadow: '0 6px 18px var(--primary-glow)'
          }}>
            K
          </div>
          <h1 style={{ color: 'var(--text-heading)', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
            Create Merchant Account
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Start managing your shop ledger digitally in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label">Full Name *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Ramesh Kumar"
                style={{ paddingLeft: '2.75rem' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label">Email Address *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field"
                placeholder="ramesh.store@gmail.com"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Phone Number */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label">Mobile Phone Number</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                className="input-field"
                placeholder="98765 43210"
                maxLength={10}
                style={{ paddingLeft: '2.75rem' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="At least 6 characters"
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
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Confirm Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter password"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute', right: '0.85rem', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(localError || error) && (
            <div className="input-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '12px', fontSize: '0.85rem' }}>
              {localError || error}
            </div>
          )}

          {/* Create Account Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginBottom: '1.5rem' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-body)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
