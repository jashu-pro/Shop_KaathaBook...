/* features/staff/hooks/useInactivityLogout.ts */
import { useEffect, useRef } from 'react';
import { useWorkerStore } from '../stores/workerStore';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { Logger } from '../../../services/Logger';

const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds session check

export function useInactivityLogout(timeoutMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS) {
  const { sessionMode, activeWorker, exitWorkerSpace } = useWorkerStore();
  const lastActivityRef = useRef<number>(Date.now());
  const workerRepo = useRef(RepositoryFactory.getWorkerRepository()).current;

  useEffect(() => {
    if (sessionMode !== 'worker' || !activeWorker) {
      return;
    }

    lastActivityRef.current = Date.now();

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // 1. Inactivity timer check
    const inactivityInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= timeoutMs) {
        Logger.info(`Inactivity timeout reached (${Math.round(idleTime / 1000)}s idle). Logging out worker.`);
        exitWorkerSpace();
        window.location.href = '/worker-login?reason=inactivity';
      }
    }, 10000);

    // 2. Real-time session validation heartbeat (checks if owner revoked session or suspended worker)
    const heartbeatInterval = setInterval(async () => {
      try {
        if (!activeWorker?.id) return;
        const currentWorker = await workerRepo.getWorkerById(activeWorker.id);
        if (!currentWorker) {
          Logger.warn('Worker record not found during heartbeat. Ending session.');
          exitWorkerSpace();
          window.location.href = '/worker-login?reason=removed';
          return;
        }

        if (currentWorker.status === 'suspended') {
          Logger.warn('Worker was suspended by owner. Ending session.');
          exitWorkerSpace();
          window.location.href = '/worker-login?reason=suspended';
          return;
        }

        if (
          currentWorker.sessionVersion &&
          activeWorker.sessionVersion &&
          currentWorker.sessionVersion > activeWorker.sessionVersion
        ) {
          Logger.warn('Worker session was revoked by owner. Ending session.');
          exitWorkerSpace();
          window.location.href = '/worker-login?reason=revoked';
          return;
        }
      } catch (err) {
        Logger.error('Session heartbeat error', err);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(inactivityInterval);
      clearInterval(heartbeatInterval);
    };
  }, [sessionMode, activeWorker, timeoutMs, exitWorkerSpace, workerRepo]);
}
