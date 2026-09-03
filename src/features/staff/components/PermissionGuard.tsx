/* features/staff/components/PermissionGuard.tsx */
import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkerPermissions } from '../hooks/useWorkerPermissions';
import type { WorkerPermissions } from '../types';

interface PermissionGuardProps {
  module: keyof WorkerPermissions | string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  children,
  fallback,
}) => {
  const navigate = useNavigate();
  const { can, isWorker, activeWorker } = useWorkerPermissions();

  const isAllowed = can(module, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <ShieldAlert size={32} />
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
        Access Restricted
      </h2>

      <p style={{ maxWidth: '440px', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
        {isWorker && activeWorker ? (
          <>
            Worker account <strong>{activeWorker.name}</strong> does not have permission to access the{' '}
            <strong>{String(module).toUpperCase()}</strong> module. Please contact your shop owner to request access.
          </>
        ) : (
          'You do not have permission to view or perform this action.'
        )}
      </p>

      <button onClick={() => navigate('/')} className="btn btn-primary" style={{ gap: '0.5rem' }}>
        <ArrowLeft size={18} />
        <span>Return to Permitted Workspace</span>
      </button>
    </div>
  );
};
