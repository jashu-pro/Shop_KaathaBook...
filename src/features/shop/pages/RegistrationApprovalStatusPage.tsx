/* features/shop/pages/RegistrationApprovalStatusPage.tsx */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { EventBus } from '../../../services/EventBus';
import { 
  Clock, 
  XCircle, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export const RegistrationApprovalStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, shop, registrationRequest, isOnboarded, refreshShopStatus, signOut } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // If shop became active, redirect immediately to dashboard
  useEffect(() => {
    if (isOnboarded && shop?.status === 'active') {
      navigate('/', { replace: true });
    }
  }, [isOnboarded, shop?.status, navigate]);

  // Real-time EventBus synchronization for instant approval detection
  useEffect(() => {
    const unsub = EventBus.subscribe('shop:status_changed', () => {
      refreshShopStatus();
    });
    return () => unsub();
  }, [refreshShopStatus]);

  // Periodic polling every 12 seconds to auto-detect admin approval
  useEffect(() => {
    if (shop?.status !== 'pending') return;

    const interval = setInterval(() => {
      refreshShopStatus();
    }, 12000);

    return () => clearInterval(interval);
  }, [shop?.status, refreshShopStatus]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckMessage(null);
    try {
      await refreshShopStatus();
      if (shop?.status === 'active') {
        setCheckMessage('Approved! Redirecting to your dashboard...');
        setTimeout(() => navigate('/', { replace: true }), 800);
      } else if (shop?.status === 'rejected') {
        setCheckMessage('Status updated: Registration was rejected.');
      } else {
        setCheckMessage('Status verified: Still under review.');
      }
    } catch {
      setCheckMessage('Unable to refresh status. Please try again.');
    } finally {
      setChecking(false);
      setTimeout(() => setCheckMessage(null), 4000);
    }
  };

  const status = shop?.status || registrationRequest?.status || 'pending';
  const isRejected = status === 'rejected';
  const isSuspended = status === 'suspended';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary, #090d16)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--bg-card, #111827)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, #1f2937)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header Ribbon */}
        <div style={{
          padding: '2rem 2.5rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #1f2937)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: isRejected 
            ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)' 
            : 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}>
              K
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading, #f9fafb)', margin: 0 }}>
                Shop KhattaBook
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #9ca3af)', margin: 0 }}>
                Merchant Verification Gateway
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted, #9ca3af)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Sign out of current account"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '2.5rem' }}>
          {isRejected ? (
            /* ────────── REJECTED VIEW ────────── */
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}>
                <XCircle size={16} />
                <span>REGISTRATION REJECTED</span>
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading, #f9fafb)', margin: '0 0 0.75rem' }}>
                Application Not Approved
              </h2>
              <p style={{ color: 'var(--text-body, #d1d5db)', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1.75rem' }}>
                Thank you for submitting your shop registration. Platform administration reviewed your application, but it could not be approved at this time.
              </p>

              {/* Rejection Reason Box */}
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>Reason Provided by Administrator</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-heading, #f9fafb)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  "{registrationRequest?.rejectionReason || 'The shop information provided did not satisfy platform verification requirements.'}"
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/shop-setup')}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span>Re-apply with Updated Details</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : isSuspended ? (
            /* ────────── SUSPENDED VIEW ────────── */
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}>
                <AlertTriangle size={16} />
                <span>SHOP ACCOUNT SUSPENDED</span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading, #f9fafb)', margin: '0 0 0.75rem' }}>
                Temporary Account Suspension
              </h2>
              <p style={{ color: 'var(--text-body, #d1d5db)', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1.75rem' }}>
                This shop account has been temporarily suspended by administrative review. For assistance or reactivation, please contact support.
              </p>
            </div>
          ) : (
            /* ────────── PENDING APPROVAL VIEW ────────── */
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}>
                <Clock size={16} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>PENDING ADMINISTRATOR APPROVAL</span>
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading, #f9fafb)', margin: '0 0 0.75rem' }}>
                Verification in Progress
              </h2>
              <p style={{ color: 'var(--text-body, #d1d5db)', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1.75rem' }}>
                Your shop registration has been submitted successfully and is currently queued for security review. You will receive immediate dashboard access once an administrator approves your request.
              </p>

              {/* Submitted Details Card */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color, #1f2937)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
              }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Submitted Shop Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)' }}>Shop Name</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading, #f9fafb)' }}>
                      {shop?.name || registrationRequest?.shopName || 'Registered Shop'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)' }}>Business Category</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-heading, #f9fafb)' }}>
                      {shop?.businessType || registrationRequest?.businessType || 'Retail'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)' }}>Owner Contact</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-heading, #f9fafb)' }}>
                      {user?.email || registrationRequest?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)' }}>Status</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24' }}>
                      Under Review
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {checkMessage && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <CheckCircle2 size={16} />
                  <span>{checkMessage}</span>
                </div>
              )}

              {/* Refresh Button */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: checking ? 'not-allowed' : 'pointer',
                    opacity: checking ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
                  <span>{checking ? 'Checking Status...' : 'Check Status Now'}</span>
                </button>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)' }}>
                  Auto-checks status every 12s
                </span>
              </div>
            </div>
          )}

          {/* Security & Support Note */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color, #1f2937)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #9ca3af)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              <span>Identity & Security Guard Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HelpCircle size={15} />
              <span>Need help? support@shopkhattabook.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RegistrationApprovalStatusPage;
