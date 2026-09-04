/* src/features/staff/services/WorkerPerformanceService.ts */
import type { 
  WorkerSalesPerformance, 
  LeaderboardTimeframe, 
  ShopPerformanceSettings 
} from '../types';
import { DEFAULT_PERFORMANCE_SETTINGS } from '../types';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';

export class WorkerPerformanceService {
  private static getSettingsKey(shopId: string): string {
    return `khattabook_performance_settings_${shopId}`;
  }

  static getShopSettings(shopId: string): ShopPerformanceSettings {
    try {
      const data = localStorage.getItem(this.getSettingsKey(shopId));
      if (!data) return DEFAULT_PERFORMANCE_SETTINGS;
      return { ...DEFAULT_PERFORMANCE_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_PERFORMANCE_SETTINGS;
    }
  }

  static saveShopSettings(shopId: string, settings: Partial<ShopPerformanceSettings>): ShopPerformanceSettings {
    const current = this.getShopSettings(shopId);
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(this.getSettingsKey(shopId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save performance settings', e);
    }
    return updated;
  }

  private static isWithinTimeframe(timestamp: string, timeframe: LeaderboardTimeframe): boolean {
    const date = new Date(timestamp);
    const now = new Date();

    if (timeframe === 'all_time') return true;

    if (timeframe === 'today') {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }

    if (timeframe === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(now.getDate() - 7);
      return date >= pastWeek;
    }

    if (timeframe === 'month') {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    return true;
  }

  static async computeLeaderboard(
    shopId: string,
    timeframe: LeaderboardTimeframe = 'today'
  ): Promise<WorkerSalesPerformance[]> {
    const workerRepo = RepositoryFactory.getWorkerRepository();
    const [workers, allLogs] = await Promise.all([
      workerRepo.getWorkers(shopId),
      workerRepo.getActivityLogs(shopId),
    ]);

    const settings = this.getShopSettings(shopId);

    // Filter logs by selected timeframe
    const filteredLogs = allLogs.filter((log) => 
      this.isWithinTimeframe(log.timestamp, timeframe)
    );

    // Target multiplier based on timeframe
    let targetMultiplier = 1;
    if (timeframe === 'week') targetMultiplier = 7;
    if (timeframe === 'month') targetMultiplier = 30;
    if (timeframe === 'all_time') targetMultiplier = 90;

    const baseTarget = (settings.dailySalesTargetPerWorker || 25000) * targetMultiplier;

    // Ensure Owner is included as a benchmark participant alongside workers
    const participants: { id: string; name: string; role: string }[] = [
      ...workers.map((w) => ({ id: w.id, name: w.name, role: (w as any).role || 'Staff Member' })),
    ];

    // If no workers exist yet, add dummy or owner for immediate viewability
    if (participants.length === 0) {
      participants.push({ id: 'owner', name: 'Shop Owner', role: 'Owner' });
    }

    // Check if there are logs attributed to "owner"
    const hasOwnerLogs = filteredLogs.some((l) => l.workerId === 'owner');
    if (hasOwnerLogs && !participants.some((p) => p.id === 'owner')) {
      participants.unshift({ id: 'owner', name: 'Shop Owner', role: 'Owner' });
    }

    const performanceList: WorkerSalesPerformance[] = participants.map((p) => {
      const workerLogs = filteredLogs.filter((l) => l.workerId === p.id);

      // Total revenue from sale logs
      const saleLogs = workerLogs.filter((l) => l.category === 'sale');
      const totalRevenue = saleLogs.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
      const billsCount = saleLogs.length;

      // Payment logs breakdown
      const paymentLogs = workerLogs.filter((l) => l.category === 'payment');
      const cashCollected = paymentLogs
        .filter((l) => (l.action || '').toLowerCase().includes('cash'))
        .reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

      const upiCollected = paymentLogs
        .filter((l) => {
          const act = (l.action || '').toLowerCase();
          return act.includes('upi') || act.includes('gpay') || act.includes('phonepe') || act.includes('paytm');
        })
        .reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

      const averageBillValue = billsCount > 0 ? Math.round(totalRevenue / billsCount) : 0;
      const targetProgress = baseTarget > 0 ? Math.round((totalRevenue / baseTarget) * 100) : 0;
      const commissionEarned = Math.round((totalRevenue * (settings.commissionPercentage || 1.0)) / 100);

      return {
        workerId: p.id,
        workerName: p.name,
        role: p.role,
        totalRevenue,
        billsCount,
        cashCollected,
        upiCollected,
        averageBillValue,
        dailyTarget: baseTarget,
        targetProgress,
        commissionEarned,
        rank: 0, // Assigned after sorting
      };
    });

    // Sort descending by total revenue (or bills count for tie breaker)
    performanceList.sort((a, b) => {
      if (b.totalRevenue !== a.totalRevenue) {
        return b.totalRevenue - a.totalRevenue;
      }
      return b.billsCount - a.billsCount;
    });

    // Assign ranks and badges
    const rankedList = performanceList.map((item, index) => {
      let badge: WorkerSalesPerformance['badge'] = undefined;
      if (index === 0 && item.totalRevenue > 0) {
        badge = 'top_performer';
      } else if (item.billsCount >= 10) {
        badge = 'speed_master';
      } else if (item.targetProgress >= 100) {
        badge = 'customer_champ';
      }

      return {
        ...item,
        rank: index + 1,
        badge,
      };
    });

    return rankedList;
  }
}
