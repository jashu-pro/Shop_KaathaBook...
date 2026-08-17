/* features/dashboard/components/WeeklyChart.tsx */
import React, { useState } from 'react';
import { 
  BarChart3, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw, 
  Zap, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2 
} from 'lucide-react';

export interface DayData {
  day: string;
  dateStr?: string;
  formattedDate?: string;
  sales: number;
  collections: number;
  salesCount?: number;
  collectionsCount?: number;
}

export type ChartTimeRange = 'thisWeek' | 'past7Days' | 'thisMonth';

interface WeeklyChartProps {
  data?: DayData[];
  timeRange?: ChartTimeRange;
  onTimeRangeChange?: (range: ChartTimeRange) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickAddSale?: () => void;
  onSeedSampleData?: () => void;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  data,
  timeRange = 'thisWeek',
  onTimeRangeChange,
  onRefresh,
  isRefreshing = false,
  onQuickAddSale,
  onSeedSampleData
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const defaultData: DayData[] = [
    { day: 'Mon', sales: 0, collections: 0 },
    { day: 'Tue', sales: 0, collections: 0 },
    { day: 'Wed', sales: 0, collections: 0 },
    { day: 'Thu', sales: 0, collections: 0 },
    { day: 'Fri', sales: 0, collections: 0 },
    { day: 'Sat', sales: 0, collections: 0 },
    { day: 'Sun', sales: 0, collections: 0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;
  const maxVal = Math.max(...chartData.flatMap((d) => [d.sales, d.collections]), 500);

  const totalWeeklySales = chartData.reduce((acc, d) => acc + d.sales, 0);
  const totalWeeklyCollections = chartData.reduce((acc, d) => acc + d.collections, 0);
  const netFlow = totalWeeklyCollections - totalWeeklySales;

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card, 24px)',
        padding: '1.5rem 1.75rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        marginTop: '0.5rem',
        position: 'relative'
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: TITLE + LIVE REAL-TIME BADGE + TIME SWITCHER      */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BarChart3 size={18} />
            </div>
            
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.3px' }}>
              Performance Analytics
            </h3>

            {/* LIVE PULSING REAL-TIME BADGE */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.725rem',
              fontWeight: '800',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              letterSpacing: '0.02em'
            }}>
              <span 
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  display: 'inline-block',
                  animation: 'pulse 1.8s infinite ease-in-out'
                }} 
              />
              <span>LIVE REAL-TIME</span>
            </div>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-body)', opacity: 0.85, margin: 0 }}>
            Real-time Credit Sales vs Payment Collections comparison
          </p>
        </div>

        {/* CONTROLS: TIME RANGE TABS & REFRESH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Time Range Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0.2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            gap: '0.2rem'
          }}>
            <button
              type="button"
              onClick={() => onTimeRangeChange?.('thisWeek')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: timeRange === 'thisWeek' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'thisWeek' ? 'var(--primary)' : 'var(--text-body)',
                fontWeight: '700',
                fontSize: '0.775rem',
                cursor: 'pointer',
                boxShadow: timeRange === 'thisWeek' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => onTimeRangeChange?.('past7Days')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: timeRange === 'past7Days' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'past7Days' ? 'var(--primary)' : 'var(--text-body)',
                fontWeight: '700',
                fontSize: '0.775rem',
                cursor: 'pointer',
                boxShadow: timeRange === 'past7Days' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              Past 7 Days
            </button>

            <button
              type="button"
              onClick={() => onTimeRangeChange?.('thisMonth')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: timeRange === 'thisMonth' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'thisMonth' ? 'var(--primary)' : 'var(--text-body)',
                fontWeight: '700',
                fontSize: '0.775rem',
                cursor: 'pointer',
                boxShadow: timeRange === 'thisMonth' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              This Month
            </button>
          </div>

          {/* Instant Manual Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh Live Data"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
            >
              <RefreshCw 
                size={15} 
                style={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
                }} 
              />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUMMARY STATS & LEGEND BAR                                    */}
      {/* ------------------------------------------------------------- */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap', 
        gap: '1rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        marginBottom: '1.25rem'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Credit Sales */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Credit Sales:</span>
            <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>₹{totalWeeklySales.toLocaleString('en-IN')}</span>
          </div>

          {/* Collections */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Collections:</span>
            <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>₹{totalWeeklyCollections.toLocaleString('en-IN')}</span>
          </div>

          {/* Net Cash Flow Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: '700', color: netFlow >= 0 ? '#10B981' : '#EF4444' }}>
            {netFlow >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>Net: {netFlow >= 0 ? `+₹${netFlow.toLocaleString('en-IN')}` : `-₹${Math.abs(netFlow).toLocaleString('en-IN')}`}</span>
          </div>
        </div>

        {/* Status Badge or CTA */}
        {totalWeeklySales > 0 || totalWeeklyCollections > 0 ? (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669',
            padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
            fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem'
          }}>
            <ArrowUpRight size={14} /> Active Transaction Stream
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              No transactions recorded in this period
            </span>
            {onSeedSampleData && (
              <button
                type="button"
                onClick={onSeedSampleData}
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  color: '#8B5CF6',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '10px',
                  fontSize: '0.725rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Zap size={12} /> ⚡ Demo Week
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SVG / BAR CHART VISUALIZATION                                 */}
      {/* ------------------------------------------------------------- */}
      <div style={{ 
        width: '100%', 
        height: '210px', 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: chartData.length > 7 ? '0.5rem' : '1.25rem', 
        paddingTop: '1.25rem', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '0.6rem',
        position: 'relative'
      }}>
        {chartData.map((item, index) => {
          const salesHeightPct = maxVal > 0 ? (item.sales / maxVal) * 100 : 0;
          const collectionsHeightPct = maxVal > 0 ? (item.collections / maxVal) * 100 : 0;
          const isHovered = hoveredDay?.day === item.day;
          const hasActivity = item.sales > 0 || item.collections > 0;

          return (
            <div 
              key={`${item.day}-${index}`} 
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                height: '100%', 
                justifyContent: 'flex-end', 
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  marginBottom: '8px',
                  backgroundColor: 'var(--text-heading)',
                  color: 'var(--bg-card)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  zIndex: 50,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  animation: 'modal-slide 0.15s ease'
                }}>
                  <div style={{ fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.2rem', marginBottom: '0.1rem' }}>
                    {item.formattedDate || item.day}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#10B981' }}>
                    <span>Credit Sales:</span>
                    <span>₹{item.sales.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', color: '#F59E0B' }}>
                    <span>Collections:</span>
                    <span>₹{item.collections.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Grouped Bar Bars */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: chartData.length > 7 ? '3px' : '6px', 
                width: '100%', 
                justifyContent: 'center', 
                height: '160px' 
              }}>
                {/* Sales Bar */}
                <div
                  title={`${item.day} Credit Sales: ₹${item.sales}`}
                  style={{
                    width: chartData.length > 7 ? '42%' : '38%',
                    maxWidth: '24px',
                    height: `${Math.max(salesHeightPct, hasActivity ? 8 : 5)}%`,
                    background: item.sales > 0 
                      ? 'linear-gradient(180deg, #34D399 0%, #059669 100%)' 
                      : 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms',
                    boxShadow: item.sales > 0 ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                    transform: isHovered ? 'scaleY(1.05)' : 'none',
                    transformOrigin: 'bottom'
                  }}
                />

                {/* Collections Bar */}
                <div
                  title={`${item.day} Collections: ₹${item.collections}`}
                  style={{
                    width: chartData.length > 7 ? '42%' : '38%',
                    maxWidth: '24px',
                    height: `${Math.max(collectionsHeightPct, hasActivity ? 8 : 5)}%`,
                    background: item.collections > 0 
                      ? 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)' 
                      : 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms',
                    boxShadow: item.collections > 0 ? '0 4px 12px rgba(245, 158, 11, 0.35)' : 'none',
                    transform: isHovered ? 'scaleY(1.05)' : 'none',
                    transformOrigin: 'bottom'
                  }}
                />
              </div>

              {/* Day Label */}
              <span style={{ 
                fontSize: chartData.length > 7 ? '0.7rem' : '0.8rem', 
                fontWeight: isHovered ? '800' : '700', 
                color: isHovered ? 'var(--primary)' : 'var(--text-body)', 
                marginTop: '0.6rem',
                transition: 'color 150ms'
              }}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER BAR: PERIOD INFO + LIVE STATUS                         */}
      {/* ------------------------------------------------------------- */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '1rem', 
        color: 'var(--text-muted)', 
        fontSize: '0.8rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <span>
            {timeRange === 'thisWeek' && 'Current Week (Mon - Sun)'}
            {timeRange === 'past7Days' && 'Rolling Past 7 Days'}
            {timeRange === 'thisMonth' && 'Current Month Performance'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {onQuickAddSale && totalWeeklySales === 0 && totalWeeklyCollections === 0 && (
            <button
              type="button"
              onClick={onQuickAddSale}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--primary)',
                fontWeight: '800',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Plus size={14} /> Record Live Sale
            </button>
          )}

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: '600', color: '#10B981' }}>
            <CheckCircle2 size={13} /> Synchronized live from ledger entries
          </span>
        </div>
      </div>
    </div>
  );
};
