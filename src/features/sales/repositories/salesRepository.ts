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
    const { data: saleId, error } = await supabase.rpc('record_sale', {
      p_shop_id: shopId,
      p_customer_id: dto.customerId || null,
      p_invoice_no: invoiceNo,
      p_subtotal: dto.subtotal,
      p_tax_amount: dto.taxAmount || 0,
      p_discount_amount: dto.discountAmount || 0,
      p_total_amount: dto.totalAmount,
      p_amount_paid: dto.amountPaid,
      p_payment_method: dto.paymentMethod || 'cash',
      p_bill_image_url: dto.billImageUrl || null,
      p_notes: dto.notes || null,
      p_items: dto.items,
    });
    if (error || !saleId) throw error || new Error('Failed to record sale');

    const sale = await this.getSaleById(saleId);
    if (!sale) throw new Error('Sale was recorded but could not be loaded');
    return sale;
  }

  async deleteSale(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.rpc('void_sale', { p_sale_id: id });
    if (error) throw error;
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
      billImageUrls: data.bill_image_urls || (data.bill_image_url ? [data.bill_image_url] : []),
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
    if (dto.totalAmount < 0 || dto.amountPaid < 0 || dto.amountPaid > dto.totalAmount) {
      throw new Error('Invalid sale amounts');
    }
    if (!dto.items.length) throw new Error('A sale must contain at least one item');
    if (!dto.customerId && dto.amountPaid !== dto.totalAmount) {
      throw new Error('A customer is required for a credit sale');
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = dto.invoiceNo || `INV-${dateStr}-${randomSuffix}`;

    let status: 'paid' | 'partially_paid' | 'unpaid' | 'voided' = dto.paymentStatus;
    if (dto.amountPaid >= dto.totalAmount) status = 'paid';
    else if (dto.amountPaid > 0) status = 'partially_paid';
    else status = 'unpaid';

    const products: any[] = [];
    for (const item of dto.items) {
      let product: any = await LocalStorageDB.selectOne('products', (p: any) => p.id === item.productId && p.shop_id === shopId);
      if (!product && item.name) {
        product = await LocalStorageDB.selectOne('products', (p: any) => p.name?.toLowerCase() === item.name?.toLowerCase() && p.shop_id === shopId);
      }
      if (!product) {
        // Auto-create product for fast itemized retail billing (Step 3 & 4)
        product = await LocalStorageDB.insert('products', {
          shop_id: shopId,
          name: item.name || 'General Item',
          price: item.unitPrice,
          cost_price: 0,
          stock_qty: 1000,
          unit: item.unit || 'piece',
          sku: `SKU-${Date.now().toString().slice(-6)}`,
        });
      }
      if (Number(product.stock_qty || 0) < item.quantity) {
        const topup = item.quantity + 500;
        await LocalStorageDB.update('products', (p: any) => p.id === product.id, {
          stock_qty: topup,
        });
        product.stock_qty = topup;
      }
      item.productId = product.id;
      products.push(product);
    }


    let customerName: string | undefined;
    let balanceBefore = 0;
    if (dto.customerId) {
      const customer: any = await LocalStorageDB.selectOne('customers', (c: any) => c.id === dto.customerId);
      if (!customer) throw new Error('Customer does not belong to this shop');
      customerName = customer.name;
      balanceBefore = Number(customer.current_balance || 0);
    }

    const balanceAfterSale = balanceBefore + dto.totalAmount;
    const balanceAfterPayment = balanceAfterSale - dto.amountPaid;
    const images = dto.billImageUrls || (dto.billImageUrl ? [dto.billImageUrl] : []);

    const saleRecord = await LocalStorageDB.insert('sales', {
      shop_id: shopId,
      customer_id: dto.customerId || null,
      customer_name: customerName || null,
      invoice_no: invoiceNo,
      subtotal: dto.subtotal,
      tax_amount: dto.taxAmount || 0,
      discount_amount: dto.discountAmount || 0,
      total_amount: dto.totalAmount,
      amount_paid: dto.amountPaid,
      payment_status: status,
      payment_method: dto.paymentMethod || 'credit',
      bill_image_url: images[0] || null,
      bill_image_urls: images,
      notes: dto.notes || null,
    });

    // Save individual image attachments (Step 47-49)
    for (const img of images) {
      await LocalStorageDB.insert('sale_attachments', {
        shop_id: shopId,
        sale_id: saleRecord.id,
        file_url: img,
        created_at: new Date().toISOString(),
      });
    }

    for (const [index, item] of dto.items.entries()) {
      const product: any = products[index];
      await LocalStorageDB.insert('sale_items', {
        sale_id: saleRecord.id,
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        unit: item.unit || product.unit || 'piece',
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        tax_rate: item.taxRate || 0,
      });
      await LocalStorageDB.update('products', (p: any) => p.id === item.productId, {
        stock_qty: Number(product.stock_qty || 0) - item.quantity,
      });
      await LocalStorageDB.insert('stock_movements', {
        shop_id: shopId,
        product_id: item.productId,
        product_name: product.name,
        sale_id: saleRecord.id,
        type: 'out',
        quantity: item.quantity,
        reason: `Sale ${invoiceNo}`,
      });
    }

    // Insert Payment into payments if amountPaid > 0
    let paymentRecordId: string | undefined;
    if (dto.amountPaid > 0 && dto.customerId) {
      const pRecord = await LocalStorageDB.insert('payments', {
        shop_id: shopId,
        customer_id: dto.customerId,
        sale_id: saleRecord.id,
        customer_name: customerName || null,
        amount: dto.amountPaid,
        payment_method: dto.paymentMethod || 'cash',
        notes: `Immediate payment paid for sale ${invoiceNo}`,
      });
      paymentRecordId = pRecord.id;
    }

    // Insert Ledger Entry
    if (dto.customerId) {
      await LocalStorageDB.update('customers', (c: any) => c.id === dto.customerId, { current_balance: balanceAfterPayment });

      // Debit (Udhaar) for total sale bill
      await LocalStorageDB.insert('ledger_entries', {
        shop_id: shopId,
        customer_id: dto.customerId,
        customer_name: customerName || null,
        entry_date: new Date().toISOString(),
        entry_type: 'debit',
        amount: dto.totalAmount,
        balance_after: balanceAfterSale,
        description: `Sale ${invoiceNo}`,
        reference_type: 'sale',
        reference_id: saleRecord.id,
      });

      // Credit (Jama) for amount paid if > 0
      if (dto.amountPaid > 0 && paymentRecordId) {
        await LocalStorageDB.insert('ledger_entries', {
          shop_id: shopId,
          customer_id: dto.customerId,
          customer_name: customerName || null,
          entry_date: new Date().toISOString(),
          entry_type: 'credit',
          amount: dto.amountPaid,
          balance_after: balanceAfterPayment,
          description: `Payment for Sale (${invoiceNo})`,
          reference_type: 'payment',
          reference_id: paymentRecordId,
        });
      }
    }

    return this.mapSale(saleRecord);
  }

  async deleteSale(id: string): Promise<void> {
    const sale: any = await LocalStorageDB.selectOne('sales', (s: any) => s.id === id);
    if (!sale) throw new Error('Sale not found');
    if (sale.payment_status === 'voided') throw new Error('Sale is already voided');

    const nowIso = new Date().toISOString();

    // 1. Mark sale status as voided (Immutable state preservation)
    await LocalStorageDB.update('sales', (s: any) => s.id === id, {
      payment_status: 'voided',
      notes: (sale.notes || '') + ` [VOIDED at ${nowIso}]`,
    });

    // 2. Reverse stock movements & restore product inventory
    const saleItems: any[] = await LocalStorageDB.select('sale_items', (item: any) => item.sale_id === id);
    for (const item of saleItems) {
      const product: any = await LocalStorageDB.selectOne('products', (p: any) => p.id === item.product_id);
      if (product) {
        await LocalStorageDB.update('products', (p: any) => p.id === item.product_id, {
          stock_qty: Number(product.stock_qty || 0) + Number(item.quantity || 0),
        });
      }
      await LocalStorageDB.insert('stock_movements', {
        shop_id: sale.shop_id,
        product_id: item.product_id,
        product_name: item.product_name,
        sale_id: sale.id,
        type: 'in',
        quantity: Number(item.quantity),
        reason: `Reversal: Voided Sale ${sale.invoice_no}`,
        created_at: nowIso,
      });
    }

    // 3. Reverse customer credit balance & post immutable offsetting ledger entries
    if (sale.customer_id) {
      const customer: any = await LocalStorageDB.selectOne('customers', (c: any) => c.id === sale.customer_id);
      if (customer) {
        const unpaidCredit = Number(sale.total_amount) - Number(sale.amount_paid || 0);
        const newBalance = Number(customer.current_balance || 0) - unpaidCredit;

        await LocalStorageDB.update('customers', (c: any) => c.id === sale.customer_id, {
          current_balance: newBalance,
        });

        // Offsetting Credit entry to cancel original Debit sale total
        await LocalStorageDB.insert('ledger_entries', {
          shop_id: sale.shop_id,
          customer_id: sale.customer_id,
          customer_name: customer.name,
          entry_date: nowIso,
          entry_type: 'credit',
          amount: Number(sale.total_amount),
          balance_after: Number(customer.current_balance || 0) - Number(sale.total_amount),
          description: `Reversal: Voided Sale ${sale.invoice_no}`,
          reference_type: 'void_sale',
          reference_id: sale.id,
        });

        // If immediate payment was recorded with this sale, mark voided and post offsetting debit
        const immediatePayments: any[] = await LocalStorageDB.select('payments', (p: any) => p.sale_id === id);
        for (const payment of immediatePayments) {
          await LocalStorageDB.update('payments', (p: any) => p.id === payment.id, {
            notes: (payment.notes || '') + ' [VOIDED with Sale]',
          });
          await LocalStorageDB.insert('ledger_entries', {
            shop_id: sale.shop_id,
            customer_id: sale.customer_id,
            customer_name: customer.name,
            entry_date: nowIso,
            entry_type: 'debit',
            amount: Number(payment.amount),
            balance_after: newBalance,
            description: `Reversal: Refunded Downpayment for Voided Sale ${sale.invoice_no}`,
            reference_type: 'void_payment',
            reference_id: payment.id,
          });
        }
      }
    }
  }
}
