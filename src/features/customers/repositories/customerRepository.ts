/* features/customers/repositories/customerRepository.ts */
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface ICustomerRepository {
  getCustomersByShop(shopId: string): Promise<Customer[]>;
  getCustomerById(id: string, shopId?: string): Promise<Customer | null>;
  createCustomer(shopId: string, data: CreateCustomerDTO): Promise<Customer>;
  updateCustomer(id: string, updates: UpdateCustomerDTO): Promise<Customer>;
  deleteCustomer(id: string, shopId?: string): Promise<boolean>;
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
    const localRepo = new LocalCustomerRepository();
    const localCustomers = await localRepo.getCustomersByShop(shopId);
    if (!supabase) return localCustomers;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) return localCustomers;
      const remote = data.map((d) => this.mapEntityToDomain(d));
      const ids = new Set(remote.map((c) => c.id));
      return [...remote, ...localCustomers.filter((c) => !ids.has(c.id))];
    } catch {
      return localCustomers;
    }
  }

  async getCustomerById(id: string, shopId?: string): Promise<Customer | null> {
    const localRepo = new LocalCustomerRepository();
    const localCustomer = await localRepo.getCustomerById(id, shopId);
    if (!supabase) return localCustomer;
    try {
      let query = supabase.from('customers').select('*').eq('id', id);
      if (shopId) {
        query = query.eq('shop_id', shopId);
      }
      const { data, error } = await query.maybeSingle();

      if (error || !data) return localCustomer;
      return this.mapEntityToDomain(data);
    } catch {
      return localCustomer;
    }
  }

  async createCustomer(shopId: string, dto: CreateCustomerDTO): Promise<Customer> {
    const localRepo = new LocalCustomerRepository();
    const localCreated = await localRepo.createCustomer(shopId, dto);

    if (supabase) {
      try {
        const initialBalance = dto.openingBalance
          ? (dto.balanceType === 'advance' ? -Math.abs(dto.openingBalance) : Math.abs(dto.openingBalance))
          : 0;

        const { data, error } = await supabase
          .from('customers')
          .insert({
            id: localCreated.id,
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
          .maybeSingle();

        if (!error && data) {
          return this.mapEntityToDomain(data);
        }
      } catch (err) {
        console.warn('Supabase createCustomer sync failed, using local customer:', err);
      }
    }

    return localCreated;
  }

  async updateCustomer(id: string, updates: UpdateCustomerDTO): Promise<Customer> {
    const localRepo = new LocalCustomerRepository();
    const localUpdated = await localRepo.updateCustomer(id, updates);

    if (supabase) {
      try {
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
          .maybeSingle();

        if (!error && data) {
          return this.mapEntityToDomain(data);
        }
      } catch (err) {
        console.warn('Supabase updateCustomer sync error:', err);
      }
    }

    return localUpdated;
  }

  async deleteCustomer(id: string, shopId?: string): Promise<boolean> {
    const localRepo = new LocalCustomerRepository();
    await localRepo.deleteCustomer(id, shopId);

    if (supabase) {
      try {
        let query = supabase.from('customers').delete().eq('id', id);
        if (shopId) {
          query = query.eq('shop_id', shopId);
        }
        await query;
      } catch {
        // ignore
      }
    }
    return true;
  }

  async findDuplicateByPhone(shopId: string, phone: string): Promise<Customer | null> {
    const localRepo = new LocalCustomerRepository();
    const localMatch = await localRepo.findDuplicateByPhone(shopId, phone);
    if (localMatch || !supabase || !phone) return localMatch;

    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('phone', phone)
        .maybeSingle();

      return data ? this.mapEntityToDomain(data) : null;
    } catch {
      return null;
    }
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

  async getCustomerById(id: string, shopId?: string): Promise<Customer | null> {
    const data = await LocalStorageDB.selectOne('customers', (c: any) => c.id === id && (!shopId || c.shop_id === shopId));
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

  async deleteCustomer(id: string, shopId?: string): Promise<boolean> {
    await LocalStorageDB.delete('customers', (c: any) => c.id === id && (!shopId || c.shop_id === shopId));
    return true;
  }

  async findDuplicateByPhone(shopId: string, phone: string): Promise<Customer | null> {
    if (!phone) return null;
    const data = await LocalStorageDB.selectOne('customers', (c: any) => c.shop_id === shopId && c.phone === phone);
    return data ? this.mapEntityToDomain(data) : null;
  }
}
