/* features/payments/components/PaymentDetailsModal.tsx */
import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Building2 
} from 'lucide-react';
import type { Payment, PaymentMode } from '../types';
import { useAuthStore } from '../../../stores/authStore';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  payment
}) => {
  const { shop } = useAuthStore();

  if (!isOpen || !payment) return null;

  const shopName = shop?.name || 'Shop KhattaBook';
  const shopPhone = shop?.phone || '';
  const shopAddress = [shop?.address, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(', ');

  const getMethodDetails = (method: PaymentMode) => {
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

  const methodInfo = getMethodDetails(payment.paymentMethod);
  const MethodIcon = methodInfo.icon;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptContent = `
========================================
           ${shopName.toUpperCase()}
========================================
Address: ${shopAddress || 'Local Store'}
Phone: ${shopPhone || 'N/A'}
----------------------------------------
PAYMENT RECEIPT (JAMA / GOT)
Receipt ID: ${payment.id}
Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-IN')}
Time: ${new Date(payment.paymentDate || payment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

CUSTOMER DETAILS:
Name: ${payment.customerName || 'Customer'}
Phone: ${payment.customerPhone || 'N/A'}
----------------------------------------
AMOUNT RECEIVED: ₹${payment.amount}
Payment Mode:    ${methodInfo.label}
${payment.referenceNo ? `UTR / Ref No:   ${payment.referenceNo}` : ''}
${payment.notes ? `Notes:          ${payment.notes}` : ''}
Status:          SUCCESS (GOT / JAMA ENTRY)
========================================
      Thank You for Your Payment! 🙏
========================================
`;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_Receipt_${payment.customerName || 'Customer'}_${payment.id.slice(0, 6)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    if (!payment.customerPhone) {
      alert('No customer phone number available to send WhatsApp message.');
      return;
    }
    const cleanPhone = payment.customerPhone.replace(/[^0-9]/g, '');
    const message = `🙏 *${shopName.toUpperCase()}*

🟢 *PAYMENT RECEIVED RECEIPT (JAMA)*
------------------------------------
Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-IN')}

Hello *${payment.customerName || 'Customer'}*,
Thank you! We have received your payment:

💵 *Amount Received:* ₹${payment.amount}
💳 *Payment Mode:* ${methodInfo.label}
${payment.referenceNo ? `🔢 *UTR / Reference:* ${payment.referenceNo}` : ''}

Your Khatta ledger has been updated successfully.
Thank you for your payment! 🙏`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'modal-slide 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} style={{ color: '#10B981' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>
              Payment Receipt
            </h3>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: '800',
              padding: '0.2rem 0.55rem',
              borderRadius: '8px',
              backgroundColor: '#DCFCE7',
              color: '#16A34A'
            }}>
              JAMA / GOT
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Printable Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Shop Header */}
          <div style={{ textAlign: 'center', paddingBottom: '0.75rem', borderBottom: '2px dashed #E2E8F0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A', lineHeight: 1.2 }}>
              {shopName}
            </h2>
            {shopAddress && (
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                📍 {shopAddress}
              </p>
            )}
            {shopPhone && (
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                📱 {shopPhone}
              </p>
            )}
          </div>

          {/* Amount Paid Big Pill */}
          <div style={{
            backgroundColor: '#F0FDF4',
            borderRadius: '16px',
            border: '1.5px solid #DCFCE7',
            padding: '1.15rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Received
            </span>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#16A34A', lineHeight: 1.1, marginTop: '0.2rem' }}>
              ₹{payment.amount}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: methodInfo.bg, color: methodInfo.color, padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.775rem', fontWeight: '800', marginTop: '0.5rem' }}>
              <MethodIcon size={14} />
              <span>Paid via {methodInfo.label}</span>
            </div>
          </div>

          {/* Customer & Transaction Meta */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Customer:</span>
              <span style={{ fontWeight: '800', color: '#0F172A' }}>{payment.customerName || 'Customer'}</span>
            </div>

            {payment.customerPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Phone:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>📱 {payment.customerPhone}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Payment Date:</span>
              <span style={{ fontWeight: '700', color: '#0F172A' }}>
                📅 {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Payment Time:</span>
              <span style={{ fontWeight: '700', color: '#0F172A' }}>
                ⏰ {new Date(payment.paymentDate || payment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {payment.referenceNo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                <span style={{ color: '#64748B' }}>UTR / Reference No:</span>
                <span style={{ fontWeight: '800', color: '#2563EB' }}>{payment.referenceNo}</span>
              </div>
            )}

            {payment.notes && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                <span style={{ color: '#64748B' }}>Notes / Remarks:</span>
                <span style={{ fontWeight: '600', color: '#475569' }}>{payment.notes}</span>
              </div>
            )}
          </div>

          {/* Attached Receipt Proof Screenshot */}
          {payment.proofImageUrl && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                Payment Screenshot / Receipt:
              </span>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', maxHeight: '160px' }}>
                <img src={payment.proofImageUrl} alt="Payment Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.2fr',
          gap: '0.65rem',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '0.65rem',
              fontSize: '0.825rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '0.65rem',
              fontSize: '0.825rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Download size={15} />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem',
              fontSize: '0.825rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
            }}
          >
            <Share2 size={15} />
            <span>WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentDetailsModal;
