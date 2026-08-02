/* localStorageDB.ts */
import { Logger } from './Logger';

class LocalStorageDBService {
  private getTableData<T>(table: string): T[] {
    const data = localStorage.getItem(`db_${table}`);
    return data ? JSON.parse(data) : [];
  }

  private setTableData<T>(table: string, data: T[]): void {
    localStorage.setItem(`db_${table}`, JSON.stringify(data));
  }

  select<T = any>(table: string, filterFn?: (item: T) => boolean): Promise<T[]> {
    return new Promise((resolve) => {
      const data = this.getTableData<T>(table);
      if (filterFn) {
        resolve(data.filter(filterFn));
      } else {
        resolve(data);
      }
    });
  }

  selectOne<T = any>(table: string, filterFn: (item: T) => boolean): Promise<T | null> {
    return new Promise((resolve) => {
      const data = this.getTableData<T>(table);
      const found = data.find(filterFn);
      resolve(found || null);
    });
  }

  insert<T = any>(table: string, item: Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<T> {
    return new Promise((resolve) => {
      const data = this.getTableData<any>(table);
      const now = new Date().toISOString();
      const newItem = {
        ...item,
        id: item.id || crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      } as unknown as T;

      data.push(newItem);
      this.setTableData(table, data);
      Logger.debug(`LocalStorageDB: Inserted into "${table}"`, newItem);
      resolve(newItem);
    });
  }

  update<T = any>(table: string, filterFn: (item: T) => boolean, updates: Partial<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const data = this.getTableData<any>(table);
      const index = data.findIndex(filterFn);
      if (index === -1) {
        reject(new Error(`LocalStorageDB: Record not found in "${table}"`));
        return;
      }

      const now = new Date().toISOString();
      const updatedItem = {
        ...data[index],
        ...updates,
        updated_at: now,
      };

      data[index] = updatedItem;
      this.setTableData(table, data);
      Logger.debug(`LocalStorageDB: Updated in "${table}"`, updatedItem);
      resolve(updatedItem as T);
    });
  }

  delete<T = any>(table: string, filterFn: (item: T) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const data = this.getTableData<any>(table);
      const filtered = data.filter((item) => !filterFn(item));
      this.setTableData(table, filtered);
      Logger.debug(`LocalStorageDB: Deleted from "${table}"`);
      resolve();
    });
  }

  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('db_')) {
        localStorage.removeItem(key);
      }
    });
    Logger.info('LocalStorageDB: Cleared all tables.');
  }
}

export const LocalStorageDB = new LocalStorageDBService();
