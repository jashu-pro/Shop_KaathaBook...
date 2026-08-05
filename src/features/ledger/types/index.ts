/* features/ledger/types/index.ts */

export type LedgerEntryType = 'debit' | 'credit'; // debit = you gave credit (customer owes), credit = you got payment (customer paid)
export type LedgerDateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface LedgerEntry {
  id: string;
  shopId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  entryDate: string;
  entryType: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceType?: 'sale' | 'payment' | 'initial' | 'adjustment';
  referenceId?: string;
  createdAt: string;
}

export interface CreateLedgerEntryDTO {
  customerId: string;
  entryDate?: string;
  entryType: LedgerEntryType;
  amount: number;
  description?: string;
  referenceType?: 'sale' | 'payment' | 'initial' | 'adjustment';
  referenceId?: string;
}
