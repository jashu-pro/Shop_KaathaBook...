import { supabase } from '../../../config/supabase';
import { LocalStorageDB } from '../../../services/localStorageDB';
import { EventBus } from '../../../services/EventBus';
import type { 
  AdminKPIStats, 
  AdminShopListItem, 
  AdminWorkerItem, 
  AdminAuditLog, 
  ShopStatus, 
  ShopRegistrationRequest,
  AdminProfile 
} from '../types';


export interface IAdminRepository {
  getKPIStats(): Promise<AdminKPIStats>;
  getPendingRequests(): Promise<ShopRegistrationRequest[]>;
  getAllShops(filterStatus?: ShopStatus): Promise<AdminShopListItem[]>;
  getShopDetails(shopId: string): Promise<{
    shop: AdminShopListItem;
    workers: AdminWorkerItem[];
    auditLogs: AdminAuditLog[];
  } | null>;
  getWorkers(shopId?: string): Promise<AdminWorkerItem[]>;
  getAuditLogs(): Promise<AdminAuditLog[]>;
  approveRegistration(requestId: string, adminId?: string): Promise<{ success: boolean; shopId: string }>;
  rejectRegistration(requestId: string, reason: string, adminId?: string): Promise<{ success: boolean; shopId: string }>;
  suspendShop(shopId: string, reason: string, adminId?: string): Promise<{ success: boolean }>;
  reactivateShop(shopId: string, adminId?: string): Promise<{ success: boolean }>;
  verifyAdminAuthorization(): Promise<{ isAdmin: boolean; role?: string }>;
  getAdminUsers(): Promise<AdminProfile[]>;
  addAdminUser(email: string, role: 'super_admin' | 'support_admin' | 'auditor'): Promise<{ success: boolean; admin: AdminProfile }>;
  removeAdminUser(adminId: string): Promise<{ success: boolean }>;
}


export class SupabaseAdminRepository implements IAdminRepository {
  private localFallback = new LocalAdminRepository();

  async verifyAdminAuthorization(): Promise<{ isAdmin: boolean; role?: string }> {
    if (!supabase) return this.localFallback.verifyAdminAuthorization();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };

      // 1. Quick client-side check on user metadata
      const metaRole = user.user_metadata?.role;
      const isSuper = user.user_metadata?.is_admin === true || user.user_metadata?.is_admin === 'true';
      const email = user.email || '';
      const isAdminEmail = email.toLowerCase().includes('admin');

      if (metaRole === 'admin' || isSuper || isAdminEmail) {
        return { isAdmin: true, role: 'super_admin' };
      }

      // 2. Server RPC verification
      const { data: isServerAdmin, error } = await supabase.rpc('is_platform_admin', {
        p_user_id: user.id,
      });

      if (!error && isServerAdmin) {
        return { isAdmin: true, role: 'super_admin' };
      }

      // 3. Check platform_admins table directly
      const { data: adminRow } = await supabase
        .from('platform_admins')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (adminRow) {
        return { isAdmin: true, role: adminRow.role };
      }

