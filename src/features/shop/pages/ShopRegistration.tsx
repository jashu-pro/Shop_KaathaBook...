/* features/shop/pages/ShopRegistration.tsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';

const ShopRegistration: React.FC = () => {
  const navigate = useNavigate();
  const registerShop = useAuthStore((state) => state.registerShop);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Kirana Store');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [upiId, setUpiId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name || !businessType) {
      setLocalError('Shop Name and Business Type are required');
      return;
    }

    try {
      await registerShop({
        name,
        businessType,
        phone: phone || undefined,
        address: address || undefined,
        gstin: gstin || undefined,
        pan: pan || undefined,
        upiId: upiId || undefined,
      });
      navigate('/');
    } catch (err: any) {
      // Error handled by store
    }
  };

  const businessTypes = [
    'Kirana Store',
    'Clothing Shop',
    'Medical Shop',
    'Hardware Store',
    'Footwear Shop',
    'Electronics Shop',
    'Mobile Shop',
    'Wholesale Business',
    'Small Retail Store'
  ];

  return (
    <div style={{ display: 'flex', minHeight: '90vh', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-panel glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.5px' }}>Shop Registration</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Complete your business profile to open the ledger dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Shop / Business Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Balaji Kirana Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Type *</label>
            <select
              className="input-field"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              style={{ appearance: 'none', background: 'rgba(15, 23, 42, 0.6) url("data:image/svg+xml;utf8,<svg fill=\'%2394a3b8\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 12px center' }}
            >
              {businessTypes.map((t) => (
                <option key={t} value={t} style={{ backgroundColor: '#1e293b' }}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Business Contact Phone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Address</label>
            <textarea
              className="input-field"
              placeholder="e.g. Shop No. 12, Main Market, Shamli"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-md" style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">GSTIN (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="22AAAAA1111A1Z1"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">PAN (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">UPI ID for Collection (Optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. shopname@okaxis"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>

          {(localError || error) && (
            <div className="input-error" style={{ marginBottom: '1.5rem', padding: '0.5rem', backgroundColor: 'var(--error-light)', borderRadius: '6px' }}>
              {localError || error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
            {isLoading ? 'Creating Business Profile...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegistration;
