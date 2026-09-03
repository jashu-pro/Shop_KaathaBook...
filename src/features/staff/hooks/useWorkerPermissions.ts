/* features/staff/hooks/useWorkerPermissions.ts */
import { useWorkerStore } from '../stores/workerStore';

export const useWorkerPermissions = () => {
  const { sessionMode, activeWorker, can, exitWorkerSpace, recordWorkerActivity } = useWorkerStore();

  return {
    sessionMode,
    isWorker: sessionMode === 'worker',
    isOwner: sessionMode === 'owner',
    activeWorker,
    can,
    exitWorkerSpace,
    recordWorkerActivity,
  };
};
