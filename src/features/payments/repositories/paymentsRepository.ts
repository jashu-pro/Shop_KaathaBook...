/* payments/repositories/paymentsRepository.ts */
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface Payment {
  id: string;
  shopId: string;
  customerId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'phonepe' | 'gpay' | 'paytm' | 'bank_transfer';
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface IPaymentRepository {
  list(shopId: string, customerId?: string): Promise<Payment[]>;
  create(payment: Omit<Payment, 'id' | 'paymentDate' | 'createdAt'>): Promise<Payment>;
}

export class SupabasePaymentRepository implements IPaymentRepository {
  async list(shopId: string, customerId?: string): Promise<Payment[]> {
    if (!supabase) return [];
    let query = supabase.from('payments').select('*').eq('shop_id', shopId);
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map((p: any) => ({
      id: p.id,
      shopId: p.shop_id,
      customerId: p.customer_id,
      paymentDate: p.payment_date,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      referenceNo: p.reference_no || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at,
    }));
  }

  async create(payment: Omit<Payment, 'id' | 'paymentDate' | 'createdAt'>): Promise<Payment> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('payments')
      .insert({
        shop_id: payment.shopId,
        customer_id: payment.customerId,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        reference_no: payment.referenceNo || null,
        notes: payment.notes || null,
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create payment');
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      paymentDate: data.payment_date,
      amount: Number(data.amount),
      paymentMethod: data.payment_method,
      referenceNo: data.reference_no || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }
}

export class LocalPaymentRepository implements IPaymentRepository {
  async list(shopId: string, customerId?: string): Promise<Payment[]> {
    const list = await LocalStorageDB.select('payments', (p: any) => {
      if (p.shop_id !== shopId) return false;
      if (customerId && p.customer_id !== customerId) return false;
      return true;
    });

    return list.map((p: any) => ({
      id: p.id,
      shopId: p.shop_id,
      customerId: p.customer_id,
      paymentDate: p.created_at,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      referenceNo: p.reference_no || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at,
    }));
  }

  async create(payment: Omit<Payment, 'id' | 'paymentDate' | 'createdAt'>): Promise<Payment> {
    const data = await LocalStorageDB.insert('payments', {
      shop_id: payment.shopId,
      customer_id: payment.customerId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      reference_no: payment.referenceNo || null,
      notes: payment.notes || null,
    });

    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id,
      paymentDate: data.created_at,
      amount: Number(data.amount),
      paymentMethod: data.payment_method,
      referenceNo: data.reference_no || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }
}
