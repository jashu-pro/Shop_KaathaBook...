/* features/staff/repositories/LocalWorkerRepository.ts */
import type { WorkerRepository } from './WorkerRepository';
import type { WorkerMember, WorkerActivityLog, AddWorkerDTO, UpdateWorkerDTO } from '../types';
import { hashSecret, generate4DigitCode, isCodeExpired } from '../utils/security';
import { Logger } from '../../../services/Logger';

export class LocalWorkerRepository implements WorkerRepository {
  private getStorageKey(shopId: string): string {
    return `khattabook_workers_${shopId}`;
  }

  private getLogsStorageKey(shopId: string): string {
    return `khattabook_worker_logs_${shopId}`;
  }

  private readWorkers(shopId: string): WorkerMember[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(shopId));
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      Logger.error('LocalWorkerRepository: Failed to read workers', e);
      return [];
    }
  }

  private saveWorkers(shopId: string, workers: WorkerMember[]): void {
    try {
      localStorage.setItem(this.getStorageKey(shopId), JSON.stringify(workers));
    } catch (e) {
      Logger.error('LocalWorkerRepository: Failed to save workers', e);
    }
  }

  private readLogs(shopId: string): WorkerActivityLog[] {
    try {
      const data = localStorage.getItem(this.getLogsStorageKey(shopId));
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      Logger.error('LocalWorkerRepository: Failed to read worker logs', e);
      return [];
    }
  }

  private saveLogs(shopId: string, logs: WorkerActivityLog[]): void {
    try {
      localStorage.setItem(this.getLogsStorageKey(shopId), JSON.stringify(logs));
    } catch (e) {
      Logger.error('LocalWorkerRepository: Failed to save worker logs', e);
    }
  }

  async getWorkers(shopId: string): Promise<WorkerMember[]> {
    return this.readWorkers(shopId);
  }

  async getWorkerById(workerId: string): Promise<WorkerMember | null> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        try {
          const workers: WorkerMember[] = JSON.parse(localStorage.getItem(key) || '[]');
          const match = workers.find((w) => w.id === workerId);
          if (match) return match;
        } catch {
          // Ignore
        }
      }
    }
    return null;
  }

  async findWorkerByEmailOrPhone(shopId: string, emailOrPhone: string): Promise<WorkerMember | null> {
    const cleanQuery = emailOrPhone.trim().toLowerCase();

    // Try target shop first if provided
    if (shopId && shopId !== 'default_shop') {
      const workers = this.readWorkers(shopId);
      const match = workers.find((w) => w.emailOrPhone.trim().toLowerCase() === cleanQuery);
      if (match) return match;
    }

    // Fallback: search across all shops in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        try {
          const workers: WorkerMember[] = JSON.parse(localStorage.getItem(key) || '[]');
          const match = workers.find((w) => w.emailOrPhone.trim().toLowerCase() === cleanQuery);
          if (match) return match;
        } catch {
          // Ignore
        }
      }
    }

    return null;
  }

  async addWorker(shopId: string, data: AddWorkerDTO, tempCode: string): Promise<{ worker: WorkerMember; tempCode: string }> {
    const workers = this.readWorkers(shopId);
    const existing = workers.find(
      (w) => w.emailOrPhone.trim().toLowerCase() === data.emailOrPhone.trim().toLowerCase()
    );

    if (existing) {
      throw new Error(`A worker with email or phone "${data.emailOrPhone}" is already registered in this shop.`);
    }

    const tempCodeHash = await hashSecret(tempCode);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const newWorker: WorkerMember = {
      id: `wkr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      shopId,
      name: data.name.trim(),
      emailOrPhone: data.emailOrPhone.trim(),
      status: 'invited',
      permissions: data.permissions,
      tempCodeHash,
      tempCodeExpiresAt: expiresAt,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
    };

    workers.unshift(newWorker);
    this.saveWorkers(shopId, workers);

    // Audit log
    await this.logActivity(shopId, {
      workerId: 'owner',
      workerName: 'Shop Owner',
      action: `Invited new worker: ${newWorker.name}`,
      category: 'access',
    });

    return { worker: newWorker, tempCode };
  }

  async updateWorker(workerId: string, updates: UpdateWorkerDTO): Promise<WorkerMember> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        const workers = this.readWorkers(shopId);
        const index = workers.findIndex((w) => w.id === workerId);
        if (index !== -1) {
          const prevStatus = workers[index].status;
          const updated: WorkerMember = {
            ...workers[index],
            ...updates,
            name: updates.name ? updates.name.trim() : workers[index].name,
            emailOrPhone: updates.emailOrPhone ? updates.emailOrPhone.trim() : workers[index].emailOrPhone,
          };
          workers[index] = updated;
          this.saveWorkers(shopId, workers);

          if (updates.status && updates.status !== prevStatus) {
            await this.logActivity(shopId, {
              workerId: 'owner',
              workerName: 'Shop Owner',
              action: `Changed status of ${updated.name} to ${updates.status.toUpperCase()}`,
              category: 'access',
            });
          }

          return updated;
        }
      }
    }
    throw new Error('Worker not found');
  }

  async generateNewApprovalCode(workerId: string): Promise<{ worker: WorkerMember; tempCode: string }> {
    const newCode = generate4DigitCode();
    const newHash = await hashSecret(newCode);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        const workers = this.readWorkers(shopId);
        const index = workers.findIndex((w) => w.id === workerId);
        if (index !== -1) {
          workers[index].tempCodeHash = newHash;
          workers[index].tempCodeExpiresAt = expiresAt;
          workers[index].status = 'invited';
          this.saveWorkers(shopId, workers);

          await this.logActivity(shopId, {
            workerId: 'owner',
            workerName: 'Shop Owner',
            action: `Generated fresh 4-digit approval code for ${workers[index].name}`,
            category: 'access',
          });

          return { worker: workers[index], tempCode: newCode };
        }
      }
    }
    throw new Error('Worker not found');
  }

  async resetWorkerPin(workerId: string): Promise<{ worker: WorkerMember; tempCode: string }> {
    const newCode = generate4DigitCode();
    const newHash = await hashSecret(newCode);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        const workers = this.readWorkers(shopId);
        const index = workers.findIndex((w) => w.id === workerId);
        if (index !== -1) {
          const current = workers[index];
          current.pinHash = undefined;
          current.tempCodeHash = newHash;
          current.tempCodeExpiresAt = expiresAt;
          current.status = 'invited';
          current.sessionVersion = (current.sessionVersion || 1) + 1;
          current.sessionsRevokedAt = new Date().toISOString();

          this.saveWorkers(shopId, workers);

          await this.logActivity(shopId, {
            workerId: 'owner',
            workerName: 'Shop Owner',
            action: `Reset PIN & generated new approval code for ${current.name}`,
            category: 'access',
          });

          return { worker: current, tempCode: newCode };
        }
      }
    }
    throw new Error('Worker not found');
  }

  async revokeWorkerSessions(workerId: string): Promise<WorkerMember> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        const workers = this.readWorkers(shopId);
        const index = workers.findIndex((w) => w.id === workerId);
        if (index !== -1) {
          const current = workers[index];
          current.sessionVersion = (current.sessionVersion || 1) + 1;
          current.sessionsRevokedAt = new Date().toISOString();

          this.saveWorkers(shopId, workers);

          await this.logActivity(shopId, {
            workerId: 'owner',
            workerName: 'Shop Owner',
            action: `Revoked all active sessions for ${current.name}`,
            category: 'access',
          });

          return current;
        }
      }
    }
    throw new Error('Worker not found');
  }

  async verifyAndActivateWorker(workerId: string, tempCode: string, newPin: string): Promise<WorkerMember> {
    const inputTempHash = await hashSecret(tempCode);
    const newPinHash = await hashSecret(newPin);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        const workers = this.readWorkers(shopId);
        const index = workers.findIndex((w) => w.id === workerId);
        if (index !== -1) {
          const worker = workers[index];

          if (isCodeExpired(worker.tempCodeExpiresAt)) {
            throw new Error('This 4-digit approval code has expired. Please request a new code from the shop owner.');
          }

          if (!worker.tempCodeHash || worker.tempCodeHash !== inputTempHash) {
            throw new Error('Invalid temporary approval code. Please double-check the 4 digits.');
          }

          worker.pinHash = newPinHash;
          worker.status = 'active';
          worker.tempCodeHash = undefined;
          worker.tempCodeExpiresAt = undefined;
          worker.sessionVersion = (worker.sessionVersion || 1) + 1;
          worker.lastActiveAt = new Date().toISOString();

          workers[index] = worker;
          this.saveWorkers(shopId, workers);

          await this.logActivity(shopId, {
            workerId: worker.id,
            workerName: worker.name,
            action: `Activated personal PIN and logged into Worker Space`,
            category: 'access',
          });

          return worker;
        }
      }
    }
    throw new Error('Worker not found');
  }

  async verifyWorkerPin(workerId: string, pin: string): Promise<boolean> {
    const inputHash = await hashSecret(pin);
    const worker = await this.getWorkerById(workerId);
    if (!worker || worker.status !== 'active') return false;
    return worker.pinHash === inputHash;
  }

  async deleteWorker(workerId: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('khattabook_workers_')) {
        const shopId = key.replace('khattabook_workers_', '');
        let workers = this.readWorkers(shopId);
        const target = workers.find((w) => w.id === workerId);
        if (target) {
          workers = workers.filter((w) => w.id !== workerId);
          this.saveWorkers(shopId, workers);

          await this.logActivity(shopId, {
            workerId: 'owner',
            workerName: 'Shop Owner',
            action: `Removed worker ${target.name}`,
            category: 'access',
          });
          return;
        }
      }
    }
  }

  async getActivityLogs(shopId: string, workerId?: string): Promise<WorkerActivityLog[]> {
    const logs = this.readLogs(shopId);
    if (workerId) {
      return logs.filter((l) => l.workerId === workerId);
    }
    return logs;
  }

  async logActivity(shopId: string, log: Omit<WorkerActivityLog, 'id' | 'shopId' | 'timestamp'>): Promise<WorkerActivityLog> {
    const logs = this.readLogs(shopId);
    const newLog: WorkerActivityLog = {
      ...log,
      shopId,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    const trimmed = logs.slice(0, 250);
    this.saveLogs(shopId, trimmed);
    return newLog;
  }
}
