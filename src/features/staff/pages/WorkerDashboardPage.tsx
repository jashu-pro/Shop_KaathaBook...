/* features/staff/pages/WorkerDashboardPage.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Users, 
  Package, 
  BookOpen, 
  BarChart3, 
  Plus, 
  LogOut, 
  Clock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useWorkerPermissions } from '../hooks/useWorkerPermissions';
import { useAuthStore } from '../../../stores/authStore';
import { useStaff } from '../hooks/useStaff';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';

export const WorkerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const { activeWorker, can, exitWorkerSpace } = useWorkerPermissions();
  const { activityLogs } = useStaff();

  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);

  const workerName = activeWorker?.name || 'Worker';
  const shopName = shop?.name || 'Shop KhattaBook';

  // Filter activity logs performed by this worker
  const myLogs = activityLogs.filter((l) => l.workerId === activeWorker?.id);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Worker Greeting & Shop Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          borderRadius: '28px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '18px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.4rem',
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)',
            }}
          >
            👷
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                {greeting}, {workerName} 👋
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {shopName} • <strong>Worker Workspace</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            exitWorkerSpace();
            navigate('/login');
          }}
          className="btn btn-secondary"
          style={{
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            borderRadius: '14px',
          }}
          title="Exit Worker Space and return to login"
        >
          <LogOut size={16} />
          <span>Exit Worker Space</span>
        </button>
      </div>

      {/* Allowed Workspace Modules (Dynamically Generated based on Permissions) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            YOUR WORKSPACE
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Action 1: Create Sale */}
          {can('sales', 'create') && (
            <div
              onClick={() => setIsRecordSaleModalOpen(true)}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px var(--primary-glow)',
                  }}
                >
                  <Plus size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    New Sale
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Record bill or udhaar sale
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--primary)' }} />
            </div>
          )}

          {/* Action 2: Receive Payment */}
          {can('payments', 'receive') && (
            <div
              onClick={() => navigate('/payments/receive')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: '#F59E0B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    Receive Payment
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Collect Cash / UPI / GPay
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: '#F59E0B' }} />
            </div>
          )}

          {/* Action 3: Customers */}
          {can('customers', 'view') && (
            <div
              onClick={() => navigate('/customers')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    Customers
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    View & add customer accounts
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          {/* Action 4: Customer Ledger */}
          {can('customers', 'ledger') && (
            <div
              onClick={() => navigate('/ledger')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    Customer Ledger
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Debit & credit running balances
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          {/* Action 5: Inventory */}
          {can('inventory', 'view') && (
            <div
              onClick={() => navigate('/inventory')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#EC4899',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    Inventory & Products
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Browse stock and pricing
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          {/* Action 6: Financial Reports (if allowed by owner) */}
          {can('reports') && (
            <div
              onClick={() => navigate('/reports')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    Financial Reports
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Daily sales & statements
                  </span>
                </div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
        </div>
      </div>

      {/* My Recent Activity Log */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            MY RECENT ACTIVITY
          </h3>
        </div>

        {myLogs.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '18px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            No actions recorded for this worker session yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {myLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {log.action}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {log.amount !== undefined && (
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>
                    ₹{log.amount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Credit Sale Modal */}
      <RecordCreditSaleModal
        isOpen={isRecordSaleModalOpen}
        onClose={() => setIsRecordSaleModalOpen(false)}
      />
    </div>
  );
};
