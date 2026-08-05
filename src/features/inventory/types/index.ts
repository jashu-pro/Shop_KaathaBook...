/* features/inventory/types/index.ts */

export type ProductUnit = 'piece' | 'packet' | 'kg' | 'g' | 'liter' | 'ml' | 'box' | 'bag';

export interface Category {
  id: string;
  shopId: string;
  name: string;
  color?: string;
  icon?: string;
  productCount?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  mrp: number;
  price: number; // Selling price
  costPrice: number;
  unit: ProductUnit;
  stockQty: number;
  alertQty: number; // Low stock reorder alert limit
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  color?: string;
  icon?: string;
}

export interface CreateProductDTO {
  categoryId?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  mrp?: number;
  price: number;
  costPrice?: number;
  unit?: ProductUnit;
  stockQty?: number;
  alertQty?: number;
  imageUrl?: string;
  notes?: string;
}

export interface UpdateProductDTO {
  categoryId?: string;
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  mrp?: number;
  price?: number;
  costPrice?: number;
  unit?: ProductUnit;
  stockQty?: number;
  alertQty?: number;
  imageUrl?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  shopId: string;
  productId: string;
  productName?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  createdAt: string;
}

export type InventoryFilterTab = 'all' | 'low_stock' | 'out_of_stock' | 'categories';
