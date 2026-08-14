/* features/dashboard/pages/Dashboard.tsx */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { WeeklyChart } from '../components/WeeklyChart';
import { UpiQrModal } from '../components/UpiQrModal';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useLedger } from '../../ledger/hooks/useLedger';
import { 
  QrCode, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ArrowUpRight, 
  Plus, 
  CreditCard, 
  UserPlus, 
  BookOpen, 
  Mic, 
  ArrowRight,
  X,
  Receipt
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const { customers } = useCustomers();
  const { sales } = useSales();
  const { payments } = usePayments();
  const { entries: ledgerEntries } = useLedger();

  const [showQrModal, setShowQrModal] = useState(false);

  const shopName = shop?.name || 'My KhattaBook Store';
  const upiId = shop?.upiId || '';
  const activeCustomersCount = customers.length;

  const totalUdhaar = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Today's Credit Sales (sum of debit entries recorded today)
  const todaysSales = useMemo(() => {
    return ledgerEntries
      .filter((e) => e.entryType === 'debit' && isToday(e.entryDate))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [ledgerEntries]);

  // Today's Collections (sum of credit entries recorded today)
  const todaysCollections = useMemo(() => {
    return ledgerEntries
      .filter((e) => e.entryType === 'credit' && isToday(e.entryDate))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [ledgerEntries]);

  // Total Transactions Count
  const totalTransactionsCount = ledgerEntries.length > 0 ? ledgerEntries.length : (sales.length + payments.length);

  // Weekly Performance Analytics Chart Data (Mon - Sun)
  const weeklyChartData = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0: Sun, 1: Mon...
    const distanceToMon = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMon);
    monday.setHours(0, 0, 0, 0);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return weekDays.map((dayName, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);

      const daySales = ledgerEntries
        .filter((e) => {
          const d = new Date(e.entryDate);
          return (
            e.entryType === 'debit' &&
            d.getDate() === dayDate.getDate() &&
            d.getMonth() === dayDate.getMonth() &&
            d.getFullYear() === dayDate.getFullYear()
          );
        })
        .reduce((acc, e) => acc + e.amount, 0);

      const dayCollections = ledgerEntries
        .filter((e) => {
          const d = new Date(e.entryDate);
          return (
            e.entryType === 'credit' &&
            d.getDate() === dayDate.getDate() &&
            d.getMonth() === dayDate.getMonth() &&
            d.getFullYear() === dayDate.getFullYear()
          );
        })
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        day: dayName,
        sales: daySales,
        collections: dayCollections,
      };
    });
  }, [ledgerEntries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: WELCOME BANNER CARD (Emerald Gradient)                */}
      {/* ------------------------------------------------------------- */}
      <div 
        className="dashboard-welcome-card"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative glow circle */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none'
        }} />

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.75rem',
            fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Shop Owner Dashboard
          </div>

          <h2 className="dashboard-welcome-title" style={{ fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.25rem', lineHeight: 1.2 }}>
            Namaste, {shopName}
          </h2>

          <p style={{ opacity: 0.9, fontSize: '0.825rem', fontWeight: '500' }}>
            UPI ID: <span style={{ fontWeight: '700', letterSpacing: '0.02em' }}>{upiId}</span>
          </p>
        </div>

        {/* UPI QR Code Trigger Button */}
        <button
          onClick={() => setShowQrModal(true)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#064E3B',
            padding: '0.55rem 1.15rem',
            borderRadius: '14px',
            fontWeight: '800',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            transition: 'all 200ms'
          }}
        >
          <QrCode size={18} />
          <span>UPI QR</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2 & 3: STAT CARDS GRID                                   */}
      {/* ------------------------------------------------------------- */}
      
      {/* DESKTOP & MOBILE ADAPTIVE GRID */}
      <div className="dashboard-main-grid">
        
        {/* TOTAL CUSTOMER DEBT (UDHAAR) CARD — Spans 2 cols on Desktop & Mobile */}
        <div 
          className="udhaar-card-span dashboard-udhaar-card"
          style={{
            backgroundColor: '#047857',
            color: '#FFFFFF',
            boxShadow: '0 6px 20px rgba(4, 120, 87, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.85rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>
              Total Customer Debt (Udhaar)
            </span>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.2rem 0.6rem', borderRadius: '12px',
              fontSize: '0.7rem', fontWeight: '700'
            }}>
              {activeCustomersCount} Customers
            </span>
          </div>

          <div>
            <div className="dashboard-udhaar-value" style={{ fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              ₹{totalUdhaar}
            </div>
            <p style={{ fontSize: '0.775rem', opacity: '0.85', marginTop: '0.25rem' }}>
              Total pending collections across all villages
            </p>
          </div>
        </div>

        {/* TODAY'S CREDIT SALES */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysSales}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Today's Credit Sales
            </span>
          </div>
        </div>

        {/* TODAY'S COLLECTIONS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysCollections}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Today's Collections
            </span>
          </div>
        </div>

        {/* ACTIVE CUSTOMERS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {activeCustomersCount}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Active Customers
            </span>
          </div>
        </div>

        {/* TOTAL TRANSACTIONS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {totalTransactionsCount}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Total Transactions
            </span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 4: QUICK ACTIONS (Horizontal Scrollable Pills)            */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginTop: '0.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.6rem' }}>
          Quick Actions
        </h3>

        <div className="quick-actions-scroll">
          {/* Action 1: New Credit Sale */}
          <button
            onClick={() => navigate('/sales/new')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>+ New Credit Sale</span>
          </button>

          {/* Action 2: Receive Payment */}
          <button
            onClick={() => navigate('/payments/receive')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            <CreditCard size={16} />
            <span>Receive Payment</span>
          </button>

          {/* Action 3: Add Customer */}
          <button
            onClick={() => navigate('/customers/new')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)'
            }}
          >
            <UserPlus size={16} />
            <span>Add Customer</span>
          </button>

          {/* Action 4: Open Ledger */}
          <button
            onClick={() => navigate('/ledger')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)'
            }}
          >
            <BookOpen size={16} />
            <span>Open Ledger</span>
          </button>

          {/* Action 5: AI Voice Entry */}
          <button
            onClick={() => navigate('/ai-assistant')}
            className="quick-action-pill"
            style={{
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 3px 10px rgba(139, 92, 246, 0.25)'
            }}
          >
            <Mic size={16} />
            <span>AI Voice Entry</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 5: RECENT ACTIVITY STREAM                                 */}
      {/* ------------------------------------------------------------- */}
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
          marginTop: '0.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            Recent Activity Stream
          </h3>
          <button
            onClick={() => navigate('/ledger')}
            style={{
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <span>View Full Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Recent Activity Item */}
        {ledgerEntries.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Receipt size={18} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                  Account Initialized
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Digital ledger created for {shopName}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                Active
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ledgerEntries.slice(0, 5).map((entry) => {
              const isDebit = entry.entryType === 'debit';
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: isDebit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isDebit ? '#EF4444' : '#10B981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isDebit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-heading)' }}>
                        {entry.customerName || 'Customer'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {entry.description || (isDebit ? 'Credit Sale' : 'Payment Collection')} • {new Date(entry.entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      color: isDebit ? '#EF4444' : '#10B981'
                    }}>
                      {isDebit ? `+₹${entry.amount}` : `-₹${entry.amount}`}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {isDebit ? 'Udhaar' : 'Jama'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 6: WEEKLY SALES & COLLECTIONS PERFORMANCE CHART           */}
      {/* ------------------------------------------------------------- */}
      <WeeklyChart data={weeklyChartData} />

      {/* ------------------------------------------------------------- */}
      {/* AUTO-GENERATED UPI QR CODE MODAL POPUP                        */}
      {/* ------------------------------------------------------------- */}
      <UpiQrModal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
      />

    </div>
  );
};

export default Dashboard;
