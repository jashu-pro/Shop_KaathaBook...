/* features/staff/services/workerAuthService.ts */
// Worker sign-in (migration 024, Option B). The `worker-auth` Edge Function
// checks the PIN in the database and, only on success, returns a Supabase
// session for the worker's own account. RLS then enforces that worker's
// permissions for the session it issued.
import { supabase } from '../../../config/supabase';
import type { WorkerMember } from '../types';

export type WorkerAuthStatus =
  | 'invalid'
  | 'locked'
  | 'suspended'
  | 'bad_pin'
  | 'rate_limited'
  | 'choose_shop'
  | 'error';

export class WorkerAuthError extends Error {
  status: WorkerAuthStatus;
  shops?: Array<{ id: string; name: string }>;

  constructor(status: WorkerAuthStatus, shops?: Array<{ id: string; name: string }>) {
    super(status);
    this.name = 'WorkerAuthError';
    this.status = status;
    this.shops = shops;
  }
}

export type WorkerTouchResult =
  | { ok: true; worker: WorkerMember }
  | { ok: false; reason: 'inactivity' | 'revoked' | 'suspended' | 'removed' | 'none' };

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

const toWorker = (w: any): WorkerMember => ({
  id: w.id,
  shopId: w.shopId,
  name: w.name,
  emailOrPhone: w.emailOrPhone,
  status: w.status,
  permissions: w.permissions,
  sessionVersion: w.sessionVersion,
  createdAt: new Date().toISOString(),
});

const isUuid = (value?: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function callWorkerAuth(body: Record<string, unknown>): Promise<WorkerMember> {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('worker-auth', { body });
  // Non-2xx responses arrive as `error`; the status is in the response body.
  let result: any = data;
  if (error) {
    const context = (error as any).context as Response | undefined;
    try {
      result = context ? await context.json() : null;
    } catch {
      result = null;
    }
  }
  if (result?.status !== 'ok') {
    throw new WorkerAuthError((result?.status as WorkerAuthStatus) || 'error', result?.shops);
  }

  // One device, one identity: this replaces any owner session on the device.
  const { error: sessionError } = await client.auth.setSession(result.session);
  if (sessionError) throw sessionError;
  return toWorker(result.worker);
}

export const workerAuthService = {
  login(identity: string, pin: string, shopId?: string | null): Promise<WorkerMember> {
    return callWorkerAuth({ action: 'login', identity, pin, shopId: isUuid(shopId) ? shopId : null });
  },

  activate(identity: string, code: string, newPin: string, shopId?: string | null): Promise<WorkerMember> {
    return callWorkerAuth({ action: 'activate', identity, code, pin: newPin, shopId: isUuid(shopId) ? shopId : null });
  },

  /** extend=false only validates; it does not keep an idle device signed in. */
  async touch(extend: boolean): Promise<WorkerTouchResult> {
    const { data, error } = await requireClient().rpc('worker_touch', { p_extend: extend });
    if (error) throw error;
    return data?.ok ? { ok: true, worker: toWorker(data.worker) } : { ok: false, reason: data?.reason || 'none' };
  },

  async logout(): Promise<void> {
    const client = requireClient();
    try {
      await client.rpc('worker_logout');
    } catch {
      // The session is dropped below either way
    }
    await client.auth.signOut();
  },
};
