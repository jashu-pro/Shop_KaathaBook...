/* shop/repositories/shopRepository.ts */
import type { Shop, CreateShopDTO } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IShopRepository {
  getShopByOwner(ownerId: string): Promise<Shop | null>;
  getShopById(shopId: string): Promise<Shop | null>;
  createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop>;
  updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop>;
}

const uploadBase64ToStorage = async (base64Url?: string, folder = 'logos'): Promise<string | null> => {
  if (!base64Url) return null;
  if (!supabase || !base64Url.startsWith('data:image')) return base64Url;

  try {
    const res = await fetch(base64Url);
    const blob = await res.blob();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    const { data, error } = await supabase.storage.from('shop-assets').upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error || !data) return base64Url;

    const { data: publicUrlData } = supabase.storage.from('shop-assets').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    return base64Url;
  }
};

export class SupabaseShopRepository implements IShopRepository {
  private mapEntityToDomain(data: any): Shop {
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      tagline: data.tagline || undefined,
      businessType: data.business_type,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      gstin: data.gstin || undefined,
      pan: data.pan || undefined,
      upiId: data.upi_id || undefined,
      logoUrl: data.logo_url || undefined,
      currency: data.currency || 'INR',
      theme: data.theme || 'dark',
      language: data.language || 'en',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapEntityToDomain(data);
  }

  async getShopById(shopId: string): Promise<Shop | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapEntityToDomain(data);
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Upload image to Supabase Storage if configured
    const uploadedLogoUrl = await uploadBase64ToStorage(shopData.logoUrl, 'logos');

    const { data, error } = await supabase
      .from('shops')
      .insert({
        owner_id: ownerId,
        name: shopData.name,
        tagline: shopData.tagline || null,
        business_type: shopData.businessType,
        phone: shopData.phone || null,
        address: shopData.address || null,
        city: shopData.city || null,
        state: shopData.state || null,
        pincode: shopData.pincode || null,
        gstin: shopData.gstin || null,
        pan: shopData.pan || null,
        upi_id: shopData.upiId || null,
        logo_url: uploadedLogoUrl || null,
        currency: shopData.currency || 'INR',
        theme: shopData.theme || 'dark',
        language: shopData.language || 'en',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create shop profile');
    }

    return this.mapEntityToDomain(data);
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    if (!supabase) throw new Error('Supabase client not initialized');

    const uploadedLogoUrl = updates.logoUrl 
      ? await uploadBase64ToStorage(updates.logoUrl, 'logos') 
      : undefined;

    const { data, error } = await supabase
      .from('shops')
      .update({
        name: updates.name,
        tagline: updates.tagline || null,
        business_type: updates.businessType,
        phone: updates.phone || null,
        address: updates.address || null,
        city: updates.city || null,
        state: updates.state || null,
        pincode: updates.pincode || null,
        gstin: updates.gstin || null,
        pan: updates.pan || null,
        upi_id: updates.upiId || null,
        logo_url: uploadedLogoUrl !== undefined ? uploadedLogoUrl : updates.logoUrl || null,
        currency: updates.currency,
        theme: updates.theme,
        language: updates.language,
      })
      .eq('id', shopId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update shop profile');
    }

    return this.mapEntityToDomain(data);
  }
}

export class LocalShopRepository implements IShopRepository {
  private mapEntityToDomain(data: any): Shop {
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      tagline: data.tagline || undefined,
      businessType: data.business_type,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      gstin: data.gstin || undefined,
      pan: data.pan || undefined,
      upiId: data.upi_id || undefined,
      logoUrl: data.logo_url || undefined,
      currency: data.currency || 'INR',
      theme: data.theme || 'dark',
      language: data.language || 'en',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    const data = await LocalStorageDB.selectOne('shops', (s: any) => s.owner_id === ownerId);
    if (!data) return null;
    return this.mapEntityToDomain(data);
  }

  async getShopById(shopId: string): Promise<Shop | null> {
    const data = await LocalStorageDB.selectOne('shops', (s: any) => s.id === shopId);
    if (!data) return null;
    return this.mapEntityToDomain(data);
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    const data = await LocalStorageDB.insert('shops', {
      owner_id: ownerId,
      name: shopData.name,
      tagline: shopData.tagline || null,
      business_type: shopData.businessType,
      phone: shopData.phone || null,
      address: shopData.address || null,
      city: shopData.city || null,
      state: shopData.state || null,
      pincode: shopData.pincode || null,
      gstin: shopData.gstin || null,
      pan: shopData.pan || null,
      upi_id: shopData.upiId || null,
      logo_url: shopData.logoUrl || null,
      currency: shopData.currency || 'INR',
      theme: shopData.theme || 'dark',
      language: shopData.language || 'en',
    });

    return this.mapEntityToDomain(data);
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const data = await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
      name: updates.name,
      tagline: updates.tagline || null,
      business_type: updates.businessType,
      phone: updates.phone || null,
      address: updates.address || null,
      city: updates.city || null,
      state: updates.state || null,
      pincode: updates.pincode || null,
      gstin: updates.gstin || null,
      pan: updates.pan || null,
      upi_id: updates.upiId || null,
      logo_url: updates.logoUrl || null,
      currency: updates.currency,
      theme: updates.theme,
      language: updates.language,
    });

    return this.mapEntityToDomain(data);
  }
}
