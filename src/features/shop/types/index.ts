/* shop/types/index.ts */

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  businessType: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopDTO {
  name: string;
  businessType: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  upiId?: string;
}
