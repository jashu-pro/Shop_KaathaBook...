/* features/inventory/components/RestockModal.tsx */
import React, { useState } from 'react';
import { X, PackagePlus, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import type { Product } from '../types';

interface RestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({ product, isOpen, onClose, onSuccess }) => {
  const { adjustStock } = useInventory();
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('New Purchase Stock Replenishment');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const delta = Number(quantity);
    if (isNaN(delta) || delta === 0) {
      setError('Please enter a valid non-zero quantity');
      return;
    }

    setSubmitting(true);
    try {
      await adjustStock(product.id, delta, reason);
      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '1.5rem',
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <PackagePlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' }}>
                Restock Inventory
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {product.name} (Current: {product.stockQty} {product.unit}s)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Add Quantity (+ Stock) *
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '1.1rem', fontWeight: '800' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Stock Note / Supplier Reference
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Wholesaler Delivery #104"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          {error && <div className="input-error" style={{ fontSize: '0.8rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, borderRadius: '14px' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, borderRadius: '14px', backgroundColor: '#059669' }}>
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Updating...' : 'Add Stock Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
