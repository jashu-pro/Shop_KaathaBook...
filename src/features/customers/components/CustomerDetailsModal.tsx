/* features/customers/components/CustomerDetailsModal.tsx */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  Send, 
  Receipt, 
  CreditCard, 
  FileText, 
  Edit3,
  ChevronDown
} from 'lucide-react';
import type { Customer } from '../types';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useCustomers } from '../hooks/useCustomers';
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
  const { editCustomer } = useCustomers();

  const [currentTag, setCurrentTag] = useState('Regular');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30'>('all');

  useEffect(() => {
    if (customer?.tag) {
      setCurrentTag(customer.tag);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const customerName = customer.name || 'Unnamed Customer';
  const currentBalance = Number(customer.currentBalance) || 0;
  const creditLimit = Number(customer.creditLimit) || 50000;

  const handleStatusChange = async (newTag: string) => {
    setCurrentTag(newTag);
    try {
      await editCustomer(customer.id, { tag: newTag });
    } catch (e) {
      console.error('Failed to update customer status tag', e);
    }
  };

  // Filter sales & payments safely for this customer
  const customerSales = (sales || []).filter((s) => s && s.customerId === customer.id);
  const customerPayments = (payments || []).filter((p) => p && p.customerId === customer.id);

  // Financial Summaries from Repository Data
  const totalPurchases = customerSales.reduce((acc, s) => acc + (Number(s?.totalAmount) || 0), 0);
  const totalPaid = customerPayments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);

  // Combine into Khatta Bahi Ledger Entries
  const rawLedgerEntries = [
    ...customerSales.map((s) => ({
      id: s.id,
      date: s.saleDate || s.createdAt || new Date().toISOString(),
      details: `Credit Bill (${s.invoiceNo || 'Sale'})`,
      jama: 0,
      udhaar: Number(s.totalAmount) || 0,
      type: 'sale' as const
    })),
    ...customerPayments.map((p) => ({
      id: p.id,
      date: p.paymentDate || p.createdAt || new Date().toISOString(),
      details: `Payment Received (${(p.paymentMethod || 'CASH').toUpperCase()}) ${p.referenceNo ? `#${p.referenceNo}` : ''}`,
      jama: Number(p.amount) || 0,
      udhaar: 0,
      type: 'payment' as const
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply Date Filtering
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
  const cleanPhone = customer.phone ? String(customer.phone).replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : customer.phone || 'No Phone';

  // Dynamic WhatsApp Reminder Text
  const reminderText = `🙏 ${shopName}\n\nHello ${customerName},\n\nYour current Khatta balance is ₹${Math.abs(currentBalance).toLocaleString('en-IN')}.\n\nPlease clear the pending amount at your convenience.\n\nThank you!`;

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CU';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const tagLower = (currentTag || '').toLowerCase();
  const tagColor = 
    tagLower === 'vip' ? { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6', border: '#DBEAFE' } :
    tagLower === 'risk' ? { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', border: '#FEE2E2' } :
    tagLower === 'new' ? { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E', border: '#DCFCE7' } :
    { bg: '#F8FAFC', text: '#475569', dot: '#64748B', border: '#E2E8F0' };

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
    }}
    onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '28px',
          maxWidth: '580px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Header Bar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9'
        }}>
          {/* Avatar + Customer Name + Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              fontWeight: '800',
              fontSize: '1.2rem',
              border: '1px solid #DBEAFE'
            }}>
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt={customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitials(customerName)}</span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                {customerName}
              </h3>
              <div style={{ marginTop: '0.25rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: tagColor.bg,
                    color: tagColor.text,
                    border: `1px solid ${tagColor.border}`,
                    fontSize: '0.725rem',
                    fontWeight: '800',
                    textTransform: 'uppercase'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tagColor.dot }} />
                  {currentTag}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(customer)}
                style={{
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Edit Customer Details"
              >
                <Edit3 size={15} style={{ color: '#3B82F6' }} />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                width: '36px', height: '36px', borderRadius: '12px',
                backgroundColor: '#F1F5F9', border: 'none', color: '#64748B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* STATUS SECTION */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              STATUS
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={currentTag}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="New">NEW</option>
                <option value="Regular">REGULAR</option>
                <option value="VIP">VIP</option>
                <option value="Wholesale">WHOLESALE</option>
                <option value="Contacted">CONTACTED</option>
                <option value="Onboarding">ONBOARDING</option>
                <option value="Demo Scheduled">DEMO SCHEDULED</option>
                <option value="Risk">RISK</option>
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
            </div>
          </div>

          {/* Quick Action Buttons: Call | WhatsApp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <a
              href={cleanPhone ? `tel:${cleanPhone}` : '#'}
              style={{
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.8rem', borderRadius: '16px',
                border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF',
                color: '#0F172A', fontWeight: '700', fontSize: '0.9rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <PhoneCall size={18} style={{ color: '#3B82F6' }} />
              <span>Call</span>
            </a>

            <a
              href={cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderText)}` : '#'}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.8rem', borderRadius: '16px',
                border: '1px solid #DCFCE7', backgroundColor: '#F0FDF4',
                color: '#16A34A', fontWeight: '700', fontSize: '0.9rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <Send size={18} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* DETAILS SECTION */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              DETAILS
            </label>
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              padding: '1.15rem 1.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Customer Name</span>
                <span style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '800' }}>{customerName}</span>
              </div>

              <div style={{ height: '1px', backgroundColor: '#EDF2F7' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Village / Location</span>
                <span style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '700' }}>
                  {customer.village || customer.address || 'Not Specified'}
                </span>
              </div>

              <div style={{ height: '1px', backgroundColor: '#EDF2F7' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Phone Number</span>
                <span style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '800' }}>{formattedPhone}</span>
              </div>

              <div style={{ height: '1px', backgroundColor: '#EDF2F7' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Credit Limit</span>
                <span style={{ fontSize: '0.95rem', color: '#0F172A', fontWeight: '800' }}>
                  ₹{creditLimit.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ height: '1px', backgroundColor: '#EDF2F7' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Current Udhaar</span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '800',
                  color: currentBalance > 0 ? '#DC2626' : currentBalance < 0 ? '#16A34A' : '#0F172A'
                }}>
                  ₹{Math.abs(currentBalance).toLocaleString('en-IN')} {currentBalance > 0 ? '(Udhaar)' : currentBalance < 0 ? '(Advance)' : '(Settled)'}
                </span>
              </div>

              {customer.notes && (
                <>
                  <div style={{ height: '1px', backgroundColor: '#EDF2F7' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Notes / Remarks</span>
                    <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>
                      {customer.notes}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Primary Action Buttons: + New Bill & Receive Payment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewBill(customer.id);
              }}
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                padding: '0.85rem',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
              }}
            >
              <Receipt size={18} />
              <span>+ New Credit Bill</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCollectPayment(customer.id);
              }}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                padding: '0.85rem',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              <CreditCard size={18} />
              <span>Receive Payment</span>
            </button>
          </div>

          {/* KHATTA LEDGER TIMELINE SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Khatta Passbook ({filteredLedgerEntries.length})
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
                      borderRadius: '10px',
                      border: dateFilter === f.id ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                      backgroundColor: dateFilter === f.id ? '#ECFDF5' : '#FFFFFF',
                      color: dateFilter === f.id ? '#059669' : '#64748B',
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
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '14px',
              padding: '0.65rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '800',
              fontSize: '0.8rem'
            }}>
              <span style={{ flex: 1.3 }}>Date & Transaction</span>
              <span style={{ flex: 1, textAlign: 'center' }}>GOT (Jama)</span>
              <span style={{ flex: 1, textAlign: 'right' }}>GAVE (Udhaar)</span>
            </div>

            {/* Khatta Entries */}
            {filteredLedgerEntries.length === 0 ? (
              <div style={{ padding: '1.75rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.825rem' }}>
                No transaction ledger entries found.
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
                      backgroundColor: '#F8FAFC',
                      borderRadius: '14px',
                      fontSize: '0.8rem',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ flex: 1.3 }}>
                      <span style={{ fontWeight: '700', color: '#0F172A', display: 'block' }}>{entry.details}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ flex: 1, textAlign: 'center', color: '#10B981', fontWeight: '800' }}>
                      {entry.jama > 0 ? `+ ₹${entry.jama.toLocaleString('en-IN')}` : '-'}
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', color: '#DC2626', fontWeight: '800' }}>
                      {entry.udhaar > 0 ? `- ₹${entry.udhaar.toLocaleString('en-IN')}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Print / Export Button */}
          <button
            type="button"
            onClick={handleDownloadPassbook}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '14px',
              fontWeight: '700',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            <FileText size={15} />
            <span>Print / Export PDF Khatta Passbook</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
