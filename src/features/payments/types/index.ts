/* features/payments/types/index.ts */

export type PaymentMode = 'cash' | 'phonepe' | 'gpay' | 'paytm' | 'bank_transfer' | 'upi' | 'card';
export type PaymentType = 'full' | 'partial';

export interface Payment {
  id: string;
  shopId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMode;
  referenceNo?: string;
  proofImageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentDTO {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMode;
  paymentDate?: string;
  referenceNo?: string;
  proofImageUrl?: string;
  notes?: string;
}
