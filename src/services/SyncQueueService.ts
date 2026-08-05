/* services/SyncQueueService.ts */
import { LocalStorageDB } from './localStorageDB';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Logger } from './Logger';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntity = 'customers' | 'categories' | 'products' | 'sales' | 'payments' | 'ledger_entries';

export interface SyncTask {
  id: string;
  action: SyncAction;
  entity: SyncEntity;
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
  retryCount: number;
}

class SyncQueueServiceManager {
  private isProcessing = false;
  private maxRetries = 3;

  async enqueueTask(action: SyncAction, entity: SyncEntity, payload: any): Promise<SyncTask> {
    const task: SyncTask = {
      id: `sync_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      entity,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await LocalStorageDB.insert('sync_queue', task);
    Logger.info(`Enqueued offline sync task: ${action} ${entity}`, task);

    // Try processing if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return task;
  }

  async getPendingTasks(): Promise<SyncTask[]> {
    return await LocalStorageDB.select('sync_queue', (t: any) => t.status === 'pending' || t.status === 'failed');
  }

  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isProcessing) return { processed: 0, failed: 0 };
    if (!navigator.onLine || !isSupabaseConfigured() || !supabase) {
      return { processed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let failedCount = 0;

    try {
      const pendingTasks = await this.getPendingTasks();
      Logger.info(`Processing ${pendingTasks.length} offline sync tasks...`);

      for (const task of pendingTasks) {
        if (task.retryCount >= this.maxRetries) {
          Logger.warn(`Task ${task.id} exceeded max retries. Skipping.`, task);
          failedCount++;
          continue;
        }

        // Mark as syncing
        await LocalStorageDB.update('sync_queue', (t: any) => t.id === task.id, {
          status: 'syncing',
        });

        try {
          await this.executeTask(task);

          // Mark completed & remove from queue
          await LocalStorageDB.update('sync_queue', (t: any) => t.id === task.id, {
            status: 'completed',
          });
          await LocalStorageDB.delete('sync_queue', (t: any) => t.id === task.id);
          processedCount++;
        } catch (err: any) {
          Logger.error(`Failed to execute sync task ${task.id}:`, err);
          failedCount++;
          await LocalStorageDB.update('sync_queue', (t: any) => t.id === task.id, {
            status: 'failed',
            error: err.message || 'Network sync error',
            retryCount: task.retryCount + 1,
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed: processedCount, failed: failedCount };
  }

  private async executeTask(task: SyncTask): Promise<void> {
    if (!supabase) throw new Error('Supabase client unavailable');
    const { action, entity, payload } = task;

    if (action === 'CREATE') {
      // Conflict resolution: Last-Write-Wins (LWW) check
      const { error } = await supabase.from(entity).insert(payload);
      if (error) {
        // If primary key collision, attempt update if payload timestamp is newer
        if (error.code === '23505') {
          await supabase.from(entity).update(payload).eq('id', payload.id);
        } else {
          throw error;
        }
      }
    } else if (action === 'UPDATE') {
      const { error } = await supabase.from(entity).update(payload).eq('id', payload.id);
      if (error) throw error;
    } else if (action === 'DELETE') {
      const { error } = await supabase.from(entity).delete().eq('id', payload.id);
      if (error) throw error;
    }
  }

  async clearQueue(): Promise<void> {
    await LocalStorageDB.delete('sync_queue', () => true);
  }
}

export const SyncQueueService = new SyncQueueServiceManager();
