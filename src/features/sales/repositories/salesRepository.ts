/* features/sales/repositories/salesRepository.ts */
import type { Sale, CreateSaleDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface ISaleRepository {
  listSales(shopId: string): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale | null>;
  createSale(shopId: string, dto: CreateSaleDTO): Promise<Sale>;
  deleteSale(id: string): Promise<void>;
}

export class SupabaseSaleRepository implements ISaleRepository {
  private mapSale(data: any): Sale {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id || undefined,
      customerName: data.customers?.name || undefined,
      customerPhone: data.customers?.phone || undefined,
      invoiceNo: data.invoice_no,
      saleDate: data.sale_date,
      subtotal: Number(data.subtotal || 0),
      taxAmount: Number(data.tax_amount || 0),
      discountAmount: Number(data.discount_amount || 0),
      totalAmount: Number(data.total_amount || 0),
      amountPaid: Number(data.amount_paid || 0),
      paymentStatus: data.payment_status || 'unpaid',
      paymentMethod: data.payment_method || undefined,
      billImageUrl: data.bill_image_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }

  async listSales(shopId: string): Promise<Sale[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name, phone)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d) => this.mapSale(d));
  }

  async getSaleById(id: string): Promise<Sale | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name, phone), sale_items(*, products(name))')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    const sale = this.mapSale(data);
    if (data.sale_items) {
      sale.items = data.sale_items.map((item: any) => ({
        id: item.id,
        saleId: item.sale_id,
        productId: item.product_id,
        productName: item.products?.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        taxRate: Number(item.tax_rate || 0),
      }));
    }
    return sale;
  }

  async createSale(shopId: string, dto: CreateSaleDTO): Promise<Sale> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = dto.invoiceNo || `INV-${dateStr}-${randomSuffix}`;

    const dueAmount = Math.max(0, dto.totalAmount - dto.amountPaid);
    let status: 'paid' | 'partially_paid' | 'unpaid' = dto.paymentStatus;
    if (dto.amountPaid >= dto.totalAmount) status = 'paid';
    else if (dto.amountPaid > 0) status = 'partially_paid';
    else status = 'unpaid';

    // Insert Sale
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert({
        shop_id: shopId,
        customer_id: dto.customerId || null,
        invoice_no: invoiceNo,
        subtotal: dto.subtotal,
        tax_amount: dto.taxAmount || 0,
        discount_amount: dto.discountAmount || 0,
        total_amount: dto.totalAmount,
        amount_paid: dto.amountPaid,
        payment_status: status,
        payment_method: dto.paymentMethod || 'credit',
        bill_image_url: dto.billImageUrl || null,
        notes: dto.notes || null,
      })
      .select('*, customers(name, phone)')
      .single();

    if (saleErr || !saleData) throw saleErr || new Error('Failed to create sale record');

    // Insert Sale Items
    if (dto.items && dto.items.length > 0) {
      const itemsToInsert = dto.items.map((item) => ({
        sale_id: saleData.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        tax_rate: item.taxRate || 0,
      }));

      await supabase.from('sale_items').insert(itemsToInsert);

      // Deduct stock for each product
      for (const item of dto.items) {
        const { data: prod } = await supabase.from('products').select('stock_qty').eq('id', item.productId).maybeSingle();
        if (prod) {
          const newQty = Math.max(0, Number(prod.stock_qty) - item.quantity);
          await supabase.from('products').update({ stock_qty: newQty }).eq('id', item.productId);
          await supabase.from('stock_movements').insert({
            shop_id: shopId,
            product_id: item.productId,
            type: 'out',
            quantity: item.quantity,
            reason: `Sale ${invoiceNo}`,
          });
        }
      }
    }

    // Update Customer Udhaar Balance if due > 0
    if (dto.customerId && dueAmount > 0) {
      const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', dto.customerId).maybeSingle();
      if (cust) {
        const newBalance = Number(cust.current_balance || 0) + dueAmount;
        await supabase.from('customers').update({ current_balance: newBalance }).eq('id', dto.customerId);
      }
    }

    // Record Payment in payments table if amountPaid > 0
    let paymentId: string | undefined;
    if (dto.amountPaid > 0 && dto.customerId) {
      const { data: pData } = await supabase.from('payments').insert({
        shop_id: shopId,
        customer_id: dto.customerId,
        amount: dto.amountPaid,
        payment_method: dto.paymentMethod || 'cash',
        notes: `Immediate payment paid for sale ${invoiceNo}`,
      }).select('id').maybeSingle();
      if (pData) paymentId = pData.id;
    }

    // Record Ledger Entry in ledger_entries table
    if (dto.customerId) {
      const { data: cust } = await supabase.from('customers').select('current_balance').eq('id', dto.customerId).maybeSingle();
      const currentBal = Number(cust?.current_balance || 0);

      // Debit (Udhaar) for total sale bill
      await supabase.from('ledger_entries').insert({
        shop_id: shopId,
        customer_id: dto.customerId,
        entry_date: new Date().toISOString(),
        entry_type: 'debit',
        amount: dto.totalAmount,
        balance_after: currentBal,
        description: `Sale ${invoiceNo}`,
        reference_type: 'sale',
        reference_id: saleData.id,
      });

      // Credit (Jama) for amount paid if > 0
      if (dto.amountPaid > 0 && paymentId) {
        await supabase.from('ledger_entries').insert({
          shop_id: shopId,
          customer_id: dto.customerId,
          entry_date: new Date().toISOString(),
          entry_type: 'credit',
          amount: dto.amountPaid,
          balance_after: currentBal,
          description: `Payment for Sale (${invoiceNo})`,
          reference_type: 'payment',
          reference_id: paymentId,
        });
      }
    }

    return this.mapSale(saleData);
  }

  async deleteSale(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('sales').delete().eq('id', id);
  }
}

