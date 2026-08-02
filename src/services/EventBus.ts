/* EventBus.ts */
import { Logger } from './Logger';

type EventCallback<T = any> = (data: T) => void;

class EventBusService {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    Logger.debug(`EventBus: Subscribed to "${event}"`);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe<T = any>(event: string, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
      Logger.debug(`EventBus: Unsubscribed from "${event}"`);
    }
  }

  publish<T = any>(event: string, data: T): void {
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
}

export const EventBus = new EventBusService();
