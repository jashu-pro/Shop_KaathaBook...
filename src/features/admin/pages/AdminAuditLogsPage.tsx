/* features/admin/pages/AdminAuditLogsPage.tsx */
import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminAuditLog, AdminAuditAction } from '../types';
import { History, Search, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, PlayCircle } from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    const loadAudit = async () => {
      try {
        setLoading(true);
        const data = await adminRepo.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, []);

  const getActionBadge = (action: AdminAuditAction) => {
    switch (action) {
      case 'ADMIN_APPROVED_SHOP':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            <CheckCircle2 size={13} />
            <span>APPROVED</span>
          </span>
        );
      case 'ADMIN_REJECTED_SHOP':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            <XCircle size={13} />
            <span>REJECTED</span>
          </span>
        );
      case 'ADMIN_SUSPENDED_SHOP':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '6px',
            backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            <AlertTriangle size={13} />
            <span>SUSPENDED</span>
          </span>
        );
      case 'ADMIN_REACTIVATED_SHOP':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.25rem 0.65rem', borderRadius: '6px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
            fontSize: '0.78rem', fontWeight: 700,
          }}>
            <PlayCircle size={13} />
            <span>REACTIVATED</span>
          </span>
        );
    }
  };

  const filtered = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      (log.shopName && log.shopName.toLowerCase().includes(term)) ||
      (log.adminEmail && log.adminEmail.toLowerCase().includes(term)) ||
      log.action.toLowerCase().includes(term) ||
      JSON.stringify(log.metadata).toLowerCase().includes(term);

    return matchesAction && matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Immutable Admin Audit Trail
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            Append-only record of all administrative approvals, rejections, and state modifications.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#34d399',
          fontSize: '0.78rem',
          fontWeight: 600,
        }}>
          <ShieldCheck size={14} />
          <span>Cryptographically Sealed Records</span>
        </div>
      </div>

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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'All Events', value: 'all' },
            { label: 'Approvals', value: 'ADMIN_APPROVED_SHOP' },
            { label: 'Rejections', value: 'ADMIN_REJECTED_SHOP' },
            { label: 'Suspensions', value: 'ADMIN_SUSPENDED_SHOP' },
            { label: 'Reactivations', value: 'ADMIN_REACTIVATED_SHOP' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActionFilter(tab.value)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: actionFilter === tab.value ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                border: actionFilter === tab.value ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                color: actionFilter === tab.value ? '#ffffff' : '#9ca3af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px', flex: 1, maxWidth: '350px' }}>
          <Search size={16} style={{ color: '#6b7280' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            Loading audit records...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <History size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f3f4f6' }}>
              No Audit Events Recorded
            </div>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              No administrative operations match your filter query.
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
                  <th style={{ padding: '1rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Action Executed</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Shop Target</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Administrator</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Payload / Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1.15rem 1.25rem', color: '#9ca3af', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div style={{ color: '#6b7280' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      {getActionBadge(log.action)}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#ffffff', fontWeight: 600 }}>
                      {log.shopName || log.shopId}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem', color: '#d1d5db', fontSize: '0.85rem' }}>
                      {log.adminEmail || log.adminId || 'System Administrator'}
                    </td>

                    <td style={{ padding: '1.15rem 1.25rem' }}>
                      {Object.keys(log.metadata || {}).length === 0 ? (
                        <span style={{ color: '#6b7280', fontSize: '0.8rem', fontStyle: 'italic' }}>— None —</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {log.metadata.reason && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(249, 115, 22, 0.12)',
                              border: '1px solid rgba(249, 115, 22, 0.25)',
                              color: '#fb923c',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                            }}>
                              <span style={{ fontWeight: 700 }}>Reason:</span>
                              <span>"{log.metadata.reason}"</span>
                            </div>
                          )}

                          {log.metadata.request_id && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}>
                              <span style={{ color: '#6b7280' }}>Request ID:</span>
                              <span style={{ fontFamily: 'monospace' }}>{String(log.metadata.request_id).slice(0, 16)}...</span>
                            </div>
                          )}

                          {!log.metadata.reason && !log.metadata.request_id && (
                            <div style={{
                              fontSize: '0.78rem',
                              color: '#9ca3af',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              display: 'inline-block',
                            }}>
                              {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
export default AdminAuditLogsPage;
