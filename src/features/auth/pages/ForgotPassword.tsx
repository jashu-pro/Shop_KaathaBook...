/* features/auth/pages/ForgotPassword.tsx */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { Logger } from '../../../services/Logger';

const ForgotPassword: React.FC = () => {
  const authRepo = RepositoryFactory.getAuthRepository();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authRepo.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      Logger.error('ForgotPassword: Reset password failed', err);
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel glass-card float-animation" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.5px' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            We will email you a link to reset your password
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div className="badge badge-success" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'inline-flex' }}>
              ✓ Reset link sent!
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Please check your email client for instructions on resetting your account password.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="e.g. store@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="input-error" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--error-light)', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
