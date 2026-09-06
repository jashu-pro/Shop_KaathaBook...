/* shop/types/index.ts */

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
