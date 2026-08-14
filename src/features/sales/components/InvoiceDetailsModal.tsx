/* features/sales/components/InvoiceDetailsModal.tsx */
import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  FileText
} from 'lucide-react';
import type { Sale } from '../types';
import { useAuthStore } from '../../../stores/authStore';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  sale
}) => {
  const { shop } = useAuthStore();

  if (!isOpen || !sale) return null;

  const shopName = shop?.name || 'Shop KhattaBook';
  const shopPhone = shop?.phone || '';
  const shopAddress = [shop?.address, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(', ');
  const shopGstin = shop?.gstin || '';

  const dueAmount = Math.max(0, (Number(sale.totalAmount) || 0) - (Number(sale.amountPaid) || 0));
  const isPaid = sale.paymentStatus === 'paid' || dueAmount === 0;
  const isPartial = sale.paymentStatus === 'partially_paid' || (sale.amountPaid > 0 && dueAmount > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    const invoiceContent = `
========================================
           ${shopName.toUpperCase()}
========================================
Address: ${shopAddress || 'Local Store'}
Phone: ${shopPhone || 'N/A'}
GSTIN: ${shopGstin || 'N/A'}
----------------------------------------
INVOICE: ${sale.invoiceNo}
Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-IN')}
Time: ${new Date(sale.saleDate || sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

CUSTOMER DETAILS:
Name: ${sale.customerName || 'Walk-in Customer'}
Phone: ${sale.customerPhone || 'N/A'}
----------------------------------------
ITEMS:
${(sale.items || []).map((it, idx) => `${idx + 1}. ${it.productName || 'Item'} - Qty: ${it.quantity} x ₹${it.unitPrice} = ₹${it.totalPrice}`).join('\n')}
----------------------------------------
Subtotal:        ₹${sale.subtotal}
Discount:       -₹${sale.discountAmount || 0}
Tax / GST:      +₹${sale.taxAmount || 0}
TOTAL AMOUNT:    ₹${sale.totalAmount}
Amount Paid:     ₹${sale.amountPaid}
BALANCE DUE:     ₹${dueAmount}
Payment Status:  ${sale.paymentStatus.toUpperCase()}
Payment Mode:    ${sale.paymentMethod || 'Cash'}
========================================
      Thank You! Visit Again 🙏
========================================
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${sale.invoiceNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    if (!sale.customerPhone) {
      alert('No customer phone number available to send WhatsApp message.');
      return;
    }
    const cleanPhone = sale.customerPhone.replace(/[^0-9]/g, '');
    const message = `🙏 *${shopName.toUpperCase()}*

🧾 *TAX INVOICE / SALE RECEIPT*
--------------------------------
Invoice No: *${sale.invoiceNo}*
Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-IN')}

Hello *${sale.customerName || 'Customer'}*,
Your purchase summary:

🛍️ *Total Amount:* ₹${sale.totalAmount}
💵 *Amount Paid:* ₹${sale.amountPaid}
${dueAmount > 0 ? `🔴 *Remaining Udhaar Due:* ₹${dueAmount}` : `🟢 *Payment Status:* Fully Paid`}

Payment Mode: ${sale.paymentMethod || 'Cash'}

Thank you for shopping with us! 🙏`;

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
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'modal-slide 0.25s ease'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>
              Invoice #{sale.invoiceNo}
            </h3>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: '800',
              padding: '0.2rem 0.55rem',
              borderRadius: '8px',
              backgroundColor: isPaid ? '#DCFCE7' : isPartial ? '#FEF3C7' : '#FEE2E2',
              color: isPaid ? '#16A34A' : isPartial ? '#D97706' : '#DC2626'
            }}>
              {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID'}
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

        {/* Printable Invoice Body */}
        <div id="printable-invoice" style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Shop Header Standee */}
          <div style={{
            textAlign: 'center',
            paddingBottom: '0.85rem',
            borderBottom: '2px dashed #E2E8F0'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0F172A', lineHeight: 1.2 }}>
              {shopName}
            </h2>
            {shopAddress && (
              <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.15rem' }}>
                📍 {shopAddress}
              </p>
            )}
            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
              {shopPhone && <span>📱 {shopPhone}</span>}
              {shopGstin && <span>GSTIN: {shopGstin}</span>}
            </div>
          </div>

          {/* Customer & Invoice Meta Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#F8FAFC',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            gap: '0.5rem',
            fontSize: '0.8rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '800' }}>Billed To</span>
              <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.9rem', marginTop: '0.1rem' }}>
                {sale.customerName || 'Walk-in Customer'}
              </div>
              {sale.customerPhone && (
                <div style={{ color: '#64748B', fontSize: '0.75rem' }}>📱 {sale.customerPhone}</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: '800' }}>Invoice Details</span>
              <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '0.1rem' }}>
                📅 {new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-IN')}
              </div>
              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                ⏰ {new Date(sale.saleDate || sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: '800', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}># Item</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items && sale.items.length > 0) ? (
                  sale.items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderTop: '1px solid #F1F5F9', color: '#0F172A' }}>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700' }}>
                        {item.productName || 'Item'}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', color: '#64748B' }}>
                        {item.quantity} {item.unit || ''}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#64748B' }}>
                        ₹{item.unitPrice}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '800' }}>
                        ₹{item.totalPrice}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ borderTop: '1px solid #F1F5F9', color: '#0F172A' }}>
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700' }}>
                      {sale.notes || 'General Kirana Items'}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', color: '#64748B' }}>1</td>
                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#64748B' }}>₹{sale.subtotal}</td>
                    <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: '800' }}>₹{sale.subtotal}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Financial Summary Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: '700', color: '#0F172A' }}>₹{sale.subtotal}</span>
            </div>

            {sale.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: '700' }}>-₹{sale.discountAmount}</span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Tax / GST:</span>
                <span style={{ fontWeight: '700', color: '#0F172A' }}>+₹{sale.taxAmount}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CBD5E1', paddingTop: '0.35rem', fontSize: '1rem', fontWeight: '900', color: '#0F172A' }}>
              <span>Grand Total:</span>
              <span style={{ color: '#059669' }}>₹{sale.totalAmount}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.2rem' }}>
              <span>Amount Paid ({sale.paymentMethod || 'Cash'}):</span>
              <span>₹{sale.amountPaid}</span>
            </div>

            {dueAmount > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', fontSize: '0.95rem', fontWeight: '800', borderTop: '1px dashed #FECACA', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                <span>Udhaar Balance Due:</span>
                <span>₹{dueAmount}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontSize: '0.85rem', fontWeight: '800', borderTop: '1px dashed #DCFCE7', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                <span>Balance Due:</span>
                <span>₹0 (Fully Cleared)</span>
              </div>
            )}
          </div>

          {/* Attached Bill Receipt Image Preview */}
          {sale.billImageUrl && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>
                Attached Paper Bill Photo:
              </span>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', maxHeight: '160px' }}>
                <img src={sale.billImageUrl} alt="Paper Bill" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons Footer */}
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
            onClick={handleDownloadInvoice}
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

export default InvoiceDetailsModal;
