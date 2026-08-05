/* features/customers/components/CustomerDetailsModal.tsx */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  Send, 
  Receipt, 
  CreditCard, 
  QrCode, 
  FileText, 
  Edit3,
  User
} from 'lucide-react';
import type { Customer } from '../types';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onNewBill: (customerId: string) => void;
  onCollectPayment: (customerId: string) => void;
  onEditInfo?: (customer: Customer) => void;
  onOpenUPIQR?: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onNewBill,
  onCollectPayment,
  onEditInfo,
  onOpenUPIQR
}) => {
  const { sales } = useSales();
  const { payments } = usePayments();

  const [tag, setTag] = useState<'regular' | 'vip' | 'risk' | 'high_risk'>('regular');

  useEffect(() => {
    if (customer?.tag) {
      setTag(customer.tag as any);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Filter sales & payments for this customer
  const customerSales = sales.filter((s) => s.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  // Combine into Bahi Ledger Notebook entries
  const ledgerEntries = [
    ...customerSales.map((s) => ({
      id: s.id,
      date: s.saleDate || s.createdAt,
      details: `Credit Bill (${s.invoiceNo})`,
      jama: 0,
      udhaar: s.totalAmount,
      type: 'sale'
    })),
    ...customerPayments.map((p) => ({
      id: p.id,
      date: p.paymentDate || p.createdAt,
      details: `Payment (${p.paymentMethod.toUpperCase()}) ${p.referenceNo ? `#${p.referenceNo}` : ''}`,
      jama: p.amount,
      udhaar: 0,
      type: 'payment'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';

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
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'modal-slide 0.25s ease',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Modal Header: Avatar, Name, Risk Dropdown & Close */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={24} style={{ color: '#64748B' }} />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
                {customer.name}
              </h3>

              {/* Risk Tag Pill */}
              <div style={{ marginTop: '0.25rem' }}>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as any)}
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: '800',
                    color: tag === 'high_risk' || tag === 'risk' ? '#DC2626' : tag === 'vip' ? '#059669' : '#D97706',
                    backgroundColor: tag === 'high_risk' || tag === 'risk' ? '#FEF2F2' : tag === 'vip' ? '#ECFDF5' : '#FFFBEB',
                    border: `1px solid ${tag === 'high_risk' || tag === 'risk' ? '#FCA5A5' : tag === 'vip' ? '#6EE7B7' : '#FDE68A'}`,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="risk">• HIGH RISK</option>
                  <option value="regular">• REGULAR</option>
                  <option value="vip">• VIP</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: '0.25rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Action Buttons: Call & WhatsApp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                border: '1.5px solid #E2E8F0',
                borderRadius: '16px',
                padding: '0.75rem',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={18} /> Call
            </a>

            <a
              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${customer.name}, your current Shop KhattaBook balance is ₹${customer.currentBalance}. Thank you!`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: '#ECFDF5',
                color: '#047857',
                border: '1.5px solid #A7F3D0',
                borderRadius: '16px',
                padding: '0.75rem',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <Send size={18} /> WhatsApp
            </a>
          </div>

          {/* DETAILS Container */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '20px',
            padding: '1.15rem 1.25rem',
            border: '1px solid #F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DETAILS
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Owner / Customer Name</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>{customer.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Village / Residence</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>{customer.village || 'Hyd'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Phone Number</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>+91 {customer.phone || '8121157489'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Credit Limit</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>₹50,000</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Credit Risk Score</span>
                <span style={{ fontWeight: '800', color: '#059669' }}>750 / 850 (Low Risk)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Current Khatta Balance</span>
                <span style={{ fontWeight: '800', color: customer.currentBalance > 0 ? '#DC2626' : '#059669' }}>
                  ₹{customer.currentBalance}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Account Created Date</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>
                  {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* BAHI LEDGER NOTEBOOK SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BAHI LEDGER NOTEBOOK
              </span>
              <span style={{ fontSize: '0.775rem', fontWeight: '700', color: '#94A3B8' }}>
                {ledgerEntries.length} Entries
              </span>
            </div>

            {/* Bahi Table Header */}
            <div style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '800',
              fontSize: '0.85rem'
            }}>
              <span style={{ flex: 1.2 }}>Date & Details</span>
              <span style={{ flex: 1, textAlign: 'center' }}>Jama (Paid)</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Udhaar (Owed)</span>
            </div>

            {/* Bahi Table List */}
            {ledgerEntries.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.825rem' }}>
                No ledger entries yet for this customer
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ flex: 1.2 }}>
                      <span style={{ fontWeight: '700', color: '#0F172A', display: 'block' }}>{entry.details}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(entry.date).toLocaleDateString('en-IN')}</span>
                    </div>

                    <div style={{ flex: 1, textAlign: 'center', color: '#10B981', fontWeight: '800' }}>
                      {entry.jama > 0 ? `₹${entry.jama}` : '-'}
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', color: '#EF4444', fontWeight: '800' }}>
                      {entry.udhaar > 0 ? `₹${entry.udhaar}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Middle Action Buttons */}
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
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.8rem',
                  fontWeight: '800',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <Receipt size={16} /> New Bill (Debit)
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCollectPayment(customer.id);
                }}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.8rem',
                  fontWeight: '800',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={16} /> Collect Payment
              </button>
            </div>

            {/* Bottom 3 Utility Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => onOpenUPIQR && onOpenUPIQR(customer)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.65rem 0.4rem',
                  fontWeight: '700',
                  fontSize: '0.775rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <QrCode size={14} /> UPI QR Code
              </button>

              <button
                type="button"
                onClick={handleDownloadPassbook}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.65rem 0.4rem',
                  fontWeight: '700',
                  fontSize: '0.775rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} /> PDF Passbook
              </button>

              <button
                type="button"
                onClick={() => onEditInfo && onEditInfo(customer)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '0.65rem 0.4rem',
                  fontWeight: '700',
                  fontSize: '0.775rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={14} /> Edit Info
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
