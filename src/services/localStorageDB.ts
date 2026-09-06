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

  /**
   * Strictly tenant-isolated query: returns items matching both the shopId and optional filter
   */
  selectByShop<T = any>(table: string, shopId: string, additionalFilter?: (item: T) => boolean): Promise<T[]> {
    return this.select<T>(table, (item: any) => {
      if (item.shop_id !== shopId) return false;
      return additionalFilter ? additionalFilter(item) : true;
    });
  }

  /**
   * Strictly tenant-isolated single record lookup
   */
  selectOneByShop<T = any>(table: string, shopId: string, filterFn: (item: T) => boolean): Promise<T | null> {
    return this.selectOne<T>(table, (item: any) => {
      if (item.shop_id !== shopId) return false;
      return filterFn(item);
    });
  }

  /**
   * Strictly tenant-isolated delete
   */
  deleteByShop<T = any>(table: string, shopId: string, filterFn: (item: T) => boolean): Promise<void> {
    return this.delete<T>(table, (item: any) => item.shop_id === shopId && filterFn(item));
  }

  /**
   * Purge all data belonging to a specific shop without affecting other tenants
   */
  async clearShopData(shopId: string): Promise<void> {
    const tenantTables = [
      'customers',
      'categories',
      'products',
      'sales',
      'sale_items',
      'sale_attachments',
      'payments',
      'ledger_entries',
      'stock_movements',
      'workers',
      'worker_activity_logs'
    ];

    for (const table of tenantTables) {
      await this.delete(table, (item: any) => item.shop_id === shopId);
    }
    Logger.info(`LocalStorageDB: Purged all isolated data for shop ${shopId}`);
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
