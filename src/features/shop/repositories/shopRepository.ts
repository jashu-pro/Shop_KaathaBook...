/* shop/repositories/shopRepository.ts */
import type { Shop, CreateShopDTO, ShopStatus, ShopRegistrationRequest } from '../types';
import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';

export interface IShopRepository {
  getShopByOwner(ownerId: string): Promise<Shop | null>;
  getShopsByOwner(ownerId: string): Promise<Shop[]>;
  getShopById(shopId: string): Promise<Shop | null>;
  createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop>;
  updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop>;
  getRegistrationRequestByShopId(shopId: string): Promise<ShopRegistrationRequest | null>;
  getRegistrationRequestByOwner(ownerId: string): Promise<ShopRegistrationRequest | null>;
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
  } catch {
    return base64Url;
  }
};

export class SupabaseShopRepository implements IShopRepository {
  private localFallback = new LocalShopRepository();

  private mapEntityToDomain(data: any): Shop {
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      tagline: data.tagline || undefined,
      businessType: data.business_type,
      phone: data.phone || undefined,
      address: data.address || undefined,
      landmark: data.landmark || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      gstin: data.gstin || undefined,
      pan: data.pan || undefined,
      upiId: data.upi_id || undefined,
      logoUrl: data.logo_url || undefined,
      currency: data.currency || 'INR',
      theme: data.theme || 'dark',
      language: data.language || 'en',
      status: (data.status as ShopStatus) || 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapRequestToDomain(data: any): ShopRegistrationRequest {
    return {
      id: data.id,
      ownerUserId: data.owner_user_id,
      shopId: data.shop_id,
      shopName: data.shop_name,
      businessType: data.business_type,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      landmark: data.landmark || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      status: data.status,
      rejectionReason: data.rejection_reason || undefined,
      approvedBy: data.approved_by || undefined,
      approvedAt: data.approved_at || undefined,
      rejectedBy: data.rejected_by || undefined,
      rejectedAt: data.rejected_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    const local = await this.localFallback.getShopByOwner(ownerId);
    if (!supabase) return local;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

      if (error || !data) return local;
      return this.mapEntityToDomain(data);
    } catch {
      return local;
    }
  }

  async getShopsByOwner(ownerId: string): Promise<Shop[]> {
    const localShops = await this.localFallback.getShopsByOwner(ownerId);
    if (!supabase) return localShops;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) return localShops;
      const remoteShops = data.map((d) => this.mapEntityToDomain(d));
      const ids = new Set(remoteShops.map((s) => s.id));
      return [...remoteShops, ...localShops.filter((s) => !ids.has(s.id))];
    } catch {
      return localShops;
    }
  }

  async getShopById(shopId: string): Promise<Shop | null> {
    const local = await this.localFallback.getShopById(shopId);
    if (!supabase) return local;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .maybeSingle();

      if (error || !data) return local;
      return this.mapEntityToDomain(data);
    } catch {
      return local;
    }
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    // 1. Always execute atomic registration in local fallback storage
    const localCreated = await this.localFallback.createShop(ownerId, shopData);

    if (supabase) {
      try {
        const uploadedLogoUrl = await uploadBase64ToStorage(shopData.logoUrl, 'logos');
        const { data: { user } } = await supabase.auth.getUser();

        // 2. ATOMIC RPC CALL: rpc_submit_shop_registration
        // Creates User Profile -> Shop ('pending') -> Registration Request ('pending') -> Owner Membership
        const { data: rpcRes, error: rpcError } = await supabase.rpc('rpc_submit_shop_registration', {
          p_shop_id: localCreated.id,
          p_owner_id: ownerId,
          p_name: shopData.name,
          p_tagline: shopData.tagline || null,
          p_business_type: shopData.businessType,
          p_phone: shopData.phone || null,
          p_address: shopData.address || null,
          p_landmark: shopData.landmark || null,
          p_city: shopData.city || null,
          p_state: shopData.state || null,
          p_pincode: shopData.pincode || null,
          p_latitude: shopData.latitude ?? null,
          p_longitude: shopData.longitude ?? null,
          p_gstin: shopData.gstin || null,
          p_pan: shopData.pan || null,
          p_upi_id: shopData.upiId || null,
          p_logo_url: uploadedLogoUrl || null,
          p_currency: shopData.currency || 'INR',
          p_theme: shopData.theme || 'dark',
          p_language: shopData.language || 'en',
          p_owner_email: user?.email || undefined,
          p_owner_name: user?.user_metadata?.full_name || user?.user_metadata?.name || shopData.name,
        });

        if (!rpcError && rpcRes?.shop_id) {
          const { data: remoteShop } = await supabase
            .from('shops')
            .select('*')
            .eq('id', rpcRes.shop_id)
            .maybeSingle();

          if (remoteShop) {
            return this.mapEntityToDomain(remoteShop);
          }
        } else if (rpcError) {
          const insertPayload: any = {
            id: localCreated.id,
            owner_id: ownerId,
            name: shopData.name,
            tagline: shopData.tagline || null,
            business_type: shopData.businessType,
            phone: shopData.phone || null,
            address: shopData.address || null,
            landmark: shopData.landmark || null,
            city: shopData.city || null,
            state: shopData.state || null,
            pincode: shopData.pincode || null,
            latitude: shopData.latitude ?? null,
            longitude: shopData.longitude ?? null,
            gstin: shopData.gstin || null,
            pan: shopData.pan || null,
            upi_id: shopData.upiId || null,
            logo_url: uploadedLogoUrl || null,
            currency: shopData.currency || 'INR',
            theme: shopData.theme || 'dark',
            language: shopData.language || 'en',
            status: 'pending',
          };

          let { data, error } = await supabase
            .from('shops')
            .insert(insertPayload)
            .select()
            .maybeSingle();

          if (error && (error.message?.includes('status') || error.code === 'PGRST204')) {
            delete insertPayload.status;
            const retryRes = await supabase
              .from('shops')
              .insert(insertPayload)
              .select()
              .maybeSingle();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (!error && data) {
            // Also insert pending registration request if table exists
            try {
              await supabase.from('shop_registration_requests').insert({
                owner_user_id: ownerId,
                shop_id: data.id,
                shop_name: shopData.name,
                business_type: shopData.businessType,
                email: user?.email || `${ownerId}@user.local`,
                phone: shopData.phone || null,
                address: shopData.address || null,
                status: 'pending',
              });
            } catch {
              // Table might not exist yet if migration 021 is pending
            }
            return this.mapEntityToDomain(data);
          }
        }
      } catch (err) {
        console.warn('Supabase atomic shop registration failed, falling back to local store:', err);
      }
    }

    return localCreated;
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const localUpdated = await this.localFallback.updateShop(shopId, updates);

    if (supabase) {
      try {
        const uploadedLogoUrl = updates.logoUrl 
          ? await uploadBase64ToStorage(updates.logoUrl, 'logos') 
          : undefined;

        await supabase
          .from('shops')
          .update({
            name: updates.name,
            tagline: updates.tagline || null,
            business_type: updates.businessType,
            phone: updates.phone || null,
            address: updates.address || null,
            landmark: updates.landmark || null,
            city: updates.city || null,
            state: updates.state || null,
            pincode: updates.pincode || null,
            latitude: updates.latitude ?? null,
            longitude: updates.longitude ?? null,
            gstin: updates.gstin || null,
            pan: updates.pan || null,
            upi_id: updates.upiId || null,
            logo_url: uploadedLogoUrl || undefined,
            currency: updates.currency,
            theme: updates.theme,
            language: updates.language,
            status: updates.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shopId);
      } catch (err) {
        console.warn('Supabase updateShop sync failed, using local store:', err);
      }
    }

    return localUpdated;
  }

  async getRegistrationRequestByShopId(shopId: string): Promise<ShopRegistrationRequest | null> {
    const local = await this.localFallback.getRegistrationRequestByShopId(shopId);
    if (!supabase) return local;
    try {
      const { data, error } = await supabase
        .from('shop_registration_requests')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle();

      if (error || !data) return local;
      return this.mapRequestToDomain(data);
    } catch {
      return local;
    }
  }

  async getRegistrationRequestByOwner(ownerId: string): Promise<ShopRegistrationRequest | null> {
    const local = await this.localFallback.getRegistrationRequestByOwner(ownerId);
    if (!supabase) return local;
    try {
      const { data, error } = await supabase
        .from('shop_registration_requests')
        .select('*')
        .eq('owner_user_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return local;
      return this.mapRequestToDomain(data);
    } catch {
      return local;
    }
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
      landmark: data.landmark || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      gstin: data.gstin || undefined,
      pan: data.pan || undefined,
      upiId: data.upi_id || undefined,
      logoUrl: data.logo_url || undefined,
      currency: data.currency || 'INR',
      theme: data.theme || 'dark',
      language: data.language || 'en',
      status: (data.status as ShopStatus) || 'pending',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapRequestToDomain(data: any): ShopRegistrationRequest {
    return {
      id: data.id,
      ownerUserId: data.owner_user_id,
      shopId: data.shop_id,
      shopName: data.shop_name,
      businessType: data.business_type,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      landmark: data.landmark || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      pincode: data.pincode || undefined,
      status: data.status,
      rejectionReason: data.rejection_reason || undefined,
      approvedBy: data.approved_by || undefined,
      approvedAt: data.approved_at || undefined,
      rejectedBy: data.rejected_by || undefined,
      rejectedAt: data.rejected_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getShopByOwner(ownerId: string): Promise<Shop | null> {
    const data = await LocalStorageDB.selectOne('shops', (s: any) => s.owner_id === ownerId);
    if (!data) return null;
    return this.mapEntityToDomain(data);
  }

  async getShopsByOwner(ownerId: string): Promise<Shop[]> {
    const data = await LocalStorageDB.select('shops', (s: any) => s.owner_id === ownerId);
    return data.map((d: any) => this.mapEntityToDomain(d));
  }

  async getShopById(shopId: string): Promise<Shop | null> {
    const data = await LocalStorageDB.selectOne('shops', (s: any) => s.id === shopId);
    if (!data) return null;
    return this.mapEntityToDomain(data);
  }

  async createShop(ownerId: string, shopData: CreateShopDTO): Promise<Shop> {
    // Atomic local transaction: Shop ('pending') + Registration Request ('pending') + Owner Membership
    const shopEntity = await LocalStorageDB.insert('shops', {
      owner_id: ownerId,
      name: shopData.name,
      tagline: shopData.tagline || null,
      business_type: shopData.businessType,
      phone: shopData.phone || null,
      address: shopData.address || null,
      landmark: shopData.landmark || null,
      city: shopData.city || null,
      state: shopData.state || null,
      pincode: shopData.pincode || null,
      latitude: shopData.latitude ?? null,
      longitude: shopData.longitude ?? null,
      gstin: shopData.gstin || null,
      pan: shopData.pan || null,
      upi_id: shopData.upiId || null,
      logo_url: shopData.logoUrl || null,
      currency: shopData.currency || 'INR',
      theme: shopData.theme || 'dark',
      language: shopData.language || 'en',
      status: 'pending',
    });

    // Create registration request
    await LocalStorageDB.insert('shop_registration_requests', {
      owner_user_id: ownerId,
      shop_id: shopEntity.id,
      shop_name: shopData.name,
      business_type: shopData.businessType,
      email: `${ownerId}@user.local`,
      phone: shopData.phone || null,
      address: shopData.address || null,
      landmark: shopData.landmark || null,
      city: shopData.city || null,
      state: shopData.state || null,
      pincode: shopData.pincode || null,
      status: 'pending',
    });

    // Create owner membership
    await LocalStorageDB.insert('shop_memberships', {
      shop_id: shopEntity.id,
      user_id: ownerId,
      member_type: 'owner',
      name: shopData.name,
      email_or_phone: shopData.phone || `${ownerId}@user.local`,
      status: 'active',
      permissions: { all: true },
    });

    return this.mapEntityToDomain(shopEntity);
  }

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const data = await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
      name: updates.name,
      tagline: updates.tagline || null,
      business_type: updates.businessType,
      phone: updates.phone || null,
      address: updates.address || null,
      landmark: updates.landmark || null,
      city: updates.city || null,
      state: updates.state || null,
      pincode: updates.pincode || null,
      latitude: updates.latitude ?? null,
      longitude: updates.longitude ?? null,
      gstin: updates.gstin || null,
      pan: updates.pan || null,
      upi_id: updates.upiId || null,
      logo_url: updates.logoUrl || null,
      currency: updates.currency,
      theme: updates.theme,
      language: updates.language,
      status: updates.status,
    });

    return this.mapEntityToDomain(data);
  }

  async getRegistrationRequestByShopId(shopId: string): Promise<ShopRegistrationRequest | null> {
    const data = await LocalStorageDB.selectOne('shop_registration_requests', (r: any) => r.shop_id === shopId);
    if (!data) return null;
    return this.mapRequestToDomain(data);
  }

  async getRegistrationRequestByOwner(ownerId: string): Promise<ShopRegistrationRequest | null> {
    const requests = await LocalStorageDB.select('shop_registration_requests', (r: any) => r.owner_user_id === ownerId);
    if (requests.length === 0) return null;
    // return most recent
    const latest = requests.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return this.mapRequestToDomain(latest);
  }
}
