/* features/sales/components/NewSaleWizardModal.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Send, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Barcode, 
  UserPlus, 
  ArrowRight,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { AddCustomerModal } from '../../customers/components/AddCustomerModal';
import { ImageUploader } from '../../../components/common/ImageUploader';

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface NewSaleWizardModalProps {
  isOpen: boolean;
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewSaleWizardModal: React.FC<NewSaleWizardModalProps> = ({
  isOpen,
  initialCustomerId = '',
  onClose,
  onSuccess,
}) => {
  const { customers, refetch: refetchCustomers } = useCustomers();
  const { products } = useInventory();
  const { createSale } = useSales();

  // Wizard Step: 1 = Customer, 2 = Products, 3 = Payment & Summary, 4 = Notes & Camera, 5 = Success
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [taxAmount, setTaxAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash' | 'upi' | 'card' | 'mixed'>('credit');
  const [amountPaidNow, setAmountPaidNow] = useState<string>('0');

  const [notes, setNotes] = useState('');
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | null>(null);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState(false);
  const [savedSaleRecord, setSavedSaleRecord] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync initial customer ID
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Draft Auto-Save & Restore
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem('khattabook_sale_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.cart && parsed.cart.length > 0) {
            setCart(parsed.cart);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('khattabook_sale_draft', JSON.stringify({ cart, selectedCustomerId }));
    }
  }, [cart, selectedCustomerId]);

  // Selected Customer
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers.slice(0, 5); // Recent 5
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
    );
  }, [products, productSearch]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const discountVal = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const taxVal = Math.max(0, Number(taxAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal + taxVal);
  const paidVal = Math.max(0, Number(amountPaidNow) || 0);
  const balanceOwed = Math.max(0, grandTotal - paidVal);

  // Cart Handlers
  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          discount: 0,
          taxRate: 0,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const handleBarcodeLookup = () => {
    if (products.length > 0) {
      handleAddToCart(products[0]);
    }
  };

  // Submit Sale Handler
  const handleSaveSale = async () => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select a customer');
      setStep(1);
      return;
    }
    if (cart.length === 0) {
      setError('Please select at least one product');
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSale({
        customerId: selectedCustomerId,
        subtotal,
        discountAmount: discountVal,
        taxAmount: taxVal,
        totalAmount: grandTotal,
        amountPaid: paidVal,
        paymentStatus: paidVal >= grandTotal ? 'paid' : paidVal > 0 ? 'partially_paid' : 'unpaid',
        paymentMethod: paymentMethod,
        billImageUrl: billPhotoUrl || undefined,
        notes: notes || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      });

      // Clear draft
      localStorage.removeItem('khattabook_sale_draft');

      setSavedSaleRecord({
        ...created,
        customerName: selectedCustomer?.name || 'Customer',
        customerPhone: selectedCustomer?.phone,
        balanceOwed,
      });

      setSubmitting(false);
      setStep(5); // Success step
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to save sale');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      animation: 'modal-slide 0.25s ease'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        border: '1.5px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Wizard Header */}
        <div style={{
          padding: '1.15rem 1.5rem',
          backgroundColor: '#059669',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', lineHeight: 1.1 }}>
                New Sale Wizard
              </h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.1rem' }}>
                Step {step} of 4 • {step === 1 ? 'Select Customer' : step === 2 ? 'Select Products' : step === 3 ? 'Bill & Payment' : step === 4 ? 'Notes & Photo' : 'Complete'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.3rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Step Progress Bar */}
        {step < 5 && (
          <div style={{ display: 'flex', height: '4px', backgroundColor: '#E2E8F0' }}>
            <div style={{ width: `${(step / 4) * 100}%`, backgroundColor: '#059669', transition: 'width 300ms ease' }} />
          </div>
        )}

        {/* Modal Content Scrollable Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.65rem 1rem', borderRadius: '12px', fontSize: '0.825rem', fontWeight: '700' }}>
              {error}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: SELECT CUSTOMER                                       */}
          {/* ------------------------------------------------------------- */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>
                  1. Select Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  style={{ border: 'none', background: 'none', color: '#059669', fontWeight: '800', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <UserPlus size={16} /> + Add New Customer
                </button>
              </div>

              {/* Search Field */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search existing customer by Name, Mobile, Village..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '14px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Customer List Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '280px', overflowY: 'auto' }}>
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomerId === customer.id;

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #059669' : '1.5px solid #E2E8F0',
                        backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.925rem', fontWeight: '800', color: '#0F172A' }}>
                          {customer.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {customer.village ? `${customer.village} • ` : ''} {customer.phone || 'No Mobile'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Udhaar</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: customer.currentBalance > 0 ? '#EF4444' : '#10B981' }}>
                          ₹{customer.currentBalance}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: SELECT PRODUCTS FROM INVENTORY                        */}
          {/* ------------------------------------------------------------- */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>
                  2. Choose Products ({cart.length} items added)
                </label>
                <button
                  type="button"
                  onClick={handleBarcodeLookup}
                  style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.775rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Barcode size={15} /> Barcode Scan
                </button>
              </div>

              {/* Search Product */}
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              />

              {/* Product Catalog Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
                {filteredProducts.map((p) => {
                  const cartItem = cart.find((i) => i.productId === p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '14px',
                        border: cartItem ? '2px solid #059669' : '1.5px solid #E2E8F0',
                        backgroundColor: cartItem ? '#ECFDF5' : '#F8FAFC',
                        cursor: 'pointer'
                      }}
                    >
                      <h5 style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </h5>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#059669' }}>₹{p.price}</span>
                        {cartItem && <span style={{ backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>{cartItem.quantity}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Line Items */}
              {cart.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569' }}>Selected Items:</span>
                  {cart.map((item) => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '0.6rem 0.85rem', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0F172A' }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button type="button" onClick={() => handleUpdateQty(item.productId, -1)} style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer' }}>-</button>
                        <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateQty(item.productId, 1)} style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer' }}>+</button>
                        <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#059669', minWidth: '60px', textAlign: 'right' }}>₹{item.quantity * item.unitPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: BILL SUMMARY & PAYMENT TYPE                           */}
          {/* ------------------------------------------------------------- */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>
                3. Bill Summary & Payment Mode
              </label>

              {/* Bill Calculations Card */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>₹{subtotal}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>Discount (₹)</label>
                    <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>Tax (₹)</label>
                    <input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontWeight: '700' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', fontSize: '1.1rem', fontWeight: '800' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#0F172A' }}>₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.4rem', display: 'block' }}>
                  Choose Payment Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'credit', label: 'Udhaar (Credit)' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'upi', label: 'UPI / GPay' },
                    { id: 'card', label: 'Card' },
                    { id: 'mixed', label: 'Mixed Pay' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '12px',
                        border: paymentMethod === m.id ? '2px solid #059669' : '1.5px solid #CBD5E1',
                        backgroundColor: paymentMethod === m.id ? '#ECFDF5' : '#FFFFFF',
                        color: paymentMethod === m.id ? '#047857' : '#475569',
                        fontWeight: '800',
                        fontSize: '0.775rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Cash Now Field */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                  Amount Paid Cash/UPI Now (₹)
                </label>
                <input
                  type="number"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '1rem', fontWeight: '800' }}
                />
              </div>

              <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem 1rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#991B1B' }}>Remaining Balance (Udhaar):</span>
                <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#EF4444' }}>₹{balanceOwed}</span>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: NOTES & ATTACH PHOTO                                  */}
          {/* ------------------------------------------------------------- */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A' }}>
                4. Add Bill Notes & Photos (Optional)
              </label>

              {/* Preset Note Chips */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['Home delivery', 'Paid tomorrow', 'Festival offer'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setNotes((prev) => (prev ? `${prev}, ${chip}` : chip))}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Write custom bill notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontSize: '0.85rem' }}
              />

              <ImageUploader
                value={billPhotoUrl}
                onChange={(val) => setBillPhotoUrl(val)}
                variant="logo"
                label="Physical Bill / Product Photo Attachment"
              />

              <div
                onClick={() => setAutoSendWhatsApp(!autoSendWhatsApp)}
                style={{ backgroundColor: '#ECFDF5', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <input type="checkbox" checked={autoSendWhatsApp} onChange={(e) => setAutoSendWhatsApp(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#059669' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857' }}>Auto-send WhatsApp receipt to customer on save</span>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 5: SUCCESS CONFIRMATION SCREEN                           */}
          {/* ------------------------------------------------------------- */}
          {step === 5 && savedSaleRecord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={40} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A' }}>
                  Sale Saved Successfully! 🎉
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Invoice #{savedSaleRecord.invoiceNo} added to Bahi Khatta
                </p>
              </div>

              {/* Summary Card */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '18px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', border: '1px solid #E2E8F0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Customer:</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>{savedSaleRecord.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Total Amount:</span>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>₹{savedSaleRecord.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B' }}>Paid Now:</span>
                  <span style={{ fontWeight: '800', color: '#10B981' }}>₹{savedSaleRecord.amountPaid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem', fontSize: '1rem', fontWeight: '800' }}>
                  <span style={{ color: '#EF4444' }}>Outstanding Debt:</span>
                  <span style={{ color: '#EF4444' }}>₹{savedSaleRecord.balanceOwed}</span>
                </div>
              </div>

              {/* Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button onClick={() => window.print()} style={{ padding: '0.75rem', borderRadius: '14px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: '800', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <Printer size={16} /> Print Invoice
                </button>
                <button onClick={() => window.print()} style={{ padding: '0.75rem', borderRadius: '14px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: '800', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <FileText size={16} /> Download PDF
                </button>
              </div>

              {savedSaleRecord.customerPhone && (
                <a
                  href={`https://wa.me/91${savedSaleRecord.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${savedSaleRecord.customerName}, bill #${savedSaleRecord.invoiceNo} of ₹${savedSaleRecord.totalAmount} recorded. Outstanding balance: ₹${savedSaleRecord.balanceOwed}. Thank you!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '0.75rem', borderRadius: '14px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none' }}
                >
                  <Send size={16} /> Share on WhatsApp
                </a>
              )}
            </div>
          )}

        </div>

        {/* Sticky Wizard Footer Bar */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 1 && step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '48px' }}
            >
              <span>Next</span> <ArrowRight size={16} />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveSale}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.925rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '48px' }}
            >
              <span>{submitting ? 'Saving...' : '✔ Save Sale & Add to Khatta'}</span>
            </button>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', gap: '0.65rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCart([]);
                  setSelectedCustomerId('');
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', minHeight: '48px' }}
              >
                + Create Another Sale
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', minHeight: '48px' }}
              >
                🏠 Back to Dashboard
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => refetchCustomers()}
      />
    </div>
  );
};
