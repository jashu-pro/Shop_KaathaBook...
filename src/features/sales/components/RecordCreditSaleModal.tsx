/* features/sales/components/RecordCreditSaleModal.tsx */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Send, 
  Check, 
  Search, 
  UserPlus, 
  Barcode, 
  Mic, 
  Printer, 
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { AddCustomerModal } from '../../customers/components/AddCustomerModal';
import { useTheme } from '../../../providers/ThemeProvider';


interface LineItem {
  id: string;
  productId?: string;
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
  const { customers, refetch: refetchCustomers } = useCustomers();
  const { products, addProduct } = useInventory();
  const { createSale } = useSales();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const themeStyles = {
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#E2E8F0',
    headerBg: isDark ? '#1E293B' : '#FFFFFF',
    headerBorder: isDark ? '#334155' : '#F1F5F9',
    title: isDark ? '#F8FAFC' : '#0F172A',
    subtitle: isDark ? '#94A3B8' : '#64748B',
    sectionTitle: isDark ? '#F8FAFC' : '#0F172A',
    label: isDark ? '#CBD5E1' : '#475569',
    cardBg: isDark ? '#0F172A' : '#F8FAFC',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    inputBg: isDark ? '#0F172A' : '#FFFFFF',
    inputBorder: isDark ? '#334155' : '#CBD5E1',
    inputText: isDark ? '#F8FAFC' : '#0F172A',
    placeholder: isDark ? '#64748B' : '#94A3B8',
    stepperBtnBg: isDark ? '#334155' : '#FFFFFF',
    stepperBtnBorder: isDark ? '#475569' : '#CBD5E1',
    stepperBtnText: isDark ? '#F8FAFC' : '#0F172A',
    summaryBg: isDark ? '#0F172A' : '#F8FAFC',
    summaryBorder: isDark ? '#334155' : '#F1F5F9',
    divider: isDark ? '#334155' : '#E2E8F0',
    chipBg: isDark ? '#1E293B' : '#F8FAFC',
    chipBorder: isDark ? '#334155' : '#CBD5E1',
    chipText: isDark ? '#CBD5E1' : '#475569',
    methodBg: isDark ? '#0F172A' : '#FFFFFF',
    methodBorder: isDark ? '#334155' : '#CBD5E1',
    methodText: isDark ? '#CBD5E1' : '#475569',
    dropdownBg: isDark ? '#1E293B' : '#FFFFFF',
    dropdownBorder: isDark ? '#334155' : '#E2E8F0',
    dropdownItemBorder: isDark ? '#334155' : '#F1F5F9',
  };

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);

  // Sale Type: 'credit' | 'full'
  const [saleType, setSaleType] = useState<'credit' | 'full'>('credit');

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', name: 'General Item', quantity: 1, price: 500 }
  ]);
  // Running Total Fields
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [taxAmount, setTaxAmount] = useState<string>('0');
  const [paidCashNow, setPaidCashNow] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'phonepe' | 'gpay' | 'paytm' | 'bank'>('cash');

  // Notes & Multi-Image Photos (Step 47-49)
  const [notes, setNotes] = useState<string>('');
  const [billPhotos, setBillPhotos] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setBillPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setBillPhotos((prev) => prev.filter((_, i) => i !== index));
  };


  // Submission & Success Confirmation State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessRecord, setSavedSuccessRecord] = useState<any | null>(null);

  // Sync initial customer ID
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [initialCustomerId, customers]);

  // Selected Customer Details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered Customer Search Suggestions
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 4);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  }, [lineItems]);

  const discountVal = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const taxVal = Math.max(0, Number(taxAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal + taxVal);

  const actualPaid = saleType === 'full' ? grandTotal : Math.max(0, Number(paidCashNow) || 0);
  const balanceOwed = Math.max(0, grandTotal - actualPaid);

  if (!isOpen) return null;

  // Line Item Handlers
  const handleAddLineItem = (product?: any) => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        productId: product?.id,
        name: product ? product.name : 'General Item',
        quantity: 1,
        price: product ? product.price : 0,
      }
    ]);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setLineItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as LineItem[]
    );
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

  // Submit Sale Handler
  const handleSaveSale = async () => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select or add a customer');
      return;
    }

    const validItems = lineItems.filter((i) => i.name.trim() !== '');
    if (validItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const saleItemsPayload = [];
      for (const item of validItems) {
        let prodId = item.productId;
        const matched = products.find(
          (p) => (prodId && p.id === prodId) || p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );

        if (matched) {
          prodId = matched.id;
        } else {
          try {
            const newProd = await addProduct({
              name: item.name.trim(),
              price: Number(item.price) || 0,
              costPrice: 0,
              stockQty: 1000,
              unit: 'piece',
            });
            prodId = newProd.id;
          } catch {
            prodId = item.productId || item.id;
          }
        }

        saleItemsPayload.push({
          productId: prodId,
          name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.price) || 0,
          totalPrice: (Number(item.quantity) || 1) * (Number(item.price) || 0),
        });
      }

      const created = await createSale({
        customerId: selectedCustomerId,
        subtotal,
        discountAmount: discountVal,
        taxAmount: taxVal,
        totalAmount: grandTotal,
        amountPaid: actualPaid,
        paymentStatus: actualPaid >= grandTotal ? 'paid' : actualPaid > 0 ? 'partially_paid' : 'unpaid',
        paymentMethod: paymentMethod,
        billImageUrl: billPhotos[0] || undefined,
        billImageUrls: billPhotos,
        notes: notes || undefined,
        items: saleItemsPayload,
      });

      if (sendWhatsApp && selectedCustomer?.phone) {
        const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
        const message = `Namaste ${selectedCustomer.name}, bill of ₹${grandTotal} (Paid: ₹${actualPaid}, Udhaar: ₹${balanceOwed}) recorded at Sri Laxmi Traders. Total Khatta Balance: ₹${(selectedCustomer.currentBalance || 0) + balanceOwed}. Thank you!`;
        window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }

      setSavedSuccessRecord({
        ...created,
        customerName: selectedCustomer?.name || 'Customer',
        customerPhone: selectedCustomer?.phone,
        balanceOwed,
      });

      setSubmitting(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to save sale');
    }
  };

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
        backgroundColor: themeStyles.modalBg,
        borderRadius: '24px',
        maxWidth: '550px',
        width: '100%',
        maxHeight: '92vh',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 40px rgba(0, 0, 0, 0.15)',
        border: '1.5px solid ' + themeStyles.modalBorder,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.15rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid ' + themeStyles.headerBorder,
          backgroundColor: themeStyles.headerBg
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} style={{ color: '#059669' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: themeStyles.title, lineHeight: 1.1 }}>
                Record Credit Sale
              </h3>
              <p style={{ fontSize: '0.8rem', color: themeStyles.subtitle, marginTop: '0.15rem' }}>
                Fast itemized billing & automatic ledger sync
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ border: 'none', background: 'none', color: themeStyles.subtitle, cursor: 'pointer', padding: '0.3rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          
          {savedSuccessRecord ? (
            /* ------------------------------------------------------------- */
            /* 11. POST-SAVE SUCCESS CONFIRMATION OVERLAY                    */
            /* ------------------------------------------------------------- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 size={40} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: themeStyles.title }}>
                  ✅ Sale Saved Successfully
                </h3>
                <p style={{ fontSize: '0.825rem', color: themeStyles.subtitle, marginTop: '0.15rem' }}>
                  Invoice #{savedSuccessRecord.invoiceNo} • Ledger & stock updated
                </p>
              </div>

              {/* Summary Card */}
              <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '18px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', border: '1px solid ' + themeStyles.cardBorder, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: themeStyles.subtitle }}>Customer:</span>
                  <span style={{ fontWeight: '800', color: themeStyles.title }}>{savedSuccessRecord.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: themeStyles.subtitle }}>Total Amount:</span>
                  <span style={{ fontWeight: '800', color: themeStyles.title }}>₹{savedSuccessRecord.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: themeStyles.subtitle }}>Paid:</span>
                  <span style={{ fontWeight: '800', color: '#10B981' }}>₹{savedSuccessRecord.amountPaid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid ' + themeStyles.divider, paddingTop: '0.5rem', fontSize: '1rem', fontWeight: '800' }}>
                  <span style={{ color: '#EF4444' }}>Outstanding Debt:</span>
                  <span style={{ color: '#EF4444' }}>₹{savedSuccessRecord.balanceOwed}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button onClick={() => window.print()} style={{ padding: '0.75rem', borderRadius: '14px', border: '1.5px solid ' + themeStyles.inputBorder, backgroundColor: themeStyles.inputBg, color: themeStyles.title, fontWeight: '800', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <Printer size={16} /> Print Invoice
                </button>
                {savedSuccessRecord.customerPhone && (
                  <a
                    href={`https://wa.me/91${savedSuccessRecord.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${savedSuccessRecord.customerName}, bill #${savedSuccessRecord.invoiceNo} recorded. Total: ₹${savedSuccessRecord.totalAmount}, Paid: ₹${savedSuccessRecord.amountPaid}, Udhaar: ₹${savedSuccessRecord.balanceOwed}. Thank you!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: '0.75rem', borderRadius: '14px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    <Send size={16} /> Share WhatsApp
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSavedSuccessRecord(null);
                    setLineItems([{ id: '1', name: 'General Item', quantity: 1, price: 500 }]);
                  }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  + Create Another Sale
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  🏠 Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.65rem 1rem', borderRadius: '12px', fontSize: '0.825rem', fontWeight: '700' }}>
                  {error}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* 1. FAST CUSTOMER SEARCH & RICH CARDS                         */}
              {/* ------------------------------------------------------------- */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: themeStyles.sectionTitle }}>
                    Select Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    style={{ border: 'none', background: 'none', color: '#059669', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <UserPlus size={15} /> + Add New Customer
                  </button>
                </div>

                {/* Selected Customer Card or Search Field */}
                {selectedCustomer && !showCustomerDropdown ? (
                  <div
                    onClick={() => setShowCustomerDropdown(true)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '16px',
                      border: '1.5px solid #059669',
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: '800', color: themeStyles.title }}>
                        🔍 {selectedCustomer.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: themeStyles.subtitle }}>
                        📞 {selectedCustomer.phone || 'No Mobile'} {selectedCustomer.village ? `• ${selectedCustomer.village}` : ''}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: themeStyles.subtitle }}>Outstanding</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: selectedCustomer.currentBalance > 0 ? '#EF4444' : '#10B981' }}>
                        ₹{selectedCustomer.currentBalance}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={16} style={{ position: 'absolute', left: '0.85rem', color: themeStyles.placeholder }} />
                      <input
                        type="text"
                        placeholder="Search Customer by Name, Mobile, Village..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(true)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 1rem 0.65rem 2.4rem',
                          borderRadius: '14px',
                          border: '1.5px solid ' + themeStyles.inputBorder,
                          backgroundColor: themeStyles.inputBg,
                          color: themeStyles.inputText,
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showCustomerDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '105%',
                        left: 0,
                        right: 0,
                        backgroundColor: themeStyles.dropdownBg,
                        borderRadius: '16px',
                        border: '1.5px solid ' + themeStyles.dropdownBorder,
                        boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 100,
                        padding: '0.4rem'
                      }}>
                        {filteredCustomers.length === 0 ? (
                          <div style={{ padding: '0.85rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: themeStyles.subtitle, display: 'block' }}>Customer not found</span>
                            <button
                              type="button"
                              onClick={() => { setShowCustomerDropdown(false); setIsAddCustomerOpen(true); }}
                              style={{ marginTop: '0.35rem', border: 'none', backgroundColor: '#ECFDF5', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.775rem', cursor: 'pointer' }}
                            >
                              + Add New Customer
                            </button>
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setShowCustomerDropdown(false);
                              }}
                              style={{
                                padding: '0.65rem 0.85rem',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                borderBottom: '1px solid ' + themeStyles.dropdownItemBorder,
                                backgroundColor: themeStyles.dropdownBg
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: '800', fontSize: '0.85rem', color: themeStyles.title, display: 'block' }}>{c.name}</span>
                                <span style={{ fontSize: '0.725rem', color: themeStyles.subtitle }}>📞 {c.phone || 'N/A'} {c.village ? `(${c.village})` : ''}</span>
                              </div>
                              <span style={{ fontWeight: '800', fontSize: '0.825rem', color: c.currentBalance > 0 ? '#EF4444' : '#10B981' }}>
                                ₹{c.currentBalance}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 7. SALE TYPE TOGGLE (CREDIT vs FULL PAYMENT)                  */}
              {/* ------------------------------------------------------------- */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: themeStyles.label, marginBottom: '0.3rem', display: 'block' }}>
                  Sale Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setSaleType('credit')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '14px',
                      border: saleType === 'credit' ? '2px solid #EF4444' : '1.5px solid ' + themeStyles.inputBorder,
                      backgroundColor: saleType === 'credit' ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2') : themeStyles.inputBg,
                      color: saleType === 'credit' ? (isDark ? '#FCA5A5' : '#B91C1C') : themeStyles.label,
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    ● Credit (Udhaar Sale)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaleType('full')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '14px',
                      border: saleType === 'full' ? '2px solid #10B981' : '1.5px solid ' + themeStyles.inputBorder,
                      backgroundColor: saleType === 'full' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') : themeStyles.inputBg,
                      color: saleType === 'full' ? (isDark ? '#6EE7B7' : '#047857') : themeStyles.label,
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    ○ Full Payment (Cash/UPI)
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 3 & 4. PRODUCT ENTRY TABLE WITH QUANTITY STEPPERS            */}
              {/* ------------------------------------------------------------- */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: themeStyles.sectionTitle }}>
                    Itemized Items List *
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handleAddLineItem()}
                      style={{ border: 'none', background: 'none', color: '#059669', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      + Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLineItem(products[0])}
                      style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: isDark ? '#34D399' : '#047857', border: '1px solid ' + (isDark ? '#059669' : '#A7F3D0'), padding: '0.2rem 0.55rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.725rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Barcode size={13} /> Scan Barcode
                    </button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {lineItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: themeStyles.cardBg, padding: '0.55rem 0.75rem', borderRadius: '14px', border: '1px solid ' + themeStyles.cardBorder }}>
                      {/* Product Name Input */}
                      <input
                        type="text"
                        list="inventory-products-list"
                        placeholder="Rice, Sugar, Oil..."
                        value={item.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          const matchedProd = products.find((p) => p.name.toLowerCase() === newName.toLowerCase());
                          setLineItems((prev) =>
                            prev.map((it) => {
                              if (it.id === item.id) {
                                return {
                                  ...it,
                                  name: newName,
                                  productId: matchedProd ? matchedProd.id : it.productId,
                                  price: matchedProd ? matchedProd.price : it.price,
                                };
                              }
                              return it;
                            })
                          );
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '0.45rem 0.65rem',
                          borderRadius: '10px',
                          border: '1.5px solid ' + themeStyles.inputBorder,
                          backgroundColor: themeStyles.inputBg,
                          color: themeStyles.inputText,
                          fontSize: '0.85rem',
                          fontWeight: '700'
                        }}
                      />

                      {/* Quantity Stepper (- / +) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            border: '1px solid ' + themeStyles.stepperBtnBorder,
                            backgroundColor: themeStyles.stepperBtnBg,
                            color: themeStyles.stepperBtnText,
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: '800', fontSize: '0.85rem', minWidth: '20px', textAlign: 'center', color: themeStyles.stepperBtnText }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            border: '1px solid ' + themeStyles.stepperBtnBorder,
                            backgroundColor: themeStyles.stepperBtnBg,
                            color: themeStyles.stepperBtnText,
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Price Input */}
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price || ''}
                        onChange={(e) => handleUpdateLineItem(item.id, 'price', Number(e.target.value))}
                        style={{
                          width: '75px',
                          padding: '0.45rem 0.5rem',
                          borderRadius: '10px',
                          border: '1.5px solid ' + themeStyles.inputBorder,
                          backgroundColor: themeStyles.inputBg,
                          color: themeStyles.inputText,
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          textAlign: 'right'
                        }}
                      />

                      {/* Line Total */}
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: isDark ? '#34D399' : '#059669', minWidth: '55px', textAlign: 'right' }}>
                        ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                      </span>

                      {/* Delete */}
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => handleRemoveLineItem(item.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.15rem' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Datalist for fast inventory auto-complete */}
                <datalist id="inventory-products-list">
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      ₹{p.price} (Stock: {p.stockQty})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 5. BEAUTIFUL RUNNING TOTAL SUMMARY CARD                       */}
              {/* ------------------------------------------------------------- */}
              <div style={{ backgroundColor: themeStyles.summaryBg, borderRadius: '18px', padding: '0.85rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', border: '1px solid ' + themeStyles.summaryBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: themeStyles.label }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: '800', color: themeStyles.title }}>₹{subtotal}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: '700', color: themeStyles.label }}>Discount (₹)</label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '10px',
                        border: '1.5px solid ' + themeStyles.inputBorder,
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: themeStyles.inputBg,
                        color: themeStyles.inputText
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: '700', color: themeStyles.label }}>Tax (₹)</label>
                    <input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '10px',
                        border: '1.5px solid ' + themeStyles.inputBorder,
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: themeStyles.inputBg,
                        color: themeStyles.inputText
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', color: themeStyles.title, borderTop: '1px solid ' + themeStyles.divider, paddingTop: '0.5rem' }}>
                  <span>Grand Total:</span>
                  <span>₹{grandTotal}</span>
                </div>

                {saleType === 'credit' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: themeStyles.label }}>Paid Cash Now (₹):</label>
                      <input
                        type="number"
                        value={paidCashNow}
                        onChange={(e) => setPaidCashNow(e.target.value)}
                        style={{
                          width: '110px',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '10px',
                          border: '1.5px solid ' + themeStyles.inputBorder,
                          fontSize: '0.875rem',
                          fontWeight: '800',
                          textAlign: 'right',
                          backgroundColor: themeStyles.inputBg,
                          color: themeStyles.inputText
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid ' + themeStyles.divider, paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '800', color: themeStyles.title }}>Remaining Udhaar Balance:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isDark ? '#F87171' : '#EF4444' }}>₹{balanceOwed}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: isDark ? '#34D399' : '#047857', fontWeight: '800', fontSize: '0.85rem' }}>
                    <span>Paid in Full (Clear):</span>
                    <span>₹{grandTotal}</span>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 6. PAYMENT METHOD SELECTORS                                    */}
              {/* ------------------------------------------------------------- */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: themeStyles.label, marginBottom: '0.3rem', display: 'block' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                  {[
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'phonepe', label: '💜 PhonePe' },
                    { id: 'gpay', label: '🔵 GPay' },
                    { id: 'paytm', label: '💙 Paytm' },
                    { id: 'bank', label: '🏛️ Bank' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      style={{
                        padding: '0.5rem 0.2rem',
                        borderRadius: '12px',
                        border: paymentMethod === m.id ? '2px solid #059669' : '1.5px solid ' + themeStyles.methodBorder,
                        backgroundColor: paymentMethod === m.id ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5') : themeStyles.methodBg,
                        color: paymentMethod === m.id ? (isDark ? '#6EE7B7' : '#047857') : themeStyles.methodText,
                        fontWeight: '800',
                        fontSize: '0.725rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 8 & 9. CAMERA SECTION & NOTES WITH PRESET CHIPS               */}
              {/* ------------------------------------------------------------- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: themeStyles.label, marginBottom: '0.25rem', display: 'block' }}>
                    Notes (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {['Delivered tomorrow', 'Festival Discount', 'Home Delivery'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setNotes((prev) => (prev ? `${prev}, ${chip}` : chip))}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          border: '1px solid ' + themeStyles.chipBorder,
                          backgroundColor: themeStyles.chipBg,
                          color: themeStyles.chipText,
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Write custom notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '12px',
                      border: '1.5px solid ' + themeStyles.inputBorder,
                      backgroundColor: themeStyles.inputBg,
                      color: themeStyles.inputText,
                      fontSize: '0.825rem'
                    }}
                  />
                </div>

                {/* Multi-Image Attachments Studio (Step 47-49) */}
                <div style={{ backgroundColor: themeStyles.cardBg, borderRadius: '16px', padding: '0.85rem', border: '1px solid ' + themeStyles.cardBorder }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: themeStyles.sectionTitle, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Camera size={14} style={{ color: '#059669' }} />
                      Bill & Receipt Attachments ({billPhotos.length})
                    </label>
                    <span style={{ fontSize: '0.7rem', color: themeStyles.subtitle }}>Multiple images supported</span>
                  </div>


                  {/* Hidden inputs for Camera and Gallery */}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleAddPhotos}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleAddPhotos}
                  />

                  {/* Action buttons: Camera vs Gallery */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: billPhotos.length > 0 ? '0.75rem' : 0 }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        padding: '0.55rem',
                        borderRadius: '12px',
                        border: '1.5px solid #10B981',
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        fontWeight: '700',
                        fontSize: '0.775rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={15} /> 📸 Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      style={{
                        padding: '0.55rem',
                        borderRadius: '12px',
                        border: '1.5px solid ' + themeStyles.inputBorder,
                        backgroundColor: themeStyles.inputBg,
                        color: themeStyles.label,
                        fontWeight: '700',
                        fontSize: '0.775rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={15} /> 🖼️ Gallery
                    </button>
                  </div>

                  {/* Thumbnails Gallery Tray */}
                  {billPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {billPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '64px',
                            height: '64px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                          }}
                        >
                          <img
                            src={photo}
                            alt={`Bill Attachment ${idx + 1}`}
                            onClick={() => setLightboxImage(photo)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            title="View Larger"
                            onClick={() => setLightboxImage(photo)}
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              color: '#FFFFFF',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <ZoomIn size={11} />
                          </button>
                          <button
                            type="button"
                            title="Remove photo"
                            onClick={() => handleRemovePhoto(idx)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#EF4444',
                              color: '#FFFFFF',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lightbox Modal */}
                {lightboxImage && (
                  <div
                    onClick={() => setLightboxImage(null)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.85)',
                      zIndex: 1100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={lightboxImage}
                        alt="Enlarged Attachment"
                        style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', objectFit: 'contain', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '-12px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          border: 'none',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 13. Auto WhatsApp Toggle (ON / OFF) */}
                <div
                  onClick={() => setSendWhatsApp(!sendWhatsApp)}
                  style={{
                    backgroundColor: sendWhatsApp ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : themeStyles.cardBg,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '14px',
                    border: `1.5px solid ${sendWhatsApp ? '#059669' : themeStyles.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={15} style={{ color: sendWhatsApp ? '#059669' : themeStyles.subtitle }} />
                    <span style={{ fontSize: '0.775rem', fontWeight: '800', color: sendWhatsApp ? (isDark ? '#34D399' : '#047857') : themeStyles.label }}>
                      Send Receipt to WhatsApp
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: sendWhatsApp ? '#059669' : themeStyles.subtitle }}>
                    {sendWhatsApp ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 10. BETTER ACTIONABLE SAVE BUTTON                             */}
              {/* ------------------------------------------------------------- */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveSale}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.15rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.25)',
                  minHeight: '52px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={18} />
                  <span>{submitting ? 'Saving...' : '✔ Save Sale'}</span>
                </div>
                <span style={{ fontSize: '0.675rem', opacity: 0.85, fontWeight: '600' }}>
                  Create Sale • Update Ledger • Reduce Stock • Generate Receipt
                </span>
              </button>

              {/* 15. Voice Entry AI Assistant Floating Button */}
              <div style={{ textAlign: 'center', marginTop: '-0.2rem' }}>
                <button
                  type="button"
                  onClick={() => alert('AI Voice Entry: Speak "Ramesh bought two shirts for ₹4500 and paid ₹2000" to auto-fill.')}
                  style={{ border: 'none', background: 'none', color: '#8B5CF6', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Mic size={14} /> 🎤 Speak Sale (AI Voice Assistant)
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Mini Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => refetchCustomers()}
      />
    </div>
  );
};
