/* features/staff/stores/workerStore.ts */
import { create } from 'zustand';
import type { WorkerMember, WorkerPermissions } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import { useAuthStore } from '../../../stores/authStore';
import { Logger } from '../../../services/Logger';
import { isSupabaseConfigured } from '../../../config/supabase';
import { workerAuthService } from '../services/workerAuthService';

interface WorkerSessionState {
  sessionMode: 'owner' | 'worker';
  activeWorker: WorkerMember | null;
  isLoading: boolean;
  /** True while a saved worker session is being checked on startup. */
  isRestoring: boolean;
  error: string | null;

  // Worker Session Actions
  loginWorkerWithPin: (shopId: string, emailOrPhone: string, pin: string) => Promise<WorkerMember>;
  activateWorkerFirstTime: (shopId: string, emailOrPhone: string, tempCode: string, newPin: string) => Promise<WorkerMember>;
  exitWorkerSpace: () => Promise<void>;
  recordWorkerActivity: (shopId: string, action: string, category: 'sale' | 'payment' | 'customer' | 'inventory' | 'access' | 'security', amount?: number) => Promise<void>;
  
  // Permission Checker
  can: (module: keyof WorkerPermissions | string, action?: string) => boolean;
  restoreSession: () => Promise<void>;
}

const workerRepo = RepositoryFactory.getWorkerRepository();
const shopRepo = RepositoryFactory.getShopRepository();
const SESSION_STORAGE_KEY = 'khattabook_worker_session';
const LAST_ACTIVITY_KEY = 'khattabook_worker_last_activity';
export const WORKER_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Records worker activity so the idle limit also applies across reloads. */
export const touchWorkerActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: the in-memory idle timer still applies
  }
};

// With Supabase, sign-in and permission checks happen in the database (migration 024).
const useServerAuth = isSupabaseConfigured();

/** Puts the app into worker mode for a worker the server has signed in. */
const enterWorkerMode = async (
  set: (partial: Partial<WorkerSessionState>) => void,
  worker: WorkerMember
) => {
  // The device now holds the worker's session, not the owner's.
  useAuthStore.setState({ user: null, shops: [], registrationRequest: null, isAuthenticated: false });
  if (worker.shopId) {
    const shop = await shopRepo.getShopById(worker.shopId);
    if (shop) {
      useAuthStore.setState({ shop, isOnboarded: true });
    }
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ worker }));
  touchWorkerActivity();
  set({ sessionMode: 'worker', activeWorker: worker, isLoading: false, isRestoring: false, error: null });
};

