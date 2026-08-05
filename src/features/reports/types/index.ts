/* features/reports/types/index.ts */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ReportTab = 'overview' | 'profit' | 'outstanding' | 'customers';

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
}

export interface OutstandingSummary {
  totalUdhaarOwed: number;
  debtorCount: number;
  highRiskCount: number;
}

export interface CustomerReportItem {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  village?: string;
  totalSalesCount: number;
  totalSpent: number;
  currentBalance: number;
  status: 'clear' | 'udhaar';
}
