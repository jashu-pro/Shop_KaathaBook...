import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Copy, Check, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import { 
  DEFAULT_WORKER_PERMISSIONS, 
  PERMISSION_PRESETS, 
  type PermissionPresetKey, 
  type WorkerPermissions 
} from '../types';
import { useStaff } from '../hooks/useStaff';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose }) => {
  const { addWorker, isAddingWorker } = useStaff();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PermissionPresetKey>('sales');
  const [permissions, setPermissions] = useState<WorkerPermissions>({
    ...PERMISSION_PRESETS[0].permissions,
  });
  const [error, setError] = useState<string | null>(null);

  // Success view state with generated temporary code
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdWorkerName, setCreatedWorkerName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (presetKey: PermissionPresetKey) => {
    setSelectedPreset(presetKey);
    const matched = PERMISSION_PRESETS.find((p) => p.key === presetKey);
    if (matched) {
      setPermissions(JSON.parse(JSON.stringify(matched.permissions)));
    }
  };

  const handleCustomChange = (updater: (prev: WorkerPermissions) => WorkerPermissions) => {
    setSelectedPreset('custom');
    setPermissions(updater);
  };

  const handleToggleModule = (key: keyof WorkerPermissions) => {
    if (typeof permissions[key] === 'boolean') {
      handleCustomChange((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleToggleSalesCreate = () => {
    handleCustomChange((prev) => ({
      ...prev,
      sales: {
        ...prev.sales,
        create: !prev.sales.create,
        view: true,
      },
    }));
  };

  const handleTogglePaymentReceive = () => {
    handleCustomChange((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        receive: !prev.payments.receive,
        view: true,
      },
    }));
  };

  const handleToggleCustomerLedger = () => {
    handleCustomChange((prev) => ({
      ...prev,
      customers: {
        ...prev.customers,
        ledger: !prev.customers.ledger,
      },
    }));
  };

  const handleToggleCustomerAdd = () => {
    handleCustomChange((prev) => ({
      ...prev,
      customers: {
        ...prev.customers,
        add: !prev.customers.add,
        view: true,
      },
    }));
  };

  const handleToggleInventory = () => {
    handleCustomChange((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        view: !prev.inventory.view,
        add: !prev.inventory.view,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Worker name is required.');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError('Email or mobile number is required.');
      return;
    }

    try {
      const result = await addWorker({
        name: name.trim(),
        emailOrPhone: emailOrPhone.trim(),
        permissions,
      });

      setCreatedCode(result.tempCode);
      setCreatedWorkerName(name.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to add worker.');
    }
  };

  const getInvitationText = () => {
    return `Namaste ${createdWorkerName}! You have been invited to Shop KhattaBook. Open "Worker Space" and enter your mobile/email along with your 4-digit Approval Code: ${createdCode} to set up your personal 4-digit PIN.`;
  };

  const handleCopyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(getInvitationText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (createdCode) {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText())}`;
      window.open(url, '_blank');
    }
  };

  const handleFinish = () => {
    setCreatedCode(null);
    setName('');
    setEmailOrPhone('');
    setSelectedPreset('sales');
    setPermissions({ ...DEFAULT_WORKER_PERMISSIONS });
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleFinish}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          padding: '2rem',
          backgroundColor: 'var(--bg-card)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              {createdCode ? 'Worker Access Ready' : 'Add Worker & Grant Access'}
            </h3>
          </div>

          <button onClick={handleFinish} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {createdCode ? (
          /* Step 2: Temporary Code Display & Share */
          <div>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1.5rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                {createdWorkerName} Added Successfully!
              </h4>

              <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                Share this 4-digit temporary approval code with <strong>{createdWorkerName}</strong> for first-time login:
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px dashed var(--primary)',
                  borderRadius: '18px',
                  padding: '1.25rem',
                  margin: '1.25rem 0',
                }}
              >
                <span
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: '800',
                    letterSpacing: '0.5rem',
                    color: 'var(--primary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {createdCode}
                </span>
              </div>

              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '0.78rem',
                  color: 'var(--text-heading)',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                ⏳ <strong>48-Hour Expiry:</strong> This code expires after first activation or in 48 hours. The worker will use it to set their personal 4-digit PIN.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn btn-secondary"
                    style={{ flex: 1, gap: '0.5rem', justifyContent: 'center' }}
                  >
                    {copied ? <Check size={18} style={{ color: 'var(--primary)' }} /> : <Copy size={18} />}
                    <span>{copied ? 'Copied Invitation!' : 'Copy Code & Instructions'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="btn btn-secondary"
                    style={{ gap: '0.4rem', justifyContent: 'center', borderColor: '#25D366', color: '#25D366' }}
                    title="Share on WhatsApp"
                  >
                    <MessageSquare size={18} />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 1: Worker Details & Permission Selection */
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Worker Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Mobile Number or Email</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 9876543210 or ramesh@gmail.com"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>

            {/* Permission Presets Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.15rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '0.04em' }}>
                    QUICK ACCESS PRESETS
                  </span>
                </div>
                {selectedPreset === 'custom' && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700' }}>
                    Custom Tailored
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {PERMISSION_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleSelectPreset(preset.key)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{preset.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-heading)' }}>
                          {preset.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Granular Checkboxes - Owner has ultimate individual authority */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '0.04em' }}>
                  INDIVIDUAL ACCESS CONTROLS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Dashboard */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.dashboard}
                    onChange={() => handleToggleModule('dashboard')}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Worker Workspace Dashboard</span>
                </label>

                {/* Create Sale */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.sales.create}
                    onChange={handleToggleSalesCreate}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Create Sale (POS Billing & Udhaar)</span>
                </label>

                {/* Receive Payment */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.payments.receive}
                    onChange={handleTogglePaymentReceive}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Receive Payment (Cash / UPI / GPay)</span>
                </label>

                {/* Customers */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.customers.add}
                    onChange={handleToggleCustomerAdd}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Customers (View & Add)</span>
                </label>

                {/* Customer Ledger */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.customers.ledger}
                    onChange={handleToggleCustomerLedger}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Customer Ledger (Khatta Debit/Credit)</span>
                </label>

                {/* Inventory */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.inventory.view}
                    onChange={handleToggleInventory}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Inventory & Products</span>
                </label>

                {/* Financial Reports */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.reports}
                    onChange={() => handleToggleModule('reports')}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Financial Reports (Sensitive)</span>
                </label>

                {/* Settings */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  <input
                    type="checkbox"
                    checked={permissions.settings}
                    onChange={() => handleToggleModule('settings')}
                    style={{ width: '17px', height: '17px', accentColor: 'var(--primary)' }}
                  />
                  <span>Shop Settings (Sensitive)</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="input-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleFinish} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isAddingWorker}>
                {isAddingWorker ? 'Generating Access...' : 'Generate 4-Digit Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

