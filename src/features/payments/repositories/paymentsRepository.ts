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

    const { data: paymentId, error } = await supabase.rpc('record_payment', {
      p_shop_id: shopId,
      p_customer_id: dto.customerId,
      p_amount: dto.amount,
      p_payment_method: dto.paymentMethod,
      p_reference_no: dto.referenceNo || null,
      p_proof_image_url: dto.proofImageUrl || null,
      p_notes: dto.notes || null,
    });
    if (error || !paymentId) throw error || new Error('Failed to record payment');

    const payment = await this.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment was recorded but could not be loaded');
    return payment;
  }

  async deletePayment(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.rpc('void_payment', { p_payment_id: id });
    if (error) throw error;
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
    if (dto.amount <= 0) throw new Error('Payment amount must be greater than zero');
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

    if (!cust || cust.shop_id !== shopId) throw new Error('Customer does not belong to this shop');
    const newBalance = Number(cust.current_balance || 0) - dto.amount;
    await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: newBalance });

    // Insert Credit (Jama) entry into ledger_entries
    await LocalStorageDB.insert('ledger_entries', {
      shop_id: shopId,
      customer_id: dto.customerId,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      entry_date: new Date().toISOString(),
      entry_type: 'credit',
      amount: dto.amount,
      balance_after: newBalance,
      description: dto.notes || `Payment Received (${(dto.paymentMethod || 'cash').toUpperCase()}) ${dto.referenceNo ? `#${dto.referenceNo}` : ''}`,
      reference_type: 'payment',
      reference_id: record.id,
    });

    return this.mapPayment(record);
  }

  async deletePayment(id: string): Promise<void> {
    const payment: any = await LocalStorageDB.selectOne('payments', (p: any) => p.id === id);
    if (!payment) throw new Error('Payment not found');
    if (payment.sale_id) throw new Error('Void the associated sale instead of its immediate payment');
    const customer: any = await LocalStorageDB.selectOne('customers', (c: any) => c.id === payment.customer_id);
    if (customer) {
      await LocalStorageDB.update('customers', (c: any) => c.id === payment.customer_id, {
        current_balance: Number(customer.current_balance || 0) + Number(payment.amount || 0),
      });
    }
    await LocalStorageDB.delete('ledger_entries', (entry: any) => entry.reference_id === id);
    await LocalStorageDB.delete('payments', (p: any) => p.id === id);
  }
}
