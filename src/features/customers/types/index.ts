/* features/customers/types/index.ts */

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  creditLimit: number;
  currentBalance: number; // positive = customer owes merchant (Udhaar), negative = advance
  tag?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDTO {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  creditLimit?: number;
  tag?: string;
  openingBalance?: number;
  balanceType?: 'udhaar' | 'advance';
  photoUrl?: string;
  notes?: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  creditLimit?: number;
  tag?: string;
  photoUrl?: string;
  notes?: string;
}

export type CustomerFilterTab = 'all' | 'udhaar' | 'advance' | 'clear';
