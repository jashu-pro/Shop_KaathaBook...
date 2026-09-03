/* features/settings/pages/SettingsPage.tsx */
import React, { useState, useEffect } from 'react';
import { 
  Store, 
  User, 
  Palette, 
  CreditCard, 
  Database, 
  Save, 
  CheckCircle2, 
  LogOut, 
  Moon, 
  Sun, 
  Download, 
  QrCode,
  Users,
  Trash2
} from 'lucide-react';
import { LocalStorageDB } from '../../../services/localStorageDB';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../providers/ThemeProvider';
import { ImageUploader } from '../../../components/common/ImageUploader';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useLedger } from '../../ledger/hooks/useLedger';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { StaffAccessSection } from '../../staff';

export const SettingsPage: React.FC = () => {
  const { shop, user, updateShop, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { customers } = useCustomers();
  const { entries: ledgerEntries } = useLedger();
  const { sales } = useSales();
  const { payments } = usePayments();

  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'appearance' | 'khatta' | 'backup' | 'account'>('profile');

  // Shop Profile State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [businessType, setBusinessType] = useState('Clothing & Textiles');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [upiId, setUpiId] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setName(shop.name || '');
      setTagline(shop.tagline || '');
      setBusinessType(shop.businessType || 'Clothing & Textiles');
      setPhone(shop.phone || '');
      setAddress(shop.address || '');
      setCity(shop.city || '');
      setState(shop.state || '');
      setPincode(shop.pincode || '');
      setGstin(shop.gstin || '');
      setUpiId(shop.upiId || '');
      setLogoUrl(shop.logoUrl || null);
    }
  }, [shop]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!name.trim()) {
      setErrorMessage('Shop Name is required');
      return;
    }

    setSaving(true);
    try {
      await updateShop({
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        businessType,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        gstin: gstin.trim() || undefined,
        upiId: upiId.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaving(false);
      setErrorMessage(err.message || 'Failed to save shop profile settings');
    }
  };

  const handleExportDataBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      shop,
      customers,
      sales,
      payments,
      ledgerEntries,
      summary: {
        totalCustomers: customers.length,
        totalSales: sales.length,
        totalPayments: payments.length,
        totalLedgerEntries: ledgerEntries.length
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khattabook_backup_${(shop?.name || 'shop').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '840px', margin: '0 auto', width: '100%', animation: 'modal-slide 0.25s ease' }}>
      
      {/* Top Header */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Store size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              Shop & Account Settings
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Manage your shop profile, UPI details, theme & data backup
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            backgroundColor: '#DCFCE7', color: '#16A34A',
            padding: '0.4rem 0.85rem', borderRadius: '12px',
            fontSize: '0.825rem', fontWeight: '700'
          }}>
            <CheckCircle2 size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs Row */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.2rem'
      }}>
        {[
          { id: 'profile', label: 'Shop Profile', icon: Store },
          { id: 'staff', label: '👥 Staff & Access', icon: Users },
          { id: 'appearance', label: 'Theme & Appearance', icon: Palette },
          { id: 'khatta', label: 'Khatta & UPI', icon: CreditCard },
          { id: 'backup', label: 'Data Backup', icon: Database },
          { id: 'account', label: 'Account', icon: User },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '14px',
                border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                color: isActive ? 'var(--primary)' : 'var(--text-body)',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease'
              }}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: STAFF & ACCESS */}
      {activeTab === 'staff' && (
        <div style={{ animation: 'modal-slide 0.2s ease' }}>
          <StaffAccessSection />
        </div>
      )}

      {/* TAB 1: SHOP PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            
            {/* Shop Logo & Header */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                Shop Logo / Branding Banner
              </label>
              <ImageUploader
                value={logoUrl}
                onChange={(val) => setLogoUrl(val)}
                variant="logo"
                label="Shop Logo"
              />
            </div>

            {/* Shop Name & Business Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  Shop / Store Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sri Seetharam Cloth & Readymades"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  Business Category
                </label>
                <select
                  className="input-field"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <option value="Clothing & Textiles">Clothing & Textiles</option>
                  <option value="Grocery / Kirana">Grocery / Kirana</option>
                  <option value="Footwear & Accessories">Footwear & Accessories</option>
                  <option value="Electronics & Mobile">Electronics & Mobile</option>
                  <option value="Hardware & Sanitary">Hardware & Sanitary</option>
                  <option value="Jewellery & Gold">Jewellery & Gold</option>
                  <option value="Medical & Pharmacy">Medical & Pharmacy</option>
                  <option value="General Store">General Retail Store</option>
                </select>
              </div>
            </div>

            {/* Tagline & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  Tagline / Slogan (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Premium Silk & Cotton Sarees"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9440112345"
                />
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                Street Address / Landmark
              </label>
              <input
                type="text"
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Main Bazaar, Opposite Old Bus Stand"
              />
            </div>

            {/* City, State, Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  City / Town
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kotturu"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  State
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                  Pincode
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 532455"
                />
              </div>
            </div>

            {/* GSTIN (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="e.g. 37AAAAA0000A1Z5"
              />
            </div>

            {errorMessage && (
              <div className="input-error" style={{ fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontWeight: '800', gap: '0.45rem', borderRadius: '16px' }}
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: APPEARANCE & THEME */}
      {activeTab === 'appearance' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Theme & Interface Mode
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Switch between Dark Mode and Clean Light Mode
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Light Mode Card */}
            <div
              onClick={() => { if (theme === 'dark') toggleTheme(); }}
              style={{
                border: theme === 'light' ? '2.5px solid #10B981' : '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '18px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: theme === 'light' ? '0 8px 25px rgba(16, 185, 129, 0.15)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Sun size={20} style={{ color: '#F59E0B' }} />
                  <span>Light Mode</span>
                </div>
                {theme === 'light' && <CheckCircle2 size={20} style={{ color: '#10B981' }} />}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Clean white surfaces, high readability for bright daytime shop environments.
              </p>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => { if (theme === 'light') toggleTheme(); }}
              style={{
                border: theme === 'dark' ? '2.5px solid #10B981' : '1px solid var(--border-color)',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '18px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: theme === 'dark' ? '0 8px 25px rgba(16, 185, 129, 0.15)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Moon size={20} style={{ color: '#60A5FA' }} />
                  <span>Dark Mode</span>
                </div>
                {theme === 'dark' && <CheckCircle2 size={20} style={{ color: '#10B981' }} />}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Sleek dark slate background, reduced eye strain and modern aesthetic.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KHATTA & UPI */}
      {activeTab === 'khatta' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                UPI & Payment QR Configuration
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Configure your Shop UPI VPA ID to generate instant QR codes on invoices
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.35rem' }}>
                Shop UPI Virtual Payment Address (VPA / UPI ID)
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                  <QrCode size={18} />
                </div>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.6rem' }}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 9440112345@upi or mybusiness@okaxis"
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Customers can scan QR codes on printed bills to pay directly to this UPI ID.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontWeight: '800', gap: '0.45rem', borderRadius: '16px' }}
              >
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save UPI Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: DATA BACKUP & EXPORT */}
      {activeTab === 'backup' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Data Backup & Passbook Export
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Download complete digital backup of your customer ledger records, sales & payments
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Customers</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.2rem' }}>
                {customers.length}
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Sales Invoices</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.2rem' }}>
                {sales.length}
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Payments Collected</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', marginTop: '0.2rem' }}>
                {payments.length}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportDataBackup}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.5rem', fontWeight: '800', borderRadius: '16px', gap: '0.5rem' }}
            >
              <Download size={18} />
              <span>Download Complete JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clean all prefilled and local storage data? This will reset the app to a completely fresh state.')) {
                  LocalStorageDB.clearAll();
                  localStorage.clear();
                  window.location.href = '/login';
                }
              }}
              className="btn btn-secondary"
              style={{ 
                padding: '0.85rem 1.5rem', 
                fontWeight: '800', 
                borderRadius: '16px', 
                gap: '0.5rem',
                borderColor: '#EF4444',
                color: '#EF4444'
              }}
            >
              <Trash2 size={18} />
              <span>Clean All Local / Prefilled Data</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: ACCOUNT & LOGOUT */}
      {activeTab === 'account' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Logged-in Account
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Your authenticated session credentials
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              backgroundColor: 'var(--primary)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '1.2rem'
            }}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                {user?.fullName || 'Shop Owner'}
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                📧 {user?.email || 'Logged in via Supabase Auth'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={() => signOut()}
              className="btn btn-secondary"
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                padding: '0.75rem 1.5rem',
                borderRadius: '16px',
                fontWeight: '800',
                gap: '0.45rem'
              }}
            >
              <LogOut size={18} />
              <span>Log Out of Shop KhattaBook</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
