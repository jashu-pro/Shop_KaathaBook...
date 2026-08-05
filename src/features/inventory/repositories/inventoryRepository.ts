/* inventory/repositories/inventoryRepository.ts */
import type { 
  Category, 
  Product, 
  CreateCategoryDTO, 
  CreateProductDTO, 
  UpdateProductDTO,
  StockMovement 
} from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface ICategoryRepository {
  list(shopId: string): Promise<Category[]>;
  create(shopId: string, dto: CreateCategoryDTO): Promise<Category>;
  delete(id: string): Promise<void>;
}

export interface IProductRepository {
  list(shopId: string): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(shopId: string, dto: CreateProductDTO): Promise<Product>;
  update(id: string, updates: UpdateProductDTO): Promise<Product>;
  delete(id: string): Promise<void>;
  adjustStock(shopId: string, productId: string, deltaQty: number, reason?: string): Promise<Product>;
  listStockMovements(shopId: string): Promise<StockMovement[]>;
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
      color: d.color || undefined,
      icon: d.icon || undefined,
      createdAt: d.created_at,
    }));
  }

  async create(shopId: string, dto: CreateCategoryDTO): Promise<Category> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('categories')
      .insert({ shop_id: shopId, name: dto.name, color: dto.color || null, icon: dto.icon || null })
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create category');
    return { id: data.id, shopId: data.shop_id, name: data.name, color: data.color, icon: data.icon, createdAt: data.created_at };
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
      color: d.color || undefined,
      icon: d.icon || undefined,
      createdAt: d.created_at,
    }));
  }

  async create(shopId: string, dto: CreateCategoryDTO): Promise<Category> {
    const data = await LocalStorageDB.insert('categories', { 
      shop_id: shopId, 
      name: dto.name,
      color: dto.color || null,
      icon: dto.icon || null
    });
    return { id: data.id, shopId: data.shop_id, name: data.name, color: data.color, icon: data.icon, createdAt: data.created_at };
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
      categoryName: p.categories?.name || undefined,
      name: p.name,
      description: p.description || undefined,
      barcode: p.barcode || undefined,
      mrp: Number(p.mrp || p.price),
      price: Number(p.price),
      costPrice: Number(p.cost_price || 0),
      sku: p.sku || undefined,
      unit: p.unit || 'piece',
      stockQty: Number(p.stock_qty || 0),
      alertQty: Number(p.alert_qty || 5),
      imageUrl: p.image_url || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }

  async list(shopId: string): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*, categories(name)').eq('shop_id', shopId);
    if (error || !data) return [];
    return data.map((d: any) => this.map(d));
  }

  async getById(id: string): Promise<Product | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('products').select('*, categories(name)').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.map(data);
  }

  async create(shopId: string, dto: CreateProductDTO): Promise<Product> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: shopId,
        category_id: dto.categoryId || null,
        name: dto.name,
        description: dto.description || null,
        barcode: dto.barcode || null,
        mrp: dto.mrp || dto.price,
        price: dto.price,
        cost_price: dto.costPrice || 0,
        sku: dto.sku || `SKU-${Date.now().toString().slice(-6)}`,
        unit: dto.unit || 'piece',
        stock_qty: dto.stockQty || 0,
        alert_qty: dto.alertQty || 5,
        image_url: dto.imageUrl || null,
        notes: dto.notes || null,
      })
      .select('*, categories(name)')
      .single();
    if (error || !data) throw error || new Error('Failed to create product');
    return this.map(data);
  }

  async update(id: string, updates: UpdateProductDTO): Promise<Product> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('products')
      .update({
        category_id: updates.categoryId || null,
        name: updates.name,
        description: updates.description || null,
        barcode: updates.barcode || null,
        mrp: updates.mrp,
        price: updates.price,
        cost_price: updates.costPrice,
        sku: updates.sku || null,
        unit: updates.unit,
        stock_qty: updates.stockQty,
        alert_qty: updates.alertQty,
        image_url: updates.imageUrl || null,
        notes: updates.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, categories(name)')
      .single();
    if (error || !data) throw error || new Error('Failed to update product');
    return this.map(data);
  }

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    await supabase.from('products').delete().eq('id', id);
  }

  async adjustStock(shopId: string, productId: string, deltaQty: number, reason?: string): Promise<Product> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const current = await this.getById(productId);
    if (!current) throw new Error('Product not found');

    const newStock = Math.max(0, current.stockQty + deltaQty);
    const updated = await this.update(productId, { stockQty: newStock });

    await supabase.from('stock_movements').insert({
      shop_id: shopId,
      product_id: productId,
      type: deltaQty > 0 ? 'in' : 'out',
      quantity: Math.abs(deltaQty),
      reason: reason || 'Manual Stock Adjustment',
    });

    return updated;
  }

  async listStockMovements(shopId: string): Promise<StockMovement[]> {
    if (!supabase) return [];
    const { data } = await supabase.from('stock_movements').select('*, products(name)').eq('shop_id', shopId).order('created_at', { ascending: false });
    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      productId: d.product_id,
      productName: d.products?.name,
      type: d.type,
      quantity: Number(d.quantity),
      reason: d.reason,
      createdAt: d.created_at,
    }));
  }
}

