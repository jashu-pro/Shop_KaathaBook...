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

    let ledgerQuery = supabase
      .from('ledger_entries')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('entry_date', { ascending: true });

    let paymentsQuery = supabase
      .from('payments')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });

    let salesQuery = supabase
      .from('sales')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });

    if (customerId) {
      ledgerQuery = ledgerQuery.eq('customer_id', customerId);
      paymentsQuery = paymentsQuery.eq('customer_id', customerId);
      salesQuery = salesQuery.eq('customer_id', customerId);
    }
    if (startDate) {
      ledgerQuery = ledgerQuery.gte('entry_date', startDate);
      paymentsQuery = paymentsQuery.gte('payment_date', startDate);
      salesQuery = salesQuery.gte('sale_date', startDate);
    }
    if (endDate) {
      ledgerQuery = ledgerQuery.lte('entry_date', endDate);
      paymentsQuery = paymentsQuery.lte('payment_date', endDate);
      salesQuery = salesQuery.lte('sale_date', endDate);
    }

    const [ledgerRes, paymentsRes, salesRes] = await Promise.all([ledgerQuery, paymentsQuery, salesQuery]);

    const combined: LedgerEntry[] = [];
    const seenPaymentIds = new Set<string>();
    const seenSaleIds = new Set<string>();

    if (ledgerRes.data) {
      ledgerRes.data.forEach((d: any) => {
        const mapped = this.mapEntry(d);
        combined.push(mapped);
        if (d.reference_type === 'payment' && d.reference_id) {
          seenPaymentIds.add(d.reference_id);
        }
        if (d.reference_type === 'sale' && d.reference_id) {
          seenSaleIds.add(d.reference_id);
        }
      });
    }

    // Merge payments not already in ledger_entries as Jama (credit)
    if (paymentsRes.data) {
      paymentsRes.data.forEach((p: any) => {
        if (!seenPaymentIds.has(p.id)) {
          combined.push({
            id: `pay-${p.id}`,
            shopId: p.shop_id,
            customerId: p.customer_id,
            customerName: p.customers?.name,
            customerPhone: p.customers?.phone,
            entryDate: p.payment_date || p.created_at,
            entryType: 'credit',
            amount: Number(p.amount || 0),
            balanceAfter: 0,
            description: p.notes || `Payment Received (${(p.payment_method || 'cash').toUpperCase()}) ${p.reference_no ? `#${p.reference_no}` : ''}`,
            referenceType: 'payment',
            referenceId: p.id,
            createdAt: p.created_at,
          });
        }
      });
    }

    // Merge sales not already in ledger_entries as Udhaar (debit) if ledger_entries is missing them
    if (salesRes.data && (!ledgerRes.data || ledgerRes.data.length === 0)) {
      salesRes.data.forEach((s: any) => {
        if (!seenSaleIds.has(s.id)) {
          combined.push({
            id: `sale-${s.id}`,
            shopId: s.shop_id,
            customerId: s.customer_id,
            customerName: s.customers?.name,
            customerPhone: s.customers?.phone,
            entryDate: s.sale_date || s.created_at,
            entryType: 'debit',
            amount: Number(s.total_amount || 0),
            balanceAfter: 0,
            description: `Credit Bill (${s.invoice_no})`,
            referenceType: 'sale',
            referenceId: s.id,
            createdAt: s.created_at,
          });
        }
      });
    }

    // Sort chronologically ascending to compute running balances correctly
    combined.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    const customerBalMap: { [cust: string]: number } = {};
    let globalRunningBal = 0;

    combined.forEach((entry) => {
      if (customerId) {
        if (entry.entryType === 'debit') globalRunningBal += entry.amount;
        else globalRunningBal -= entry.amount;
        entry.balanceAfter = globalRunningBal;
      } else {
        const cId = entry.customerId || 'unknown';
        if (!customerBalMap[cId]) customerBalMap[cId] = 0;
        if (entry.entryType === 'debit') customerBalMap[cId] += entry.amount;
        else customerBalMap[cId] -= entry.amount;
        entry.balanceAfter = customerBalMap[cId];
      }
    });

    return combined.reverse();
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Calculate current customer balance
    const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', dto.customerId).maybeSingle();
    const currentBal = Number(cust?.current_balance || 0);
    const balanceAfter = dto.entryType === 'debit' ? currentBal + dto.amount : Math.max(0, currentBal - dto.amount);

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
    let filteredLedger = rawEntries.map((d: any) => this.mapEntry(d));

    if (customerId) filteredLedger = filteredLedger.filter((e) => e.customerId === customerId);

    const payments = await LocalStorageDB.select('payments', (p: any) => p.shop_id === shopId);
    const sales = await LocalStorageDB.select('sales', (s: any) => s.shop_id === shopId);

    const combined: LedgerEntry[] = [...filteredLedger];
    const seenPaymentIds = new Set<string>();
    const seenSaleIds = new Set<string>();

    filteredLedger.forEach((entry) => {
      if (entry.referenceType === 'payment' && entry.referenceId) {
        seenPaymentIds.add(entry.referenceId);
      }
      if (entry.referenceType === 'sale' && entry.referenceId) {
        seenSaleIds.add(entry.referenceId);
      }
    });

    payments.forEach((p: any) => {
      if (!customerId || p.customer_id === customerId) {
        if (!seenPaymentIds.has(p.id)) {
          combined.push({
            id: `pay-${p.id}`,
            shopId: p.shop_id,
            customerId: p.customer_id,
            customerName: p.customer_name,
            customerPhone: p.customer_phone,
            entryDate: p.payment_date || p.created_at,
            entryType: 'credit',
            amount: Number(p.amount),
            balanceAfter: 0,
            description: p.notes || `Payment Received (${(p.payment_method || 'cash').toUpperCase()}) ${p.reference_no ? `#${p.reference_no}` : ''}`,
            referenceType: 'payment',
            referenceId: p.id,
            createdAt: p.created_at,
          });
        }
      }
    });

    if (filteredLedger.length === 0) {
      sales.forEach((s: any) => {
        if (!customerId || s.customer_id === customerId) {
          if (!seenSaleIds.has(s.id)) {
            const owed = Number(s.total_amount - (s.amount_paid || 0));
            if (owed > 0) {
              combined.push({
                id: `sale-${s.id}`,
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
        }
      });
    }

    // Chronological order for running balance
    combined.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    const customerBalMap: { [cust: string]: number } = {};
    let globalRunningBal = 0;

    combined.forEach((entry) => {
      if (customerId) {
        if (entry.entryType === 'debit') globalRunningBal += entry.amount;
        else globalRunningBal -= entry.amount;
        entry.balanceAfter = globalRunningBal;
      } else {
        const cId = entry.customerId || 'unknown';
        if (!customerBalMap[cId]) customerBalMap[cId] = 0;
        if (entry.entryType === 'debit') customerBalMap[cId] += entry.amount;
        else customerBalMap[cId] -= entry.amount;
        entry.balanceAfter = customerBalMap[cId];
      }
    });

    return combined.reverse();
  }

  async createLedgerEntry(shopId: string, dto: CreateLedgerEntryDTO): Promise<LedgerEntry> {
    const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
    const currentBal = Number(cust?.current_balance || 0);
    const balanceAfter = dto.entryType === 'debit' ? currentBal + dto.amount : Math.max(0, currentBal - dto.amount);

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