export const getWorkerLastActivity = (): number => {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const useWorkerStore = create<WorkerSessionState>((set, get) => ({
  sessionMode: 'owner',
  activeWorker: null,
  isLoading: false,
  isRestoring: (() => {
    try {
      return !!localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return false;
    }
  })(),
  error: null,

  restoreSession: async () => {
    if (useServerAuth) {
      try {
        if (!localStorage.getItem(SESSION_STORAGE_KEY)) return;
        // The server decides: still active, not revoked, not idle for 30 minutes.
        const res = await workerAuthService.touch(false);
        if (res.ok) {
          await enterWorkerMode(set, res.worker);
          Logger.info('WorkerStore: Restored worker session');
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
        }
      } catch (e) {
        Logger.error('WorkerStore: Failed to restore worker session', e);
      } finally {
        set({ isRestoring: false });
      }
      return;
    }

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.worker) {
          // A session idle for longer than the limit (e.g. tab closed) must not come back.
          if (Date.now() - getWorkerLastActivity() >= WORKER_IDLE_TIMEOUT_MS) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            return;
          }
          const storedWorker: WorkerMember = parsed.worker;
          const worker = await workerRepo.getWorkerById(storedWorker.id);
          if (
            !worker ||
            worker.status !== 'active' ||
            (storedWorker.sessionVersion || 1) !== (worker.sessionVersion || 1)
          ) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            return;
          }
          set({
            sessionMode: 'worker',
            activeWorker: worker,
          });

          // Ensure shop context is loaded
          if (worker.shopId) {
            const currentShop = useAuthStore.getState().shop;
            if (!currentShop || currentShop.id !== worker.shopId) {
              const shop = await shopRepo.getShopById(worker.shopId);
              if (shop) {
                useAuthStore.setState({ shop, isOnboarded: true });
              }
            }
          }

          Logger.info(`WorkerStore: Restored session for worker ${worker.name}`);
        }
      }
    } catch (e) {
      Logger.error('WorkerStore: Failed to restore worker session', e);
    } finally {
      set({ isRestoring: false });
    }
  },

  loginWorkerWithPin: async (shopId: string, emailOrPhone: string, pin: string) => {
    set({ isLoading: true, error: null });
    if (useServerAuth) {
      try {
        const worker = await workerAuthService.login(emailOrPhone, pin, shopId);
        await enterWorkerMode(set, worker);
        return worker;
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Worker login failed' });
        throw err;
      }
    }
    try {
      const worker = await workerRepo.findWorkerByEmailOrPhone(shopId, emailOrPhone);
      if (!worker) {
        throw new Error('No worker account found for the provided email or phone number in this shop.');
      }
      if (worker.status === 'suspended') {
        throw new Error('Your worker access has been suspended by the shop owner.');
      }
      if (worker.status !== 'active') {
        throw new Error('This worker account is not activated yet. Please click "First time? Activate PIN" below to enter your 4-digit Approval Code.');
      }

      const isValid = await workerRepo.verifyWorkerPin(worker.id, pin);
      if (!isValid) {
        throw new Error('Invalid 4-digit PIN. Please verify and try again.');
      }

      // Update last active
      const updated = await workerRepo.updateWorker(worker.id, {
        status: 'active',
        lastActiveAt: new Date().toISOString(),
      });

      // Load shop context for worker
      if (updated.shopId) {
        const shop = await shopRepo.getShopById(updated.shopId);
        if (shop) {
          useAuthStore.setState({ shop, isOnboarded: true });
        }
      }

      // Save worker session
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ worker: updated }));
      touchWorkerActivity();

      set({
        sessionMode: 'worker',
        activeWorker: updated,
        isLoading: false,
        error: null,
      });

      await workerRepo.logActivity(updated.shopId, {
        workerId: updated.id,
        workerName: updated.name,
        action: `Logged into Worker Space`,
        category: 'access',
      });

      return updated;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Worker login failed' });
      throw err;
    }
  },

  activateWorkerFirstTime: async (shopId: string, emailOrPhone: string, tempCode: string, newPin: string) => {
    set({ isLoading: true, error: null });
    if (useServerAuth) {
      try {
        const worker = await workerAuthService.activate(emailOrPhone, tempCode, newPin, shopId);
        await enterWorkerMode(set, worker);
        return worker;
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Worker activation failed' });
        throw err;
      }
    }
    try {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        throw new Error('Your personal PIN must be exactly 4 digits.');
      }

      const worker = await workerRepo.findWorkerByEmailOrPhone(shopId, emailOrPhone);
      if (!worker) {
        throw new Error('No invitation found for the provided email or phone number in this shop.');
      }

      const activated = await workerRepo.verifyAndActivateWorker(worker.id, tempCode, newPin);

      // Load shop context for worker
      if (activated.shopId) {
        const shop = await shopRepo.getShopById(activated.shopId);
        if (shop) {
          useAuthStore.setState({ shop, isOnboarded: true });
        }
      }

      // Save worker session
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ worker: activated }));
      touchWorkerActivity();

      set({
        sessionMode: 'worker',
        activeWorker: activated,
        isLoading: false,
        error: null,
      });

      return activated;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Worker activation failed' });
      throw err;
    }
  },

  exitWorkerSpace: async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {
      // Ignore
    }
    set({
      sessionMode: 'owner',
      activeWorker: null,
      error: null,
    });

    if (useServerAuth) {
      // Ends the server-side link and this device's anonymous session.
      await workerAuthService.logout();
      // Also clear the owner sign-in cached on this device, or a reload would
      // fall back to it and reopen the owner's account.
      await useAuthStore.getState().signOut();
      Logger.info('WorkerStore: Worker signed out');
      return;
    }

    // Worker Space runs on the owner's signed-in device. Leaving it must not
    // drop the worker into the owner's account, so the owner is signed out too.
    await useAuthStore.getState().signOut();
    if (useAuthStore.getState().isAuthenticated) {
      useAuthStore.setState({ user: null, shop: null, shops: [], isAuthenticated: false, isOnboarded: false });
    }
    Logger.info('WorkerStore: Exited Worker Space and signed out of the device');
  },

  recordWorkerActivity: async (shopId: string, action: string, category: 'sale' | 'payment' | 'customer' | 'inventory' | 'access' | 'security', amount?: number) => {
    const { activeWorker, sessionMode } = get();
    const workerId = sessionMode === 'worker' && activeWorker ? activeWorker.id : 'owner';
    const workerName = sessionMode === 'worker' && activeWorker ? activeWorker.name : 'Shop Owner';

    await workerRepo.logActivity(shopId, {
      workerId,
      workerName,
      action,
      category,
      amount,
    });
  },

  can: (module: keyof WorkerPermissions | string, action?: string) => {
    const { sessionMode, activeWorker } = get();

    // Owner has unconditional full access to everything
    if (sessionMode === 'owner' || !activeWorker) {
      return true;
    }

    const perms = activeWorker.permissions;
    if (!perms) return false;

    // Check specific module / action
    if (module === 'dashboard') return perms.dashboard !== false;
    if (module === 'reports') return perms.reports === true;
    if (module === 'viewProfit') return perms.viewProfit === true;
    if (module === 'settings') return perms.settings === true;
    if (module === 'staffManagement') return perms.staffManagement === true;

    if (module === 'sales') {
      if (!action) return perms.sales.view || perms.sales.create;
      return !!perms.sales[action as keyof typeof perms.sales];
    }

    if (module === 'payments') {
      if (!action) return perms.payments.view || perms.payments.receive;
      return !!perms.payments[action as keyof typeof perms.payments];
    }

    if (module === 'customers') {
      if (!action) return perms.customers.view || perms.customers.add;
      return !!perms.customers[action as keyof typeof perms.customers];
    }

    if (module === 'inventory') {
      if (!action) return perms.inventory.view || perms.inventory.add;
      return !!perms.inventory[action as keyof typeof perms.inventory];
    }

    return false;
  },
}));

// Initialize session restoration immediately on bundle load
useWorkerStore.getState().restoreSession();
