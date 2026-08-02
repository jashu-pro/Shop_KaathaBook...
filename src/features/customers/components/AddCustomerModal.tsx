import React, { useState } from 'react';
import { X, UserPlus, AlertTriangle, Sparkles } from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addCustomer, checkDuplicatePhone } = useCustomers();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000');
  const [notes, setNotes] = useState('');

  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = async (val: string) => {
    setPhone(val);
    setDuplicateCustomer(null);
    if (val.length >= 10) {
      const dup = await checkDuplicatePhone(val.trim());
      if (dup) {
        setDuplicateCustomer(dup);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Customer Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        village: village.trim() || undefined,
        address: address.trim() || undefined,
        creditLimit: Number(creditLimit) || 0,
        notes: notes.trim() || undefined,
      });

      setSubmitting(false);
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setFormError(err.message || 'Failed to add customer');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '2rem',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '28px'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Add New Customer
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-body)' }}>
                Create digital credit ledger for Kirana customer
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Duplicate Phone Warning Banner */}
        {duplicateCustomer && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: '700', color: '#F59E0B' }}>Duplicate Mobile Warning!</span>
              <p style={{ color: 'var(--text-body)', marginTop: '0.2rem' }}>
                Customer <strong style={{ color: 'var(--text-heading)' }}>{duplicateCustomer.name}</strong> ({duplicateCustomer.village || 'No village'}) already exists with this phone number.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Customer Full Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village / Town</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Anantapur Town"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Main Market Street, House #12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="form-group">
              <label className="form-label">Credit Limit (Udhaar Limit ₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="10000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Regular monthly customer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {formError && (
            <div className="input-error" style={{ marginBottom: '1rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, borderRadius: '18px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, borderRadius: '18px' }}>
              <Sparkles size={18} />
              {submitting ? 'Saving...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
