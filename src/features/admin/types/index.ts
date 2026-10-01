/* features/admin/types/index.ts */
import type { ShopStatus, RegistrationRequestStatus, ShopRegistrationRequest } from '../../shop/types';

export type { ShopStatus, RegistrationRequestStatus, ShopRegistrationRequest };

export interface AdminKPIStats {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  rejectedShops: number;
  suspendedShops: number;
  totalWorkers: number;
}

export interface AdminShopListItem {
  id: string;
  name: string;
  tagline?: string;
  businessType: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: ShopStatus;
  workerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkerItem {
  id: string;
  shopId: string;
  shopName: string;
  userId?: string;
  memberType: 'owner' | 'worker';
  name: string;
  emailOrPhone: string;
  status: 'invited' | 'active' | 'suspended';
  permissions: Record<string, any>;
  lastActiveAt?: string;
  createdAt: string;
}

export type AdminAuditAction = 
  | 'ADMIN_APPROVED_SHOP' 
  | 'ADMIN_REJECTED_SHOP' 
  | 'ADMIN_SUSPENDED_SHOP' 
  | 'ADMIN_REACTIVATED_SHOP';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  shopId: string;
  shopName?: string;
  action: AdminAuditAction;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  role: 'super_admin' | 'support_admin' | 'auditor';
  createdAt: string;
}
