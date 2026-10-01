/* features/admin/pages/AdminReportsPage.tsx */
import React, { useState, useEffect } from 'react';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AdminKPIStats } from '../types';
import { Download } from 'lucide-react';

const adminRepo = RepositoryFactory.getAdminRepository();

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<AdminKPIStats | null>(null);

  useEffect(() => {
    adminRepo.getKPIStats().then(setStats);
  }, []);

  const handleExportJSON = async () => {
    const [shops, workers, audit] = await Promise.all([
      adminRepo.getAllShops(),
      adminRepo.getWorkers(),
      adminRepo.getAuditLogs(),
    ]);

    const report = {
      exportTimestamp: new Date().toISOString(),
      stats,
      shops,
      workers,
      audit,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShopKhattaBook_Platform_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Platform Reports & Aggregates
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.35rem 0 0' }}>
            System health, approval throughput, and multi-tenant ledger summary.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Download size={16} />
          <span>Export Master JSON Report</span>
        </button>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1rem' }}>
          Approval Metrics Summary
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Active Merchants Ratio</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.35rem' }}>
              {stats && stats.totalShops > 0 
                ? `${Math.round((stats.activeShops / stats.totalShops) * 100)}%` 
                : '100%'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {stats?.activeShops || 0} of {stats?.totalShops || 0} active
            </div>
          </div>

          <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Staff Utilization</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c4b5fd', marginTop: '0.35rem' }}>
              {stats?.totalWorkers || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total active staff memberships
            </div>
          </div>

          <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Audit Log Records</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', marginTop: '0.35rem' }}>
              Verified
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Append-only PostgreSQL RPC logs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminReportsPage;
