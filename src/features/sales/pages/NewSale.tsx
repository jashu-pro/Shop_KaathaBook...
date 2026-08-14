/* features/sales/pages/NewSale.tsx */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  Printer, 
  Share2, 
  ArrowLeft, 
  Package, 
  AlertCircle 
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useSales } from '../hooks/useSales';
import { CustomerSearchSelect } from '../../customers/components/CustomerSearchSelect';
import { AddCustomerModal } from '../../customers/components/AddCustomerModal';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { Product } from '../../inventory/types';
import type { CartItem } from '../types';

export const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const { shop } = useAuthStore();
  const { customers, refetch: refetchCustomers } = useCustomers();
  const { products, categories, refetch: refetchInventory } = useInventory();
  const { createSale, refetch: refetchSales } = useSales();

  // Customer Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Product Search & Barcode
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount & Tax
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<number>(0);

  // Payment Breakdown
  const [paymentModeType, setPaymentModeType] = useState<'cash' | 'credit' | 'partial'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [billImageUrl, setBillImageUrl] = useState<string | null>(null);

  // Submission & Post-Sale Success Screen
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccessSale, setSavedSuccessSale] = useState<any | null>(null);

  // Sync initial customer from URL if provided
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c && c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Product Catalog Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p) return false;
      const q = productSearchQuery.toLowerCase().trim();
      const pCat = p.categoryName || '';
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        pCat.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || pCat === selectedCategory || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearchQuery, selectedCategory]);

  // Handle Quick Barcode Scan/Input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) || 
             (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );

    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
    } else {
      setErrorMessage(`No product found with barcode/SKU "${code}"`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Cart Operations
  const handleAddToCart = (product: Product) => {
    const availableStock = Number(product.stockQty || 0);
    if (availableStock <= 0) {
      setErrorMessage(`"${product.name}" is currently Out of Stock.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= availableStock) {
          setErrorMessage(`Cannot exceed available stock of ${availableStock} ${product.unit || 'units'}.`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price || 0),
          quantity: 1,
          unit: product.unit || 'pcs',
          mrp: product.mrp,
          stockQty: availableStock
        }
      ];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const maxStock = item.stockQty ?? 99999;
            if (newQty > maxStock) {
              setErrorMessage(`Stock limit reached (${maxStock} ${item.unit}).`);
              setTimeout(() => setErrorMessage(null), 3000);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleManualQtyChange = (productId: string, qtyStr: string) => {
    const parsed = parseInt(qtyStr, 10);
    if (isNaN(parsed) || parsed < 0) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            if (parsed === 0) return null;
            const maxStock = item.stockQty ?? 99999;
            const clamped = Math.min(parsed, maxStock);
            return { ...item, quantity: clamped };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const rawVal = Math.max(0, Number(discountValue) || 0);
    if (discountType === 'percent') {
      const pct = Math.min(100, rawVal);
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, rawVal);
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    return Math.round((taxableAmount * taxRate) / 100);
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Compute Amount Paid and Balance Due (Udhaar)
  const amountPaid = useMemo(() => {
    if (paymentModeType === 'cash') {
      return grandTotal;
    }
    if (paymentModeType === 'credit') {
      return 0;
    }
    // Partial payment mode
    const custom = Math.max(0, Number(amountPaidInput) || 0);
    return Math.min(grandTotal, custom);
  }, [paymentModeType, grandTotal, amountPaidInput]);

  const balanceDue = Math.max(0, grandTotal - amountPaid);

  // Quick Payment Mode Switcher
  const handleSetPaymentMode = (mode: 'cash' | 'credit' | 'partial') => {
    setPaymentModeType(mode);
    if (mode === 'partial') {
      setAmountPaidInput(Math.round(grandTotal / 2).toString());
    }
  };

  // Submit Sale Handler with Atomic Execution & Duplicate Guard
  const handleConfirmSale = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Please add at least 1 product to create a sale.');
      return;
    }

    if (paymentModeType !== 'cash' && !selectedCustomerId) {
      setErrorMessage('Please select a customer for Credit / Udhaar sales.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const isPaidFull = amountPaid >= grandTotal;
      const isPartial = amountPaid > 0 && amountPaid < grandTotal;
      const status: 'paid' | 'partially_paid' | 'unpaid' = isPaidFull ? 'paid' : isPartial ? 'partially_paid' : 'unpaid';

      const saleData = await createSale({
        customerId: selectedCustomerId || undefined,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount: grandTotal,
        amountPaid,
        paymentStatus: status,
        paymentMethod: amountPaid > 0 ? paymentMethod : 'credit',
        billImageUrl: billImageUrl || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          unit: item.unit,
          taxRate: taxRate,
        }))
      });

      // Refresh relevant data stores
      await Promise.all([
        refetchSales(),
        refetchCustomers(),
        refetchInventory()
      ]);

      setSubmitting(false);
      setSavedSuccessSale(saleData);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Failed to record sale transaction');
    }
  };

  // Post-Sale WhatsApp Share Trigger
  const handleSendWhatsAppReceipt = () => {
    if (!savedSuccessSale) return;
    const phone = savedSuccessSale.customerPhone || selectedCustomer?.phone;
    if (!phone) {
      alert('No customer phone number available for WhatsApp.');
      return;
    }

    const shopNameStr = shop?.name || 'Shop KhattaBook';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const due = Math.max(0, (savedSuccessSale.totalAmount || 0) - (savedSuccessSale.amountPaid || 0));

    const msg = `🙏 *${shopNameStr.toUpperCase()}*

🧾 *SALE RECEIPT & BILL*
--------------------------------
Invoice: *${savedSuccessSale.invoiceNo}*
Date: ${new Date(savedSuccessSale.saleDate || savedSuccessSale.createdAt).toLocaleDateString('en-IN')}

Hello *${savedSuccessSale.customerName || selectedCustomer?.name || 'Customer'}*,
Your purchase summary:

🛍️ *Total Amount:* ₹${savedSuccessSale.totalAmount}
💵 *Amount Paid:* ₹${savedSuccessSale.amountPaid}
${due > 0 ? `🔴 *Remaining Udhaar Due:* ₹${due}` : `🟢 *Status:* Fully Paid`}

Thank you for shopping with us! 🙏`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleStartNextSale = () => {
    setSavedSuccessSale(null);
    setCart([]);
    setDiscountValue('0');
    setTaxRate(0);
    setAmountPaidInput('');
    setNotes('');
    setBillImageUrl(null);
    setPaymentModeType('cash');
    setProductSearchQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minHeight: 'calc(100vh - 120px)', animation: 'modal-slide 0.25s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: Header & Fast Barcode / Customer Quick Actions       */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              Shop Counter POS • New Sale
            </h2>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Fast billing counter with live inventory stock deduction & Udhaar ledger
            </p>
          </div>
        </div>

        {/* Quick Barcode Input Field */}
        <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
              <Barcode size={18} />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              className="input-field"
              placeholder="Scan/Type Barcode (Enter)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              style={{
                borderRadius: '14px',
                paddingLeft: '2.4rem',
                paddingRight: '0.75rem',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                width: '230px'
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: '12px', padding: '0.55rem 0.85rem', fontSize: '0.8rem', fontWeight: '800' }}
          >
            Add
          </button>
        </form>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
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
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN POS COUNTER LAYOUT                            */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        
        {/* ============================================================= */}
        {/* LEFT COLUMN: PRODUCT CATALOG & INVENTORY SELECTION            */}
        {/* ============================================================= */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minHeight: '620px'
        }}>
          
          {/* Search Products Bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="Search product by name, SKU, barcode..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              style={{
                borderRadius: '16px',
                paddingLeft: '2.5rem',
                paddingTop: '0.7rem',
                paddingBottom: '0.7rem',
                fontSize: '0.875rem',
                fontWeight: '700'
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '12px',
                border: selectedCategory === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: selectedCategory === 'all' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-body)',
                fontSize: '0.775rem',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '12px',
                  border: selectedCategory === cat.name ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedCategory === cat.name ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  color: selectedCategory === cat.name ? 'var(--primary)' : 'var(--text-body)',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
            overflowY: 'auto',
            maxHeight: '520px',
            paddingRight: '0.2rem'
          }}>
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No products found</p>
                <p style={{ fontSize: '0.775rem' }}>Try searching another keyword or add products in Inventory</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const stock = Number(prod.stockQty || 0);
                const isOut = stock <= 0;
                const isLow = stock > 0 && stock <= 5;
                const cartQty = cart.find((i) => i.productId === prod.id)?.quantity || 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOut && handleAddToCart(prod)}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '18px',
                      border: cartQty > 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: isOut ? 'not-allowed' : 'pointer',
                      opacity: isOut ? 0.6 : 1,
                      transition: 'all 150ms ease',
                      position: 'relative'
                    }}
                  >
                    {/* Cart Quantity Badge */}
                    {cartQty > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'var(--primary)',
                        color: '#FFFFFF',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px var(--primary-glow)'
                      }}>
                        {cartQty}
                      </div>
                    )}

                    <div>
                      {prod.imageUrl && (
                        <div style={{ height: '70px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                          <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.25 }}>
                        {prod.name}
                      </h4>
                      <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {prod.categoryName || 'General'}
                      </p>
                    </div>

                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--primary)' }}>
                          ₹{prod.price}
                        </span>
                        {prod.mrp && prod.mrp > prod.price && (
                          <span style={{ fontSize: '0.725rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                            ₹{prod.mrp}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: isOut ? '#DC2626' : isLow ? '#D97706' : '#16A34A'
                        }}>
                          {isOut ? 'Out of Stock' : `${stock} ${prod.unit || 'pcs'} left`}
                        </span>

                        {!isOut && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                              borderRadius: '8px',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.725rem',
                              fontWeight: '800'
                            }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* RIGHT COLUMN: CUSTOMER, CART, DISCOUNT, PAYMENT & CONFIRM     */}
        {/* ============================================================= */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          
          {/* 1. Customer Selection Card */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '18px',
            padding: '1rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Customer Information
              </span>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <UserPlus size={14} />
                <span>+ New Customer</span>
              </button>
            </div>

            <CustomerSearchSelect
              label=""
              value={selectedCustomerId}
              onChange={(id) => setSelectedCustomerId(id)}
              customers={customers}
              placeholder="Search customer by name, phone, or village..."
            />
          </div>

          {/* 2. Shopping Cart Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                  Cart Items ({cart.length})
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1.5px dashed var(--border-color)',
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <p style={{ fontWeight: '700', fontSize: '0.85rem' }}>Cart is empty</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>Click products from catalog on left or scan barcode</p>
              </div>
            ) : (
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                overflow: 'hidden',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-heading)' }}>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ fontWeight: '800' }}>{item.name}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>₹{item.unitPrice} / {item.unit}</div>
                        </td>

                        {/* Quantity Controls */}
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.2rem' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, -1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleManualQtyChange(item.productId, e.target.value)}
                              style={{ width: '32px', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: '800', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: '900', color: 'var(--text-heading)' }}>
                          ₹{item.unitPrice * item.quantity}
                        </td>

                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Discount & Tax Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
            {/* Discount */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                Discount
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    style={{
                      padding: '0.4rem 0.6rem',
                      border: 'none',
                      backgroundColor: discountType === 'fixed' ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: discountType === 'fixed' ? '#FFFFFF' : 'var(--text-body)',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    style={{
                      padding: '0.4rem 0.6rem',
                      border: 'none',
                      backgroundColor: discountType === 'percent' ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: discountType === 'percent' ? '#FFFFFF' : 'var(--text-body)',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  className="input-field"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0"
                  style={{ borderRadius: '10px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontWeight: '800' }}
                />
              </div>
            </div>

            {/* GST / Tax Rate */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                GST / Tax
              </label>
              <select
                className="input-field"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                style={{ borderRadius: '10px', padding: '0.4rem 0.6rem', fontSize: '0.825rem', fontWeight: '800', backgroundColor: 'var(--bg-card)' }}
              >
                <option value={0}>0% (No Tax)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          {/* 4. Payment Settlement Mode & Amount */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '18px',
            padding: '1rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Payment & Udhaar Terms
              </span>
            </div>

            {/* Payment Shortcuts: Full Cash | Full Udhaar | Partial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => handleSetPaymentMode('cash')}
                style={{
                  padding: '0.55rem',
                  borderRadius: '12px',
                  border: paymentModeType === 'cash' ? '2px solid #10B981' : '1px solid var(--border-color)',
                  backgroundColor: paymentModeType === 'cash' ? '#ECFDF5' : 'var(--bg-card)',
                  color: paymentModeType === 'cash' ? '#047857' : 'var(--text-body)',
                  fontWeight: '800',
                  fontSize: '0.775rem',
                  cursor: 'pointer'
                }}
              >
                💵 Full Cash
              </button>

              <button
                type="button"
                onClick={() => handleSetPaymentMode('credit')}
                style={{
                  padding: '0.55rem',
                  borderRadius: '12px',
                  border: paymentModeType === 'credit' ? '2px solid #EF4444' : '1px solid var(--border-color)',
                  backgroundColor: paymentModeType === 'credit' ? '#FEF2F2' : 'var(--bg-card)',
                  color: paymentModeType === 'credit' ? '#B91C1C' : 'var(--text-body)',
                  fontWeight: '800',
                  fontSize: '0.775rem',
                  cursor: 'pointer'
                }}
              >
                📕 Full Udhaar
              </button>

              <button
                type="button"
                onClick={() => handleSetPaymentMode('partial')}
                style={{
                  padding: '0.55rem',
                  borderRadius: '12px',
                  border: paymentModeType === 'partial' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                  backgroundColor: paymentModeType === 'partial' ? '#FFFBEB' : 'var(--bg-card)',
                  color: paymentModeType === 'partial' ? '#B45309' : 'var(--text-body)',
                  fontWeight: '800',
                  fontSize: '0.775rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ Partial
              </button>
            </div>

            {/* Custom Amount Paid Input if Partial */}
            {paymentModeType === 'partial' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  Amount Paid Now (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  placeholder="e.g. 1000"
                  style={{ borderRadius: '12px', padding: '0.55rem 0.85rem', fontWeight: '800', fontSize: '1rem', color: '#10B981' }}
                />
              </div>
            )}

            {/* Payment Method Selector if Amount Paid > 0 */}
            {amountPaid > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                  {['cash', 'phonepe', 'gpay', 'paytm'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        border: paymentMethod === pm ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: paymentMethod === pm ? 'var(--primary-light)' : 'var(--bg-card)',
                        color: paymentMethod === pm ? 'var(--primary)' : 'var(--text-body)',
                        fontSize: '0.725rem',
                        fontWeight: '800',
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Summary Breakdown Box */}
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>₹{subtotal}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                <span>Discount ({discountType === 'percent' ? `${discountValue}%` : '₹'}):</span>
                <span style={{ fontWeight: '800' }}>-₹{discountAmount}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Tax ({taxRate}%):</span>
                <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>+₹{taxAmount}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-heading)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
              <span>Grand Total:</span>
              <span style={{ color: 'var(--primary)' }}>₹{grandTotal}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: '800', fontSize: '0.9rem' }}>
              <span>Paid Now:</span>
              <span>₹{amountPaid}</span>
            </div>

            {balanceDue > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626', fontWeight: '900', fontSize: '1.05rem', borderTop: '1px dashed #FECACA', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                <span>Udhaar Added:</span>
                <span>₹{balanceDue}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: '800', fontSize: '0.85rem' }}>
                <span>Udhaar Added:</span>
                <span>₹0 (Full Cash Sale)</span>
              </div>
            )}
          </div>

          {/* Optional Bill Image Attachment Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
              Attach Paper Bill Photo (Optional)
            </label>
            <ImageUploader
              value={billImageUrl}
              onChange={(val) => setBillImageUrl(val)}
              variant="logo"
              label="Bill Photo"
            />
          </div>

          {/* Confirm Sale Button */}
          <button
            type="button"
            onClick={handleConfirmSale}
            disabled={submitting || cart.length === 0}
            className="btn btn-primary"
            style={{
              borderRadius: '16px',
              padding: '0.95rem',
              fontWeight: '900',
              fontSize: '1.05rem',
              backgroundColor: '#059669',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.3)',
              cursor: submitting || cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckCircle2 size={20} />
            <span>{submitting ? 'Recording Transaction...' : `Confirm Sale • ₹${grandTotal}`}</span>
          </button>

        </div>

      </div>

      {/* ============================================================= */}
      {/* POST-SALE INVOICE SUCCESS MODAL DIALOG                        */}
      {/* ============================================================= */}
      {savedSuccessSale && (
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
                ✓ Sale Recorded Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                Invoice #{savedSuccessSale.invoiceNo} has been saved to digital ledger & stock updated.
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
                <span style={{ fontWeight: '800', color: '#0F172A' }}>
                  {savedSuccessSale.customerName || selectedCustomer?.name || 'Walk-in Customer'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Total Bill Amount:</span>
                <span style={{ fontWeight: '800', color: '#0F172A' }}>₹{savedSuccessSale.totalAmount}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                <span>Amount Paid:</span>
                <span style={{ fontWeight: '800' }}>₹{savedSuccessSale.amountPaid}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '0.45rem', fontWeight: '900', color: (savedSuccessSale.totalAmount - savedSuccessSale.amountPaid) > 0 ? '#DC2626' : '#16A34A' }}>
                <span>Udhaar Balance Due:</span>
                <span>₹{Math.max(0, savedSuccessSale.totalAmount - savedSuccessSale.amountPaid)}</span>
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
              onClick={handleStartNextSale}
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
              <span>Start Next Sale (+ New Bill)</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSuccess={async () => {
            await refetchCustomers();
            setIsAddCustomerOpen(false);
          }}
        />
      )}

    </div>
  );
};

export default NewSale;
