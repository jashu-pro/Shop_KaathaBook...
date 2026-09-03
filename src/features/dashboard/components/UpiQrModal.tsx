/* features/dashboard/components/UpiQrModal.tsx */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Edit2, 
  Download, 
  Save, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { PaymentPosterStudioModal } from './PaymentPosterStudioModal';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({ isOpen, onClose }) => {
  const { shop, updateShop } = useAuthStore();
  const { customers } = useCustomers();

  const [upiId, setUpiId] = useState('');
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpiId, setTempUpiId] = useState('');
  const [copied, setCopied] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isPosterStudioOpen, setIsPosterStudioOpen] = useState(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  const shopName = shop?.name || 'Shop KhattaBook Store';

  useEffect(() => {
    const initialUpi = shop?.upiId || `${shop?.phone || '9440112345'}@upi`;
    setUpiId(initialUpi);
    setTempUpiId(initialUpi);
  }, [shop]);

  // When customer selected, prefill their pending debt
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomAmount('');
      return;
    }
    const customer = customers.find((c) => c && c.id === customerId);
    if (customer && customer.currentBalance > 0) {
      setCustomAmount(customer.currentBalance.toString());
    } else {
      setCustomAmount('');
    }
  };

  const handleSaveUpiId = async () => {
    if (!tempUpiId.trim()) return;
    try {
      await updateShop({ upiId: tempUpiId.trim() });
      setUpiId(tempUpiId.trim());
      setIsEditingUpi(false);
    } catch (err) {
      console.error('Failed to update UPI ID', err);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amountVal = Number(customAmount) || 0;

  // Generate standard NPCI UPI Payment URI
  const upiUrl = useMemo(() => {
    let base = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;
    if (amountVal > 0) {
      base += `&am=${amountVal.toFixed(2)}`;
    }
    if (selectedCustomerId) {
      const cust = customers.find((c) => c && c.id === selectedCustomerId);
      if (cust) {
        base += `&tn=${encodeURIComponent(`Payment by ${cust.name}`)}`;
      }
    }
    return base;
  }, [upiId, shopName, amountVal, selectedCustomerId, customers]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUrl)}`;

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UPI_QR_${shopName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(qrImageUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'modal-slide 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.15rem 1.35rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              backgroundColor: '#ECFDF5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                Auto-Generated UPI QR Code
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.1rem' }}>
                Scan with GPay, PhonePe, Paytm or BHIM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#F1F5F9', border: 'none', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.15rem 1.35rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* SHOP UPI ID / VPA Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
              SHOP UPI ID / VPA
            </label>

            {isEditingUpi ? (
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="text"
                  className="input-field"
                  value={tempUpiId}
                  onChange={(e) => setTempUpiId(e.target.value)}
                  placeholder="e.g. 8121157489-2@ybl"
                  style={{
                    borderRadius: '12px',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    border: '1.5px solid #3B82F6'
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveUpiId}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUpi(false)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#64748B',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #DCFCE7',
                borderRadius: '14px',
                padding: '0.6rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.925rem', fontWeight: '800', color: '#047857' }}>
                  {upiId}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied ? '#10B981' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempUpiId(upiId);
                      setIsEditingUpi(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#059669',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Selection & Amount Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.65rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                SELECT CUSTOMER (OPTIONAL)
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    padding: '0.55rem 2rem 0.55rem 0.75rem',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    appearance: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  <option value="">Search by name, villa...</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.village ? `(${c.village})` : ''} {c.currentBalance > 0 ? `- ₹${c.currentBalance}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                AMOUNT (₹)
              </label>
              <input
                type="number"
                placeholder="Any amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A'
                }}
              />
            </div>
          </div>

          {/* Standalone Printable QR Code Standee Box */}
          <div
            ref={qrCardRef}
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #059669',
              borderRadius: '20px',
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.08)',
              position: 'relative'
            }}
          >
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
              {shopName}
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
              Accept Payments via All UPI Apps
            </p>

            {/* High-res QR Code */}
            <div style={{
              margin: '0.85rem 0',
              padding: '0.5rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={qrImageUrl}
                alt="UPI QR Code Standee"
                style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }}
              />
            </div>

            {/* Amount / Instruction Label */}
            {amountVal > 0 ? (
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', margin: '0.1rem 0' }}>
                ₹{amountVal.toLocaleString('en-IN')}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.1rem 0', fontWeight: '600' }}>
                Customer enters payment amount on phone
              </p>
            )}

            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '700', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>PhonePe</span>
              <span>•</span>
              <span>Google Pay</span>
              <span>•</span>
              <span>Paytm</span>
              <span>•</span>
              <span>BHIM UPI</span>
            </div>
          </div>

          {/* Bottom Actions: Generate PDF Poster Studio | Save QR Image */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsPosterStudioOpen(true)}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '0.8rem',
                fontSize: '0.85rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Sparkles size={16} />
              <span>Generate Poster PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '14px',
                padding: '0.8rem',
                fontSize: '0.85rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <Download size={16} />
              <span>Save QR Image</span>
            </button>
          </div>

        </div>
      </div>

      {/* Dedicated High-Res PDF Poster Studio Modal */}
      {isPosterStudioOpen && (
        <PaymentPosterStudioModal
          isOpen={isPosterStudioOpen}
          onClose={() => setIsPosterStudioOpen(false)}
          initialAmount={amountVal}
          initialCustomerName={customers.find(c => c && c.id === selectedCustomerId)?.name || ''}
        />
      )}
    </div>
  );
};

export default UpiQrModal;
