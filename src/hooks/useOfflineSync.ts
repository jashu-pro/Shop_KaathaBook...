/* hooks/useOfflineSync.ts */
import { useState, useEffect, useCallback } from 'react';
import { SyncQueueService, type SyncTask } from '../services/SyncQueueService';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingTasks, setPendingTasks] = useState<SyncTask[]>([]);

  const refreshPendingTasks = useCallback(async () => {
    const tasks = await SyncQueueService.getPendingTasks();
    setPendingTasks(tasks);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await SyncQueueService.processQueue();
    } finally {
      setIsSyncing(false);
      await refreshPendingTasks();
    }
  }, [isSyncing, refreshPendingTasks]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingTasks();

    // Periodic sync attempt every 30 seconds if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, refreshPendingTasks]);

  const clearQueue = async () => {
    await SyncQueueService.clearQueue();
    await refreshPendingTasks();
  };

  return {
    isOnline,
    isSyncing,
    pendingTasks,
    pendingCount: pendingTasks.length,
    syncNow: triggerSync,
    clearQueue,
    refreshPendingTasks,
  };
};
