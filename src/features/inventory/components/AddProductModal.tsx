/* features/inventory/components/AddProductModal.tsx */
import React, { useState } from 'react';
import { X, PackagePlus, Barcode, Plus, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { ImageUploader } from '../../../components/common/ImageUploader';
import type { Product, ProductUnit } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: Product) => void;
  onOpenAddCategory?: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAddCategory,
}) => {
  const { categories, addProduct } = useInventory();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState(`SKU-${Date.now().toString().slice(-6)}`);
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

  if (!isOpen) return null;

  const generateBarcode = () => {
    // Generate 12-digit random Indian barcode number
    const random12 = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(random12);
  };

  const generateSku = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setSku(`KIR-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Valid selling price is required');
      return;
    }

    setSubmitting(true);
    try {
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
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '1.75rem',
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <PackagePlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0F172A' }}>
                Add New Product
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Add item to Kirana stock & POS catalog
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Product Image Uploader */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <ImageUploader
              value={imageUrl}
              onChange={(val) => setImageUrl(val)}
              variant="avatar"
              label="Product Image"
            />
          </div>

          {/* Product Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Product Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Fortune Sunflower Oil 1L, India Gate Basmati Rice 5kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              autoFocus
            />
          </div>

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>
                  Category
                </label>
                {onOpenAddCategory && (
                  <button
                    type="button"
                    onClick={onOpenAddCategory}
                    style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Add Category
                  </button>
                )}
              </div>
              <select
                className="input-field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="">-- General / Uncategorized --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Unit / Metric
              </label>
              <select
                className="input-field"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="piece">Piece (Pcs)</option>
                <option value="packet">Packet (Pkt)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="liter">Liter (L)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
              </select>
            </div>
          </div>

          {/* Barcode & SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>
                  Barcode
                </label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  style={{ fontSize: '0.725rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}
                >
                  Auto-Gen
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Barcode size={16} style={{ position: 'absolute', left: '0.85rem', color: '#64748B' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="890123456789"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{ borderRadius: '14px', paddingLeft: '2.4rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>
                  SKU Code
                </label>
                <button
                  type="button"
                  onClick={generateSku}
                  style={{ fontSize: '0.725rem', fontWeight: '700', color: '#3B82F6', cursor: 'pointer' }}
                >
                  Auto-Gen
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="SKU-1002"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Pricing Row: MRP, Selling Price, Cost Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                MRP (₹)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="150"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Selling Price *
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="140"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Cost Price (₹)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="110"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 0.85rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Stock Tracking Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Initial Stock Qty *
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="50"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Low Stock Alert Limit
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="5"
                value={alertQty}
                onChange={(e) => setAlertQty(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Product Notes / Description (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 100% pure refined oil, 1 year shelf life"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          {error && <div className="input-error" style={{ fontSize: '0.8rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, borderRadius: '16px' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1.5, borderRadius: '16px', backgroundColor: '#059669' }}>
              <CheckCircle2 size={18} />
              <span>{submitting ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
