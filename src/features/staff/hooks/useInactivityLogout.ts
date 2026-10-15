/* features/staff/hooks/useInactivityLogout.ts */
import { useEffect, useRef, useState } from 'react';
import { useWorkerStore, touchWorkerActivity, getWorkerLastActivity, WORKER_IDLE_TIMEOUT_MS } from '../stores/workerStore';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { Logger } from '../../../services/Logger';
import { isSupabaseConfigured } from '../../../config/supabase';
import { workerAuthService } from '../services/workerAuthService';

const DEFAULT_INACTIVITY_TIMEOUT_MS = WORKER_IDLE_TIMEOUT_MS;
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds session check

export function useInactivityLogout(timeoutMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS) {
  const { sessionMode, activeWorker, exitWorkerSpace } = useWorkerStore();
  // Reset to Date.now() when the worker session effect starts below
  const lastActivityRef = useRef<number>(0);
  const [workerRepo] = useState(() => RepositoryFactory.getWorkerRepository());

  useEffect(() => {
    if (sessionMode !== 'worker' || !activeWorker) {
      return;
    }

    lastActivityRef.current = getWorkerLastActivity() || Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      // Persist at most every 5s so reloads keep the real idle time
      if (now - lastActivityRef.current > 5000) touchWorkerActivity();
      lastActivityRef.current = now;
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // 1. Inactivity timer check
    const inactivityInterval = setInterval(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= timeoutMs) {
        Logger.info(`Inactivity timeout reached (${Math.round(idleTime / 1000)}s idle). Logging out worker.`);
        await exitWorkerSpace();
        window.location.href = '/worker-login?reason=inactivity';
      }
    }, 10000);

    // 2. Real-time session validation heartbeat (checks if owner revoked session or suspended worker)
    const heartbeatInterval = setInterval(async () => {
      try {
        if (!activeWorker?.id) return;

        if (isSupabaseConfigured()) {
          // Server-side check. Only extend the session if the worker did something
          // since the last beat, so the database's 30-minute limit still applies.
          const wasActive = Date.now() - lastActivityRef.current < HEARTBEAT_INTERVAL_MS * 2;
          const res = await workerAuthService.touch(wasActive);
          if (!res.ok) {
            Logger.warn(`Worker session ended by server (${res.reason}).`);
            await exitWorkerSpace();
            window.location.href = `/worker-login?reason=${res.reason === 'none' ? 'revoked' : res.reason}`;
            return;
          }
          if (JSON.stringify(res.worker.permissions) !== JSON.stringify(activeWorker.permissions) || res.worker.name !== activeWorker.name) {
            try {
              localStorage.setItem('khattabook_worker_session', JSON.stringify({ worker: res.worker }));
            } catch {
              // Ignore
            }
            useWorkerStore.setState({ activeWorker: res.worker });
          }
          return;
        }

        const currentWorker = await workerRepo.getWorkerById(activeWorker.id);
        if (!currentWorker) {
          Logger.warn('Worker record not found during heartbeat. Ending session.');
          await exitWorkerSpace();
          window.location.href = '/worker-login?reason=removed';
          return;
        }

        if (currentWorker.status === 'suspended') {
          Logger.warn('Worker was suspended by owner. Ending session.');
          await exitWorkerSpace();
          window.location.href = '/worker-login?reason=suspended';
          return;
        }

        if (
          currentWorker.sessionVersion &&
          activeWorker.sessionVersion &&
          currentWorker.sessionVersion > activeWorker.sessionVersion
        ) {
          Logger.warn('Worker session was revoked by owner. Ending session.');
          await exitWorkerSpace();
          window.location.href = '/worker-login?reason=revoked';
          return;
        }

        // Pick up permission or profile changes the owner made since login.
        if (JSON.stringify(currentWorker.permissions) !== JSON.stringify(activeWorker.permissions) || currentWorker.name !== activeWorker.name) {
          try {
            localStorage.setItem('khattabook_worker_session', JSON.stringify({ worker: currentWorker }));
          } catch {
            // Ignore
          }
          useWorkerStore.setState({ activeWorker: currentWorker });
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
