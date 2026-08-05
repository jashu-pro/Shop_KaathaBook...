/* features/customers/repositories/customerRepository.ts */
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface ICustomerRepository {
  getCustomersByShop(shopId: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(shopId: string, data: CreateCustomerDTO): Promise<Customer>;
  updateCustomer(id: string, updates: UpdateCustomerDTO): Promise<Customer>;
  deleteCustomer(id: string): Promise<boolean>;
  findDuplicateByPhone(shopId: string, phone: string): Promise<Customer | null>;
}

export class SupabaseCustomerRepository implements ICustomerRepository {
  private mapEntityToDomain(data: any): Customer {
    return {
      id: data.id,
      shopId: data.shop_id,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      village: data.village || undefined,
      creditLimit: Number(data.credit_limit || 0),
      currentBalance: Number(data.current_balance || 0),
      tag: data.tag || 'Regular',
      photoUrl: data.photo_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getCustomersByShop(shopId: string): Promise<Customer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((d) => this.mapEntityToDomain(d));
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapEntityToDomain(data);
  }

  async createCustomer(shopId: string, dto: CreateCustomerDTO): Promise<Customer> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const initialBalance = dto.openingBalance
      ? (dto.balanceType === 'advance' ? -Math.abs(dto.openingBalance) : Math.abs(dto.openingBalance))
      : 0;

    const { data, error } = await supabase
      .from('customers')
      .insert({
        shop_id: shopId,
        name: dto.name,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        village: dto.village || null,
        credit_limit: dto.creditLimit || 0,
        current_balance: initialBalance,
        tag: dto.tag || 'Regular',
        photo_url: dto.photoUrl || null,
        notes: dto.notes || null,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create customer');
    return this.mapEntityToDomain(data);
  }

  async updateCustomer(id: string, updates: UpdateCustomerDTO): Promise<Customer> {
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
        tag: updates.tag,
        photo_url: updates.photoUrl || null,
        notes: updates.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to update customer');
    return this.mapEntityToDomain(data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
  }

  async findDuplicateByPhone(shopId: string, phone: string): Promise<Customer | null> {
    if (!supabase || !phone) return null;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .eq('phone', phone)
      .maybeSingle();

    return data ? this.mapEntityToDomain(data) : null;
  }
}

export class LocalCustomerRepository implements ICustomerRepository {
  private mapEntityToDomain(data: any): Customer {
    return {
      id: data.id,
      shopId: data.shop_id,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      village: data.village || undefined,
      creditLimit: Number(data.credit_limit || 0),
      currentBalance: Number(data.current_balance || 0),
      tag: data.tag || 'Regular',
      photoUrl: data.photo_url || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getCustomersByShop(shopId: string): Promise<Customer[]> {
    const data = await LocalStorageDB.select('customers', (c: any) => c.shop_id === shopId);
    return data.map((d: any) => this.mapEntityToDomain(d));
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const data = await LocalStorageDB.selectOne('customers', (c: any) => c.id === id);
    if (!data) return null;
    return this.mapEntityToDomain(data);
  }

  async createCustomer(shopId: string, dto: CreateCustomerDTO): Promise<Customer> {
    const initialBalance = dto.openingBalance
      ? (dto.balanceType === 'advance' ? -Math.abs(dto.openingBalance) : Math.abs(dto.openingBalance))
      : 0;

    const data = await LocalStorageDB.insert('customers', {
      shop_id: shopId,
      name: dto.name,
      phone: dto.phone || null,
      email: dto.email || null,
      address: dto.address || null,
      village: dto.village || null,
      credit_limit: dto.creditLimit || 0,
      current_balance: initialBalance,
      tag: dto.tag || 'Regular',
      photo_url: dto.photoUrl || null,
      notes: dto.notes || null,
    });
    return this.mapEntityToDomain(data);
  }

  async updateCustomer(id: string, updates: UpdateCustomerDTO): Promise<Customer> {
    const data = await LocalStorageDB.update('customers', (c: any) => c.id === id, {
      name: updates.name,
      phone: updates.phone || null,
      email: updates.email || null,
      address: updates.address || null,
      village: updates.village || null,
      credit_limit: updates.creditLimit,
      tag: updates.tag,
      photo_url: updates.photoUrl || null,
      notes: updates.notes || null,
    });
    return this.mapEntityToDomain(data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await LocalStorageDB.delete('customers', (c: any) => c.id === id);
    return true;
  }

  async findDuplicateByPhone(shopId: string, phone: string): Promise<Customer | null> {
    if (!phone) return null;
    const data = await LocalStorageDB.selectOne('customers', (c: any) => c.shop_id === shopId && c.phone === phone);
    return data ? this.mapEntityToDomain(data) : null;
  }
}