export class LocalSaleRepository implements ISaleRepository {
  private mapSale(data: any): Sale {
    return {
      id: data.id,
      shopId: data.shop_id,
      customerId: data.customer_id || undefined,
      customerName: data.customer_name || undefined,
      customerPhone: data.customer_phone || undefined,
      invoiceNo: data.invoice_no,
      saleDate: data.sale_date || data.created_at,
      subtotal: Number(data.subtotal || 0),
      taxAmount: Number(data.tax_amount || 0),
      discountAmount: Number(data.discount_amount || 0),
      totalAmount: Number(data.total_amount || 0),
      amountPaid: Number(data.amount_paid || 0),
      paymentStatus: data.payment_status || 'unpaid',
      paymentMethod: data.payment_method || undefined,
      billImageUrl: data.bill_image_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
    };
  }

  async listSales(shopId: string): Promise<Sale[]> {
    const data = await LocalStorageDB.select('sales', (s: any) => s.shop_id === shopId);
    return data.map((d: any) => this.mapSale(d));
  }

  async getSaleById(id: string): Promise<Sale | null> {
    const data = await LocalStorageDB.selectOne('sales', (s: any) => s.id === id);
    if (!data) return null;
    const sale = this.mapSale(data);
    const itemsData = await LocalStorageDB.select('sale_items', (i: any) => i.sale_id === id);
    sale.items = itemsData.map((item: any) => ({
      id: item.id,
      saleId: item.sale_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
      taxRate: Number(item.tax_rate || 0),
    }));
    return sale;
  }

  async createSale(shopId: string, dto: CreateSaleDTO): Promise<Sale> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = dto.invoiceNo || `INV-${dateStr}-${randomSuffix}`;

    const dueAmount = Math.max(0, dto.totalAmount - dto.amountPaid);
    let status: 'paid' | 'partially_paid' | 'unpaid' = dto.paymentStatus;
    if (dto.amountPaid >= dto.totalAmount) status = 'paid';
    else if (dto.amountPaid > 0) status = 'partially_paid';
    else status = 'unpaid';

