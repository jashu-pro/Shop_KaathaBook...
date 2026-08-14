/* features/dashboard/components/WeeklyChart.tsx */
import React from 'react';
import { BarChart3, ArrowUpRight, Calendar } from 'lucide-react';

interface DayData {
  day: string;
  sales: number;
  collections: number;
}

interface WeeklyChartProps {
  data?: DayData[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
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
  const maxVal = Math.max(...chartData.flatMap((d) => [d.sales, d.collections]), 1000);

  const totalWeeklySales = chartData.reduce((acc, d) => acc + d.sales, 0);
  const totalWeeklyCollections = chartData.reduce((acc, d) => acc + d.collections, 0);

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card, 28px)',
        padding: '1.75rem 2rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        marginTop: '0.5rem'
      }}
    >
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Weekly Performance Analytics
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
            Comparing Credit Sales vs Payments Collected this week
          </p>
        </div>

        {/* Legend & Summary Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#10B981' }} />
            <span>Credit Sales (₹{totalWeeklySales.toLocaleString('en-IN')})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#F59E0B' }} />
            <span>Collections (₹{totalWeeklyCollections.toLocaleString('en-IN')})</span>
          </div>

          {totalWeeklySales > 0 || totalWeeklyCollections > 0 ? (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}>
              <ArrowUpRight size={14} /> Active Period
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)',
              padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              No transactions this week
            </div>
          )}
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '1.25rem', paddingTop: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {chartData.map((item) => {
          const salesHeightPct = (item.sales / maxVal) * 100;
          const collectionsHeightPct = (item.collections / maxVal) * 100;

          return (
            <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
              
              {/* Grouped Bar Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', width: '100%', justifyContent: 'center', height: '180px' }}>
                {/* Sales Bar */}
                <div
                  title={`${item.day} Credit Sales: ₹${item.sales}`}
                  style={{
                    width: '38%',
                    maxWidth: '24px',
                    height: `${Math.max(salesHeightPct, 6)}%`,
                    backgroundColor: '#10B981',
                    borderRadius: '8px 8px 2px 2px',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                  }}
                />

                {/* Collections Bar */}
                <div
                  title={`${item.day} Collections: ₹${item.collections}`}
                  style={{
                    width: '38%',
                    maxWidth: '24px',
                    height: `${Math.max(collectionsHeightPct, 6)}%`,
                    backgroundColor: '#F59E0B',
                    borderRadius: '8px 8px 2px 2px',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)'
                  }}
                />
              </div>

              {/* Day Label */}
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-body)', marginTop: '0.6rem' }}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} />
          <span>Current Week (Mon - Sun)</span>
        </div>
        <span>Updated real-time from transaction entries</span>
      </div>
    </div>
  );
};
