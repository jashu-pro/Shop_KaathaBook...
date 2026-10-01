/* features/admin/pages/AdminShopsPage.tsx */
import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminShopListItem, ShopStatus, AdminWorkerItem } from '../types';
import {
  Store,
  Users,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';


const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminShopsPage: React.FC = () => {
  const [shops, setShops] = useState<AdminShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShopStatus>('all');

  // Workers Drawer/Modal
  const [selectedShopForWorkers, setSelectedShopForWorkers] = useState<AdminShopListItem | null>(null);
  const [shopWorkers, setShopWorkers] = useState<AdminWorkerItem[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  // Suspend Modal
  const [suspendShopId, setSuspendShopId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await adminRepo.getAllShops();
      setShops(data);
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleOpenWorkers = async (shop: AdminShopListItem) => {
    setSelectedShopForWorkers(shop);
    try {
      setWorkersLoading(true);
      const workers = await adminRepo.getWorkers(shop.id);
      setShopWorkers(workers);
    } catch (err) {
      console.error('Error loading shop workers:', err);
    } finally {
      setWorkersLoading(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendShopId || !suspendReason.trim()) {
      alert('Please specify a suspension reason.');
      return;
    }
    try {
      setActionLoading(true);
      await adminRepo.suspendShop(suspendShopId, suspendReason.trim());
      setSuspendShopId(null);
      setSuspendReason('');
      await loadShops();
    } catch (err: any) {
      alert(`Suspend failed: ${err.message || 'Error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (shopId: string) => {
    try {
      setActionLoading(true);
      await adminRepo.reactivateShop(shopId);
      await loadShops();
    } catch (err: any) {
      alert(`Reactivation failed: ${err.message || 'Error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredShops = shops.filter((s) => {
    const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      s.ownerName.toLowerCase().includes(term) ||
      s.ownerEmail.toLowerCase().includes(term) ||
      (s.city && s.city.toLowerCase().includes(term)) ||
      s.businessType.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: ShopStatus) => {
    switch (status) {
      case 'active':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <CheckCircle2 size={13} />
            <span>Active</span>
          </span>
        );
      case 'pending':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <Clock size={13} />
            <span>Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '9999px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <XCircle size={13} />
            <span>Rejected</span>
          </span>
        );
      case 'suspended':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '9999px',
            backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c',
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          }}>
            <AlertTriangle size={13} />
            <span>Suspended</span>
          </span>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Shops Management & Hierarchy
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Comprehensive directory of shops, owners, assigned workers, and lifecycle states.
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Total Registered: <strong style={{ color: '#ffffff' }}>{shops.length}</strong>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['all', 'active', 'pending', 'rejected', 'suspended'] as const).map((tab) => {
            const count = tab === 'all' ? shops.length : shops.filter((s) => s.status === tab).length;
            const isSelected = statusFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : '#9ca3af',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>{tab}</span>
                <span style={{
                  fontSize: '0.7rem',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ color: '#6b7280' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops, owners, city..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.875rem',
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
      </div>

      {/* Shops Table */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading shops directory...
          </div>
        ) : filteredShops.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <Store size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6' }}>
              No Shops Found
            </div>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              No shop records match your current filters.
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
                  <th style={{ padding: '1rem 1.25rem' }}>Shop Info</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Owner Profile</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Location</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Worker Count</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShops.map((shop) => (
                  <tr
                    key={shop.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{shop.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                        {shop.businessType}
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <div style={{ color: '#f3f4f6', fontWeight: 600 }}>{shop.ownerName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                        {shop.ownerEmail}
                      </div>
                      {shop.ownerPhone && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{shop.ownerPhone}</div>
                      )}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                      <div>{shop.city || 'N/A'}{shop.state ? `, ${shop.state}` : ''}</div>
                      {shop.pincode && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>PIN: {shop.pincode}</div>}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      {getStatusBadge(shop.status)}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <button
                        onClick={() => handleOpenWorkers(shop)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#c4b5fd',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Users size={14} />
                        <span>{shop.workerCount} Workers</span>
                        <Eye size={12} style={{ opacity: 0.7 }} />
                      </button>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        {shop.status === 'active' && (
                          <button
                            onClick={() => {
                              setSuspendShopId(shop.id);
                              setSuspendReason('');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(249, 115, 22, 0.15)',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              color: '#fb923c',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <PauseCircle size={14} />
                            <span>Suspend</span>
                          </button>
                        )}

                        {shop.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(shop.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <PlayCircle size={14} />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workers Inspection Modal */}
      {selectedShopForWorkers && (
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
            maxWidth: '700px',
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
                  Workers for {selectedShopForWorkers.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                  Total Staff Members: {shopWorkers.length}
                </p>
              </div>

              <button
                onClick={() => setSelectedShopForWorkers(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem 2rem', maxHeight: '420px', overflowY: 'auto' }}>
              {workersLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                  Loading worker accounts...
                </div>
              ) : shopWorkers.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280' }}>
                  <Users size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#9ca3af' }}>
                    No Workers Assigned
                  </div>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                    This shop currently operates solely under the merchant owner account.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {shopWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>
                          {worker.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          {worker.emailOrPhone}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: worker.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: worker.status === 'active' ? '#34d399' : '#fbbf24',
                        }}>
                          {worker.status}
                        </span>

                        <span style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#d1d5db',
                        }}>
                          Role: Worker
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem 2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setSelectedShopForWorkers(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendShopId && (
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
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fb923c', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                Suspend Shop Account
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 1.25rem' }}>
              Suspending this shop blocks login access for the owner and all assigned workers. An audit record will be logged.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.5rem' }}>
                Suspension Reason *
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., Compliance review or payment irregularity."
                rows={3}
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
                onClick={() => setSuspendShopId(null)}
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
                onClick={handleConfirmSuspend}
                disabled={actionLoading}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#f97316',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminShopsPage;
