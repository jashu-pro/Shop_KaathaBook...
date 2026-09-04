/* features/staff/pages/WorkerDashboardPage.tsx */
import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Trophy,
  Flame,
  X
} from 'lucide-react';
import { useWorkerPermissions } from '../hooks/useWorkerPermissions';
import { useAuthStore } from '../../../stores/authStore';
import { useStaff } from '../hooks/useStaff';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
import { WorkerPerformanceService } from '../services/WorkerPerformanceService';
import { WorkerLeaderboardStudio } from '../components/WorkerLeaderboardStudio';
import type { WorkerSalesPerformance } from '../types';
import { EventBus } from '../../../services/EventBus';

export const WorkerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const { activeWorker, can, exitWorkerSpace } = useWorkerPermissions();
  const { activityLogs } = useStaff();

  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [myPerf, setMyPerf] = useState<WorkerSalesPerformance | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const loadMyPerformance = useCallback(async () => {
    if (!shop?.id) return;
    try {
      const list = await WorkerPerformanceService.computeLeaderboard(shop.id, 'today');
      const mine = list.find((w) => w.workerId === activeWorker?.id) || list[0] || null;
      setMyPerf(mine);
    } catch (e) {
      console.error('Failed to load performance', e);
    }
  }, [shop?.id, activeWorker?.id]);

  useEffect(() => {
    loadMyPerformance();
    const unsubSales = EventBus.subscribe('sales:changed', () => loadMyPerformance());
    const unsubSync = EventBus.subscribe('data:sync', () => loadMyPerformance());
    return () => {
      unsubSales();
      unsubSync();
    };
  }, [loadMyPerformance]);

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

      {/* Worker Live Target & Performance Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-card)',
          border: '1.5px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Today's Sales Performance & Daily Target
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Rank #{myPerf?.rank || 1} in team today • Earn +{myPerf?.commissionEarned ? `₹${myPerf.commissionEarned}` : '₹0'} incentive
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLeaderboardModal(true)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#D97706',
              fontWeight: '800',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <Flame size={14} />
            <span>View Team Leaderboard</span>
          </button>
        </div>

        {/* 3 Metrics: Revenue, Bills, Target */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Billed Today</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#059669' }}>
              ₹{(myPerf?.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Bills Issued</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              {myPerf?.billsCount || 0} bills
            </span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Estimated Incentive</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#F59E0B' }}>
              +₹{myPerf?.commissionEarned || 0}
            </span>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.3rem' }}>
            <span style={{ color: 'var(--text-heading)' }}>Daily Target Progress: {myPerf?.targetProgress || 0}%</span>
            <span style={{ color: 'var(--text-muted)' }}>Target: ₹{(myPerf?.dailyTarget || 25000).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ width: '100%', height: '8px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(myPerf?.targetProgress || 0, 100)}%`,
                height: '100%',
                borderRadius: '10px',
                backgroundColor: (myPerf?.targetProgress || 0) >= 100 ? '#10B981' : '#F59E0B',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
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

      {/* Team Leaderboard Modal View */}
      {showLeaderboardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '28px',
              backgroundColor: 'var(--bg-card)',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  color: 'var(--text-heading)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <WorkerLeaderboardStudio />
          </div>
        </div>
      )}
    </div>
  );
};
