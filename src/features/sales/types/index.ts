/* features/sales/types/index.ts */

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  mrp?: number;
  stockQty?: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
}

export interface Sale {
  id: string;
  shopId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  invoiceNo: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid' | 'voided';
  paymentMethod?: string;
  billImageUrl?: string;
  billImageUrls?: string[];
  notes?: string;
  items?: SaleItem[];
  createdAt: string;
}

export interface CreateSaleItemDTO {
  productId: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  taxRate?: number;
}

export interface CreateSaleDTO {
  customerId?: string;
  invoiceNo?: string;
  saleDate?: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid' | 'voided';
  paymentMethod?: string;
  billImageUrl?: string;
  billImageUrls?: string[];
  notes?: string;
  items: CreateSaleItemDTO[];
}


export type SalesFilterTab = 'all' | 'unpaid' | 'partially_paid' | 'paid';
