/* features/auth/pages/Register.tsx */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signup, error, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
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
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel glass-card float-animation" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.5px' }}>Register Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Start managing your business credit digitally
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. ramesh.store@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {(localError || error) && (
            <div className="input-error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--error-light)', borderRadius: '6px' }}>
              {localError || error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
