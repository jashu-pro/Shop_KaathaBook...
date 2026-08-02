/* customers/repositories/customerRepository.ts */
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

// Domain Model
export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  creditLimit: number;
  creditBalance: number; // Derived
  photoUrl?: string;
  notes?: string;
  createdAt: string;
}

// Database Entity
export interface CustomerEntity {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  village: string | null;
  credit_limit: number;
  credit_balance: number;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Data Transfer Objects
export interface CreateCustomerDTO {
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  creditLimit: number;
  photoUrl?: string;
  notes?: string;
}

export interface ICustomerRepository {
  list(shopId: string): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(dto: CreateCustomerDTO): Promise<Customer>;
  update(id: string, updates: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<void>;
}

// Mapper to convert Entity -> Domain Model
const mapEntityToDomain = (entity: CustomerEntity): Customer => ({
  id: entity.id,
  shopId: entity.shop_id,
  name: entity.name,
  phone: entity.phone || undefined,
  email: entity.email || undefined,
  address: entity.address || undefined,
  village: entity.village || undefined,
  creditLimit: Number(entity.credit_limit),
  creditBalance: Number(entity.credit_balance || 0),
  photoUrl: entity.photo_url || undefined,
  notes: entity.notes || undefined,
  createdAt: entity.created_at,
});

export class SupabaseCustomerRepository implements ICustomerRepository {
  async list(shopId: string): Promise<Customer[]> {
    if (!supabase) return [];
    // We fetch and also select from the customer balances view or table
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((d: any) => mapEntityToDomain(d));
  }

  async getById(id: string): Promise<Customer | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return mapEntityToDomain(data);
  }

  async create(dto: CreateCustomerDTO): Promise<Customer> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('customers')
      .insert({
        shop_id: dto.shopId,
        name: dto.name,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        village: dto.village || null,
        credit_limit: dto.creditLimit,
        photo_url: dto.photoUrl || null,
        notes: dto.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create customer');
    }

    return mapEntityToDomain(data);
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        phone: updates.phone || null,
        email: updates.email || null,
        address: updates.address || null,
        village: updates.village || null,
        credit_limit: updates.creditLimit,
        photo_url: updates.photoUrl || null,
        notes: updates.notes || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update customer');
    }

    return mapEntityToDomain(data);
  }

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export class LocalCustomerRepository implements ICustomerRepository {
  async list(shopId: string): Promise<Customer[]> {
    const list = await LocalStorageDB.select('customers', (c: any) => c.shop_id === shopId);
    return list.map((item: any) => mapEntityToDomain(item));
  }

  async getById(id: string): Promise<Customer | null> {
    const data = await LocalStorageDB.selectOne('customers', (c: any) => c.id === id);
    if (!data) return null;
    return mapEntityToDomain(data);
  }

  async create(dto: CreateCustomerDTO): Promise<Customer> {
    const data = await LocalStorageDB.insert('customers', {
      shop_id: dto.shopId,
      name: dto.name,
      phone: dto.phone || null,
      email: dto.email || null,
      address: dto.address || null,
      village: dto.village || null,
      credit_limit: dto.creditLimit,
      credit_balance: 0,
      photo_url: dto.photoUrl || null,
      notes: dto.notes || null,
    });

    return mapEntityToDomain(data);
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const data = await LocalStorageDB.update('customers', (c: any) => c.id === id, {
      name: updates.name,
      phone: updates.phone || null,
      email: updates.email || null,
      address: updates.address || null,
      village: updates.village || null,
      credit_limit: updates.creditLimit,
      photo_url: updates.photoUrl || null,
      notes: updates.notes || null,
    });

    return mapEntityToDomain(data);
  }

  async delete(id: string): Promise<void> {
    await LocalStorageDB.delete('customers', (c: any) => c.id === id);
  }
}
