/* features/dashboard/pages/Dashboard.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { WeeklyChart } from '../components/WeeklyChart';
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
  const [showQrModal, setShowQrModal] = useState(false);

  const shopName = shop?.name || 'Sri Laxmi Traders';
  const upiId = shop?.upiId || 'srilaxmi@ybl';
  const activeCustomersCount = 5;
  const totalTransactionsCount = 1;
  const totalUdhaar = 0;
  const todaysSales = 0;
  const todaysCollections = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: LARGE WELCOME BANNER CARD (Emerald Gradient)          */}
      {/* ------------------------------------------------------------- */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
          borderRadius: 'var(--radius-card, 28px)',
          padding: '2rem 2.25rem',
          color: '#FFFFFF',
          boxShadow: '0 12px 30px rgba(4, 120, 87, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative glow circle */}
        <div style={{
          position: 'absolute', top: '-50px', right: '-50px',
          width: '200px', height: '200px', borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none'
        }} />

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem',
            fontWeight: '700', marginBottom: '0.85rem', letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Shop Owner Dashboard
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.35rem', lineHeight: 1.2 }}>
            Namaste, {shopName}
          </h2>

          <p style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: '500' }}>
            UPI ID: <span style={{ fontWeight: '700', letterSpacing: '0.02em' }}>{upiId}</span>
          </p>
        </div>

        {/* UPI QR Code Trigger Button */}
        <button
          onClick={() => setShowQrModal(true)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#064E3B',
            padding: '0.8rem 1.5rem',
            borderRadius: '18px',
            fontWeight: '800',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            transition: 'all 200ms'
          }}
        >
          <QrCode size={20} />
          <span>UPI QR</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2 & 3: STAT CARDS GRID                                   */}
      {/* ------------------------------------------------------------- */}
      
      {/* DESKTOP & TABLET ADAPTIVE GRID */}
      <div className="dashboard-main-grid">
        
        {/* TOTAL CUSTOMER DEBT (UDHAAR) CARD — Spans 2 cols on Desktop */}
        <div 
          className="udhaar-card-span"
          style={{
            backgroundColor: '#047857',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-card, 28px)',
            padding: '1.75rem 2rem',
            boxShadow: '0 10px 25px rgba(4, 120, 87, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '600', opacity: 0.9 }}>
              Total Customer Debt (Udhaar)
            </span>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.25rem 0.75rem', borderRadius: '14px',
              fontSize: '0.75rem', fontWeight: '700'
            }}>
              {activeCustomersCount} Customers
            </span>
          </div>

          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1.1 }}>
              ₹{totalUdhaar}
            </div>
            <p style={{ fontSize: '0.85rem', opacity: '0.85', marginTop: '0.4rem' }}>
              Total pending collections across all villages
            </p>
          </div>
        </div>

        {/* TODAY'S CREDIT SALES */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          padding: '1.5rem 1.75rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={22} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysSales}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.35rem', display: 'block' }}>
              Today's Credit Sales
            </span>
          </div>
        </div>

        {/* TODAY'S COLLECTIONS */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          padding: '1.5rem 1.75rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingDown size={22} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysCollections}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.35rem', display: 'block' }}>
              Today's Collections
            </span>
          </div>
        </div>

        {/* ACTIVE CUSTOMERS */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          padding: '1.5rem 1.75rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={22} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {activeCustomersCount}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.35rem', display: 'block' }}>
              Active Customers
            </span>
          </div>
        </div>

        {/* TOTAL TRANSACTIONS */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card, 28px)',
          padding: '1.5rem 1.75rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {totalTransactionsCount}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.35rem', display: 'block' }}>
              Total Transactions
            </span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 4: QUICK ACTIONS (Horizontal Scrollable Pills)            */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginTop: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.85rem' }}>
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
            <Plus size={18} />
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
            <CreditCard size={18} />
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
            <UserPlus size={18} />
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
            <BookOpen size={18} />
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
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Mic size={18} />
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
          borderRadius: 'var(--radius-card, 28px)',
          padding: '1.75rem 2rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          marginTop: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            Recent Activity Stream
          </h3>
          <button
            onClick={() => navigate('/ledger')}
            style={{
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <span>View Full Ledger</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Recent Activity Item */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderRadius: '18px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Receipt size={20} />
            </div>
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                Account Initialized
              </h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Digital ledger created for {shopName}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-success">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 6: WEEKLY SALES & COLLECTIONS PERFORMANCE CHART           */}
      {/* ------------------------------------------------------------- */}
      <WeeklyChart />

      {/* ------------------------------------------------------------- */}
      {/* UPI QR CODE MODAL POPUP                                       */}
      {/* ------------------------------------------------------------- */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div 
            className="glass-panel modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '2rem',
              maxWidth: '440px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={22} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                  Merchant UPI QR
                </h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            {/* Generated QR Code Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '1.5rem',
              borderRadius: '24px',
              border: '2px solid var(--primary-light)',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(upiId)}%26pn=${encodeURIComponent(shopName)}`}
                alt="UPI QR Code"
                style={{ width: '180px', height: '180px', borderRadius: '12px' }}
              />

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>
                  {shopName}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', marginTop: '0.2rem' }}>
                  UPI ID: {upiId}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(upiId);
                  alert('UPI ID copied to clipboard!');
                }}
                className="btn btn-secondary"
                style={{ flex: 1, borderRadius: '18px' }}
              >
                Copy UPI ID
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: '18px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
