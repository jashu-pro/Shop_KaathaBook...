/* features/inventory/components/AddCategoryModal.tsx */
import React, { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import type { Category } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: Category) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addCategory } = useInventory();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10B981');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addCategory({ name: name.trim(), color });
      setSubmitting(false);
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Failed to create category');
    }
  };

  const presetColors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#64748B'];

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
              <FolderPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A' }}>
                Add Category
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Group products for easy POS billing
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
              Category Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Rice & Grains, Oil & Ghee, Dairy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Badge Color
            </label>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? '3px solid #0F172A' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          {error && <div className="input-error" style={{ fontSize: '0.8rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, borderRadius: '14px' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, borderRadius: '14px', backgroundColor: '#059669' }}>
              <Sparkles size={16} />
              <span>{submitting ? 'Saving...' : 'Add Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