export class LocalProductRepository implements IProductRepository {
  private map(p: any): Product {
    return {
      id: p.id,
      shopId: p.shop_id,
      categoryId: p.category_id || undefined,
      categoryName: p.category_name || undefined,
      name: p.name,
      description: p.description || undefined,
      barcode: p.barcode || undefined,
      mrp: Number(p.mrp || p.price),
      price: Number(p.price),
      costPrice: Number(p.cost_price || 0),
      sku: p.sku || undefined,
      unit: p.unit || 'piece',
      stockQty: Number(p.stock_qty || 0),
      alertQty: Number(p.alert_qty || 5),
      imageUrl: p.image_url || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
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

  async create(shopId: string, dto: CreateProductDTO): Promise<Product> {
    const data = await LocalStorageDB.insert('products', {
      shop_id: shopId,
      category_id: dto.categoryId || null,
      name: dto.name,
      description: dto.description || null,
      barcode: dto.barcode || null,
      mrp: dto.mrp || dto.price,
      price: dto.price,
      cost_price: dto.costPrice || 0,
      sku: dto.sku || `SKU-${Date.now().toString().slice(-6)}`,
      unit: dto.unit || 'piece',
      stock_qty: dto.stockQty || 0,
      alert_qty: dto.alertQty || 5,
      image_url: dto.imageUrl || null,
      notes: dto.notes || null,
    });
    return this.map(data);
  }

  async update(id: string, updates: UpdateProductDTO): Promise<Product> {
    const data = await LocalStorageDB.update('products', (p: any) => p.id === id, {
      category_id: updates.categoryId || null,
      name: updates.name,
      description: updates.description || null,
      barcode: updates.barcode || null,
      mrp: updates.mrp,
      price: updates.price,
      cost_price: updates.costPrice,
      sku: updates.sku || null,
      unit: updates.unit,
      stock_qty: updates.stockQty,
      alert_qty: updates.alertQty,
      image_url: updates.imageUrl || null,
      notes: updates.notes || null,
    });
    return this.map(data);
  }

  async delete(id: string): Promise<void> {
    await LocalStorageDB.delete('products', (p: any) => p.id === id);
  }

  async adjustStock(shopId: string, productId: string, deltaQty: number, reason?: string): Promise<Product> {
    const current = await this.getById(productId);
    if (!current) throw new Error('Product not found');

    const newStock = Math.max(0, current.stockQty + deltaQty);
    const updated = await this.update(productId, { stockQty: newStock });

    await LocalStorageDB.insert('stock_movements', {
      shop_id: shopId,
      product_id: productId,
      type: deltaQty > 0 ? 'in' : 'out',
      quantity: Math.abs(deltaQty),
      reason: reason || 'Manual Stock Adjustment',
    });

    return updated;
  }

  async listStockMovements(shopId: string): Promise<StockMovement[]> {
    const data = await LocalStorageDB.select('stock_movements', (s: any) => s.shop_id === shopId);
    return data.map((d: any) => ({
      id: d.id,
      shopId: d.shop_id,
      productId: d.product_id,
      productName: d.product_name,
      type: d.type,
      quantity: Number(d.quantity),
      reason: d.reason,
      createdAt: d.created_at,
    }));
  }
}
