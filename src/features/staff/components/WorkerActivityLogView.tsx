/* features/staff/components/WorkerActivityLogView.tsx */
import React, { useState, useMemo } from 'react';
import { 
  History, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Package, 
  ShieldCheck, 
  Clock, 
  Search, 
  Download, 
  TrendingUp 
} from 'lucide-react';
import type { WorkerActivityLog } from '../types';


interface WorkerActivityLogViewProps {
  logs: WorkerActivityLog[];
  isLoading?: boolean;
}

type DateRangeFilter = 'all' | 'today' | 'yesterday' | '7days' | 'month';
type CategoryFilter = 'all' | 'sale' | 'payment' | 'customer' | 'inventory' | 'access';

export const WorkerActivityLogView: React.FC<WorkerActivityLogViewProps> = ({ logs, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  // Extract distinct worker names for filter dropdown
  const workerOptions = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.workerId && l.workerName) {
        map.set(l.workerId, l.workerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  // Filter logs based on search, worker, date range, and category
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return logs.filter((log) => {
      // 1. Worker filter
      if (selectedWorker !== 'all' && log.workerId !== selectedWorker) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // 3. Date range filter
      const logTime = new Date(log.timestamp).getTime();
      if (selectedDateRange === 'today' && logTime < startOfToday) return false;
      if (selectedDateRange === 'yesterday' && (logTime < startOfYesterday || logTime >= startOfToday)) return false;
      if (selectedDateRange === '7days' && logTime < startOf7Days) return false;
      if (selectedDateRange === 'month' && logTime < startOfMonth) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesWorker = log.workerName.toLowerCase().includes(query);
        const matchesAmount = log.amount !== undefined && log.amount.toString().includes(query);
        return matchesAction || matchesWorker || matchesAmount;
      }

      return true;
    });
  }, [logs, selectedWorker, selectedCategory, selectedDateRange, searchQuery]);

  // Compute summary financial totals for filtered view
  const summaryMetrics = useMemo(() => {
    let salesTotal = 0;
    let salesCount = 0;
    let paymentsTotal = 0;
    let paymentsCount = 0;

    filteredLogs.forEach((l) => {
      if (l.category === 'sale' && l.amount) {
        salesTotal += l.amount;
        salesCount++;
      } else if (l.category === 'payment' && l.amount) {
        paymentsTotal += l.amount;
        paymentsCount++;
      }
    });

    return { salesTotal, salesCount, paymentsTotal, paymentsCount, totalActions: filteredLogs.length };
  }, [filteredLogs]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Date', 'Time', 'Worker Name', 'Category', 'Action', 'Amount (₹)'];
    const rows = filteredLogs.map((l) => {
      const date = new Date(l.timestamp);
      return [
        `"${date.toLocaleDateString('en-IN')}"`,
        `"${date.toLocaleTimeString('en-IN')}"`,
        `"${l.workerName.replace(/"/g, '""')}"`,
        `"${l.category.toUpperCase()}"`,
        `"${l.action.replace(/"/g, '""')}"`,
        l.amount !== undefined ? l.amount : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shop_activity_log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: WorkerActivityLog['category']) => {
    switch (category) {
      case 'sale':
        return <ShoppingCart size={16} style={{ color: '#10B981' }} />;
      case 'payment':
        return <CreditCard size={16} style={{ color: '#F59E0B' }} />;
      case 'customer':
        return <Users size={16} style={{ color: '#3B82F6' }} />;
      case 'inventory':
        return <Package size={16} style={{ color: '#8B5CF6' }} />;
      case 'access':
      default:
        return <ShieldCheck size={16} style={{ color: '#64748B' }} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary Badges Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Filtered Actions
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.1rem' }}>
              {summaryMetrics.totalActions}
            </div>
          </div>
          <History size={22} style={{ color: 'var(--text-muted)' }} />
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700', textTransform: 'uppercase' }}>
              Sales Amount ({summaryMetrics.salesCount})
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10B981', marginTop: '0.1rem' }}>
              ₹{summaryMetrics.salesTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <TrendingUp size={22} style={{ color: '#10B981' }} />
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              Payments Collected ({summaryMetrics.paymentsCount})
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#F59E0B', marginTop: '0.1rem' }}>
              ₹{summaryMetrics.paymentsTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <CreditCard size={22} style={{ color: '#F59E0B' }} />
        </div>
      </div>

      {/* Controls Bar: Search, Filters & Export */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '18px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search activity or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingBlock: '0.45rem', fontSize: '0.82rem', borderRadius: '12px' }}
          />
        </div>

        {/* Worker Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="input-field"
            style={{ paddingBlock: '0.45rem', paddingInline: '0.75rem', fontSize: '0.82rem', borderRadius: '12px', width: 'auto' }}
          >
            <option value="all">All People</option>
            <option value="owner">👑 Shop Owner</option>
            {workerOptions.filter((w) => w.id !== 'owner').map((w) => (
              <option key={w.id} value={w.id}>
                👷 {w.name}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value as DateRangeFilter)}
            className="input-field"
            style={{ paddingBlock: '0.45rem', paddingInline: '0.75rem', fontSize: '0.82rem', borderRadius: '12px', width: 'auto' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', borderRadius: '12px', gap: '0.35rem' }}
          disabled={filteredLogs.length === 0}
          title="Export activity logs to CSV spreadsheet"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Category Chips Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {[
          { key: 'all', label: 'All Activities' },
          { key: 'sale', label: '🛒 Sales' },
          { key: 'payment', label: '💳 Payments' },
          { key: 'customer', label: '👥 Customers' },
          { key: 'inventory', label: '📦 Inventory' },
          { key: 'access', label: '🔐 Access & Security' },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as CategoryFilter)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: isSelected ? '700' : '600',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
                color: isSelected ? '#FFFFFF' : 'var(--text-heading)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Activity Logs List */}
      {filteredLogs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px dashed var(--border-color)',
          }}
        >
          <History size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-heading)' }}>
            No Matching Activities Found
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Try changing the filter options, date range, or search keyword.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="glass-panel"
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '16px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(log.category)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: log.workerId === 'owner' ? '#F59E0B' : 'var(--text-heading)' }}>
                      {log.workerId === 'owner' ? '👑 ' : ''}{log.workerName}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-heading)', fontWeight: '600' }}>
                      {log.action}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.725rem', marginTop: '0.15rem' }}>
                    <Clock size={12} />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {log.amount !== undefined && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: log.category === 'sale' ? '#10B981' : '#F59E0B' }}>
                    ₹{log.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

