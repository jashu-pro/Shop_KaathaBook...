import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { ShopRegistrationRequest } from '../types';
import {
  Clock,
  Check,
  X,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';


const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminPendingRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ShopRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // View modal state (Note: Passwords/Tokens NEVER exist here)
  const [viewModalRequest, setViewModalRequest] = useState<ShopRegistrationRequest | null>(null);

  // Reject modal state
  const [rejectModalRequest, setRejectModalRequest] = useState<ShopRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await adminRepo.getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: ShopRegistrationRequest) => {
    try {
      setActionLoading(req.id);
      await adminRepo.approveRegistration(req.id);
      setToastMessage({ type: 'success', text: `Approved "${req.shopName}". Shop is now ACTIVE.` });
      setViewModalRequest(null);
      await loadRequests();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: `Approval failed: ${err.message || 'Error'}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRequest) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for the applicant.');
      return;
    }

    try {
      setActionLoading(rejectModalRequest.id);
      await adminRepo.rejectRegistration(rejectModalRequest.id, rejectionReason.trim());
      setToastMessage({ type: 'success', text: `Rejected "${rejectModalRequest.shopName}". Reason recorded in audit log.` });
      setRejectModalRequest(null);
      setViewModalRequest(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: `Rejection failed: ${err.message || 'Error'}` });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const filtered = requests.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.shopName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.phone && r.phone.includes(term)) ||
      (r.city && r.city.toLowerCase().includes(term)) ||
      r.businessType.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Pending Registration Requests
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Review, inspect credentials metadata, and approve or reject merchant registrations.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 1rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(231, 142, 9, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          fontSize: '0.85rem',
          fontWeight: 700,
        }}>
          <Clock size={16} />
          <span>{requests.length} Pending Review</span>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: toastMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: toastMessage.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Controls: Search */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Search size={18} style={{ color: '#6b7280' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by shop name, owner email, phone, city, or category..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading pending queue...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <CheckCircle2 size={40} style={{ color: '#10b981', margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6' }}>
              No Pending Requests Found
            </div>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              {search ? 'No registrations matched your filter.' : 'All shop registrations have been processed.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'left',
                  color: '#6b7280',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Shop & Category</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Owner Identity</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Location</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Submission Date</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{req.shopName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                        {req.businessType}
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <div style={{ color: '#f3f4f6', fontWeight: 500 }}>{req.email}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                        {req.phone || 'No phone registered'}
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      <div>{req.city || 'N/A'}{req.state ? `, ${req.state}` : ''}</div>
                      {req.pincode && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>PIN: {req.pincode}</div>}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      <div>{new Date(req.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setViewModalRequest(req)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#e5e7eb',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleApprove(req)}
                          disabled={actionLoading === req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 0.95rem',
                            borderRadius: '8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectModalRequest(req);
                            setRejectionReason('');
                          }}
                          disabled={actionLoading === req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Details Modal (Never displays passwords) */}
      {viewModalRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            maxWidth: '650px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}>
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Shop Registration Dossier
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                  Request ID: {viewModalRequest.id}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                <Clock size={13} />
                <span>PENDING</span>
              </div>
            </div>

            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Shop Specs */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.65rem' }}>
                  Business Particulars
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Shop Name</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>{viewModalRequest.shopName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Category</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3b82f6' }}>{viewModalRequest.businessType}</div>
                  </div>
                </div>
              </div>

              {/* Owner Identity */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.65rem' }}>
                  Owner Identity & Contact
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Registered Email</div>
                    <div style={{ fontSize: '0.95rem', color: '#ffffff' }}>{viewModalRequest.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Phone Number</div>
                    <div style={{ fontSize: '0.95rem', color: '#ffffff' }}>{viewModalRequest.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.65rem' }}>
                  Store Location
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.5' }}>
                  <div>{viewModalRequest.address || 'Address not specified'}</div>
                  {viewModalRequest.landmark && <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Landmark: {viewModalRequest.landmark}</div>}
                  <div style={{ marginTop: '0.35rem', fontWeight: 600, color: '#ffffff' }}>
                    {[viewModalRequest.city, viewModalRequest.state, viewModalRequest.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>

              {/* Security Banner: No passwords stored or displayed */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontSize: '0.8rem',
              }}>
                <ShieldCheck size={16} />
                <span>Security Protected: Credentials handled strictly by Supabase Auth (no plaintext or tokens).</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <button
                onClick={() => setViewModalRequest(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setRejectModalRequest(viewModalRequest);
                    setRejectionReason('');
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject Request
                </button>

                <button
                  onClick={() => handleApprove(viewModalRequest)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '10px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Approve Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 60,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '2rem',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f87171', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Reject Registration Application
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 1.25rem' }}>
              Specify the exact reason for rejecting <strong>{rejectModalRequest.shopName}</strong>. This text will be shown on the merchant's portal so they can address the issue.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete address details or identity verification could not be validated."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setRejectModalRequest(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPendingRequestsPage;
