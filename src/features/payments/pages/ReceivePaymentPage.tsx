/* features/payments/pages/ReceivePaymentPage.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Zap
} from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { CustomerSearchSelect } from '../../customers/components/CustomerSearchSelect';
import { usePayments } from '../hooks/usePayments';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { PaymentMode } from '../types';

const ReceivePaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { customers, refetch: refetchCustomers } = useCustomers();
  const { createPayment } = usePayments();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('phonepe');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Set default amount to current balance when customer selected
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.currentBalance > 0 && !amount) {
      setAmount(selectedCustomer.currentBalance.toString());
    }
  }, [selectedCustomer]);

  const currentUdhaar = selectedCustomer ? selectedCustomer.currentBalance : 0;
  const payAmountVal = Number(amount) || 0;
  const remainingUdhaar = Math.max(0, currentUdhaar - payAmountVal);

  const handlePayFullShortcut = () => {
    if (selectedCustomer) {
      setAmount(selectedCustomer.currentBalance.toString());
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer to record payment');
      return;
    }
    if (!amount || payAmountVal <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        customerId: selectedCustomerId,
        amount: payAmountVal,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        proofImageUrl: proofImageUrl || undefined,
        notes: notes.trim() || undefined,
      });

      await refetchCustomers();
      setSubmitting(false);
      navigate('/customers');
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to record payment');
    }
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
        gap: '0.75rem'
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-icon"
          style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
            Receive Customer Payment
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginTop: '0.1rem' }}>
            Record cash or UPI payment & deduct customer Udhaar debt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Customer Selection Card with Search Bar */}
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

          {/* Customer Debt Banner */}
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Udhaar Debt:</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: currentUdhaar > 0 ? '#EF4444' : '#10B981' }}>
                  ₹{currentUdhaar}
                </div>
              </div>

              {currentUdhaar > 0 && (
                <button
                  type="button"
                  onClick={handlePayFullShortcut}
                  className="btn btn-secondary"
                  style={{ borderRadius: '12px', fontSize: '0.775rem', padding: '0.4rem 0.85rem', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                >
                  <Zap size={14} /> Pay Full ₹{currentUdhaar}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payment Amount Card */}
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
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Payment Amount Received (₹) *
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 1450"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', fontSize: '1.25rem', fontWeight: '800', color: '#10B981' }}
            />
          </div>

          {selectedCustomer && payAmountVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: '700', backgroundColor: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: '12px' }}>
              <span>New Remaining Udhaar Balance:</span>
              <span style={{ color: remainingUdhaar > 0 ? '#EF4444' : '#10B981' }}>
                ₹{remainingUdhaar} {remainingUdhaar === 0 ? '(Fully Paid!)' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Payment Mode Selector */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)' }}>
            Select Payment Mode *
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.6rem' }}>
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
                  <mode.icon size={20} style={{ color: mode.color }} />
                  <span style={{ fontSize: '0.775rem', fontWeight: '800', color: selected ? mode.color : 'var(--text-heading)' }}>
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Reference & Receipt Attachment */}
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
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              UPI Transaction ID / UTR Reference No. (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. UPI/4201984210"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>

          {/* Payment Proof / Receipt Attachment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Payment Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Paid via PhonePe QR scanner"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {error && <div className="input-error" style={{ fontSize: '0.8rem' }}>{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{
            borderRadius: '16px',
            padding: '0.85rem',
            fontWeight: '800',
            fontSize: '0.95rem',
            backgroundColor: '#059669',
            boxShadow: '0 6px 20px rgba(5, 150, 105, 0.25)'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{submitting ? 'Recording Payment...' : `Save Payment & Deduct ₹${payAmountVal}`}</span>
        </button>

      </form>
    </div>
  );
};

export default ReceivePaymentPage;
