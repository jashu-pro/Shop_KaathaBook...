/* shop/types/index.ts */

export type ShopStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type RegistrationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  tagline?: string;
  businessType: string;
  phone?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstin?: string;
  pan?: string;
  upiId?: string;
  logoUrl?: string;
  currency: string;
  theme: string;
  language: string;
  status: ShopStatus;
  defaultCreditPeriod?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopDTO {
  name: string;
  tagline?: string;
  businessType: string;
  phone?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  gstin?: string;
  pan?: string;
  upiId?: string;
  logoUrl?: string;
  currency?: string;
  theme?: string;
  language?: string;
  defaultCreditPeriod?: number;
}

/**
 * Public Shop Registration Request entity.
 * SECURITY NOTICE: Under no circumstance does this include passwords or credentials.
 */
export interface ShopRegistrationRequest {
  id: string;
  ownerUserId: string;
  shopId: string;
  shopName: string;
  businessType: string;
  email: string;
  phone?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: RegistrationRequestStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}
