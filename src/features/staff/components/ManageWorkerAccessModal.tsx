/* features/staff/components/ManageWorkerAccessModal.tsx */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Key, 
  RotateCcw, 
  Power, 
  Copy, 
  CheckCircle2 
} from 'lucide-react';
import { 
  PERMISSION_PRESETS, 
  type PermissionPresetKey, 
  type WorkerMember, 
  type WorkerPermissions 
} from '../types';
import { useStaff } from '../hooks/useStaff';

interface ManageWorkerAccessModalProps {
  worker: WorkerMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageWorkerAccessModal: React.FC<ManageWorkerAccessModalProps> = ({
  worker,
  isOpen,
  onClose,
}) => {
  const { 
    updateWorker, 
    resetPin, 
    revokeSessions, 
    isUpdatingWorker, 
    isResettingPin, 
    isRevokingSessions 
  } = useStaff();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PermissionPresetKey | 'custom'>('custom');
  const [permissions, setPermissions] = useState<WorkerPermissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security action states
  const [resetCodeResult, setResetCodeResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sessionsRevokedSuccess, setSessionsRevokedSuccess] = useState(false);

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setEmailOrPhone(worker.emailOrPhone);
      setPermissions(JSON.parse(JSON.stringify(worker.permissions)));
      setResetCodeResult(null);
      setSessionsRevokedSuccess(false);
    }
  }, [worker]);

  if (!isOpen || !worker || !permissions) return null;

  const handleSelectPreset = (presetKey: PermissionPresetKey) => {
    setSelectedPreset(presetKey);
    const matched = PERMISSION_PRESETS.find((p) => p.key === presetKey);
    if (matched) {
      setPermissions(JSON.parse(JSON.stringify(matched.permissions)));
    }
  };

  const handleToggleSales = (action: keyof WorkerPermissions['sales']) => {
    setSelectedPreset('custom');
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sales: {
          ...prev.sales,
          [action]: !prev.sales[action],
        },
      };
    });
  };

  const handleTogglePayments = (action: keyof WorkerPermissions['payments']) => {
    setSelectedPreset('custom');
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        payments: {
          ...prev.payments,
          [action]: !prev.payments[action],
        },
      };
    });
  };

  const handleToggleCustomers = (action: keyof WorkerPermissions['customers']) => {
    setSelectedPreset('custom');
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customers: {
          ...prev.customers,
          [action]: !prev.customers[action],
        },
      };
    });
  };

  const handleToggleInventory = (action: keyof WorkerPermissions['inventory']) => {
    setSelectedPreset('custom');
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [action]: !prev.inventory[action],
        },
      };
    });
  };

  const handleToggleDirect = (key: 'dashboard' | 'reports' | 'settings' | 'staffManagement') => {
    setSelectedPreset('custom');
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  const handleResetPin = async () => {
    try {
      const res = await resetPin(worker.id);
      setResetCodeResult(res.tempCode);
    } catch (err: any) {
      setError(err.message || 'Failed to reset PIN.');
    }
  };

  const handleRevokeSessions = async () => {
    try {
      await revokeSessions(worker.id);
      setSessionsRevokedSuccess(true);
      setTimeout(() => setSessionsRevokedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke sessions.');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = worker.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateWorker({
        workerId: worker.id,
        updates: { status: nextStatus },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    try {
      await updateWorker({
        workerId: worker.id,
        updates: {
          name: name.trim(),
          emailOrPhone: emailOrPhone.trim(),
          permissions,
        },
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update worker permissions.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '600px',
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Manage Access: {worker.name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{worker.emailOrPhone}</p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={15} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '0.04em' }}>
                APPLY PRESET TEMPLATE
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
            {PERMISSION_PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleSelectPreset(preset.key)}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? '700' : '600',
                    color: isSelected ? 'var(--primary)' : 'var(--text-heading)',
                  }}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Access Actions Card */}
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(2, 132, 199, 0.05)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0284C7', textTransform: 'uppercase' }}>
              🔐 Security & Session Controls
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Status: <strong>{worker.status.toUpperCase()}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleResetPin}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', gap: '0.35rem', borderRadius: '10px' }}
              disabled={isResettingPin}
            >
              <Key size={14} />
              <span>{isResettingPin ? 'Resetting...' : 'Reset PIN & New Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleRevokeSessions}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', gap: '0.35rem', borderRadius: '10px' }}
              disabled={isRevokingSessions}
            >
              <RotateCcw size={14} />
              <span>{isRevokingSessions ? 'Revoking...' : 'Revoke All Sessions'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                gap: '0.35rem',
                borderRadius: '10px',
                color: worker.status === 'suspended' ? '#10B981' : '#EF4444',
              }}
            >
              <Power size={14} />
              <span>{worker.status === 'suspended' ? 'Reactivate Worker' : 'Suspend Worker'}</span>
            </button>
          </div>

          {/* Reset PIN Code Result */}
          {resetCodeResult && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px dashed var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                  New 4-digit approval code for {worker.name}:
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.2rem' }}>
                  {resetCodeResult}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Namaste ${worker.name}! Your PIN was reset. Use approval code ${resetCodeResult} in Worker Space to set a new 4-digit PIN.`
                  );
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '8px', gap: '0.3rem' }}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {sessionsRevokedSuccess && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckCircle2 size={14} />
              <span>All active worker sessions revoked. Worker must log in again.</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section: Sales Permissions */}
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
              🛒 Sales Access
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.sales.create}
                  onChange={() => handleToggleSales('create')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Create Sale</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.sales.view}
                  onChange={() => handleToggleSales('view')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>View Sales History</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.sales.edit}
                  onChange={() => handleToggleSales('edit')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Edit Sale</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.sales.delete}
                  onChange={() => handleToggleSales('delete')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Delete Sale</span>
              </label>
            </div>
          </div>

          {/* Section: Payment Permissions */}
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
              💳 Payments Access
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.payments.receive}
                  onChange={() => handleTogglePayments('receive')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Receive Payment</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.payments.view}
                  onChange={() => handleTogglePayments('view')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>View Payments</span>
              </label>
            </div>
          </div>

          {/* Section: Customer Permissions */}
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
              👥 Customer & Ledger Access
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.customers.view}
                  onChange={() => handleToggleCustomers('view')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>View Customers</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.customers.add}
                  onChange={() => handleToggleCustomers('add')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Add Customer</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.customers.ledger}
                  onChange={() => handleToggleCustomers('ledger')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Customer Ledger</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.customers.edit}
                  onChange={() => handleToggleCustomers('edit')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Edit Customer</span>
              </label>
            </div>
          </div>

          {/* Section: Inventory Permissions */}
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
              📦 Inventory Access
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.inventory.view}
                  onChange={() => handleToggleInventory('view')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>View Products</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.inventory.add}
                  onChange={() => handleToggleInventory('add')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Add Product</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.inventory.adjustStock}
                  onChange={() => handleToggleInventory('adjustStock')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Adjust Stock</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.inventory.edit}
                  onChange={() => handleToggleInventory('edit')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Edit Product</span>
              </label>
            </div>
          </div>

          {/* Section: Administrative & Financial */}
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
              ⚙️ Sensitive Modules
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.reports}
                  onChange={() => handleToggleDirect('reports')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Financial Reports & Analytics</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={permissions.settings}
                  onChange={() => handleToggleDirect('settings')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Shop Settings</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="input-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUpdatingWorker}>
              {savedSuccess ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={18} /> Saved!
                </span>
              ) : isUpdatingWorker ? (
                'Saving...'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

