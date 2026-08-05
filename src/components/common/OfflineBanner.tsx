/* components/common/OfflineBanner.tsx */
import React from 'react';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div style={{
      width: '100%',
      backgroundColor: !isOnline
        ? '#FFFBEB'
        : isSyncing
        ? '#ECFDF5'
        : '#EFF6FF',
      borderBottom: `1px solid ${
        !isOnline
          ? '#FDE68A'
          : isSyncing
          ? '#A7F3D0'
          : '#BFDBFE'
      }`,
      padding: '0.55rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      fontWeight: '700',
      color: !isOnline
        ? '#B45309'
        : isSyncing
        ? '#047857'
        : '#1D4ED8',
      animation: 'modal-slide 0.25s ease',
      zIndex: 900
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {!isOnline ? (
          <WifiOff size={16} style={{ color: '#D97706' }} />
        ) : isSyncing ? (
          <RefreshCw size={16} className="spinner" style={{ color: '#059669' }} />
        ) : (
          <CloudOff size={16} style={{ color: '#2563EB' }} />
        )}

        <span>
          {!isOnline
            ? 'Offline Mode — You are working offline. All Khatta entries will automatically sync when connected.'
            : isSyncing
            ? `Connection Restored! Syncing ${pendingCount} offline Khatta entries to cloud...`
            : `${pendingCount} offline Khatta entries waiting for cloud sync.`}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {pendingCount > 0 && (
          <span style={{
            backgroundColor: !isOnline ? '#FDE68A' : isSyncing ? '#A7F3D0' : '#BFDBFE',
            color: !isOnline ? '#92400E' : isSyncing ? '#065F46' : '#1E40AF',
            padding: '0.15rem 0.55rem',
            borderRadius: '10px',
            fontSize: '0.725rem',
            fontWeight: '800'
          }}>
            {pendingCount} Pending
          </span>
        )}

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={syncNow}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};
