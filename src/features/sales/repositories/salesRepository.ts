/* sales/repositories/salesRepository.ts */
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface SaleItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

export interface Sale {
  id: string;
  shopId: string;
  customerId?: string;
  invoiceNo: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
  paymentMethod?: string;
  billImageUrl?: string;
  notes?: string;
  items: SaleItem[];
}

export interface ISaleRepository {
  list(shopId: string): Promise<Sale[]>;
  getById(id: string): Promise<Sale | null>;
  create(sale: Omit<Sale, 'id' | 'saleDate' | 'invoiceNo'>): Promise<Sale>;
}

export class SupabaseSaleRepository implements ISaleRepository {
  async list(shopId: string): Promise<Sale[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('shop_id', shopId)
      .order('sale_date', { ascending: false });

    if (error || !data) return [];
    return data.map((s: any) => ({
      id: s.id,
      shopId: s.shop_id,
      customerId: s.customer_id || undefined,
      invoiceNo: s.invoice_no,
      saleDate: s.sale_date,
      subtotal: Number(s.subtotal),
      taxAmount: Number(s.tax_amount),
      discountAmount: Number(s.discount_amount),
      totalAmount: Number(s.total_amount),
      amountPaid: Number(s.amount_paid),
      paymentStatus: s.payment_status,
      paymentMethod: s.payment_method || undefined,
      billImageUrl: s.bill_image_url || undefined,
      notes: s.notes || undefined,
      items: (s.sale_items || []).map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
        taxRate: Number(i.tax_rate),
      })),
    }));
  }

  async getById(id: string): Promise<Sale | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id || undefined,
      invoiceNo: data.invoice_no,
      saleDate: data.sale_date,
      subtotal: Number(data.subtotal),
      taxAmount: Number(data.tax_amount),
      discountAmount: Number(data.discount_amount),
      totalAmount: Number(data.total_amount),
      amountPaid: Number(data.amount_paid),
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method || undefined,
      billImageUrl: data.bill_image_url || undefined,
      notes: data.notes || undefined,
      items: (data.sale_items || []).map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
        taxRate: Number(i.tax_rate),
      })),
    };
  }

  async create(sale: Omit<Sale, 'id' | 'saleDate' | 'invoiceNo'>): Promise<Sale> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    // Insert sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        shop_id: sale.shopId,
        customer_id: sale.customerId || null,
        invoice_no: invoiceNo,
        subtotal: sale.subtotal,
        tax_amount: sale.taxAmount,
        discount_amount: sale.discountAmount,
        total_amount: sale.totalAmount,
        amount_paid: sale.amountPaid,
        payment_status: sale.paymentStatus,
        payment_method: sale.paymentMethod || null,
        bill_image_url: sale.billImageUrl || null,
        notes: sale.notes || null,
      })
      .select()
      .single();

    if (saleError || !saleData) throw saleError || new Error('Failed to save sale header');

    // Insert sale items
    const itemsToInsert = sale.items.map((item) => ({
      sale_id: saleData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      tax_rate: item.taxRate,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    return {
      ...sale,
      id: saleData.id,
      invoiceNo: saleData.invoice_no,
      saleDate: saleData.sale_date,
    };
  }
}

export class LocalSaleRepository implements ISaleRepository {
  async list(shopId: string): Promise<Sale[]> {
    const list = await LocalStorageDB.select('sales', (s: any) => s.shop_id === shopId);
    // Hydrate items
    const result: Sale[] = [];
    for (const s of list) {
      const items = await LocalStorageDB.select('sale_items', (i: any) => i.sale_id === s.id);
      result.push({
        id: s.id,
        shopId: s.shop_id,
        customerId: s.customer_id || undefined,
        invoiceNo: s.invoice_no,
        saleDate: s.created_at,
        subtotal: Number(s.subtotal),
        taxAmount: Number(s.tax_amount),
        discountAmount: Number(s.discount_amount),
        totalAmount: Number(s.total_amount),
        amountPaid: Number(s.amount_paid),
        paymentStatus: s.payment_status,
        paymentMethod: s.payment_method || undefined,
        billImageUrl: s.bill_image_url || undefined,
        notes: s.notes || undefined,
        items: items.map((i: any) => ({
          id: i.id,
          productId: i.product_id,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unit_price),
          totalPrice: Number(i.total_price),
          taxRate: Number(i.tax_rate),
        })),
      });
    }
    return result;
  }

  async getById(id: string): Promise<Sale | null> {
    const s = await LocalStorageDB.selectOne('sales', (item: any) => item.id === id);
    if (!s) return null;
    const items = await LocalStorageDB.select('sale_items', (i: any) => i.sale_id === s.id);
    return {
      id: s.id,
      shopId: s.shop_id,
      customerId: s.customer_id || undefined,
      invoiceNo: s.invoice_no,
      saleDate: s.created_at,
      subtotal: Number(s.subtotal),
      taxAmount: Number(s.tax_amount),
      discountAmount: Number(s.discount_amount),
      totalAmount: Number(s.total_amount),
      amountPaid: Number(s.amount_paid),
      paymentStatus: s.payment_status,
      paymentMethod: s.payment_method || undefined,
      billImageUrl: s.bill_image_url || undefined,
      notes: s.notes || undefined,
      items: items.map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.total_price),
        taxRate: Number(i.tax_rate),
      })),
    };
  }

  async create(sale: Omit<Sale, 'id' | 'saleDate' | 'invoiceNo'>): Promise<Sale> {
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const saleData = await LocalStorageDB.insert('sales', {
      shop_id: sale.shopId,
      customer_id: sale.customerId || null,
      invoice_no: invoiceNo,
      subtotal: sale.subtotal,
      tax_amount: sale.taxAmount,
      discount_amount: sale.discountAmount,
      total_amount: sale.totalAmount,
      amount_paid: sale.amountPaid,
      payment_status: sale.paymentStatus,
      payment_method: sale.paymentMethod || null,
      bill_image_url: sale.billImageUrl || null,
      notes: sale.notes || null,
    });

    for (const item of sale.items) {
      await LocalStorageDB.insert('sale_items', {
        sale_id: saleData.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        tax_rate: item.taxRate,
      });

      // Adjust mock product inventory directly since DB triggers aren't running in localStorage
      const product = await LocalStorageDB.selectOne('products', (p: any) => p.id === item.productId);
      if (product) {
        await LocalStorageDB.update('products', (p: any) => p.id === item.productId, {
          stock_qty: Number(product.stock_qty) - item.quantity,
        });
      }
    }

    return {
      ...sale,
      id: saleData.id,
      invoiceNo: saleData.invoice_no,
      saleDate: saleData.created_at,
    };
  }
}