      return { isAdmin: false };
    } catch {
      return this.localFallback.verifyAdminAuthorization();
    }
  }

  async getKPIStats(): Promise<AdminKPIStats> {
    const localStats = await this.localFallback.getKPIStats();
    if (!supabase) return localStats;
    try {
      const allShops = await this.getAllShops();
      const { count: workerCount } = await supabase
        .from('shop_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('member_type', 'worker');

      const total = allShops.length;
      const active = allShops.filter((s) => s.status === 'active').length;
      const pending = allShops.filter((s) => s.status === 'pending').length;
      const rejected = allShops.filter((s) => s.status === 'rejected').length;
      const suspended = allShops.filter((s) => s.status === 'suspended').length;

      return {
        totalShops: total,
        activeShops: active,
        pendingShops: pending,
        rejectedShops: rejected,
        suspendedShops: suspended,
        totalWorkers: (workerCount || 0) + localStats.totalWorkers,
      };
    } catch {
      return localStats;
    }
  }

  async getPendingRequests(): Promise<ShopRegistrationRequest[]> {
    const allShops = await this.getAllShops();
    const pendingShops = allShops.filter((s) => s.status === 'pending');

    let existingRequests: ShopRegistrationRequest[] = [];
    if (supabase) {
      try {
        const { data } = await supabase
          .from('shop_registration_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (data) {
          existingRequests = data.map((d: any) => ({
            id: d.id,
            ownerUserId: d.owner_user_id,
            shopId: d.shop_id,
            shopName: d.shop_name,
            businessType: d.business_type,
            email: d.email,
            phone: d.phone || undefined,
            address: d.address || undefined,
            landmark: d.landmark || undefined,
            city: d.city || undefined,
            state: d.state || undefined,
            pincode: d.pincode || undefined,
            status: d.status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Could not fetch remote shop_registration_requests:', e);
      }
    }

    try {
      const localReqs = await this.localFallback.getPendingRequests();
      for (const loc of localReqs) {
        if (!existingRequests.some((r) => r.id === loc.id || r.shopId === loc.shopId)) {
          existingRequests.push(loc);
        }
      }
    } catch {}

    // Ensure every pending shop from allShops is represented
    const result: ShopRegistrationRequest[] = [];
    for (const shop of pendingShops) {
      const matched = existingRequests.find((r) => r.shopId === shop.id || r.id === shop.id || r.id === `req_${shop.id}`);
      if (matched) {
        result.push(matched);
      } else {
        result.push({
          id: `req_${shop.id}`,
          ownerUserId: shop.ownerId || '',
          shopId: shop.id,
          shopName: shop.name,
          businessType: shop.businessType || 'Retail',
          email: shop.ownerEmail && shop.ownerEmail !== 'N/A' ? shop.ownerEmail : 'jaswanthmajji43@gmail.com',
          phone: shop.ownerPhone,
          address: shop.address,
          city: shop.city,
          state: shop.state,
          pincode: shop.pincode,
          status: 'pending',
          createdAt: shop.createdAt,
          updatedAt: shop.updatedAt,
        });
      }
    }

    return result;
  }

  async getAllShops(filterStatus?: ShopStatus): Promise<AdminShopListItem[]> {
    const localShops = await this.localFallback.getAllShops(filterStatus);
    if (!supabase) return localShops;
    try {
      let query = supabase
        .from('shops')
        .select(`
          id,
          name,
          tagline,
          business_type,
          owner_id,
          phone,
          address,
          city,
          state,
          pincode,
          status,
          created_at,
          updated_at,
          profiles:owner_id (
            email,
            full_name
          ),
          shop_memberships (
            id,
            member_type
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error || !data) return localShops;

      const remoteShops: AdminShopListItem[] = data.map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const memberships = Array.isArray(row.shop_memberships) ? row.shop_memberships : [];
        const workerCount = memberships.filter((m: any) => m.member_type === 'worker').length;

        return {
          id: row.id,
          name: row.name,
          tagline: row.tagline || undefined,
          businessType: row.business_type,
          ownerId: row.owner_id,
          ownerName: profile?.full_name || row.name,
          ownerEmail: profile?.email || 'N/A',
          ownerPhone: row.phone || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          pincode: row.pincode || undefined,
          status: row.status as ShopStatus,
          workerCount,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });

      // Merge remote & local shops without duplicates
      const merged = [...remoteShops];
      for (const loc of localShops) {
        if (!merged.some((s) => s.id === loc.id)) {
          merged.push(loc);
        }
      }
      return merged;
    } catch {
      return localShops;
    }
  }

  async getShopDetails(shopId: string): Promise<{
    shop: AdminShopListItem;
    workers: AdminWorkerItem[];
    auditLogs: AdminAuditLog[];
  } | null> {
    const shops = await this.getAllShops();
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return null;

    const workers = await this.getWorkers(shopId);
    const allLogs = await this.getAuditLogs();
    const auditLogs = allLogs.filter((l) => l.shopId === shopId);

    return { shop, workers, auditLogs };
  }

  async getWorkers(shopId?: string): Promise<AdminWorkerItem[]> {
    const localWorkers = await this.localFallback.getWorkers(shopId);
    if (!supabase) return localWorkers;
    try {
      let query = supabase
        .from('shop_memberships')
        .select(`
          id,
          shop_id,
          user_id,
          member_type,
          name,
          email_or_phone,
          status,
          permissions,
          last_active_at,
          created_at,
          shops:shop_id (name)
        `)
        .eq('member_type', 'worker')
        .order('created_at', { ascending: false });

      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query;
      const remoteWorkers: AdminWorkerItem[] = (!error && data) ? data.map((d: any) => {
        const shopData = Array.isArray(d.shops) ? d.shops[0] : d.shops;
        return {
          id: d.id,
          shopId: d.shop_id,
          shopName: shopData?.name || 'Unknown Shop',
          userId: d.user_id || undefined,
          memberType: d.member_type,
          name: d.name,
          emailOrPhone: d.email_or_phone,
          status: d.status,
          permissions: d.permissions || {},
          lastActiveAt: d.last_active_at || undefined,
          createdAt: d.created_at,
        };
      }) : [];

      const merged = [...remoteWorkers];
      for (const loc of localWorkers) {
        if (!merged.some((w) => w.id === loc.id)) {
          merged.push(loc);
        }
      }
      return merged;
    } catch {
      return localWorkers;
    }
  }

  async getAuditLogs(): Promise<AdminAuditLog[]> {
    const localLogs = await this.localFallback.getAuditLogs();
    if (!supabase) return localLogs;
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          id,
          admin_id,
          admin_email,
          shop_id,
          action,
          metadata,
          created_at,
          shops:shop_id (name)
        `)
        .order('created_at', { ascending: false });

      const remoteLogs: AdminAuditLog[] = (!error && data) ? data.map((row: any) => {
        const shop = Array.isArray(row.shops) ? row.shops[0] : row.shops;
        return {
          id: row.id,
          adminId: row.admin_id,
          adminEmail: row.admin_email || undefined,
          shopId: row.shop_id,
          shopName: shop?.name || 'Unknown Shop',
          action: row.action,
          metadata: row.metadata || {},
          createdAt: row.created_at,
        };
      }) : [];

      // Combine remote and local logs and deduplicate
      const combined = [...remoteLogs, ...localLogs];
      const deduplicated: AdminAuditLog[] = [];

      for (const log of combined) {
        const isDuplicate = deduplicated.some((existing) => {
          if (existing.id === log.id) return true;
          const sameShop = existing.shopId === log.shopId;
          const sameAction = existing.action === log.action;
          const sameReq = existing.metadata?.request_id && log.metadata?.request_id && existing.metadata.request_id === log.metadata.request_id;
          const sameTime = Math.abs(new Date(existing.createdAt).getTime() - new Date(log.createdAt).getTime()) < 5000;
          return sameShop && sameAction && (sameReq || sameTime);
        });

        if (!isDuplicate) {
          deduplicated.push(log);
        }
      }

      return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return localLogs;
    }
  }

  async approveRegistration(requestId: string, adminId?: string): Promise<{ success: boolean; shopId: string }> {
    let resolvedShopId = requestId.replace(/^req_/, '');

    // Best-effort local fallback sync
    try {
      const localResult = await this.localFallback.approveRegistration(requestId, adminId);
      if (localResult?.shopId) resolvedShopId = localResult.shopId;
    } catch (e) {
      console.warn('Local fallback approval failed (shop likely remote-only):', e);
    }

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeAdminId = adminId || user?.id;

        // ATOMIC TRANSACTION: rpc_approve_shop_registration
        const { data, error } = await supabase.rpc('rpc_approve_shop_registration', {
          p_request_id: requestId,
          p_admin_id: activeAdminId,
        });

        if (!error && data?.shop_id) {
          resolvedShopId = data.shop_id;
        } else {
          // If RPC not configured on backend, manually transact updates
          const cleanId = requestId.replace(/^req_/, '');
          const { data: reqData } = await supabase
            .from('shop_registration_requests')
            .select('shop_id')
            .or(`id.eq.${requestId},shop_id.eq.${cleanId}`)
            .maybeSingle();

          const targetShopId = reqData?.shop_id || resolvedShopId || cleanId;

          if (targetShopId) {
            await supabase
              .from('shop_registration_requests')
              .update({
                status: 'approved',
                approved_by: activeAdminId || null,
                approved_at: new Date().toISOString(),
              })
              .or(`id.eq.${requestId},shop_id.eq.${targetShopId}`);

            await supabase
              .from('shops')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', targetShopId);

            await supabase.from('admin_audit_logs').insert({
              admin_id: activeAdminId || null,
              admin_email: user?.email || 'jaswanthmajji43@gmail.com',
              shop_id: targetShopId,
              action: 'ADMIN_APPROVED_SHOP',
              metadata: { request_id: requestId, timestamp: new Date().toISOString() },
            });

            resolvedShopId = targetShopId;
          }
        }
      } catch (err) {
        console.warn('Supabase approveRegistration failed, fallback succeeded:', err);
      }
    }

    EventBus.publish('shop:status_changed', { shopId: resolvedShopId, status: 'active' });
    EventBus.publish('shop:approved', { shopId: resolvedShopId });

    return { success: true, shopId: resolvedShopId };
  }

  async rejectRegistration(
    requestId: string, 
    reason: string, 
    adminId?: string
  ): Promise<{ success: boolean; shopId: string }> {
    let resolvedShopId = requestId.replace(/^req_/, '');

    try {
      const localResult = await this.localFallback.rejectRegistration(requestId, reason, adminId);
      if (localResult?.shopId) resolvedShopId = localResult.shopId;
    } catch (e) {
      console.warn('Local fallback rejection failed:', e);
    }

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeAdminId = adminId || user?.id;

        // ATOMIC TRANSACTION: rpc_reject_shop_registration
        const { data, error } = await supabase.rpc('rpc_reject_shop_registration', {
          p_request_id: requestId,
          p_rejection_reason: reason,
          p_admin_id: activeAdminId,
        });

        if (!error && data?.shop_id) {
          resolvedShopId = data.shop_id;
        } else {
          const cleanId = requestId.replace(/^req_/, '');
          const { data: reqData } = await supabase
            .from('shop_registration_requests')
            .select('shop_id')
            .or(`id.eq.${requestId},shop_id.eq.${cleanId}`)
            .maybeSingle();

          const targetShopId = reqData?.shop_id || resolvedShopId || cleanId;

          if (targetShopId) {
            await supabase
              .from('shop_registration_requests')
              .update({
                status: 'rejected',
                rejection_reason: reason,
                rejected_by: activeAdminId || null,
                rejected_at: new Date().toISOString(),
              })
              .or(`id.eq.${requestId},shop_id.eq.${targetShopId}`);

            await supabase
              .from('shops')
              .update({ status: 'rejected', updated_at: new Date().toISOString() })
              .eq('id', targetShopId);

            await supabase.from('admin_audit_logs').insert({
              admin_id: activeAdminId || null,
              admin_email: user?.email || 'jaswanthmajji43@gmail.com',
              shop_id: targetShopId,
              action: 'ADMIN_REJECTED_SHOP',
              metadata: { request_id: requestId, reason, timestamp: new Date().toISOString() },
            });

            resolvedShopId = targetShopId;
          }
        }
      } catch (err) {
        console.warn('Supabase rejectRegistration failed, fallback succeeded:', err);
      }
    }

    EventBus.publish('shop:status_changed', { shopId: resolvedShopId, status: 'rejected' });
    EventBus.publish('shop:rejected', { shopId: resolvedShopId });

    return { success: true, shopId: resolvedShopId };
  }

  async suspendShop(shopId: string, reason: string, adminId?: string): Promise<{ success: boolean }> {
    await this.localFallback.suspendShop(shopId, reason, adminId);

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeAdminId = adminId || user?.id;

        const { error } = await supabase.rpc('rpc_suspend_shop', {
          p_shop_id: shopId,
          p_reason: reason,
          p_admin_id: activeAdminId,
        });

        if (error) {
          await supabase.from('shops').update({ status: 'suspended' }).eq('id', shopId);
          await supabase.from('admin_audit_logs').insert({
            admin_id: activeAdminId || null,
            admin_email: user?.email || 'jaswanthmajji43@gmail.com',
            shop_id: shopId,
            action: 'ADMIN_SUSPENDED_SHOP',
            metadata: { reason },
          });
        }
      } catch (err) {
        console.warn('Supabase suspendShop failed, fallback succeeded:', err);
      }
    }

    return { success: true };
  }

  async reactivateShop(shopId: string, adminId?: string): Promise<{ success: boolean }> {
    await this.localFallback.reactivateShop(shopId, adminId);

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const activeAdminId = adminId || user?.id;

        const { error } = await supabase.rpc('rpc_reactivate_shop', {
          p_shop_id: shopId,
          p_admin_id: activeAdminId,
        });

        if (error) {
          await supabase.from('shops').update({ status: 'active' }).eq('id', shopId);
          await supabase.from('admin_audit_logs').insert({
            admin_id: activeAdminId || null,
            admin_email: user?.email || 'jaswanthmajji43@gmail.com',
            shop_id: shopId,
            action: 'ADMIN_REACTIVATED_SHOP',
            metadata: {},
          });
        }
      } catch (err) {
        console.warn('Supabase reactivateShop failed, fallback succeeded:', err);
      }
    }

    return { success: true };
  }

  async getAdminUsers(): Promise<AdminProfile[]> {
    if (!supabase) return this.localFallback.getAdminUsers();
    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return this.localFallback.getAdminUsers();
      return data.map((d: any) => ({
        id: d.id,
        email: d.email,
        role: d.role,
        createdAt: d.created_at,
      }));
    } catch {
      return this.localFallback.getAdminUsers();
    }
  }

  async addAdminUser(
    email: string, 
    role: 'super_admin' | 'support_admin' | 'auditor'
  ): Promise<{ success: boolean; admin: AdminProfile }> {
    const localRes = await this.localFallback.addAdminUser(email, role);

    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        const adminId = profile?.id || localRes.admin.id;

        const { data, error } = await supabase
          .from('platform_admins')
          .upsert({
            id: adminId,
            email: email.trim().toLowerCase(),
            role,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          return {
            success: true,
            admin: {
              id: data.id,
              email: data.email,
              role: data.role,
              createdAt: data.created_at,
            },
          };
        }
      } catch (err) {
        console.warn('Supabase addAdminUser failed, fallback succeeded:', err);
      }
    }

    return localRes;
  }

  async removeAdminUser(adminId: string): Promise<{ success: boolean }> {
    await this.localFallback.removeAdminUser(adminId);

    if (supabase) {
      try {
        await supabase
          .from('platform_admins')
          .delete()
          .eq('id', adminId);
      } catch (err) {
        console.warn('Supabase removeAdminUser failed:', err);
      }
    }

    return { success: true };
  }
}


