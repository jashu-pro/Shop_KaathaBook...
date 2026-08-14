/* features/payments/pages/ReceivePaymentPage.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Zap,
  QrCode,
  Printer,
  Share2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { CustomerSearchSelect } from '../../customers/components/CustomerSearchSelect';
import { UpiQrModal } from '../../dashboard/components/UpiQrModal';
import { usePayments } from '../hooks/usePayments';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { PaymentMode } from '../types';

export const ReceivePaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { shop } = useAuthStore();
  const { customers, refetch: refetchCustomers } = useCustomers();
  const { createPayment, refetch: refetchPayments } = usePayments();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('phonepe');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  const [showQrModal, setShowQrModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessPayment, setSavedSuccessPayment] = useState<any | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c && c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const currentBalance = Number(selectedCustomer?.currentBalance) || 0;
  const isDebt = currentBalance > 0;
  const isAdvance = currentBalance < 0;

  // Auto-populate default amount to current debt when customer selected if empty
  useEffect(() => {
    if (selectedCustomer && isDebt && !amount) {
      setAmount(currentBalance.toString());
    }
  }, [selectedCustomer, isDebt, currentBalance]);

  const payAmountVal = Math.max(0, Number(amount) || 0);
  
  // Calculate remaining balance preview safely
  const remainingUdhaar = useMemo(() => {
    if (!selectedCustomer) return 0;
    return currentBalance - payAmountVal;
  }, [selectedCustomer, currentBalance, payAmountVal]);

  const handlePayFullShortcut = () => {
    if (selectedCustomer && isDebt) {
      setAmount(currentBalance.toString());
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer to record payment.');
      return;
    }
    if (!amount || payAmountVal <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const record = await createPayment({
        customerId: selectedCustomerId,
        amount: payAmountVal,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        proofImageUrl: proofImageUrl || undefined,
        notes: notes.trim() || undefined,
      });

      await Promise.all([
        refetchCustomers(),
        refetchPayments()
      ]);

      setSubmitting(false);
      setSavedSuccessPayment(record);
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to record payment');
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!savedSuccessPayment || !selectedCustomer) return;
    const phone = savedSuccessPayment.customerPhone || selectedCustomer.phone;
    if (!phone) {
      alert('No customer phone number available for WhatsApp.');
      return;
    }

    const shopNameStr = shop?.name || 'Shop KhattaBook';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const finalBalance = currentBalance - savedSuccessPayment.amount;

    const msg = `🙏 *${shopNameStr.toUpperCase()}*

🟢 *PAYMENT RECEIVED RECEIPT (JAMA)*
------------------------------------
Date: ${new Date(savedSuccessPayment.paymentDate || savedSuccessPayment.createdAt).toLocaleDateString('en-IN')}

Hello *${selectedCustomer.name}*,
Thank you! We have received your payment:

💵 *Amount Received:* ₹${savedSuccessPayment.amount}
💳 *Payment Mode:* ${savedSuccessPayment.paymentMethod.toUpperCase()}
${savedSuccessPayment.referenceNo ? `🔢 *UTR / Ref No:* ${savedSuccessPayment.referenceNo}\n` : ''}
${finalBalance > 0 ? `🔴 *Remaining Udhaar Due:* ₹${finalBalance}` : finalBalance < 0 ? `🟢 *Advance Balance:* ₹${Math.abs(finalBalance)}` : `🟢 *Khatta Balance:* ₹0 (Fully Cleared)`}

Thank you for your payment! 🙏`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleStartNextPayment = () => {
    setSavedSuccessPayment(null);
    setAmount('');
    setReferenceNo('');
    setNotes('');
    setProofImageUrl(null);
    setSelectedCustomerId('');
  };

  const paymentModesList: { id: PaymentMode; label: string; icon: any; color: string; bg: string }[] = [
    { id: 'phonepe', label: 'PhonePe', icon: Smartphone, color: '#673AB7', bg: 'rgba(103, 58, 183, 0.1)' },
    { id: 'gpay', label: 'Google Pay', icon: Smartphone, color: '#1A73E8', bg: 'rgba(26, 115, 232, 0.1)' },
    { id: 'paytm', label: 'Paytm', icon: Smartphone, color: '#00BAF2', bg: 'rgba(0, 186, 242, 0.1)' },
    { id: 'cash', label: 'Cash', icon: DollarSign, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      
      {/* Top Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.15rem 1.25rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              Receive Customer Payment (Jama)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Record cash, UPI or bank collection & atomically deduct Udhaar
            </p>
          </div>
        </div>

        {/* Live Dynamic UPI QR Launcher Button */}
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          style={{
            backgroundColor: '#ECFDF5',
            color: '#059669',
            border: '1.5px solid #A7F3D0',
            borderRadius: '12px',
            padding: '0.5rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <QrCode size={16} />
          <span>Show Dynamic QR</span>
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: '14px',
          padding: '0.75rem 1rem',
          color: '#DC2626',
          fontSize: '0.85rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* 1. Customer Selection Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <CustomerSearchSelect
            label="Select Customer"
            required
            value={selectedCustomerId}
            onChange={(id) => setSelectedCustomerId(id)}
            customers={customers}
            placeholder="Type to search by customer name, phone, or village..."
          />

          {/* Customer Balance Banner */}
          {selectedCustomer && (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isDebt ? 'Outstanding Udhaar Debt:' : isAdvance ? 'Customer Advance Credit:' : 'Current Khatta Balance:'}
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: isDebt ? '#DC2626' : isAdvance ? '#16A34A' : '#64748B' }}>
                  ₹{Math.abs(currentBalance)} {isAdvance ? '(Advance)' : isDebt ? '' : '(Settled)'}
                </div>
              </div>

              {isDebt && (
                <button
                  type="button"
                  onClick={handlePayFullShortcut}
                  className="btn btn-secondary"
                  style={{ borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', padding: '0.45rem 0.85rem', color: '#059669', borderColor: 'rgba(5, 150, 105, 0.3)' }}
                >
                  <Zap size={14} /> Pay Full ₹{currentBalance}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Payment Amount & Quick Shortcuts Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Payment Amount Received (₹) *
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.75rem 1rem', border: '1.5px solid var(--border-color)', fontSize: '1.35rem', fontWeight: '900', color: '#059669' }}
              min="1"
            />
          </div>

          {/* Quick Amount Shortcut Pills */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {[500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  color: 'var(--text-heading)',
                  cursor: 'pointer'
                }}
              >
                + ₹{val.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Live Remaining Balance Preview */}
          {selectedCustomer && payAmountVal > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              fontWeight: '800',
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.75rem 1rem',
              borderRadius: '14px'
            }}>
              <span>New Balance After Payment:</span>
              <span style={{ color: remainingUdhaar > 0 ? '#DC2626' : '#16A34A' }}>
                {remainingUdhaar > 0 
                  ? `₹${remainingUdhaar} (Remaining Udhaar)` 
                  : remainingUdhaar < 0 
                  ? `₹${Math.abs(remainingUdhaar)} (Customer Advance)` 
                  : '₹0 (Fully Cleared!)'}
              </span>
            </div>
          )}
        </div>

        {/* 3. Payment Mode Selector */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            Select Payment Mode *
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.6rem' }}>
            {paymentModesList.map((mode) => {
              const selected = paymentMethod === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaymentMethod(mode.id)}
                  style={{
                    backgroundColor: selected ? mode.bg : 'var(--bg-secondary)',
                    border: selected ? `2px solid ${mode.color}` : '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '0.75rem 0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <mode.icon size={22} style={{ color: mode.color }} />
                  <span style={{ fontSize: '0.775rem', fontWeight: '800', color: selected ? mode.color : 'var(--text-heading)' }}>
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Payment Reference & Receipt Attachment */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {paymentMethod !== 'cash' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                UPI Transaction ID / UTR Reference No. (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. UPI/620491823901 or UTR12345"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Payment Receipt / Screenshot Photo (Optional)
            </label>
            <ImageUploader
              value={proofImageUrl}
              onChange={(val) => setProofImageUrl(val)}
              variant="logo"
              label="Payment Receipt"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Payment Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Paid via QR Scanner on shop counter"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{
            borderRadius: '16px',
            padding: '0.95rem',
            fontWeight: '900',
            fontSize: '1.05rem',
            backgroundColor: '#059669',
            boxShadow: '0 6px 20px rgba(5, 150, 105, 0.25)',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          <CheckCircle2 size={20} />
          <span>{submitting ? 'Recording Payment...' : `✓ Save Payment & Deduct ₹${payAmountVal}`}</span>
        </button>

      </form>

      {/* ============================================================= */}
      {/* POST-PAYMENT SUCCESS RECEIPT MODAL DIALOG                     */}
      {/* ============================================================= */}
      {savedSuccessPayment && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              padding: '1.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
              animation: 'modal-slide 0.25s ease'
            }}
          >
            {/* Green Success Check Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0F172A', lineHeight: 1.2 }}>
                ✓ Payment Recorded Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                ₹{savedSuccessPayment.amount} received from {selectedCustomer?.name || 'Customer'}
              </p>
            </div>

            {/* Financial Summary Card */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              textAlign: 'left',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Customer:</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>{selectedCustomer?.name || 'Customer'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                <span>Amount Received:</span>
                <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>₹{savedSuccessPayment.amount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Payment Mode:</span>
                <span style={{ fontWeight: '800', textTransform: 'capitalize', color: '#0F172A' }}>{savedSuccessPayment.paymentMethod}</span>
              </div>

              {savedSuccessPayment.referenceNo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>UTR / Reference:</span>
                  <span style={{ fontWeight: '700', color: '#2563EB' }}>{savedSuccessPayment.referenceNo}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '0.45rem', fontWeight: '900', color: (currentBalance - savedSuccessPayment.amount) > 0 ? '#DC2626' : '#16A34A' }}>
                <span>Updated Khatta Balance:</span>
                <span>
                  {(currentBalance - savedSuccessPayment.amount) > 0
                    ? `₹${currentBalance - savedSuccessPayment.amount} (Udhaar)`
                    : (currentBalance - savedSuccessPayment.amount) < 0
                    ? `₹${Math.abs(currentBalance - savedSuccessPayment.amount)} (Advance)`
                    : '₹0 (Fully Cleared)'}
                </span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '14px',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Printer size={16} />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                }}
              >
                <Share2 size={16} />
                <span>Share WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartNextPayment}
              className="btn btn-primary"
              style={{
                borderRadius: '16px',
                padding: '0.85rem',
                fontWeight: '900',
                fontSize: '0.95rem',
                backgroundColor: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={18} />
              <span>Receive Another Payment</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic UPI QR Modal */}
      {showQrModal && (
        <UpiQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
        />
      )}

    </div>
  );
};

export default ReceivePaymentPage;
