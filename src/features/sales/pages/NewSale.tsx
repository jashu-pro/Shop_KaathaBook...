/* features/sales/pages/NewSale.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, 
  UserPlus, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { AddCustomerModal } from '../../customers/components/AddCustomerModal';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { CartItem } from '../types';

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { customers, refetch: refetchCustomers } = useCustomers();
  const { products, categories } = useInventory();
  const { createSale } = useSales();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Discount, Tax, Notes, Bill Image, Amount Paid
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [amountPaid, setAmountPaid] = useState<string>('0'); // Default 0 for Udhaar sale
  const [notes, setNotes] = useState('');
  const [billImageUrl, setBillImageUrl] = useState<string | null>(null);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial customer ID if provided via query param
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q));

      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Helpers
  const addToCart = (product: any) => {
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
          unitPrice: product.price,
          quantity: 1,
          unit: product.unit || 'piece',
          mrp: product.mrp,
          stockQty: product.stockQty,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Subtotal, Discount, Tax, Grand Total calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    const d = Number(discountAmount) || 0;
    return Math.min(subtotal, Math.max(0, d));
  }, [subtotal, discountAmount]);

  const taxableAmount = Math.max(0, subtotal - discountVal);

  const taxVal = useMemo(() => {
    const rate = Number(taxRate) || 0;
    return Math.round((taxableAmount * rate) / 100);
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.max(0, taxableAmount + taxVal);
  const paidVal = Number(amountPaid) || 0;
  const dueUdhaarAmount = Math.max(0, grandTotal - paidVal);

  const handleSubmitSale = async (paymentType: 'credit' | 'full_paid') => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select or add a customer to record credit (Udhaar) sale');
      return;
    }
    if (cart.length === 0) {
      setError('Please add at least one product to the bill cart');
      return;
    }

    const actualPaid = paymentType === 'full_paid' ? grandTotal : paidVal;

    setSubmitting(true);
    try {
      await createSale({
        customerId: selectedCustomerId,
        subtotal,
        discountAmount: discountVal,
        taxAmount: taxVal,
        totalAmount: grandTotal,
        amountPaid: actualPaid,
        paymentStatus: actualPaid >= grandTotal ? 'paid' : actualPaid > 0 ? 'partially_paid' : 'unpaid',
        paymentMethod: paymentType === 'full_paid' ? 'cash' : 'credit',
        billImageUrl: billImageUrl || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          unit: item.unit,
        })),
      });

      setSubmitting(false);
      navigate('/customers');
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to complete credit sale');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: CUSTOMER SELECTOR & QUICK ADD                         */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              New Credit Sale (POS)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginTop: '0.1rem' }}>
              Select customer and add items to issue digital Udhaar bill
            </p>
          </div>
        </div>

        {/* Customer Selector & Quick Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px' }}>
            <select
              className="input-field"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                borderRadius: '14px',
                padding: '0.65rem 1rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontWeight: '700',
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <option value="">-- Select Udhaar Customer * --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.village ? `(${c.village})` : ''} - ₹{c.currentBalance} Udhaar
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddCustomerOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1rem', fontSize: '0.825rem', fontWeight: '700' }}
          >
            <UserPlus size={16} />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Selected Customer Details Banner */}
      {selectedCustomer && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '0.75rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: '#10B981', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '0.9rem'
            }}>
              {selectedCustomer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                {selectedCustomer.name}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Phone: {selectedCustomer.phone || 'No phone'} | Village: {selectedCustomer.village || 'N/A'}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              Current Pending Balance
            </span>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: selectedCustomer.currentBalance > 0 ? '#EF4444' : '#10B981' }}>
              ₹{selectedCustomer.currentBalance} {selectedCustomer.currentBalance > 0 ? 'Udhaar' : 'Clear'}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2-COLUMN MAIN CONTENT: PRODUCT CATALOG & BILL CART             */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* LEFT COLUMN: PRODUCT CATALOG & SEARCH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Search & Category Filter */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '18px',
            padding: '0.85rem 1rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search products by name, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem', padding: '0.6rem 0.85rem 0.6rem 2.4rem', fontSize: '0.85rem', borderRadius: '12px' }}
              />
            </div>

            {/* Category Chips */}
            {categories.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
                    backgroundColor: selectedCategory === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  All Items
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
                      backgroundColor: selectedCategory === c.id ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: selectedCategory === c.id ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.65rem', maxHeight: '480px', overflowY: 'auto' }}>
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.productId === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '0.75rem',
                    border: inCart ? '2px solid #10B981' : '1px solid var(--border-color)',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                      {product.name}
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Stock: {product.stockQty} {product.unit}s
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10B981' }}>
                      ₹{product.price}
                    </div>

                    <button
                      type="button"
                      style={{
                        backgroundColor: inCart ? '#10B981' : 'var(--primary-light)',
                        color: inCart ? '#FFFFFF' : 'var(--primary)',
                        borderRadius: '10px',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none'
                      }}
                    >
                      {inCart ? <CheckCircle2 size={15} /> : <Plus size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: BILL CART & CHECKOUT DRAWER */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                  Bill Cart ({cart.length})
                </h3>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: '700', cursor: 'pointer' }}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Your cart is empty</p>
                <span style={{ fontSize: '0.75rem' }}>Tap items on the left catalog to add to bill</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '200px', overflowY: 'auto' }}>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)', display: 'block' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        ₹{item.unitPrice} / {item.unit}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, -1)}
                        style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: '800', width: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '60px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '0.4rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Adjustments: Discount, Tax, Paid Now, Notes, Bill Image */}
          {cart.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              
              {/* Discount, Tax & Paid Now Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    style={{ padding: '0.45rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    GST Tax Rate
                  </label>
                  <select
                    className="input-field"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    style={{ padding: '0.45rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="0">0%</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    style={{ padding: '0.45rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* Physical Bill Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Attach Paper Bill Photo (Optional)
                </label>
                <ImageUploader
                  value={billImageUrl}
                  onChange={(val) => setBillImageUrl(val)}
                  variant="logo"
                  label="Paper Bill"
                />
              </div>

              {/* Notes */}
              <div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add bill notes / invoice memo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', fontSize: '0.8rem' }}
                />
              </div>

              {/* Totals Breakdown */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>

                {discountVal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>Discount:</span>
                    <span>- ₹{discountVal}</span>
                  </div>
                )}

                {taxVal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Tax ({taxRate}%):</span>
                    <span>+ ₹{taxVal}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#059669' }}>₹{grandTotal}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '800', color: dueUdhaarAmount > 0 ? '#EF4444' : '#10B981' }}>
                  <span>Udhaar Debt Added:</span>
                  <span>₹{dueUdhaarAmount}</span>
                </div>
              </div>

              {error && <div className="input-error" style={{ fontSize: '0.775rem' }}>{error}</div>}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitSale('credit')}
                  className="btn btn-primary"
                  style={{ borderRadius: '14px', padding: '0.75rem', fontWeight: '800', fontSize: '0.875rem', backgroundColor: '#059669' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Saving...' : `Record Udhaar Sale (₹${dueUdhaarAmount} Debt)`}</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitSale('full_paid')}
                  className="btn btn-secondary"
                  style={{ borderRadius: '14px', padding: '0.65rem', fontWeight: '700', fontSize: '0.8rem' }}
                >
                  <CreditCard size={15} />
                  <span>Record Full Paid Sale (₹{grandTotal})</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Quick Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={(created) => {
          refetchCustomers();
          setSelectedCustomerId(created.id);
        }}
      />

    </div>
  );
};

export default NewSale;
