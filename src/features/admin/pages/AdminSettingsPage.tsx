/* features/admin/pages/AdminSettingsPage.tsx */
import React from 'react';


export const AdminSettingsPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Admin Platform Settings
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
          Database architecture, security policies, and environment status.
        </p>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1.25rem' }}>
          Security & Database Architecture
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Supabase PostgreSQL + RLS</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Multi-tenant row level security with strict tenant isolation.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              ONLINE
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Atomic Registration & Approval RPCs</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Single-transaction operations for user profile, shop, request, and owner membership.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              ENFORCED
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Credential Exposure Prevention</div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Zero passwords, hashes, or auth tokens exposed across admin UI or APIs.
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminSettingsPage;
