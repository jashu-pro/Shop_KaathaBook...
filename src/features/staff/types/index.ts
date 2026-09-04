/* features/staff/types/index.ts */

export interface WorkerPermissions {
  dashboard: boolean;
  sales: {
    create: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  payments: {
    receive: boolean;
    view: boolean;
  };
  customers: {
    view: boolean;
    add: boolean;
    edit: boolean;
    ledger: boolean;
  };
  inventory: {
    view: boolean;
    add: boolean;
    edit: boolean;
    adjustStock: boolean;
  };
  reports: boolean;
  settings: boolean;
  staffManagement: boolean;
}

export type WorkerStatus = 'active' | 'invited' | 'suspended';

export interface WorkerMember {
  id: string;
  shopId: string;
  name: string;
  emailOrPhone: string;
  status: WorkerStatus;
  permissions: WorkerPermissions;
  pinHash?: string;            // SHA-256 hashed 4-digit personal PIN
  tempCodeHash?: string;       // SHA-256 hashed temporary approval code
  tempCodeExpiresAt?: string;  // ISO timestamp for temp code expiry
  sessionVersion?: number;     // Incremented to revoke active sessions
  sessionsRevokedAt?: string;  // Timestamp of last session revocation
  lastActiveAt?: string;
  createdAt: string;
}

export interface WorkerActivityLog {
  id: string;
  shopId: string;
  workerId: string;
  workerName: string;
  action: string;              // e.g. "Created Sale #1024", "Received ₹2,000 payment"
  category: 'sale' | 'payment' | 'customer' | 'inventory' | 'access';
  amount?: number;
  timestamp: string;
}

export interface AddWorkerDTO {
  name: string;
  emailOrPhone: string;
  permissions: WorkerPermissions;
}

export interface UpdateWorkerDTO {
  name?: string;
  emailOrPhone?: string;
  status?: WorkerStatus;
  permissions?: WorkerPermissions;
  sessionVersion?: number;
  sessionsRevokedAt?: string;
  lastActiveAt?: string;
}

export type PermissionPresetKey = 'sales' | 'counter' | 'inventory' | 'full' | 'custom';

export interface PermissionPreset {
  key: PermissionPresetKey;
  label: string;
  description: string;
  icon: string;
  permissions: WorkerPermissions;
}

export const DEFAULT_WORKER_PERMISSIONS: WorkerPermissions = {
  dashboard: true,
  sales: {
    create: true,
    view: true,
    edit: false,
    delete: false,
  },
  payments: {
    receive: true,
    view: true,
  },
  customers: {
    view: true,
    add: true,
    edit: false,
    ledger: true,
  },
  inventory: {
    view: false,
    add: false,
    edit: false,
    adjustStock: false,
  },
  reports: false,
  settings: false,
  staffManagement: false,
};

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    key: 'sales',
    label: 'Sales Access',
    description: 'Create & view sales, view & add customers, view ledger',
    icon: '🛒',
    permissions: {
      dashboard: true,
      sales: { create: true, view: true, edit: false, delete: false },
      payments: { receive: false, view: false },
      customers: { view: true, add: true, edit: false, ledger: true },
      inventory: { view: false, add: false, edit: false, adjustStock: false },
      reports: false,
      settings: false,
      staffManagement: false,
    },
  },
  {
    key: 'counter',
    label: 'Counter / Billing',
    description: 'Sales + Receive Payments + Customer management',
    icon: '💳',
    permissions: {
      dashboard: true,
      sales: { create: true, view: true, edit: false, delete: false },
      payments: { receive: true, view: true },
      customers: { view: true, add: true, edit: false, ledger: true },
      inventory: { view: false, add: false, edit: false, adjustStock: false },
      reports: false,
      settings: false,
      staffManagement: false,
    },
  },
  {
    key: 'inventory',
    label: 'Inventory Access',
    description: 'View & add products, adjust stock levels',
    icon: '📦',
    permissions: {
      dashboard: true,
      sales: { create: false, view: false, edit: false, delete: false },
      payments: { receive: false, view: false },
      customers: { view: false, add: false, edit: false, ledger: false },
      inventory: { view: true, add: true, edit: true, adjustStock: true },
      reports: false,
      settings: false,
      staffManagement: false,
    },
  },
  {
    key: 'full',
    label: 'Full Operations',
    description: 'Sales, Payments, Customers, and Inventory',
    icon: '⚡',
    permissions: {
      dashboard: true,
      sales: { create: true, view: true, edit: true, delete: false },
      payments: { receive: true, view: true },
      customers: { view: true, add: true, edit: true, ledger: true },
      inventory: { view: true, add: true, edit: true, adjustStock: true },
      reports: false,
      settings: false,
      staffManagement: false,
    },
  },
];

export const FULL_OWNER_PERMISSIONS: WorkerPermissions = {
  dashboard: true,
  sales: {
    create: true,
    view: true,
    edit: true,
    delete: true,
  },
  payments: {
    receive: true,
    view: true,
  },
  customers: {
    view: true,
    add: true,
    edit: true,
    ledger: true,
  },
  inventory: {
    view: true,
    add: true,
    edit: true,
    adjustStock: true,
  },
  reports: true,
  settings: true,
  staffManagement: true,
};

export type LeaderboardTimeframe = 'today' | 'week' | 'month' | 'all_time';

export interface WorkerSalesPerformance {
  workerId: string;
  workerName: string;
  role: string;
  totalRevenue: number;
  billsCount: number;
  cashCollected: number;
  upiCollected: number;
  averageBillValue: number;
  dailyTarget: number;
  targetProgress: number; // 0 to 100+
  commissionEarned: number;
  rank: number;
  badge?: 'top_performer' | 'speed_master' | 'customer_champ';
}

export interface ShopPerformanceSettings {
  dailySalesTargetPerWorker: number; // e.g. 20000
  commissionPercentage: number;      // e.g. 1.0 (1%)
  rewardThresholdMultiplier: number; // e.g. 1.25 for bonus badge
}

export const DEFAULT_PERFORMANCE_SETTINGS: ShopPerformanceSettings = {
  dailySalesTargetPerWorker: 25000,
  commissionPercentage: 1.0,
  rewardThresholdMultiplier: 1.2,
};


