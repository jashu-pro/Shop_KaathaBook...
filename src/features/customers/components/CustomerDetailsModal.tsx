/* features/customers/components/CustomerDetailsModal.tsx */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  Send, 
  Receipt, 
  CreditCard, 
  FileText, 
  User,
  MessageSquare,
  Edit3
} from 'lucide-react';
import type { Customer } from '../types';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useAuthStore } from '../../../stores/authStore';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBill: (customerId: string) => void;
  onCollectPayment: (customerId: string) => void;
  onEdit?: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onNewBill,
  onCollectPayment,
  onEdit
}) => {
  const { shop } = useAuthStore();
  const shopName = shop?.name || 'Shop KhattaBook Store';

  const { sales } = useSales();
  const { payments } = usePayments();

  const [tag, setTag] = useState<'regular' | 'vip' | 'risk'>('regular');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30'>('all');

  useEffect(() => {
    if (customer?.tag) {
      setTag(customer.tag as any);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Filter sales & payments for this customer
  const customerSales = sales.filter((s) => s.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  // Financial Summaries from Repository Data
  const totalPurchases = customerSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);

  // Combine into Khatta Bahi Ledger Entries
  const rawLedgerEntries = [
    ...customerSales.map((s) => ({
      id: s.id,
      date: s.saleDate || s.createdAt,
      details: `Credit Bill (${s.invoiceNo || 'Sale'})`,
      jama: 0,
      udhaar: s.totalAmount,
      type: 'sale' as const
    })),
    ...customerPayments.map((p) => ({
      id: p.id,
      date: p.paymentDate || p.createdAt,
      details: `Payment Received (${p.paymentMethod.toUpperCase()}) ${p.referenceNo ? `#${p.referenceNo}` : ''}`,
      jama: p.amount,
      udhaar: 0,
      type: 'payment' as const
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply Date Filtering (Read-only view filtering)
  const filteredLedgerEntries = rawLedgerEntries.filter((entry) => {
    const entryDate = new Date(entry.date).getTime();
    const now = Date.now();

    if (dateFilter === 'this_month') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      return entryDate >= startOfMonth;
    }
    if (dateFilter === 'last_30') {
      const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;
      return entryDate >= thirtyDaysAgo;
    }
    return true;
  });

  // Normalized Indian Phone Number
  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : customer.phone || 'No Phone';

  // Dynamic WhatsApp & SMS Reminder Text using Authenticated Shop Name
  const reminderText = `🙏 ${shopName}\n\nHello ${customer.name},\n\nYour current Khatta balance is ₹${Math.abs(customer.currentBalance).toLocaleString('en-IN')}.\n\nPlease clear the pending amount at your convenience.\n\nThank you!`;

  const handleDownloadPassbook = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-body)',
        borderRadius: 'var(--radius-card, 28px)',
        maxWidth: '640px',
        width: '100%',
        boxShadow: 'var(--glass-shadow)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        animation: 'modal-slide 0.25s ease',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Modal Header: Avatar, Name, Tag & Actions */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              fontWeight: '800',
              fontSize: '1.2rem',
              border: '1px solid var(--border-color)'
            }}>
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={24} />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                  {customer.name}
                </h3>
                <span className={`badge ${tag === 'risk' ? 'badge-error' : tag === 'vip' ? 'badge-success' : 'badge-neutral'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {tag}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                📱 {formattedPhone} {customer.village ? `• 📍 ${customer.village}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(customer)}
                className="btn btn-secondary"
                style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '0.45rem 0.85rem', fontWeight: '700', gap: '0.3rem' }}
                title="Edit Customer Details"
              >
                <Edit3 size={15} style={{ color: 'var(--primary)' }} />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary btn-icon"
              style={{ width: '36px', height: '36px', borderRadius: '12px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Quick Contact Action Bar: Call | WhatsApp | SMS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <a
              href={cleanPhone ? `tel:${cleanPhone}` : '#'}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}
            >
              <PhoneCall size={16} style={{ color: 'var(--primary)' }} /> Call
            </a>

            <a
              href={cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderText)}` : '#'}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ textDecoration: 'none', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: '#047857' }}
            >
              <Send size={16} /> WhatsApp
            </a>

            <a
              href={cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(reminderText)}` : '#'}
              className="btn btn-secondary"
              style={{ textDecoration: 'none', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}
            >
              <MessageSquare size={16} /> SMS
            </a>
          </div>

          {/* FINANCIAL SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Purchases</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.15rem' }}>
                ₹{totalPurchases.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Paid</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.15rem' }}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{
              padding: '0.85rem', borderRadius: '16px',
              backgroundColor: customer.currentBalance > 0 ? 'var(--error-light)' : 'var(--primary-light)',
              border: `1px solid ${customer.currentBalance > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Udhaar</span>
              <div style={{
                fontSize: '1.1rem', fontWeight: '800',
                color: customer.currentBalance > 0 ? 'var(--error)' : 'var(--primary)',
                marginTop: '0.15rem'
              }}>
                ₹{Math.abs(customer.currentBalance).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* KHATTA LEDGER TIMELINE SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Traditional Khatta Ledger ({filteredLedgerEntries.length})
              </span>

              {/* Date Filters */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_30', label: 'Last 30 Days' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDateFilter(f.id as any)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '12px',
                      border: dateFilter === f.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: dateFilter === f.id ? 'var(--primary-light)' : 'transparent',
                      color: dateFilter === f.id ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '0.725rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Khatta Header */}
            <div style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              borderRadius: '14px',
              padding: '0.65rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '800',
              fontSize: '0.8rem'
            }}>
              <span style={{ flex: 1.3 }}>Date & Transaction</span>
              <span style={{ flex: 1, textAlign: 'center' }}>GOT (Payment Received)</span>
              <span style={{ flex: 1, textAlign: 'right' }}>GAVE (Credit Owed)</span>
            </div>

            {/* Khatta Entries */}
            {filteredLedgerEntries.length === 0 ? (
              <div style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No transaction ledger entries match selected date range.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                {filteredLedgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '14px',
                      fontSize: '0.8rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ flex: 1.3 }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)', display: 'block' }}>{entry.details}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ flex: 1, textAlign: 'center', color: 'var(--primary)', fontWeight: '800' }}>
                      {entry.jama > 0 ? `+ ₹${entry.jama.toLocaleString('en-IN')}` : '-'}
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', color: 'var(--error)', fontWeight: '800' }}>
                      {entry.udhaar > 0 ? `- ₹${entry.udhaar.toLocaleString('en-IN')}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Primary Actions: Record Bill | Receive Payment | PDF Passbook */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', paddingTop: '0.25rem' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewBill(customer.id);
              }}
              className="btn btn-secondary"
              style={{ padding: '0.8rem', borderRadius: '16px', fontWeight: '800', fontSize: '0.875rem', gap: '0.4rem' }}
            >
              <Receipt size={16} /> + New Credit Bill
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCollectPayment(customer.id);
              }}
              className="btn btn-primary"
              style={{ padding: '0.8rem', borderRadius: '16px', fontWeight: '800', fontSize: '0.875rem', gap: '0.4rem' }}
            >
              <CreditCard size={16} /> Receive Payment
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadPassbook}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.65rem', borderRadius: '14px', fontWeight: '700', fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <FileText size={15} /> Print / Export PDF Khatta Passbook
          </button>

        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
