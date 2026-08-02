/* ledger/repositories/ledgerRepository.ts */
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface LedgerEntry {
  id: string;
  shopId: string;
  customerId: string;
  entryDate: string;
  entryType: 'debit' | 'credit'; // debit = customer owes, credit = customer paid
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceType?: 'sale' | 'payment' | 'initial';
  referenceId?: string;
  createdAt: string;
}

export interface ILedgerRepository {
  list(shopId: string, customerId: string): Promise<LedgerEntry[]>;
  create(entry: Omit<LedgerEntry, 'id' | 'entryDate' | 'createdAt'>): Promise<LedgerEntry>;
}

export class SupabaseLedgerRepository implements ILedgerRepository {
  async list(shopId: string, customerId: string): Promise<LedgerEntry[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('shop_id', shopId)
      .eq('customer_id', customerId)
      .order('entry_date', { ascending: true });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      customerId: d.customer_id,
      entryDate: d.entry_date,
      entryType: d.entry_type,
      amount: Number(d.amount),
      balanceAfter: Number(d.balance_after),
      description: d.description || undefined,
      referenceType: d.reference_type || undefined,
      referenceId: d.reference_id || undefined,
      createdAt: d.created_at,
    }));
  }

  async create(entry: Omit<LedgerEntry, 'id' | 'entryDate' | 'createdAt'>): Promise<LedgerEntry> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        shop_id: entry.shopId,
        customer_id: entry.customerId,
        entry_type: entry.entryType,
        amount: entry.amount,
        balance_after: entry.balanceAfter,
        description: entry.description || null,
        reference_type: entry.referenceType || null,
        reference_id: entry.referenceId || null,
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create ledger entry');
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      entryDate: data.entry_date,
      entryType: data.entry_type,
      amount: Number(data.amount),
      balanceAfter: Number(data.balance_after),
      description: data.description || undefined,
      referenceType: data.reference_type || undefined,
      referenceId: data.reference_id || undefined,
      createdAt: data.created_at,
    };
  }
}

export class LocalLedgerRepository implements ILedgerRepository {
  async list(shopId: string, customerId: string): Promise<LedgerEntry[]> {
    const list = await LocalStorageDB.select('ledger_entries', (l: any) => {
      return l.shop_id === shopId && l.customer_id === customerId;
    });

    return list.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      customerId: d.customer_id,
      entryDate: d.created_at,
      entryType: d.entry_type,
      amount: Number(d.amount),
      balanceAfter: Number(d.balance_after),
      description: d.description || undefined,
      referenceType: d.reference_type || undefined,
      referenceId: d.reference_id || undefined,
      createdAt: d.created_at,
    }));
  }

  async create(entry: Omit<LedgerEntry, 'id' | 'entryDate' | 'createdAt'>): Promise<LedgerEntry> {
    const data = await LocalStorageDB.insert('ledger_entries', {
      shop_id: entry.shopId,
      customer_id: entry.customerId,
      entry_type: entry.entryType,
      amount: entry.amount,
      balance_after: entry.balanceAfter,
      description: entry.description || null,
      reference_type: entry.referenceType || null,
      reference_id: entry.referenceId || null,
    });

    // Directly adjust customer credit balance cached on customer record for immediate UI listing speed
    const customer = await LocalStorageDB.selectOne('customers', (c: any) => c.id === entry.customerId);
    if (customer) {
      const balanceChange = entry.entryType === 'debit' ? entry.amount : -entry.amount;
      await LocalStorageDB.update('customers', (c: any) => c.id === entry.customerId, {
        credit_balance: Number(customer.credit_balance || 0) + balanceChange,
      });
    }

    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      entryDate: data.created_at,
      entryType: data.entry_type,
      amount: Number(data.amount),
      balanceAfter: Number(data.balance_after),
      description: data.description || undefined,
      referenceType: data.reference_type || undefined,
      referenceId: data.reference_id || undefined,
      createdAt: data.created_at,
    };
  }
}
