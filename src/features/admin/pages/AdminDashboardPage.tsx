/* features/admin/pages/AdminDashboardPage.tsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminKPIStats, ShopRegistrationRequest, AdminShopListItem, AdminAuditLog } from '../types';
import {
  Store,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
  ArrowRight,
  History,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';


const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminKPIStats>({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    rejectedShops: 0,
    suspendedShops: 0,
    totalWorkers: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<ShopRegistrationRequest[]>([]);
  const [recentShops, setRecentShops] = useState<AdminShopListItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShopRegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpis, pending, shops, logs] = await Promise.all([
        adminRepo.getKPIStats(),
        adminRepo.getPendingRequests(),
        adminRepo.getAllShops(),
        adminRepo.getAuditLogs(),
      ]);
      setStats(kpis);
      setPendingRequests(pending.slice(0, 5));
      setRecentShops(shops.slice(0, 6));
      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickApprove = async (req: ShopRegistrationRequest) => {
    try {
      setActionLoading(req.id);
      await adminRepo.approveRegistration(req.id);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Approval failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectModal = (req: ShopRegistrationRequest) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for the applicant.');
      return;
    }
    try {
      setActionLoading(selectedRequest.id);
      await adminRepo.rejectRegistration(selectedRequest.id, rejectionReason.trim());
      setRejectModalOpen(false);
      setSelectedRequest(null);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const kpiCards = [
    { title: 'Total Shops', value: stats.totalShops, icon: Store, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Active Shops', value: stats.activeShops, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'Pending Approval', value: stats.pendingShops, icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', alert: stats.pendingShops > 0 },
    { title: 'Rejected Shops', value: stats.rejectedShops, icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { title: 'Suspended Shops', value: stats.suspendedShops, icon: AlertTriangle, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    { title: 'Total Workers', value: stats.totalWorkers, icon: Users, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
            Operations & Approval Overview
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Real-time merchant verification, tenant oversight, and security management.
          </p>
        </div>

        {stats.pendingShops > 0 && (
          <button
            onClick={() => navigate('/admin/pending')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: '#f59e0b',
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Clock size={16} />
            <span>Review {stats.pendingShops} Pending Requests</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }}>
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#111827',
                borderRadius: '16px',
                border: card.alert ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.25rem 1.5rem',
                boxShadow: card.alert ? '0 0 25px rgba(245, 158, 11, 0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>{card.title}</span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: card.color, letterSpacing: '-1px' }}>
                {loading ? '...' : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Registrations Action Section */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.5rem',
        marginBottom: '2.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Pending Registration Queue
            </h2>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
              {pendingRequests.length} Ready
            </span>
          </div>

          <button
            onClick={() => navigate('/admin/pending')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#6b7280' }}>
            <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#9ca3af' }}>
              No Pending Registrations
            </div>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              All merchant shop applications have been reviewed.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Shop Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Owner Info</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Submitted At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#f3f4f6' }}>{req.shopName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{req.businessType}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#f3f4f6' }}>{req.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{req.phone || 'No phone'}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.82rem' }}>
                      {req.city || req.address || 'India'}
                    </td>
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.82rem' }}>
                      {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleQuickApprove(req)}
                          disabled={actionLoading === req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => handleOpenRejectModal(req)}
                          disabled={actionLoading === req.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            fontWeight: 600,
                            fontSize: '0.8rem',
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

      {/* Grid of Recent Shops and Audit Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Recent Shops */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Recent Shops & Workers
            </h2>
            <button
              onClick={() => navigate('/admin/shops')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              All Shops
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentShops.map((shop) => (
              <div
                key={shop.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>{shop.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    Owner: {shop.ownerName} ({shop.ownerEmail})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    color: '#c4b5fd',
                    fontWeight: 600,
                  }}>
                    {shop.workerCount} Workers
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: shop.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: shop.status === 'active' ? '#34d399' : '#fbbf24',
                  }}>
                    {shop.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Immutable Audit Trail */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Immutable Audit Stream
            </h2>
            <button
              onClick={() => navigate('/admin/audit')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Full Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                No audit events recorded yet.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <History size={16} style={{ color: '#3b82f6', marginTop: '0.2rem', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                      Target: {log.shopName || log.shopId} by {log.adminEmail || 'Admin'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50,
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
                Reject Shop Registration
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 1.25rem' }}>
              Please provide a clear reason for rejecting <strong>{selectedRequest?.shopName}</strong>. This reason will be shown to the merchant so they can correct their information and re-apply.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., The business address provided does not match commercial records, or invalid phone number."
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
                onClick={() => setRejectModalOpen(false)}
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
export default AdminDashboardPage;
