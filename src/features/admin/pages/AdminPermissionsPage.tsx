/* features/admin/pages/AdminPermissionsPage.tsx */
import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminProfile } from '../types';
import {
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Mail,
  HelpCircle,
} from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminPermissionsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'support_admin' | 'auditor'>('super_admin');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const list = await adminRepo.getAdminUsers();
      setAdmins(list);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setToast({ type: 'error', text: 'Please enter a valid administrator email.' });
      return;
    }

    setSubmitting(true);
    try {
      await adminRepo.addAdminUser(newEmail.trim(), newRole);
      setToast({ type: 'success', text: `Granted ${newRole.replace('_', ' ')} privileges to ${newEmail.trim()}.` });
      setNewEmail('');
      await loadAdmins();
    } catch (err: any) {
      setToast({ type: 'error', text: `Failed to add administrator: ${err.message || 'Error'}` });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleRevoke = async (admin: AdminProfile) => {
    if (admin.email.toLowerCase() === 'jaswanthmajji43@gmail.com' && admins.length === 1) {
      alert('Cannot revoke access from the primary system administrator.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke platform administrator access from "${admin.email}"?`)) {
      return;
    }

    try {
      await adminRepo.removeAdminUser(admin.id);
      setToast({ type: 'success', text: `Revoked admin privileges from ${admin.email}.` });
      await loadAdmins();
    } catch (err: any) {
      setToast({ type: 'error', text: `Failed to revoke access: ${err.message || 'Error'}` });
    } finally {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            Super Admin
          </span>
        );
      case 'support_admin':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            Support Admin
          </span>
        );
      case 'auditor':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#c4b5fd',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            Security Auditor
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Manage Platform Admins & Roles
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Interactive control tool for managing backend administrator permissions and access grants.
          </p>
        </div>

        <button
          onClick={() => setShowRoleGuide(!showRoleGuide)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#d1d5db',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <HelpCircle size={16} />
          <span>{showRoleGuide ? 'Hide Role Guide' : 'Explain Role Matrix'}</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: toast.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: toast.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Interactive Form: Add Administrator */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f87171' }}>
          <UserPlus size={18} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Grant Platform Administrator Privileges
          </h2>
        </div>

        <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '260px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.4rem' }}>
              User Email Address *
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}>
              <Mail size={16} style={{ color: '#9ca3af' }} />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. security-lead@khattabook.com"
                required
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', marginBottom: '0.4rem' }}>
              Administrative Role
            </label>
            <select
              value={newRole}
              onChange={(e: any) => setNewRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                backgroundColor: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="super_admin">Super Administrator (Full)</option>
              <option value="support_admin">Support Admin (Approvals)</option>
              <option value="auditor">Security Auditor (Read-Only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
            }}
          >
            <UserPlus size={16} />
            <span>{submitting ? 'Granting...' : 'Grant Privilege'}</span>
          </button>
        </form>
      </div>

      {/* Active Administrators Table */}
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Authorized Platform Administrators ({admins.length})
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>Synced with PostgreSQL platform_admins</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading administrator directory...
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
                  <th style={{ padding: '1rem 1.25rem' }}>Administrator</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Role Level</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Granted Date</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}>
                          {admin.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>{admin.email}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>ID: {admin.id}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      {getRoleBadge(admin.role)}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.82rem' }}>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleRevoke(admin)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Breakdown Reference Guide (Collapsible) */}
      {showRoleGuide && (
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem',
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1.25rem' }}>
            Shop KhattaBook Platform Permission Matrix
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Super Admin */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Lock size={16} />
                <span>Super Administrator</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>
                Unrestricted system-wide governance. Can review, approve, reject, or suspend any merchant shop, view all staff, and add or revoke administrator privileges.
              </p>
            </div>

            {/* Merchant Owner */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 700, marginBottom: '0.5rem' }}>
                <UserCheck size={16} />
                <span>Merchant Shop Owner</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>
                Tenant authority over their own store. Full control of customers, products, sales, and workers, but strictly blocked from accessing the store dashboard until approved.
              </p>
            </div>

            {/* Shop Worker */}
            <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '0.5rem' }}>
                <KeyRound size={16} />
                <span>Shop Worker / Staff</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>
                Restricted operational access. Can ring up sales and receive payments, subject to granular owner permissions. Every transaction logs an immutable audit event.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPermissionsPage;
