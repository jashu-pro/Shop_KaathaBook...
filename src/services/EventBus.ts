/* EventBus.ts */
import { Logger } from './Logger';

type EventCallback<T = any> = (data: T) => void;

export type AppDataEvent = 
  | 'sales:changed' 
  | 'payments:changed' 
  | 'ledger:changed' 
  | 'customers:changed' 
  | 'inventory:changed' 
  | 'data:sync';

class EventBusService {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('db_')) {
          const tableName = event.key.replace('db_', '');
          if (tableName === 'sales') this.publish('sales:changed', null);
          else if (tableName === 'payments') this.publish('payments:changed', null);
          else if (tableName === 'ledger_entries') this.publish('ledger:changed', null);
          else if (tableName === 'customers') this.publish('customers:changed', null);
          else if (tableName === 'products') this.publish('inventory:changed', null);
          this.publish('data:sync', null);
        }
      });
    }
  }

  subscribe<T = any>(event: AppDataEvent | string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    Logger.debug(`EventBus: Subscribed to "${event}"`);

    return () => this.unsubscribe(event, callback);
  }

  unsubscribe<T = any>(event: AppDataEvent | string, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
      Logger.debug(`EventBus: Unsubscribed from "${event}"`);
    }
  }

  publish<T = any>(event: AppDataEvent | string, data?: T): void {
    Logger.info(`EventBus: Publishing "${event}"`, data);
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          Logger.error(`EventBus: Error executing handler for "${event}"`, error);
        }
      });
    }
  }

  triggerFullSync(): void {
    this.publish('sales:changed');
    this.publish('payments:changed');
    this.publish('ledger:changed');
    this.publish('customers:changed');
    this.publish('inventory:changed');
    this.publish('data:sync');
  }
}

export const EventBus = new EventBusService();
