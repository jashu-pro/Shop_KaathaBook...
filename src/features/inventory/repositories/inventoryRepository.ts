/* inventory/repositories/inventoryRepository.ts */
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface Category {
  id: string;
  shopId: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId?: string;
  name: string;
  description?: string;
  barcode?: string;
  price: number;
  costPrice: number;
  sku?: string;
  stockQty: number;
  alertQty: number;
  imageUrl?: string;
  createdAt: string;
}

export interface ICategoryRepository {
  list(shopId: string): Promise<Category[]>;
  create(shopId: string, name: string): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface IProductRepository {
  list(shopId: string): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}

// Category implementations
export class SupabaseCategoryRepository implements ICategoryRepository {
  async list(shopId: string): Promise<Category[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('categories').select('*').eq('shop_id', shopId);
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      name: d.name,
      createdAt: d.created_at,
    }));
  }

  async create(shopId: string, name: string): Promise<Category> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('categories')
      .insert({ shop_id: shopId, name })
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create category');
    return { id: data.id, shopId: data.shop_id, name: data.name, createdAt: data.created_at };
  }

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('categories').delete().eq('id', id);
  }
}

export class LocalCategoryRepository implements ICategoryRepository {
  async list(shopId: string): Promise<Category[]> {
    const list = await LocalStorageDB.select('categories', (c: any) => c.shop_id === shopId);
    return list.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      name: d.name,
      createdAt: d.created_at,
    }));
  }

  async create(shopId: string, name: string): Promise<Category> {
    const data = await LocalStorageDB.insert('categories', { shop_id: shopId, name });
    return { id: data.id, shopId: data.shop_id, name: data.name, createdAt: data.created_at };
  }

  async delete(id: string): Promise<void> {
    await LocalStorageDB.delete('categories', (c: any) => c.id === id);
  }
}

// Product implementations
export class SupabaseProductRepository implements IProductRepository {
  private map(p: any): Product {
    return {
      id: p.id,
      shopId: p.shop_id,
      categoryId: p.category_id || undefined,
      name: p.name,
      description: p.description || undefined,
      barcode: p.barcode || undefined,
      price: Number(p.price),
      costPrice: Number(p.cost_price),
      sku: p.sku || undefined,
      stockQty: Number(p.stock_qty),
      alertQty: Number(p.alert_qty),
      imageUrl: p.image_url || undefined,
      createdAt: p.created_at,
    };
  }

  async list(shopId: string): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId);
    if (error || !data) return [];
    return data.map((d: any) => this.map(d));
  }

  async getById(id: string): Promise<Product | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.map(data);
  }

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: product.shopId,
        category_id: product.categoryId || null,
        name: product.name,
        description: product.description || null,
        barcode: product.barcode || null,
        price: product.price,
        cost_price: product.costPrice,
        sku: product.sku || null,
        stock_qty: product.stockQty,
        alert_qty: product.alertQty,
        image_url: product.imageUrl || null,
      })
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create product');
    return this.map(data);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('products')
      .update({
        category_id: updates.categoryId || null,
        name: updates.name,
        description: updates.description || null,
        barcode: updates.barcode || null,
        price: updates.price,
        cost_price: updates.costPrice,
        sku: updates.sku || null,
        stock_qty: updates.stockQty,
        alert_qty: updates.alertQty,
        image_url: updates.imageUrl || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to update product');
    return this.map(data);
  }

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('products').delete().eq('id', id);
  }
}

export class LocalProductRepository implements IProductRepository {
  private map(p: any): Product {
    return {
      id: p.id,
      shopId: p.shop_id,
      categoryId: p.category_id || undefined,
      name: p.name,
      description: p.description || undefined,
      barcode: p.barcode || undefined,
      price: Number(p.price),
      costPrice: Number(p.cost_price),
      sku: p.sku || undefined,
      stockQty: Number(p.stock_qty),
      alertQty: Number(p.alert_qty),
      imageUrl: p.image_url || undefined,
      createdAt: p.created_at,
    };
  }

  async list(shopId: string): Promise<Product[]> {
    const list = await LocalStorageDB.select('products', (p: any) => p.shop_id === shopId);
    return list.map((item: any) => this.map(item));
  }

  async getById(id: string): Promise<Product | null> {
    const data = await LocalStorageDB.selectOne('products', (p: any) => p.id === id);
    if (!data) return null;
    return this.map(data);
  }

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const data = await LocalStorageDB.insert('products', {
      shop_id: product.shopId,
      category_id: product.categoryId || null,
      name: product.name,
      description: product.description || null,
      barcode: product.barcode || null,
      price: product.price,
      cost_price: product.costPrice,
      sku: product.sku || null,
      stock_qty: product.stockQty,
      alert_qty: product.alertQty,
      image_url: product.imageUrl || null,
    });
    return this.map(data);
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const data = await LocalStorageDB.update('products', (p: any) => p.id === id, {
      category_id: updates.categoryId || null,
      name: updates.name,
      description: updates.description || null,
      barcode: updates.barcode || null,
      price: updates.price,
      cost_price: updates.costPrice,
      sku: updates.sku || null,
      stock_qty: updates.stockQty,
      alert_qty: updates.alertQty,
      image_url: updates.imageUrl || null,
    });
    return this.map(data);
  }

  async delete(id: string): Promise<void> {
    await LocalStorageDB.delete('products', (p: any) => p.id === id);
  }
}
