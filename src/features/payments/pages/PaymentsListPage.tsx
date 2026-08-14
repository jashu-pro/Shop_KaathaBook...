/* features/payments/pages/PaymentsListPage.tsx */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Calendar, 
  Trash2,
  Filter,
  DollarSign,
  Smartphone,
  Building2,
  Eye
} from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { PaymentDetailsModal } from '../components/PaymentDetailsModal';
import type { Payment, PaymentMode } from '../types';

export const PaymentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { payments, isLoading, removePayment, refetch } = usePayments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState<Payment | null>(null);

  const totalPaymentsCount = payments.length;

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [payments]);

  // Today's collections
  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const todayCollected = useMemo(() => {
    return payments.reduce((acc, p) => {
      const pTime = new Date(p.paymentDate || p.createdAt).getTime();
      return pTime >= todayStart ? acc + (Number(p.amount) || 0) : acc;
    }, 0);
  }, [payments, todayStart]);

  const cashCollected = useMemo(() => {
    return payments.reduce((acc, p) => p.paymentMethod === 'cash' ? acc + (Number(p.amount) || 0) : acc, 0);
  }, [payments]);

  const upiCollected = useMemo(() => {
    return payments.reduce((acc, p) => ['phonepe', 'gpay', 'paytm'].includes(p.paymentMethod) ? acc + (Number(p.amount) || 0) : acc, 0);
  }, [payments]);

  const bankCollected = useMemo(() => {
    return payments.reduce((acc, p) => p.paymentMethod === 'bank_transfer' ? acc + (Number(p.amount) || 0) : acc, 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q));

      const matchesMethod = selectedMethod === 'all' || p.paymentMethod === selectedMethod;

      let matchesDate = true;
      const pTime = new Date(p.paymentDate || p.createdAt).getTime();
      if (dateFilter === 'today') {
        matchesDate = pTime >= todayStart;
      } else if (dateFilter === 'week') {
        matchesDate = pTime >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = pTime >= monthAgo;
      }

      return matchesSearch && matchesMethod && matchesDate;
    });
  }, [payments, searchQuery, selectedMethod, dateFilter, todayStart]);

  const handleDeletePayment = async (e: React.MouseEvent, id: string, amount: number) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete payment record of ₹${amount}?`)) {
      await removePayment(id);
      refetch();
    }
  };

  const getMethodBadge = (method: PaymentMode) => {
    switch (method) {
      case 'phonepe':
        return { label: 'PhonePe', color: '#673AB7', bg: 'rgba(103, 58, 183, 0.1)', icon: Smartphone };
      case 'gpay':
        return { label: 'Google Pay', color: '#1A73E8', bg: 'rgba(26, 115, 232, 0.1)', icon: Smartphone };
      case 'paytm':
        return { label: 'Paytm', color: '#00BAF2', bg: 'rgba(0, 186, 242, 0.1)', icon: Smartphone };
      case 'bank_transfer':
        return { label: 'Bank Transfer', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', icon: Building2 };
      default:
        return { label: 'Cash', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: DollarSign };
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
            <CreditCard size={22} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-heading)' }}>
              Received Payment History (Jama)
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {totalPaymentsCount} Payments
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Customer cash, UPI (PhonePe/GPay/Paytm) and bank transfer settlement records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Collections (All Time)
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            onClick={() => navigate('/payments/receive')}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1.25rem', fontWeight: '800', fontSize: '0.875rem', backgroundColor: '#059669' }}
          >
            <Plus size={18} />
            <span>+ Receive Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Collection Breakdown Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem'
      }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today's Collection</span>
          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#10B981', marginTop: '0.2rem' }}>
            ₹{todayCollected.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cash Collections</span>
          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#047857', marginTop: '0.2rem' }}>
            ₹{cashCollected.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UPI (PhonePe/GPay)</span>
          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2563EB', marginTop: '0.2rem' }}>
            ₹{upiCollected.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Transfers</span>
          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#7C3AED', marginTop: '0.2rem' }}>
            ₹{bankCollected.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by customer name, phone, UTR/ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>

          {/* Date Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{ borderRadius: '12px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', fontWeight: '700', backgroundColor: 'var(--bg-card)' }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week (Last 7 Days)</option>
              <option value="month">This Month (Last 30 Days)</option>
            </select>
          </div>
        </div>

        {/* Method Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Methods' },
            { id: 'cash', label: 'Cash' },
            { id: 'phonepe', label: 'PhonePe' },
            { id: 'gpay', label: 'Google Pay' },
            { id: 'paytm', label: 'Paytm' },
            { id: 'bank_transfer', label: 'Bank Transfer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMethod(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: selectedMethod === tab.id ? '800' : '600',
                color: selectedMethod === tab.id ? 'var(--primary)' : 'var(--text-body)',
                backgroundColor: selectedMethod === tab.id ? 'var(--primary-light)' : 'transparent',
                border: selectedMethod === tab.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '3rem 1.5rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <CreditCard size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Payment Records Found
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No payments matching "${searchQuery}"` : 'Record customer payments to see them listed here'}
          </p>
          <button onClick={() => navigate('/payments/receive')} className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Receive Payment Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '0.85rem' }}>
          {filteredPayments.map((p) => {
            const methodInfo = getMethodBadge(p.paymentMethod);
            const MethodIcon = methodInfo.icon;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPaymentForDetails(p)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 120ms ease, box-shadow 120ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(15, 23, 42, 0.03)';
                }}
              >
                {/* Header: Customer & Amount */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {p.customerName || 'Customer'}
                    </h4>
                    {p.customerPhone && (
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        📱 {p.customerPhone}
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10B981' }}>
                      +₹{p.amount}
                    </div>
                    <span style={{ fontSize: '0.675rem', fontWeight: '800', color: '#047857', backgroundColor: '#DCFCE7', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                      JAMA / GOT
                    </span>
                  </div>
                </div>

                {/* Method & UTR Banner */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px',
                  fontSize: '0.775rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: methodInfo.color, fontWeight: '800' }}>
                    <MethodIcon size={14} />
                    <span>{methodInfo.label}</span>
                  </div>

                  {p.referenceNo ? (
                    <span style={{ fontSize: '0.725rem', color: '#2563EB', fontWeight: '700' }}>
                      UTR: {p.referenceNo}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified</span>
                  )}
                </div>

                {/* Date & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPaymentForDetails(p);
                      }}
                      className="btn btn-secondary"
                      style={{ borderRadius: '8px', padding: '0.25rem 0.5rem', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Eye size={12} />
                      <span>Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeletePayment(e, p.id, p.amount)}
                      style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Payment Record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Details / Receipt Modal */}
      {selectedPaymentForDetails && (
        <PaymentDetailsModal
          isOpen={!!selectedPaymentForDetails}
          onClose={() => setSelectedPaymentForDetails(null)}
          payment={selectedPaymentForDetails}
        />
      )}

    </div>
  );
};

export default PaymentsListPage;
