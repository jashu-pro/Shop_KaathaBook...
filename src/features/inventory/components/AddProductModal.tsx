/* features/inventory/components/AddProductModal.tsx */
import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Barcode, Plus, Edit3 } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { Product, ProductUnit } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: Product) => void;
  onOpenAddCategory?: () => void;
  initialProduct?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAddCategory,
  initialProduct = null
}) => {
  const { categories, addProduct, editProduct } = useInventory();

  const isEditMode = !!initialProduct;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('piece');
  const [stockQty, setStockQty] = useState('50');
  const [alertQty, setAlertQty] = useState('5');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setCategoryId(initialProduct.categoryId || '');
      setSku(initialProduct.sku || '');
      setBarcode(initialProduct.barcode || '');
      setMrp(initialProduct.mrp ? String(initialProduct.mrp) : '');
      setPrice(String(initialProduct.price));
      setCostPrice(initialProduct.costPrice ? String(initialProduct.costPrice) : '');
      setUnit(initialProduct.unit || 'piece');
      setStockQty(String(initialProduct.stockQty));
      setAlertQty(String(initialProduct.alertQty));
      setImageUrl(initialProduct.imageUrl || null);
      setDescription(initialProduct.description || '');
    } else {
      setName('');
      setCategoryId('');
      setSku(`SKU-${Date.now().toString().slice(-6)}`);
      setBarcode('');
      setMrp('');
      setPrice('');
      setCostPrice('');
      setUnit('piece');
      setStockQty('50');
      setAlertQty('5');
      setImageUrl(null);
      setDescription('');
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const generateBarcode = () => {
    const random12 = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(random12);
  };

  // Real-time Profit Margin Calculation
  const numSellingPrice = Number(price) || 0;
  const numCostPrice = Number(costPrice) || 0;
  const profitAmount = numSellingPrice - numCostPrice;
  const marginPercentage = numSellingPrice > 0 ? Math.round((profitAmount / numSellingPrice) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!price || Number(price) < 0) {
      setError('Valid selling price is required');
      return;
    }
    if (Number(costPrice) < 0) {
      setError('Cost price cannot be negative');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && initialProduct) {
        const updated = await editProduct(initialProduct.id, {
          name: name.trim(),
          categoryId: categoryId || undefined,
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          mrp: mrp ? Number(mrp) : Number(price),
          price: Number(price),
          costPrice: costPrice ? Number(costPrice) : 0,
          unit,
          stockQty: Number(stockQty) || 0,
          alertQty: Number(alertQty) || 5,
          imageUrl: imageUrl || undefined,
          description: description.trim() || undefined,
        });
        setSubmitting(false);
        if (onSuccess && updated) onSuccess(updated);
        onClose();
      } else {
        const created = await addProduct({
          name: name.trim(),
          categoryId: categoryId || undefined,
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
          mrp: mrp ? Number(mrp) : Number(price),
          price: Number(price),
          costPrice: costPrice ? Number(costPrice) : 0,
          unit,
          stockQty: stockQty ? Number(stockQty) : 0,
          alertQty: alertQty ? Number(alertQty) : 5,
          imageUrl: imageUrl || undefined,
          description: description.trim() || undefined,
        });
        setSubmitting(false);
        if (onSuccess && created) onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to save product');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-body)',
        borderRadius: 'var(--radius-card, 28px)',
        maxWidth: '640px', width: '100%',
        boxShadow: 'var(--glass-shadow)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isEditMode ? <Edit3 size={20} /> : <PackagePlus size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                {isEditMode ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Configure selling price, cost price, stock alert thresholds
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {error && (
            <div className="input-error" style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '14px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Product Image Uploader */}
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Product Photo (Optional)</label>
            <ImageUploader
              value={imageUrl}
              onChange={(val) => setImageUrl(val)}
              variant="logo"
              label="Product Image"
            />
          </div>

          {/* Name & Category */}
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ashirvaad Atta 5kg or Tata Salt 1kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="input-field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {onOpenAddCategory && (
              <button
                type="button"
                onClick={onOpenAddCategory}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', borderRadius: '16px' }}
                title="Create New Category"
              >
                <Plus size={18} /> New Category
              </button>
            )}
          </div>

          {/* Pricing & Realtime Margin Calculation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cost / Purchase Price (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="200"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">MRP (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="260"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
              />
            </div>
          </div>

          {/* Real-time Profit Analytics Box */}
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Estimated Profit Per Unit</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: profitAmount >= 0 ? 'var(--primary)' : 'var(--error)' }}>
                ₹{profitAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Margin Percentage</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: marginPercentage > 0 ? 'var(--primary)' : 'var(--text-heading)' }}>
                {marginPercentage}%
              </div>
            </div>
          </div>

          {/* Stock Qty, Alert Threshold & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <select
                className="input-field"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
              >
                <option value="piece">Piece (pcs)</option>
                <option value="packet">Packet (pkt)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="liter">Liter (L)</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock Qty</label>
              <input
                type="number"
                className="input-field"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Low Stock Alert Limit</label>
              <input
                type="number"
                className="input-field"
                value={alertQty}
                onChange={(e) => setAlertQty(e.target.value)}
              />
            </div>
          </div>

          {/* SKU & Barcode Generator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input
                type="text"
                className="input-field"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Barcode</label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Barcode size={12} /> Auto Gen
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="890123456789"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }} disabled={submitting}>
              {submitting ? 'Saving Product...' : isEditMode ? 'Save Changes' : '+ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
