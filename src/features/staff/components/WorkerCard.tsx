/* features/staff/components/WorkerCard.tsx */
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Trash2, 
  Power, 
  Copy, 
  Check, 
  Clock, 
  Phone,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import type { WorkerMember } from '../types';
import { useStaff } from '../hooks/useStaff';

interface WorkerCardProps {
  worker: WorkerMember;
  onManageAccess: (worker: WorkerMember) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onManageAccess }) => {
  const { 
    updateWorker, 
    regenerateCode, 
    resetPin, 
    revokeSessions, 
    deleteWorker, 
    isRegeneratingCode, 
    isResettingPin, 
    isRevokingSessions, 
    isDeletingWorker 
  } = useStaff();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokedBanner, setRevokedBanner] = useState(false);

  const initials = worker.name.substring(0, 2).toUpperCase();

  const handleToggleStatus = async () => {
    const nextStatus = worker.status === 'suspended' ? 'active' : 'suspended';
    await updateWorker({
      workerId: worker.id,
      updates: { status: nextStatus },
    });
  };

  const handleRegenerateCode = async () => {
    try {
      const res = await regenerateCode(worker.id);
      setActiveCode(res.tempCode);
    } catch {
      // Ignore
    }
  };

  const handleResetPin = async () => {
    try {
      const res = await resetPin(worker.id);
      setActiveCode(res.tempCode);
    } catch {
      // Ignore
    }
  };

  const handleRevokeSessions = async () => {
    try {
      await revokeSessions(worker.id);
      setRevokedBanner(true);
      setTimeout(() => setRevokedBanner(false), 3000);
    } catch {
      // Ignore
    }
  };

  const getInvitationText = (code: string) => {
    return `Namaste ${worker.name}! Use your Shop KhattaBook 4-digit Approval Code: ${code} to activate your Worker Space PIN.`;
  };

  const handleCopyCode = () => {
    if (activeCode) {
      navigator.clipboard.writeText(getInvitationText(activeCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (activeCode) {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText(activeCode))}`;
      window.open(url, '_blank');
    }
  };

  const handleDelete = async () => {
    await deleteWorker(worker.id);
  };

  // Compile active permission badges
  const activePermissionsList: string[] = [];
  if (worker.permissions.sales.create) activePermissionsList.push('Create Sale');
  if (worker.permissions.payments.receive) activePermissionsList.push('Receive Payment');
  if (worker.permissions.customers.view || worker.permissions.customers.add) activePermissionsList.push('Customers');
  if (worker.permissions.customers.ledger) activePermissionsList.push('Customer Ledger');
  if (worker.permissions.inventory.view) activePermissionsList.push('Inventory');
  if (worker.permissions.reports) activePermissionsList.push('Reports');
  if (worker.permissions.settings) activePermissionsList.push('Settings');

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: '24px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '1.25rem',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        transition: 'all var(--transition-normal)',
      }}
    >
      {/* Top Header Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: worker.status === 'suspended' ? 'var(--bg-secondary)' : '#0284C7',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.1rem',
            }}
          >
            {initials}
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              {worker.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              <Phone size={12} />
              <span>{worker.emailOrPhone}</span>
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div>
          {worker.status === 'active' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                padding: '0.25rem 0.65rem',
                borderRadius: '12px',
                fontSize: '0.725rem',
                fontWeight: '700',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Active
            </span>
          )}

          {worker.status === 'invited' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                padding: '0.25rem 0.65rem',
                borderRadius: '12px',
                fontSize: '0.725rem',
                fontWeight: '700',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              Pending Activation
            </span>
          )}

          {worker.status === 'suspended' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                padding: '0.25rem 0.65rem',
                borderRadius: '12px',
                fontSize: '0.725rem',
                fontWeight: '700',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              Suspended
            </span>
          )}
        </div>
      </div>

      {/* Permission Summary Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {activePermissionsList.length > 0 ? (
          activePermissionsList.map((perm) => (
            <span
              key={perm}
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '0.2rem 0.55rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-heading)',
                border: '1px solid var(--border-color)',
              }}
            >
              {perm}
            </span>
          ))
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No modules allowed
          </span>
        )}
      </div>

      {/* Active Temporary Code banner if present */}
      {activeCode ? (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px dashed var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: '600' }}>
              4-Digit Approval Code:
            </span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.25rem' }}>
              {activeCode}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              onClick={handleCopyCode}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', borderRadius: '10px', gap: '0.3rem' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="btn btn-secondary btn-icon"
              style={{ width: '32px', height: '32px', borderRadius: '10px', color: '#25D366', borderColor: '#25D366' }}
              title="Share on WhatsApp"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
      ) : worker.status === 'invited' ? (
        <button
          onClick={handleRegenerateCode}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            fontSize: '0.78rem',
            borderRadius: '12px',
            gap: '0.4rem',
            justifyContent: 'center',
            borderColor: '#F59E0B',
            color: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            fontWeight: '700',
          }}
          disabled={isRegeneratingCode}
        >
          <Key size={14} />
          <span>{isRegeneratingCode ? 'Generating...' : '🔑 Show 4-Digit Approval Code'}</span>
        </button>
      ) : null}

      {/* Revocation Success Banner */}
      {revokedBanner && (
        <div style={{ padding: '0.45rem 0.75rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '0.725rem', fontWeight: '700' }}>
          ✓ Active sessions revoked successfully.
        </div>
      )}

      {/* Last Active Timestamp */}
      {worker.lastActiveAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <Clock size={12} />
          <span>Last active: {new Date(worker.lastActiveAt).toLocaleString()}</span>
        </div>
      )}

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <button
          onClick={() => onManageAccess(worker)}
          className="btn btn-secondary"
          style={{
            padding: '0.45rem 0.75rem',
            fontSize: '0.78rem',
            borderRadius: '12px',
            gap: '0.35rem',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
          <span>Manage Access</span>
        </button>

        <button
          onClick={handleResetPin}
          className="btn btn-secondary btn-icon"
          style={{ width: '34px', height: '34px', borderRadius: '10px' }}
          title="Reset Worker PIN & Generate New Code"
          disabled={isResettingPin}
        >
          <Key size={14} />
        </button>

        <button
          onClick={handleRevokeSessions}
          className="btn btn-secondary btn-icon"
          style={{ width: '34px', height: '34px', borderRadius: '10px' }}
          title="Revoke Active Sessions"
          disabled={isRevokingSessions}
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={handleToggleStatus}
          className="btn btn-secondary btn-icon"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            color: worker.status === 'suspended' ? '#10B981' : '#EF4444',
          }}
          title={worker.status === 'suspended' ? 'Reactivate Worker' : 'Suspend Worker'}
        >
          <Power size={14} />
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-ghost btn-icon"
          style={{ width: '34px', height: '34px', borderRadius: '10px', color: 'var(--text-muted)' }}
          title="Remove Worker"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', padding: '1.75rem', backgroundColor: 'var(--bg-card)' }}
          >
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Remove Worker?
            </h4>
            <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Are you sure you want to remove <strong>{worker.name}</strong>? They will immediately lose access to your shop.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={isDeletingWorker}
              >
                {isDeletingWorker ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

