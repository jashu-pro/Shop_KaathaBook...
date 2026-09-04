/* src/features/staff/components/WorkerLeaderboardStudio.tsx */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Sliders, 
  X, 
  Check, 
  Sparkles
} from 'lucide-react';
import type { WorkerSalesPerformance, LeaderboardTimeframe, ShopPerformanceSettings } from '../types';
import { WorkerPerformanceService } from '../services/WorkerPerformanceService';
import { useAuthStore } from '../../../stores/authStore';
import { useTheme } from '../../../providers/ThemeProvider';
import { EventBus } from '../../../services/EventBus';

export const WorkerLeaderboardStudio: React.FC = () => {
  const { shop } = useAuthStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('today');
  const [leaderboard, setLeaderboard] = useState<WorkerSalesPerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Settings State
  const [settings, setSettings] = useState<ShopPerformanceSettings>(
    shop?.id ? WorkerPerformanceService.getShopSettings(shop.id) : { dailySalesTargetPerWorker: 25000, commissionPercentage: 1.0, rewardThresholdMultiplier: 1.2 }
  );
  const [tempTarget, setTempTarget] = useState<string>(String(settings.dailySalesTargetPerWorker));
  const [tempCommission, setTempCommission] = useState<string>(String(settings.commissionPercentage));

  const loadData = useCallback(async () => {
    if (!shop?.id) return;
    setIsLoading(true);
    try {
      const data = await WorkerPerformanceService.computeLeaderboard(shop.id, timeframe);
      setLeaderboard(data);
      setSettings(WorkerPerformanceService.getShopSettings(shop.id));
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  }, [shop?.id, timeframe]);

  useEffect(() => {
    loadData();
    const unsubSales = EventBus.subscribe('sales:changed', () => loadData());
    const unsubSync = EventBus.subscribe('data:sync', () => loadData());
    return () => {
      unsubSales();
      unsubSync();
    };
  }, [loadData]);

  const handleSaveSettings = () => {
    if (!shop?.id) return;
    const updated = WorkerPerformanceService.saveShopSettings(shop.id, {
      dailySalesTargetPerWorker: Number(tempTarget) || 25000,
      commissionPercentage: Number(tempCommission) || 1.0,
    });
    setSettings(updated);
    setShowConfigModal(false);
    loadData();
  };

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  // Theme-aware tokens
  const styles = {
    cardBg: isDark ? 'rgba(30, 41, 59, 0.85)' : '#FFFFFF',
    borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
    titleColor: isDark ? '#F8FAFC' : '#0F172A',
    subColor: isDark ? '#94A3B8' : '#64748B',
    podiumBg1: isDark ? 'linear-gradient(180deg, rgba(234, 179, 8, 0.22) 0%, rgba(30, 41, 59, 0.95) 100%)' : 'linear-gradient(180deg, #FEF9C3 0%, #FFFFFF 100%)',
    podiumBg2: isDark ? 'linear-gradient(180deg, rgba(148, 163, 184, 0.22) 0%, rgba(30, 41, 59, 0.95) 100%)' : 'linear-gradient(180deg, #F1F5F9 0%, #FFFFFF 100%)',
    podiumBg3: isDark ? 'linear-gradient(180deg, rgba(217, 119, 6, 0.22) 0%, rgba(30, 41, 59, 0.95) 100%)' : 'linear-gradient(180deg, #FFEDD5 0%, #FFFFFF 100%)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '24px',
          backgroundColor: styles.cardBg,
          border: `1px solid ${styles.borderColor}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: styles.titleColor }}>
                Worker Sales Leaderboard & Performance
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Flame size={12} /> Live Staff Rankings
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: styles.subColor }}>
              Track daily employee revenue, bills billed, target achievements, and sales commissions
            </p>
          </div>
        </div>

        {/* Controls: Timeframe Pills & Config Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Timeframe selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9',
              padding: '0.25rem',
              borderRadius: '14px',
              border: `1px solid ${styles.borderColor}`,
            }}
          >
            {(['today', 'week', 'month', 'all_time'] as LeaderboardTimeframe[]).map((tf) => {
              const active = timeframe === tf;
              const labels: Record<LeaderboardTimeframe, string> = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                all_time: 'All Time',
              };
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: active ? '#059669' : 'transparent',
                    color: active ? '#FFFFFF' : styles.subColor,
                    fontSize: '0.775rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {labels[tf]}
                </button>
              );
            })}
          </div>

          {/* Config Settings Button */}
          <button
            type="button"
            onClick={() => {
              setTempTarget(String(settings.dailySalesTargetPerWorker));
              setTempCommission(String(settings.commissionPercentage));
              setShowConfigModal(true);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '14px',
              border: `1px solid ${styles.borderColor}`,
              backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : '#FFFFFF',
              color: styles.titleColor,
              fontSize: '0.8rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
            title="Configure Daily Targets and Commission"
          >
            <Sliders size={15} />
            <span>Target & Commission</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Visual */}
      {leaderboard.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Silver #2 */}
          {top2 && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '24px',
                background: styles.podiumBg2,
                border: '1.5px solid #94A3B8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(148, 163, 184, 0.12)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#94A3B8',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem',
                }}
              >
                🥈
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B' }}>RANK #2</span>
              <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: '800', color: styles.titleColor }}>
                {top2.workerName}
              </h4>
              <span style={{ fontSize: '0.725rem', color: styles.subColor, marginBottom: '0.65rem' }}>{top2.role}</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', marginBottom: '0.25rem' }}>
                ₹{top2.totalRevenue.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: styles.subColor }}>
                {top2.billsCount} bills • ₹{top2.commissionEarned} incentive
              </span>
            </div>
          )}

          {/* Gold #1 - Highest Podium */}
          {top1 && (
            <div
              style={{
                padding: '1.6rem 1.25rem',
                borderRadius: '26px',
                background: styles.podiumBg1,
                border: '2px solid #F59E0B',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(245, 158, 11, 0.22)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Sparkles size={12} /> TOP PERFORMER 👑
              </div>

              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.5rem',
                  marginBottom: '0.5rem',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                🥇
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D97706' }}>CHAMPION #1</span>
              <h4 style={{ margin: '0.2rem 0', fontSize: '1.25rem', fontWeight: '800', color: styles.titleColor }}>
                {top1.workerName}
              </h4>
              <span style={{ fontSize: '0.725rem', color: styles.subColor, marginBottom: '0.75rem' }}>{top1.role}</span>
              <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#059669', marginBottom: '0.25rem' }}>
                ₹{top1.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: styles.subColor,
                }}
              >
                <span>📦 {top1.billsCount} bills</span>
                <span>•</span>
                <span style={{ color: '#F59E0B', fontWeight: '700' }}>🎁 ₹{top1.commissionEarned} incentive</span>
              </div>
            </div>
          )}

          {/* Bronze #3 */}
          {top3 && (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '24px',
                background: styles.podiumBg3,
                border: '1.5px solid #D97706',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(217, 119, 6, 0.12)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem',
                }}
              >
                🥉
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B45309' }}>RANK #3</span>
              <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: '800', color: styles.titleColor }}>
                {top3.workerName}
              </h4>
              <span style={{ fontSize: '0.725rem', color: styles.subColor, marginBottom: '0.65rem' }}>{top3.role}</span>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', marginBottom: '0.25rem' }}>
                ₹{top3.totalRevenue.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.75rem', color: styles.subColor }}>
                {top3.billsCount} bills • ₹{top3.commissionEarned} incentive
              </span>
            </div>
          )}
        </div>
      )}

      {/* Detailed Leaderboard Table */}
      <div
        style={{
          borderRadius: '24px',
          backgroundColor: styles.cardBg,
          border: `1px solid ${styles.borderColor}`,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: `1px solid ${styles.borderColor}` }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: styles.titleColor }}>
            Staff Rankings & Target Achievement Breakdown
          </h4>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#F8FAFC',
                  color: styles.subColor,
                  borderBottom: `1px solid ${styles.borderColor}`,
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.85rem 1.25rem' }}>Rank</th>
                <th style={{ padding: '0.85rem 1rem' }}>Employee Name</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total Revenue</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bills Billed</th>
                <th style={{ padding: '0.85rem 1rem' }}>Avg Bill Value</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Progress</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: styles.subColor }}>
                    Calculating live staff sales rankings...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: styles.subColor }}>
                    No sales recorded for this timeframe yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((item) => {
                  const rankIcon = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`;
                  const progressColor = item.targetProgress >= 100 ? '#10B981' : item.targetProgress >= 60 ? '#F59E0B' : '#EF4444';

                  return (
                    <tr
                      key={item.workerId}
                      style={{
                        borderBottom: `1px solid ${styles.borderColor}`,
                        backgroundColor: item.rank === 1 ? (isDark ? 'rgba(245, 158, 11, 0.06)' : '#FFFBEB') : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: '800', fontSize: '0.95rem' }}>
                        {rankIcon}
                      </td>

                      {/* Employee */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: '800', color: styles.titleColor, fontSize: '0.875rem' }}>
                          {item.workerName}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: styles.subColor }}>{item.role}</span>
                      </td>

                      {/* Revenue */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: '800', color: '#059669', fontSize: '0.95rem' }}>
                        ₹{item.totalRevenue.toLocaleString('en-IN')}
                      </td>

                      {/* Bills count */}
                      <td style={{ padding: '0.9rem 1rem', fontWeight: '700', color: styles.titleColor }}>
                        {item.billsCount} bills
                      </td>

                      {/* Avg Bill */}
                      <td style={{ padding: '0.9rem 1rem', color: styles.subColor, fontWeight: '600' }}>
                        ₹{item.averageBillValue.toLocaleString('en-IN')}
                      </td>

                      {/* Target Progress Bar */}
                      <td style={{ padding: '0.9rem 1rem', minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '700', color: progressColor }}>{item.targetProgress}%</span>
                          <span style={{ color: styles.subColor }}>Target: ₹{item.dailyTarget.toLocaleString('en-IN')}</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '10px',
                            backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : '#E2E8F0',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(item.targetProgress, 100)}%`,
                              height: '100%',
                              borderRadius: '10px',
                              backgroundColor: progressColor,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </td>

                      {/* Commission */}
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: '800', color: '#F59E0B' }}>
                        +₹{item.commissionEarned.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target & Commission Config Modal */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderRadius: '24px',
              border: `1.5px solid ${styles.borderColor}`,
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: styles.titleColor }}>
                  Staff Sales Targets & Commission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', color: styles.subColor, cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.825rem', color: styles.subColor, lineHeight: '1.4' }}>
              Set shop-wide daily revenue targets for workers and configure sales incentive commission percentages.
            </p>

            {/* Daily Target Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: styles.titleColor, marginBottom: '0.35rem' }}>
                Daily Sales Target per Worker (₹)
              </label>
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                placeholder="25000"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${styles.borderColor}`,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  color: styles.titleColor,
                  fontWeight: '700',
                  fontSize: '0.95rem',
                }}
              />
              <span style={{ fontSize: '0.725rem', color: styles.subColor, marginTop: '0.2rem', display: 'block' }}>
                Used to compute the progress bar (e.g. ₹25,000 / day).
              </span>
            </div>

            {/* Commission % Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: styles.titleColor, marginBottom: '0.35rem' }}>
                Sales Incentive / Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={tempCommission}
                onChange={(e) => setTempCommission(e.target.value)}
                placeholder="1.0"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: `1.5px solid ${styles.borderColor}`,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  color: styles.titleColor,
                  fontWeight: '700',
                  fontSize: '0.95rem',
                }}
              />
              <span style={{ fontSize: '0.725rem', color: styles.subColor, marginTop: '0.2rem', display: 'block' }}>
                E.g. 1.0% awards ₹100 on ₹10,000 sales to motivate staff.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '14px',
                  border: `1px solid ${styles.borderColor}`,
                  backgroundColor: 'transparent',
                  color: styles.titleColor,
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                }}
              >
                <Check size={16} /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