    // Get customer name if selected
    let customerName: string | undefined;
    let customerPhone: string | undefined;
    if (dto.customerId) {
      const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
      if (cust) {
        customerName = cust.name;
        customerPhone = cust.phone;
      }
    }

    const saleRecord = await LocalStorageDB.insert('sales', {
      shop_id: shopId,
      customer_id: dto.customerId || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      invoice_no: invoiceNo,
      subtotal: dto.subtotal,
      tax_amount: dto.taxAmount || 0,
      discount_amount: dto.discountAmount || 0,
      total_amount: dto.totalAmount,
      amount_paid: dto.amountPaid,
      payment_status: status,
      payment_method: dto.paymentMethod || 'credit',
      bill_image_url: dto.billImageUrl || null,
      notes: dto.notes || null,
    });

    // Save items & update stock
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const prod = await LocalStorageDB.selectOne('products', (p: any) => p.id === item.productId);
        await LocalStorageDB.insert('sale_items', {
          sale_id: saleRecord.id,
          product_id: item.productId,
          product_name: prod ? prod.name : 'Item',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          tax_rate: item.taxRate || 0,
        });

        if (prod) {
          const newQty = Math.max(0, Number(prod.stock_qty || 0) - item.quantity);
          await LocalStorageDB.update('products', (p: any) => p.id === item.productId, { stock_qty: newQty });
          await LocalStorageDB.insert('stock_movements', {
            shop_id: shopId,
            product_id: item.productId,
            product_name: prod.name,
            type: 'out',
            quantity: item.quantity,
            reason: `Sale ${invoiceNo}`,
          });
        }
      }
    }

    // Update Customer Udhaar balance
    if (dto.customerId && dueAmount > 0) {
      const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
      if (cust) {
        const newBalance = Number(cust.current_balance || 0) + dueAmount;
        await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: newBalance });
      }
    }

    // Insert Payment into payments if amountPaid > 0
    let paymentRecordId: string | undefined;
    if (dto.amountPaid > 0 && dto.customerId) {
      const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
      const pRecord = await LocalStorageDB.insert('payments', {
        shop_id: shopId,
        customer_id: dto.customerId,
        customer_name: cust?.name || null,
        amount: dto.amountPaid,
        payment_method: dto.paymentMethod || 'cash',
        notes: `Immediate payment paid for sale ${invoiceNo}`,
      });
      paymentRecordId = pRecord.id;
    }

    // Insert Ledger Entry
    if (dto.customerId) {
      const cust = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
      const currentBal = Number(cust?.current_balance || 0);

      // Debit (Udhaar) for total sale bill
      await LocalStorageDB.insert('ledger_entries', {
        shop_id: shopId,
        customer_id: dto.customerId,
        customer_name: cust?.name || null,
        entry_date: new Date().toISOString(),
        entry_type: 'debit',
        amount: dto.totalAmount,
        balance_after: currentBal,
        description: `Sale ${invoiceNo}`,
        reference_type: 'sale',
        reference_id: saleRecord.id,
      });

      // Credit (Jama) for amount paid if > 0
      if (dto.amountPaid > 0 && paymentRecordId) {
        await LocalStorageDB.insert('ledger_entries', {
          shop_id: shopId,
          customer_id: dto.customerId,
          customer_name: cust?.name || null,
          entry_date: new Date().toISOString(),
          entry_type: 'credit',
          amount: dto.amountPaid,
          balance_after: currentBal,
          description: `Payment for Sale (${invoiceNo})`,
          reference_type: 'payment',
          reference_id: paymentRecordId,
        });
      }
    }

    return this.mapSale(saleRecord);
  }

  async deleteSale(id: string): Promise<void> {
    await LocalStorageDB.delete('sales', (s: any) => s.id === id);
    await LocalStorageDB.delete('sale_items', (i: any) => i.sale_id === id);
  }
}
