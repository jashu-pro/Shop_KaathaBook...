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
      .order('entry_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (startDate) query = query.gte('entry_date', startDate);
    if (endDate) query = query.lte('entry_date', endDate);

    const { data, error } = await query;

    // If explicit ledger_entries present, map them
    if (!error && data && data.length > 0) {
      return data.map((d) => this.mapEntry(d));
    }

    // Fallback: Combine Sales & Payments into unified Bahi Ledger with running balances!
    let salesQuery = supabase.from('sales').select('*, customers(name, phone)').eq('shop_id', shopId);
    let paymentsQuery = supabase.from('payments').select('*, customers(name, phone)').eq('shop_id', shopId);

    if (customerId) {
      salesQuery = salesQuery.eq('customer_id', customerId);
      paymentsQuery = paymentsQuery.eq('customer_id', customerId);
    }

    const [salesRes, paymentsRes] = await Promise.all([salesQuery, paymentsQuery]);

    const combined: LedgerEntry[] = [];

    if (salesRes.data) {
      salesRes.data.forEach((s: any) => {
        combined.push({
          id: s.id,
          shopId: s.shop_id,
          customerId: s.customer_id,
          customerName: s.customers?.name,
          customerPhone: s.customers?.phone,
          entryDate: s.sale_date || s.created_at,
          entryType: 'debit',
          amount: Number(s.total_amount - (s.amount_paid || 0)),
          balanceAfter: 0,
          description: `Credit Bill (${s.invoice_no})`,
          referenceType: 'sale',
          referenceId: s.id,
          createdAt: s.created_at,
        });
      });
    }

    if (paymentsRes.data) {
      paymentsRes.data.forEach((p: any) => {
        combined.push({
          id: p.id,
          shopId: p.shop_id,
          customerId: p.customer_id,
          customerName: p.customers?.name,
          customerPhone: p.customers?.phone,
          entryDate: p.payment_date || p.created_at,
          entryType: 'credit',
          amount: Number(p.amount),
          balanceAfter: 0,
          description: `Payment Received (${(p.payment_method || 'cash').toUpperCase()}) ${p.reference_no ? `#${p.reference_no}` : ''}`,
          referenceType: 'payment',
          referenceId: p.id,
          createdAt: p.created_at,
        });
      });
    }

    // Sort chronologically ascending to compute running balance
    combined.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let runningBal = 0;
    combined.forEach((entry) => {
      if (entry.entryType === 'debit') runningBal += entry.amount;
      else runningBal -= entry.amount;
      entry.balanceAfter = runningBal;
    });

    // Return descending for display
    return combined.reverse();
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Calculate current customer balance
    const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', dto.customerId).maybeSingle();
    const currentBal = Number(cust?.current_balance || 0);
    const balanceAfter = dto.entryType === 'debit' ? currentBal + dto.amount : currentBal - dto.amount;

    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        shop_id: shopId,
        customer_id: dto.customerId,
        entry_date: dto.entryDate || new Date().toISOString(),
        entry_type: dto.entryType,
        amount: dto.amount,
        balance_after: balanceAfter,
        description: dto.description || null,
        reference_type: dto.referenceType || null,
        reference_id: dto.referenceId || null,
      })
      .select('*, customers(name, phone)')
      .single();

    if (error || !data) throw error || new Error('Failed to create ledger entry');

    // Update customer balance
    await supabase.from('customers').update({ current_balance: balanceAfter }).eq('id', dto.customerId);

    return this.mapEntry(data);
  }

  async deleteLedgerEntry(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('ledger_entries').delete().eq('id', id);
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
    _startDate?: string,
    _endDate?: string
  ): Promise<LedgerEntry[]> {
    const rawEntries = await LocalStorageDB.select('ledger_entries', (e: any) => e.shop_id === shopId);
    let filtered = rawEntries.map((d: any) => this.mapEntry(d));

    if (customerId) filtered = filtered.filter((e) => e.customerId === customerId);

    // If explicit ledger_entries present
    if (filtered.length > 0) {
      return filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }

    // Combine local sales & payments into unified Bahi Khatta ledger
    const sales = await LocalStorageDB.select('sales', (s: any) => s.shop_id === shopId);
    const payments = await LocalStorageDB.select('payments', (p: any) => p.shop_id === shopId);

    const combined: LedgerEntry[] = [];

    sales.forEach((s: any) => {
      if (!customerId || s.customer_id === customerId) {
        const owed = Number(s.total_amount - (s.amount_paid || 0));
        if (owed > 0) {
          combined.push({
            id: s.id,
            shopId: s.shop_id,
            customerId: s.customer_id,
            customerName: s.customer_name,
            customerPhone: s.customer_phone,
            entryDate: s.sale_date || s.created_at,
            entryType: 'debit',
            amount: owed,
            balanceAfter: 0,
            description: `Credit Bill (${s.invoice_no})`,
            referenceType: 'sale',
            referenceId: s.id,
            createdAt: s.created_at,
          });
        }
      }
    });

    payments.forEach((p: any) => {
      if (!customerId || p.customer_id === customerId) {
        combined.push({
          id: p.id,
          shopId: p.shop_id,
          customerId: p.customer_id,
          customerName: p.customer_name,
          customerPhone: p.customer_phone,
          entryDate: p.payment_date || p.created_at,
          entryType: 'credit',
          amount: Number(p.amount),
          balanceAfter: 0,
          description: `Payment Received (${(p.payment_method || 'cash').toUpperCase()}) ${p.reference_no ? `#${p.reference_no}` : ''}`,
          referenceType: 'payment',
          referenceId: p.id,
          createdAt: p.created_at,
        });
      }
    });

    // Chronological order for running balance
    combined.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let runningBal = 0;
    combined.forEach((entry) => {
      if (entry.entryType === 'debit') runningBal += entry.amount;
      else runningBal -= entry.amount;
      entry.balanceAfter = runningBal;
    });

    return combined.reverse();
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
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
      reference_type: dto.referenceType || null,
      reference_id: dto.referenceId || null,
    });

    if (cust) {
      await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: balanceAfter });
    }

    return this.mapEntry(record);
  }

  async deleteLedgerEntry(id: string): Promise<void> {
    await LocalStorageDB.delete('ledger_entries', (e: any) => e.id === id);
  }
}
