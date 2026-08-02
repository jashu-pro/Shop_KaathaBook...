/* shop/repositories/shopRepository.ts */
import type { Shop, CreateShopDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IShopRepository {
  getShopByOwner(ownerId: string): Promise<Shop | null>;
  createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop>;
  updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop>;
}

export class SupabaseShopRepository implements IShopRepository {
  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        name: shopData.name,
        business_type: shopData.businessType,
        phone: shopData.phone,
        address: shopData.address,
        gstin: shopData.gstin,
        pan: shopData.pan,
        upi_id: shopData.upiId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create shop');
    }

    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
      .from('shops')
      .update({
        name: updates.name,
        business_type: updates.businessType,
        phone: updates.phone,
        address: updates.address,
        gstin: updates.gstin,
        pan: updates.pan,
        upi_id: updates.upiId,
      })
      .eq('id', shopId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update shop');
    }

    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export class LocalShopRepository implements IShopRepository {
  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    const data = await LocalStorageDB.selectOne('shops', (s: any) => s.owner_id === ownerId);
    if (!data) return null;
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    const data = await LocalStorageDB.insert('shops', {
      owner_id: ownerId,
      name: shopData.name,
      business_type: shopData.businessType,
      phone: shopData.phone,
      address: shopData.address,
      gstin: shopData.gstin,
      pan: shopData.pan,
      upi_id: shopData.upiId,
    });

    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const data = await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
      name: updates.name,
      business_type: updates.businessType,
      phone: updates.phone,
      address: updates.address,
      gstin: updates.gstin,
      pan: updates.pan,
      upi_id: updates.upiId,
    });

    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      businessType: data.business_type,
      phone: data.phone,
      address: data.address,
      gstin: data.gstin,
      pan: data.pan,
      upiId: data.upi_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
