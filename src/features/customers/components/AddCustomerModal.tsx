/* features/customers/components/AddCustomerModal.tsx */
import React, { useState, useRef } from 'react';
import { X, UserPlus, Camera, Upload, CheckCircle2, AlertTriangle, User } from 'lucide-react';
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
  const [creditLimit, setCreditLimit] = useState('50000');
  const [tag, setTag] = useState('Regular');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState<'udhaar' | 'advance'>('udhaar');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      setFormError('Customer Full Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        village: village.trim() || undefined,
        creditLimit: Number(creditLimit) || 0,
        tag,
        openingBalance: openingBalance ? Number(openingBalance) : undefined,
        balanceType,
        photoUrl: photoUrl || undefined,
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      {/* Hidden File Inputs for Native Camera & Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="user"
        onChange={handlePhotoCapture}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handlePhotoCapture}
        style={{ display: 'none' }}
      />

      <div 
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '1.75rem',
          maxWidth: '540px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                Add New Customer
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '0.1rem' }}>
                Create digital customer file with photo avatar
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Customer Profile Photo Card */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          {/* Avatar Preview */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '3px solid #10B981',
            backgroundColor: '#E2E8F0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} style={{ color: '#94A3B8' }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.5rem' }}>
              Customer Profile Photo
            </h4>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {/* Take Photo Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Camera size={15} />
                <span>Take Photo</span>
              </button>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Upload size={15} />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Duplicate Mobile Warning */}
        {duplicateCustomer && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            fontSize: '0.825rem'
          }}>
            <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: '700', color: '#F59E0B' }}>Duplicate Mobile Warning!</span>
              <p style={{ color: '#334155', marginTop: '0.15rem' }}>
                Customer <strong style={{ color: '#0F172A' }}>{duplicateCustomer.name}</strong> ({duplicateCustomer.village || 'No village'}) already exists with this phone number.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Customer Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Customer Full Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Venkatesh Rao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              autoFocus
            />
          </div>

          {/* Mobile Phone & Village / Town */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="9440112345"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Village / Town *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Tadipatri"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          {/* Credit Limit & Customer Tag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Credit Limit (₹)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
                Customer Tag
              </label>
              <select
                className="input-field"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Wholesale">Wholesale</option>
                <option value="New">New</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>
          </div>

          {/* Section 3: Opening Balance Card */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '0.9rem 1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0F172A' }}>
                Opening Balance (Optional Initial Record)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500' }}>
                Previous Khatta Balance
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="number"
                className="input-field"
                placeholder="₹0 (e.g. 1500)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                style={{ borderRadius: '14px', padding: '0.65rem 0.9rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
              />

              <select
                className="input-field"
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value as any)}
                style={{ borderRadius: '14px', padding: '0.65rem 0.9rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="udhaar">Customer Owes Me (Udhaar)</option>
                <option value="advance">I Owe Customer (Advance)</option>
              </select>
            </div>
          </div>

          {/* Notes / Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.35rem' }}>
              Notes / Address (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Saree shop owner, near Bus Stand"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ borderRadius: '14px', padding: '0.7rem 1rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          {formError && (
            <div className="input-error" style={{ fontSize: '0.8rem' }}>
              {formError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '0.85rem',
              fontWeight: '800',
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.25)',
              marginTop: '0.5rem'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Saving Customer...' : 'Save Customer & Enable Khatta'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
