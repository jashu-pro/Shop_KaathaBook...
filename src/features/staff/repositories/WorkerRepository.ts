/* features/staff/repositories/WorkerRepository.ts */
import type { WorkerMember, WorkerActivityLog, AddWorkerDTO, UpdateWorkerDTO } from '../types';

export interface WorkerRepository {
  getWorkers(shopId: string): Promise<WorkerMember[]>;
  getWorkerById(workerId: string): Promise<WorkerMember | null>;
  findWorkerByEmailOrPhone(shopId: string, emailOrPhone: string): Promise<WorkerMember | null>;
  addWorker(shopId: string, data: AddWorkerDTO, tempCode: string): Promise<{ worker: WorkerMember; tempCode: string }>;
  updateWorker(workerId: string, updates: UpdateWorkerDTO): Promise<WorkerMember>;
  generateNewApprovalCode(workerId: string): Promise<{ worker: WorkerMember; tempCode: string }>;
  verifyAndActivateWorker(workerId: string, tempCode: string, newPin: string): Promise<WorkerMember>;
  verifyWorkerPin(workerId: string, pin: string): Promise<boolean>;
  resetWorkerPin(workerId: string): Promise<{ worker: WorkerMember; tempCode: string }>;
  revokeWorkerSessions(workerId: string): Promise<WorkerMember>;
  deleteWorker(workerId: string): Promise<void>;
  getActivityLogs(shopId: string, workerId?: string): Promise<WorkerActivityLog[]>;
  logActivity(shopId: string, log: Omit<WorkerActivityLog, 'id' | 'shopId' | 'timestamp'>): Promise<WorkerActivityLog>;
}

