/* features/staff/repositories/SupabaseWorkerRepository.ts */
// Staff management through the staff_* database functions (migration 024).
// PINs and activation codes are hashed and checked in the database only;
// worker sign-in itself lives in services/workerAuthService.ts.
import type { WorkerRepository } from './WorkerRepository';
import type { WorkerMember, WorkerActivityLog, AddWorkerDTO, UpdateWorkerDTO, WorkerStatus } from '../types';
import { supabase } from '../../../config/supabase';

const client = () => {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
};

const toWorker = (row: any): WorkerMember => ({
  id: row.id,
  shopId: row.shop_id,
  name: row.name,
  emailOrPhone: row.email_or_phone,
  status: row.status as WorkerStatus,
  permissions: row.permissions,
  tempCodeExpiresAt: row.code_expires_at ?? undefined,
  sessionVersion: row.session_version ?? undefined,
  sessionsRevokedAt: row.sessions_revoked_at ?? undefined,
  lastActiveAt: row.last_active_at ?? undefined,
  createdAt: row.created_at,
});

const toLog = (row: any): WorkerActivityLog => ({
  id: row.id,
  shopId: row.shop_id,
  workerId: row.worker_id ?? 'owner',
  workerName: row.worker_name,
  action: row.action,
  category: row.category,
  amount: row.amount ?? undefined,
  timestamp: row.created_at,
});

const unwrap = <T>({ data, error }: { data: T; error: any }): T => {
  if (error) throw new Error(error.message || 'Request failed');
  return data;
};

export class SupabaseWorkerRepository implements WorkerRepository {
  async getWorkers(shopId: string): Promise<WorkerMember[]> {
    const rows = unwrap(await client().rpc('staff_list', { p_shop_id: shopId })) as any[];
    return (rows || []).map(toWorker);
  }

  async getWorkerById(workerId: string): Promise<WorkerMember | null> {
    // shop_memberships is owner-only, so staff managers read through staff_get.
    const rows = unwrap(await client().rpc('staff_get', { p_member_id: workerId })) as any[];
    return rows?.[0] ? toWorker(rows[0]) : null;
  }

  async findWorkerByEmailOrPhone(shopId: string, emailOrPhone: string): Promise<WorkerMember | null> {
    const identity = emailOrPhone.replace(/\s/g, '').toLowerCase();
    const workers = await this.getWorkers(shopId);
    return workers.find((w) => w.emailOrPhone === identity) || null;
  }

  async addWorker(shopId: string, data: AddWorkerDTO): Promise<{ worker: WorkerMember; tempCode: string }> {
    const res = unwrap(
      await client().rpc('staff_add', {
        p_shop_id: shopId,
        p_name: data.name,
        p_identity: data.emailOrPhone,
        p_permissions: data.permissions,
      })
    ) as { workerId: string; code: string };
    const worker = await this.getWorkerById(res.workerId);
    if (!worker) throw new Error('Worker was not created');
    return { worker, tempCode: res.code };
  }

  async updateWorker(workerId: string, updates: UpdateWorkerDTO): Promise<WorkerMember> {
    unwrap(
      await client().rpc('staff_update', {
        p_member_id: workerId,
        p_name: updates.name ?? null,
        p_identity: updates.emailOrPhone ?? null,
        p_permissions: updates.permissions ?? null,
        p_status: updates.status ?? null,
      })
    );
    const worker = await this.getWorkerById(workerId);
    if (!worker) throw new Error('Worker not found');
    return worker;
  }

  private async newCode(workerId: string, resetPin: boolean) {
    const res = unwrap(
      await client().rpc('staff_new_code', { p_member_id: workerId, p_reset_pin: resetPin })
    ) as { code: string };
    const worker = await this.getWorkerById(workerId);
    if (!worker) throw new Error('Worker not found');
    return { worker, tempCode: res.code };
  }

  generateNewApprovalCode(workerId: string) {
    return this.newCode(workerId, false);
  }

  resetWorkerPin(workerId: string) {
    return this.newCode(workerId, true);
  }

  async verifyAndActivateWorker(): Promise<WorkerMember> {
    throw new Error('Activation is handled by workerAuthService.activate');
  }

  async verifyWorkerPin(): Promise<boolean> {
    throw new Error('PIN checks are handled by workerAuthService.login');
  }

  async revokeWorkerSessions(workerId: string): Promise<WorkerMember> {
    unwrap(await client().rpc('staff_revoke_sessions', { p_member_id: workerId }));
    const worker = await this.getWorkerById(workerId);
    if (!worker) throw new Error('Worker not found');
    return worker;
  }

  async deleteWorker(workerId: string): Promise<void> {
    unwrap(await client().rpc('staff_remove', { p_member_id: workerId }));
  }

  async getActivityLogs(shopId: string, workerId?: string): Promise<WorkerActivityLog[]> {
    const rows = unwrap(
      await client().rpc('staff_activity', { p_shop_id: shopId, p_member_id: workerId ?? null })
    ) as any[];
    return (rows || []).map(toLog);
  }

  async logActivity(
    shopId: string,
    log: Omit<WorkerActivityLog, 'id' | 'shopId' | 'timestamp'>
  ): Promise<WorkerActivityLog> {
    // Who did it comes from the session on the server, not from `log`.
    unwrap(
      await client().rpc('log_shop_activity', {
        p_shop_id: shopId,
        p_action: log.action,
        p_category: log.category,
        p_amount: log.amount ?? null,
      })
    );
    return { ...log, id: crypto.randomUUID(), shopId, timestamp: new Date().toISOString() };
  }
}
