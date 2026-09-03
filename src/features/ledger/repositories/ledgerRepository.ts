/* features/ledger/repositories/ledgerRepository.ts */
import type { LedgerEntry, CreateLedgerEntryDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface ILedgerRepository {
  listLedgerEntries(
    shopId: string, 
    customerId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<LedgerEntry[]>;
  createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry>;
  deleteLedgerEntry(id: string): Promise<void>;
}

export class SupabaseLedgerRepository implements ILedgerRepository {
  private mapEntry(data: any): LedgerEntry {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      customerName: data.customers?.name || undefined,
      customerPhone: data.customers?.phone || undefined,
      entryDate: data.entry_date || data.created_at,
      entryType: data.entry_type || 'debit',
      amount: Number(data.amount || 0),
      balanceAfter: Number(data.balance_after || 0),
      description: data.description || undefined,
      referenceType: data.reference_type || undefined,
      referenceId: data.reference_id || undefined,
      createdAt: data.created_at,
    };
  }

  async listLedgerEntries(
    shopId: string,
    customerId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LedgerEntry[]> {
    if (!supabase) return [];

    let query = supabase
      .from('ledger_entries')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('entry_date', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (startDate) {
      query = query.gte('entry_date', startDate);
    }
    if (endDate) {
      query = query.lte('entry_date', endDate);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((entry: any) => this.mapEntry(entry));
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    if (!supabase) throw new Error('Supabase client not initialized');

    if (dto.referenceType && dto.referenceType !== 'adjustment') {
      throw new Error('Sales and payments must be recorded from their dedicated workflows');
    }
    const { data: entryId, error } = await supabase.rpc('record_ledger_adjustment', {
      p_shop_id: shopId,
      p_customer_id: dto.customerId,
      p_entry_date: dto.entryDate || null,
      p_entry_type: dto.entryType,
      p_amount: dto.amount,
      p_description: dto.description || null,
    });
    if (error || !entryId) throw error || new Error('Failed to create ledger adjustment');
    const { data, error: loadError } = await supabase
      .from('ledger_entries')
      .select('*, customers(name, phone)')
      .eq('id', entryId)
      .single();
    if (loadError || !data) throw loadError || new Error('Ledger adjustment was recorded but could not be loaded');
    return this.mapEntry(data);
  }

  async deleteLedgerEntry(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.rpc('void_ledger_adjustment', { p_entry_id: id });
    if (error) throw error;
  }
}

export class LocalLedgerRepository implements ILedgerRepository {
  private mapEntry(data: any): LedgerEntry {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      customerName: data.customer_name || undefined,
      customerPhone: data.customer_phone || undefined,
      entryDate: data.entry_date || data.created_at,
      entryType: data.entry_type || 'debit',
      amount: Number(data.amount || 0),
      balanceAfter: Number(data.balance_after || 0),
      description: data.description || undefined,
      referenceType: data.reference_type || undefined,
      referenceId: data.reference_id || undefined,
      createdAt: data.created_at,
    };
  }

  async listLedgerEntries(
    shopId: string,
    customerId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LedgerEntry[]> {
    const rawEntries = await LocalStorageDB.select('ledger_entries', (e: any) => e.shop_id === shopId);
    return rawEntries
      .map((entry: any) => this.mapEntry(entry))
      .filter((entry) => !customerId || entry.customerId === customerId)
      .filter((entry) => !startDate || entry.entryDate >= startDate)
      .filter((entry) => !endDate || entry.entryDate <= endDate)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    if (dto.amount <= 0) throw new Error('Ledger amount must be greater than zero');
    if (dto.referenceType && dto.referenceType !== 'adjustment') {
      throw new Error('Sales and payments must be recorded from their dedicated workflows');
    }
    const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId && c.shop_id === shopId);
    if (!cust) throw new Error('Customer does not belong to this shop');
    const currentBal = Number(cust?.current_balance || 0);
    const balanceAfter = dto.entryType === 'debit' ? currentBal + dto.amount : currentBal - dto.amount;

    const record = await LocalStorageDB.insert('ledger_entries', {
      shop_id: shopId,
      customer_id: dto.customerId,
      customer_name: cust?.name || null,
      customer_phone: cust?.phone || null,
      entry_date: dto.entryDate || new Date().toISOString(),
      entry_type: dto.entryType,
      amount: dto.amount,
      balance_after: balanceAfter,
      description: dto.description || null,
      reference_type: 'adjustment',
      reference_id: dto.referenceId || null,
    });

    if (cust) {
      await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: balanceAfter });
    }

    return this.mapEntry(record);
  }

  async deleteLedgerEntry(id: string): Promise<void> {
    const entry: any = await LocalStorageDB.selectOne('ledger_entries', (e: any) => e.id === id);
    if (!entry) throw new Error('Ledger entry not found');
    if (entry.reference_type !== 'adjustment') throw new Error('Only manual adjustments can be removed directly');
    const customer: any = await LocalStorageDB.selectOne('customers', (c: any) => c.id === entry.customer_id);
    if (customer) {
      const delta = entry.entry_type === 'debit' ? -Number(entry.amount) : Number(entry.amount);
      await LocalStorageDB.update('customers', (c: any) => c.id === entry.customer_id, {
        current_balance: Number(customer.current_balance || 0) + delta,
      });
    }
    await LocalStorageDB.delete('ledger_entries', (e: any) => e.id === id);
  }
}
