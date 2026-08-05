/* features/sales/components/RecordCreditSaleModal.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Camera, 
  Upload, 
  Send, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useSales } from '../hooks/useSales';
import { ImageUploader } from '../../../components/common/ImageUploader';

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface RecordCreditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
  onSuccess?: () => void;
}

export const RecordCreditSaleModal: React.FC<RecordCreditSaleModalProps> = ({
  isOpen,
  onClose,
  initialCustomerId = '',
  onSuccess
}) => {
  const { customers } = useCustomers();
  const { createSale } = useSales();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', name: 'General Udhaar Goods', quantity: 1, price: 500 }
  ]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paidCashNow, setPaidCashNow] = useState<string>('0');
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | null>(null);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);
  const [showLiveCamera, setShowLiveCamera] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers]);

  if (!isOpen) return null;

  // Add line item
  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: 1, price: 0 }
    ]);
  };

  const handleUpdateLineItem = (id: string, field: keyof LineItem, val: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  }, [lineItems]);

  const discountVal = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const paidCashVal = Math.max(0, Number(paidCashNow) || 0);
  const balanceOwedUdhaar = Math.max(0, subtotal - discountVal - paidCashVal);

  const handleSaveAndAddToKhatta = async () => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    const validItems = lineItems.filter((i) => i.name.trim() !== '' && i.price > 0);
    if (validItems.length === 0) {
      setError('Please add at least one line item with a name and price');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);

      await createSale({
        customerId: selectedCustomerId,
        subtotal,
        discountAmount: discountVal,
        taxAmount: 0,
        totalAmount: subtotal - discountVal,
        amountPaid: paidCashVal,
        paymentStatus: paidCashVal >= (subtotal - discountVal) ? 'paid' : paidCashVal > 0 ? 'partially_paid' : 'unpaid',
        paymentMethod: paidCashVal > 0 ? 'cash' : 'credit',
        billImageUrl: billPhotoUrl || undefined,
        notes: `Itemized Credit Sale (${validItems.length} items)`,
        items: validItems.map((item) => ({
          productId: item.id,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.price) || 0,
          totalPrice: (Number(item.quantity) || 1) * (Number(item.price) || 0),
        })),
      });

      // Auto Send WhatsApp if enabled & customer phone present
      if (autoSendWhatsApp && selectedCust?.phone) {
        const cleanPhone = selectedCust.phone.replace(/[^0-9]/g, '');
        const message = `Hello ${selectedCust.name}, a new Credit Sale bill of ₹${balanceOwedUdhaar} has been added to your Khatta. Total Balance Owed: ₹${(selectedCust.currentBalance || 0) + balanceOwedUdhaar}. Thank you!`;
        window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to save credit sale');
    }
  };

  const handleUseSamplePhoto = () => {
    setBillPhotoUrl('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60');
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
        borderRadius: '24px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        animation: 'modal-slide 0.25s ease',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={22} style={{ color: '#059669' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
                Record Credit Sale
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '0.15rem' }}>
                Generate itemized bill & credit ledger entry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '0.2rem',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {/* Select Customer */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                border: '1.5px solid #E2E8F0',
                fontSize: '0.925rem',
                fontWeight: '700',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.village ? `(${c.village})` : ''} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Itemized Items List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1E293B' }}>
                Itemized Items List *
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#059669',
                  fontWeight: '700',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                + Add Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {lineItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="General Udhaar Goods"
                    value={item.name}
                    onChange={(e) => handleUpdateLineItem(item.id, 'name', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))}
                    style={{
                      width: '70px',
                      padding: '0.65rem 0.5rem',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}
                  />
                  <input
                    type="number"
                    placeholder="500"
                    value={item.price || ''}
                    onChange={(e) => handleUpdateLineItem(item.id, 'price', Number(e.target.value))}
                    style={{
                      width: '100px',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      fontSize: '0.875rem',
                      fontWeight: '700'
                    }}
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '18px',
            padding: '1rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            border: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Subtotal:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A' }}>₹{subtotal}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                  Discount (₹)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                  Paid Cash Now (₹)
                </label>
                <input
                  type="number"
                  value={paidCashNow}
                  onChange={(e) => setPaidCashNow(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '0.65rem',
              marginTop: '0.15rem'
            }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A' }}>
                Balance Owed (Udhaar):
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#EF4444' }}>
                ₹{balanceOwedUdhaar}
              </span>
            </div>
          </div>

          {/* Camera & Photo Upload Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {showLiveCamera ? (
              <div>
                <ImageUploader
                  value={billPhotoUrl}
                  onChange={(val) => setBillPhotoUrl(val)}
                  variant="logo"
                  label="Physical Bill Receipt"
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLiveCamera(true)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '0.75rem',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={16} /> Open Live Camera
                </button>

                <button
                  type="button"
                  onClick={() => setShowLiveCamera(true)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0.75rem',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={16} /> Upload Photo
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#64748B' }}>
              <span>📷 Live camera works on Mobile, Tablet & Laptop webcam</span>
              <button
                type="button"
                onClick={handleUseSamplePhoto}
                style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <ImageIcon size={12} /> Use Sample Photo
              </button>
            </div>
          </div>

          {/* Auto-send WhatsApp Toggle */}
          <div style={{
            backgroundColor: '#ECFDF5',
            borderRadius: '14px',
            padding: '0.7rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid #A7F3D0',
            cursor: 'pointer'
          }}
          onClick={() => setAutoSendWhatsApp(!autoSendWhatsApp)}
          >
            <input
              type="checkbox"
              checked={autoSendWhatsApp}
              onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
            />
            <Send size={15} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: '#047857' }}>
              Auto-send bill & Khatta receipt to WhatsApp automatically on Save
            </span>
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: '600' }}>{error}</div>}

          {/* Submit Button */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveAndAddToKhatta}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '0.85rem',
              fontWeight: '800',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Check size={18} />
            <span>{submitting ? 'Saving to Khatta...' : 'Save & Add to Khatta'}</span>
          </button>

        </div>
      </div>
    </div>
  );
};
