/* features/payments/pages/PaymentsListPage.tsx */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Calendar, 
  Trash2
} from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import type { PaymentMode } from '../types';

const PaymentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { payments, isLoading, removePayment, refetch } = usePayments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const totalPaymentsCount = payments.length;

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q));

      const matchesMethod = selectedMethod === 'all' || p.paymentMethod === selectedMethod;

      return matchesSearch && matchesMethod;
    });
  }, [payments, searchQuery, selectedMethod]);

  const handleDeletePayment = async (id: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete payment record of ₹${amount}?`)) {
      await removePayment(id);
      refetch();
    }
  };

  const getMethodBadge = (method: PaymentMode) => {
    switch (method) {
      case 'phonepe':
        return { label: 'PhonePe', color: '#673AB7', bg: 'rgba(103, 58, 183, 0.1)' };
      case 'gpay':
        return { label: 'Google Pay', color: '#1A73E8', bg: 'rgba(26, 115, 232, 0.1)' };
      case 'paytm':
        return { label: 'Paytm', color: '#00BAF2', bg: 'rgba(0, 186, 242, 0.1)' };
      case 'bank_transfer':
        return { label: 'Bank Transfer', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
      default:
        return { label: 'Cash', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* Top Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <CreditCard size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Received Payment History
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {totalPaymentsCount} Payments
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Track customer settlements across Cash, PhonePe, Google Pay, Paytm, and Bank Transfer.
          </p>
        </div>

        {/* Metrics & Receive Payment Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Collections Collected
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', lineHeight: 1.1 }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={() => navigate('/payments/receive')}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '0.85rem', backgroundColor: '#059669' }}
          >
            <Plus size={18} />
            <span>+ Receive Payment</span>
          </button>
        </div>
      </div>

      {/* Search & Method Filter */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by customer name, mobile, reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>
        </div>

        {/* Method Filter Chips */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Modes' },
            { id: 'cash', label: 'Cash' },
            { id: 'phonepe', label: 'PhonePe' },
            { id: 'gpay', label: 'Google Pay' },
            { id: 'paytm', label: 'Paytm' },
            { id: 'bank_transfer', label: 'Bank Transfer' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                fontSize: '0.775rem',
                fontWeight: selectedMethod === m.id ? '700' : '500',
                backgroundColor: selectedMethod === m.id ? 'var(--primary)' : 'var(--bg-secondary)',
                color: selectedMethod === m.id ? '#FFFFFF' : 'var(--text-body)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '130px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '3rem 1.5rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <CreditCard size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Payments Received Yet
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No payment matching "${searchQuery}"` : 'Record customer payment collections to track your ledger'}
          </p>
          <button onClick={() => navigate('/payments/receive')} className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Receive Payment Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filteredPayments.map((payment) => {
            const badge = getMethodBadge(payment.paymentMethod);

            return (
              <div
                key={payment.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '18px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                {/* Header: Customer Name & Payment Method Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {payment.customerName || 'Shop Customer'}
                    </h4>
                    {payment.referenceNo && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Ref: {payment.referenceNo}
                      </span>
                    )}
                  </div>

                  <div style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '800'
                  }}>
                    {badge.label}
                  </div>
                </div>

                {/* Amount Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Amount Collected:
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#10B981' }}>
                    + ₹{payment.amount}
                  </div>
                </div>

                {/* Date & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Calendar size={12} /> {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                  </span>

                  <button
                    onClick={() => handleDeletePayment(payment.id, payment.amount)}
                    style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete Payment Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default PaymentsListPage;