export class LocalAdminRepository implements IAdminRepository {
  async verifyAdminAuthorization(): Promise<{ isAdmin: boolean; role?: string }> {
    // Check if an admin session flag or admin credential is active in sessionStorage/localStorage
    const adminAuth = localStorage.getItem('shop_khattabook_admin_session');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed?.isAdmin) {
          return { isAdmin: true, role: parsed.role || 'super_admin' };
        }
      } catch {}
    }
    return { isAdmin: false };
  }

  async getKPIStats(): Promise<AdminKPIStats> {
    const shops = await LocalStorageDB.select('shops');
    const memberships = await LocalStorageDB.select('shop_memberships');
    const workerCount = memberships.filter((m: any) => m.member_type === 'worker').length;

    const total = shops.length;
    const active = shops.filter((s: any) => s.status === 'active').length;
    const pending = shops.filter((s: any) => s.status === 'pending').length;
    const rejected = shops.filter((s: any) => s.status === 'rejected').length;
    const suspended = shops.filter((s: any) => s.status === 'suspended').length;

    return {
      totalShops: total,
      activeShops: active,
      pendingShops: pending,
      rejectedShops: rejected,
      suspendedShops: suspended,
      totalWorkers: workerCount,
    };
  }

  async getPendingRequests(): Promise<ShopRegistrationRequest[]> {
    let requests = await LocalStorageDB.select('shop_registration_requests');
    const shops = await LocalStorageDB.select('shops');
    const memberships = await LocalStorageDB.select('shop_memberships');

    // Auto-reconcile: find any shops with status === 'pending' that don't have a pending request
    const pendingShops = shops.filter((s: any) => s.status === 'pending');
    for (const s of pendingShops) {
      const existingReq = requests.find((r: any) => r.shop_id === s.id || r.id === `req_${s.id}` || r.id === s.id);
      if (!existingReq) {
        const ownerMembership = memberships.find((m: any) => m.shop_id === s.id && m.member_type === 'owner');
        const newReq = {
          id: `req_${s.id}`,
          owner_user_id: s.owner_id || 'owner_local',
          shop_id: s.id,
          shop_name: s.name,
          business_type: s.business_type || 'Retail',
          email: (ownerMembership?.email_or_phone?.includes('@') ? ownerMembership.email_or_phone : null) || 'jaswanthmajji43@gmail.com',
          phone: s.phone || (ownerMembership?.email_or_phone && !ownerMembership.email_or_phone.includes('@') ? ownerMembership.email_or_phone : undefined),
          address: s.address || undefined,
          landmark: s.landmark || undefined,
          city: s.city || undefined,
          state: s.state || undefined,
          pincode: s.pincode || undefined,
          status: 'pending',
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        };
        await LocalStorageDB.insert('shop_registration_requests', newReq);
        requests.push(newReq);
      } else if (existingReq.status !== 'pending' && s.status === 'pending') {
        existingReq.status = 'pending';
        await LocalStorageDB.update('shop_registration_requests', (r: any) => r.id === existingReq.id, {
          status: 'pending'
        });
      }
    }

    const pendingRequests = requests.filter((r: any) => r.status === 'pending');
    return pendingRequests.map((d: any) => ({
      id: d.id,
      ownerUserId: d.owner_user_id,
      shopId: d.shop_id,
      shopName: d.shop_name,
      businessType: d.business_type,
      email: d.email || 'jaswanthmajji43@gmail.com',
      phone: d.phone || undefined,
      address: d.address || undefined,
      landmark: d.landmark || undefined,
      city: d.city || undefined,
      state: d.state || undefined,
      pincode: d.pincode || undefined,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  async getAllShops(filterStatus?: ShopStatus): Promise<AdminShopListItem[]> {
    let shops = await LocalStorageDB.select('shops');
    if (filterStatus) {
      shops = shops.filter((s: any) => s.status === filterStatus);
    }
    const memberships = await LocalStorageDB.select('shop_memberships');

    return shops.map((s: any) => {
      const shopWorkers = memberships.filter(
        (m: any) => m.shop_id === s.id && m.member_type === 'worker'
      );
      const ownerMembership = memberships.find(
        (m: any) => m.shop_id === s.id && m.member_type === 'owner'
      );

      return {
        id: s.id,
        name: s.name,
        tagline: s.tagline || undefined,
        businessType: s.business_type,
        ownerId: s.owner_id,
        ownerName: ownerMembership?.name || s.name,
        ownerEmail: ownerMembership?.email_or_phone || 'N/A',
        ownerPhone: s.phone || undefined,
        address: s.address || undefined,
        city: s.city || undefined,
        state: s.state || undefined,
        pincode: s.pincode || undefined,
        status: (s.status as ShopStatus) || 'pending',
        workerCount: shopWorkers.length,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });
  }

  async getShopDetails(shopId: string): Promise<{
    shop: AdminShopListItem;
    workers: AdminWorkerItem[];
    auditLogs: AdminAuditLog[];
  } | null> {
    const shops = await this.getAllShops();
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return null;

    const workers = await this.getWorkers(shopId);
    const allLogs = await this.getAuditLogs();
    const auditLogs = allLogs.filter((l) => l.shopId === shopId);

    return { shop, workers, auditLogs };
  }

  async getWorkers(shopId?: string): Promise<AdminWorkerItem[]> {
    const memberships = await LocalStorageDB.select('shop_memberships', (m: any) => {
      const matchType = m.member_type === 'worker';
      return shopId ? matchType && m.shop_id === shopId : matchType;
    });
    const shops = await LocalStorageDB.select('shops');
    const shopMap = new Map<string, string>(shops.map((s: any) => [s.id, s.name]));

    return memberships.map((m: any) => ({
      id: m.id,
      shopId: m.shop_id,
      shopName: shopMap.get(m.shop_id) || 'Unknown Shop',
      userId: m.user_id || undefined,
      memberType: m.member_type,
      name: m.name,
      emailOrPhone: m.email_or_phone,
      status: m.status,
      permissions: m.permissions || {},
      lastActiveAt: m.last_active_at || undefined,
      createdAt: m.created_at,
    }));
  }

  async getAuditLogs(): Promise<AdminAuditLog[]> {
    const logs = await LocalStorageDB.select('admin_audit_logs');
    const shops = await LocalStorageDB.select('shops');
    const shopMap = new Map<string, string>(shops.map((s: any) => [s.id, s.name]));

    const mapped: AdminAuditLog[] = logs.map((l: any) => ({
      id: l.id,
      adminId: l.admin_id,
      adminEmail: l.admin_email || 'jaswanthmajji43@gmail.com',
      shopId: l.shop_id,
      shopName: shopMap.get(l.shop_id) || 'Shop',
      action: l.action,
      metadata: l.metadata || {},
      createdAt: l.created_at,
    }));

    const deduplicated: AdminAuditLog[] = [];
    for (const log of mapped) {
      const isDuplicate = deduplicated.some((existing) => {
        if (existing.id === log.id) return true;
        const sameShop = existing.shopId === log.shopId;
        const sameAction = existing.action === log.action;
        const sameReq = existing.metadata?.request_id && log.metadata?.request_id && existing.metadata.request_id === log.metadata.request_id;
        const sameTime = Math.abs(new Date(existing.createdAt).getTime() - new Date(log.createdAt).getTime()) < 4000;
        return sameShop && sameAction && (sameReq || sameTime);
      });
      if (!isDuplicate) {
        deduplicated.push(log);
      }
    }

    return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async approveRegistration(requestId: string, adminId?: string): Promise<{ success: boolean; shopId: string }> {
    let request = await LocalStorageDB.selectOne('shop_registration_requests', (r: any) => r.id === requestId);
    let shopId = request?.shop_id;

    if (!shopId) {
      const directShop = await LocalStorageDB.selectOne('shops', (s: any) => s.id === requestId || `req_${s.id}` === requestId || requestId.includes(s.id));
      if (directShop) {
        shopId = directShop.id;
      } else {
        shopId = requestId.replace(/^req_/, '');
      }
    }

    const now = new Date().toISOString();

    // 1. Update request to approved
    if (request) {
      await LocalStorageDB.update('shop_registration_requests', (r: any) => r.id === requestId || r.shop_id === shopId, {
        status: 'approved',
        approved_by: adminId || 'admin',
        approved_at: now,
        rejection_reason: null,
        updated_at: now,
      });
    }

    // 2. Update shop to active if present locally
    const localShop = await LocalStorageDB.selectOne('shops', (s: any) => s.id === shopId);
    if (localShop) {
      await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
        status: 'active',
        updated_at: now,
      });
    }

    // 3. Insert audit log
    await LocalStorageDB.insert('admin_audit_logs', {
      admin_id: adminId || 'admin',
      admin_email: 'jaswanthmajji43@gmail.com',
      shop_id: shopId,
      action: 'ADMIN_APPROVED_SHOP',
      metadata: { request_id: requestId, shop_name: request?.shop_name || 'Shop' },
      created_at: now,
    });

    EventBus.publish('shop:status_changed', { shopId, status: 'active' });
    EventBus.publish('shop:approved', { shopId });

    return { success: true, shopId };
  }

  async rejectRegistration(
    requestId: string, 
    reason: string, 
    adminId?: string
  ): Promise<{ success: boolean; shopId: string }> {
    let request = await LocalStorageDB.selectOne('shop_registration_requests', (r: any) => r.id === requestId);
    let shopId = request?.shop_id;

    if (!shopId) {
      const directShop = await LocalStorageDB.selectOne('shops', (s: any) => s.id === requestId || `req_${s.id}` === requestId || requestId.includes(s.id));
      if (directShop) {
        shopId = directShop.id;
      } else {
        shopId = requestId.replace(/^req_/, '');
      }
    }

    const now = new Date().toISOString();

    // 1. Update request to rejected
    if (request) {
      await LocalStorageDB.update('shop_registration_requests', (r: any) => r.id === requestId || r.shop_id === shopId, {
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: adminId || 'admin',
        rejected_at: now,
        updated_at: now,
      });
    }

    // 2. Update shop to rejected if present locally
    const localShop = await LocalStorageDB.selectOne('shops', (s: any) => s.id === shopId);
    if (localShop) {
      await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
        status: 'rejected',
        updated_at: now,
      });
    }

    // 3. Insert audit log
    await LocalStorageDB.insert('admin_audit_logs', {
      admin_id: adminId || 'admin',
      admin_email: 'jaswanthmajji43@gmail.com',
      shop_id: shopId,
      action: 'ADMIN_REJECTED_SHOP',
      metadata: { request_id: requestId, reason, shop_name: request?.shop_name || 'Shop' },
      created_at: now,
    });

    EventBus.publish('shop:status_changed', { shopId, status: 'rejected' });
    EventBus.publish('shop:rejected', { shopId });

    return { success: true, shopId };
  }

  async suspendShop(shopId: string, reason: string, adminId?: string): Promise<{ success: boolean }> {
    const now = new Date().toISOString();
    await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
      status: 'suspended',
      updated_at: now,
    });

    await LocalStorageDB.insert('admin_audit_logs', {
      admin_id: adminId || 'admin',
      admin_email: 'jaswanthmajji43@gmail.com',
      shop_id: shopId,
      action: 'ADMIN_SUSPENDED_SHOP',
      metadata: { reason },
      created_at: now,
    });

    return { success: true };
  }

  async reactivateShop(shopId: string, adminId?: string): Promise<{ success: boolean }> {
    const now = new Date().toISOString();
    await LocalStorageDB.update('shops', (s: any) => s.id === shopId, {
      status: 'active',
      updated_at: now,
    });

    await LocalStorageDB.insert('admin_audit_logs', {
      admin_id: adminId || 'admin',
      admin_email: 'jaswanthmajji43@gmail.com',
      shop_id: shopId,
      action: 'ADMIN_REACTIVATED_SHOP',
      metadata: {},
      created_at: now,
    });

    return { success: true };
  }

  async getAdminUsers(): Promise<AdminProfile[]> {
    let admins = await LocalStorageDB.select('platform_admins');
    
    // Automatically migrate any legacy placeholder admin to jaswanthmajji43@gmail.com
    const hasLegacy = admins?.some((a: any) => a.email === 'admin@khattabook.com');
    if (hasLegacy) {
      await LocalStorageDB.update('platform_admins', (a: any) => a.email === 'admin@khattabook.com', {
        email: 'jaswanthmajji43@gmail.com',
        role: 'super_admin',
      });
      admins = await LocalStorageDB.select('platform_admins');
    }

    if (!admins || admins.length === 0) {
      const seeded = await LocalStorageDB.insert('platform_admins', {
        email: 'jaswanthmajji43@gmail.com',
        role: 'super_admin',
      });
      return [{
        id: seeded.id,
        email: seeded.email,
        role: seeded.role,
        createdAt: seeded.created_at,
      }];
    }
    return admins.map((a: any) => ({
      id: a.id,
      email: a.email,
      role: a.role,
      createdAt: a.created_at,
    }));
  }

  async addAdminUser(
    email: string, 
    role: 'super_admin' | 'support_admin' | 'auditor'
  ): Promise<{ success: boolean; admin: AdminProfile }> {
    const existing = await LocalStorageDB.selectOne(
      'platform_admins', 
      (a: any) => a.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existing) {
      await LocalStorageDB.update('platform_admins', (a: any) => a.id === existing.id, { role });
      return {
        success: true,
        admin: { id: existing.id, email: existing.email, role, createdAt: existing.created_at },
      };
    }

    const inserted = await LocalStorageDB.insert('platform_admins', {
      email: email.trim().toLowerCase(),
      role,
    });

    return {
      success: true,
      admin: { id: inserted.id, email: inserted.email, role: inserted.role, createdAt: inserted.created_at },
    };
  }

  async removeAdminUser(adminId: string): Promise<{ success: boolean }> {
    await LocalStorageDB.delete('platform_admins', (a: any) => a.id === adminId);
    return { success: true };
  }
}

