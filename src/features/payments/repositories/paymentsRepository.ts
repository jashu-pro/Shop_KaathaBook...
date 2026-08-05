/* features/payments/repositories/paymentsRepository.ts */
import type { Payment, CreatePaymentDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IPaymentRepository {
  listPayments(shopId: string): Promise<Payment[]>;
  getPaymentById(id: string): Promise<Payment | null>;
  createPayment(shopId: string, dto: CreatePaymentDTO): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
}

export class SupabasePaymentRepository implements IPaymentRepository {
  private mapPayment(data: any): Payment {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      customerName: data.customers?.name || undefined,
      customerPhone: data.customers?.phone || undefined,
      paymentDate: data.payment_date || data.created_at,
      amount: Number(data.amount || 0),
      paymentMethod: data.payment_method || 'cash',
      referenceNo: data.reference_no || undefined,
      proofImageUrl: data.proof_image_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }

  async listPayments(shopId: string): Promise<Payment[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('payments')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d) => this.mapPayment(d));
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('payments')
      .select('*, customers(name, phone)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapPayment(data);
  }

  async createPayment(shopId: string, dto: CreatePaymentDTO): Promise<Payment> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('payments')
      .insert({
        shop_id: shopId,
        customer_id: dto.customerId,
        amount: dto.amount,
        payment_method: dto.paymentMethod,
        reference_no: dto.referenceNo || null,
        proof_image_url: dto.proofImageUrl || null,
        notes: dto.notes || null,
      })
      .select('*, customers(name, phone)')
      .single();

    if (error || !data) throw error || new Error('Failed to record payment');

    // Deduct payment amount from customer's current balance (Udhaar)
    const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', dto.customerId).maybeSingle();
    if (cust) {
      const newBalance = Number(cust.current_balance || 0) - dto.amount;
      await supabase.from('customers').update({ current_balance: newBalance }).eq('id', dto.customerId);
    }

    return this.mapPayment(data);
  }

  async deletePayment(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('payments').delete().eq('id', id);
  }
}

export class LocalPaymentRepository implements IPaymentRepository {
  private mapPayment(data: any): Payment {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      customerName: data.customer_name || undefined,
      customerPhone: data.customer_phone || undefined,
      paymentDate: data.payment_date || data.created_at,
      amount: Number(data.amount || 0),
      paymentMethod: data.payment_method || 'cash',
      referenceNo: data.reference_no || undefined,
      proofImageUrl: data.proof_image_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }

  async listPayments(shopId: string): Promise<Payment[]> {
    const data = await LocalStorageDB.select('payments', (p: any) => p.shop_id === shopId);
    return data.map((d: any) => this.mapPayment(d));
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const data = await LocalStorageDB.selectOne('payments', (p: any) => p.id === id);
    if (!data) return null;
    return this.mapPayment(data);
  }

  async createPayment(shopId: string, dto: CreatePaymentDTO): Promise<Payment> {
    let customerName: string | undefined;
    let customerPhone: string | undefined;
    const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
    if (cust) {
      customerName = cust.name;
      customerPhone = cust.phone;
    }

    const record = await LocalStorageDB.insert('payments', {
      shop_id: shopId,
      customer_id: dto.customerId,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      amount: dto.amount,
      payment_method: dto.paymentMethod,
      reference_no: dto.referenceNo || null,
      proof_image_url: dto.proofImageUrl || null,
      notes: dto.notes || null,
    });

    // Deduct payment amount from customer's current balance
    if (cust) {
      const newBalance = Number(cust.current_balance || 0) - dto.amount;
      await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: newBalance });
    }

    return this.mapPayment(record);
  }

  async deletePayment(id: string): Promise<void> {
    await LocalStorageDB.delete('payments', (p: any) => p.id === id);
  }
}
