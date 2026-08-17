/* features/dashboard/pages/Dashboard.tsx */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { WeeklyChart } from '../components/WeeklyChart';
import type { DayData, ChartTimeRange } from '../components/WeeklyChart';
import { UpiQrModal } from '../components/UpiQrModal';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useLedger } from '../../ledger/hooks/useLedger';
import { EventBus } from '../../../services/EventBus';
import { 
  QrCode, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ArrowUpRight, 
  Plus, 
  CreditCard, 
  UserPlus, 
  BookOpen, 
  Mic, 
  ArrowRight,
  Receipt
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const { customers, refetch: refetchCustomers, addCustomer } = useCustomers();
  const { sales, refetch: refetchSales, createSale } = useSales();
  const { payments, refetch: refetchPayments, createPayment } = usePayments();
  const { entries: ledgerEntries, refetch: refetchLedger } = useLedger();

  const [showQrModal, setShowQrModal] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('thisWeek');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shopName = shop?.name || 'My KhattaBook Store';
  const upiId = shop?.upiId || 'shop@upi';
  const activeCustomersCount = customers.length;

  // Realtime Live Refresh Trigger
  const handleFullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchCustomers(),
        refetchSales(),
        refetchPayments(),
        refetchLedger()
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetchCustomers, refetchSales, refetchPayments, refetchLedger]);

  // Subscribe to live events
  useEffect(() => {
    const unsubSales = EventBus.subscribe('sales:changed', handleFullRefresh);
    const unsubPayments = EventBus.subscribe('payments:changed', handleFullRefresh);
    const unsubLedger = EventBus.subscribe('ledger:changed', handleFullRefresh);
    const unsubCustomers = EventBus.subscribe('customers:changed', handleFullRefresh);
    const unsubSync = EventBus.subscribe('data:sync', handleFullRefresh);

    return () => {
      unsubSales();
      unsubPayments();
      unsubLedger();
      unsubCustomers();
      unsubSync();
    };
  }, [handleFullRefresh]);

  const totalUdhaar = useMemo(() => {
    return customers.reduce((acc, c) => acc + (Number(c.currentBalance) > 0 ? Number(c.currentBalance) : 0), 0);
  }, [customers]);

  // Robust Date Matching Helper (Local Date Comparison)
  const isSameCalendarDay = (dateInput: string | Date | undefined, targetDate: Date): boolean => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    return (
      d.getDate() === targetDate.getDate() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    );
  };

  const isToday = (dateInput?: string | Date) => {
    return isSameCalendarDay(dateInput, new Date());
  };

  // Today's Sales Calculation (from sales or ledger debits)
  const todaysSales = useMemo(() => {
    const fromLedger = ledgerEntries
      .filter((e) => e.entryType === 'debit' && isToday(e.entryDate))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const fromSales = sales
      .filter((s) => isToday(s.saleDate || s.createdAt))
      .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

    return Math.max(fromLedger, fromSales);
  }, [ledgerEntries, sales]);

  // Today's Collections (from payments or ledger credits)
  const todaysCollections = useMemo(() => {
    const fromLedger = ledgerEntries
      .filter((e) => e.entryType === 'credit' && isToday(e.entryDate))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const fromPayments = payments
      .filter((p) => isToday(p.paymentDate || p.createdAt))
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return Math.max(fromLedger, fromPayments);
  }, [ledgerEntries, payments]);

  // Total Transactions Count
  const totalTransactionsCount = useMemo(() => {
    const rawCount = ledgerEntries.length;
    const fallbackCount = sales.length + payments.length;
    return Math.max(rawCount, fallbackCount);
  }, [ledgerEntries, sales, payments]);

  // Dynamic Chart Data Calculation based on selected TimeRange
  const chartData: DayData[] = useMemo(() => {
    const today = new Date();

    if (timeRange === 'past7Days') {
      // Rolling Past 7 Days (e.g. today - 6 days -> today)
      const daysList: DayData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        const daySalesLedger = ledgerEntries
          .filter((e) => e.entryType === 'debit' && isSameCalendarDay(e.entryDate, d))
          .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        const daySalesDirect = sales
          .filter((s) => isSameCalendarDay(s.saleDate || s.createdAt, d))
          .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

        const dayColLedger = ledgerEntries
          .filter((e) => e.entryType === 'credit' && isSameCalendarDay(e.entryDate, d))
          .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
        const dayColDirect = payments
          .filter((p) => isSameCalendarDay(p.paymentDate || p.createdAt, d))
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        daysList.push({
          day: dayLabel,
          formattedDate: `${dayLabel}, ${formatted}`,
          sales: Math.max(daySalesLedger, daySalesDirect),
          collections: Math.max(dayColLedger, dayColDirect),
        });
      }
      return daysList;
    }

    if (timeRange === 'thisMonth') {
      // 4 Weeks of Current Month
      const daysList: DayData[] = [];
      for (let w = 1; w <= 4; w++) {
        const startDay = (w - 1) * 7 + 1;
        const endDay = Math.min(w * 7, 31);
        const weekLabel = `Wk ${w}`;

        const weekSalesLedger = ledgerEntries
          .filter((e) => {
            const entryD = new Date(e.entryDate);
            return (
              e.entryType === 'debit' &&
              entryD.getMonth() === today.getMonth() &&
              entryD.getFullYear() === today.getFullYear() &&
              entryD.getDate() >= startDay &&
              entryD.getDate() <= endDay
            );
          })
          .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

        const weekSalesDirect = sales
          .filter((s) => {
            const entryD = new Date(s.saleDate || s.createdAt);
            return (
              entryD.getMonth() === today.getMonth() &&
              entryD.getFullYear() === today.getFullYear() &&
              entryD.getDate() >= startDay &&
              entryD.getDate() <= endDay
            );
          })
          .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

        const weekColLedger = ledgerEntries
          .filter((e) => {
            const entryD = new Date(e.entryDate);
            return (
              e.entryType === 'credit' &&
              entryD.getMonth() === today.getMonth() &&
              entryD.getFullYear() === today.getFullYear() &&
              entryD.getDate() >= startDay &&
              entryD.getDate() <= endDay
            );
          })
          .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

        const weekColDirect = payments
          .filter((p) => {
            const entryD = new Date(p.paymentDate || p.createdAt);
            return (
              entryD.getMonth() === today.getMonth() &&
              entryD.getFullYear() === today.getFullYear() &&
              entryD.getDate() >= startDay &&
              entryD.getDate() <= endDay
            );
          })
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        daysList.push({
          day: weekLabel,
          formattedDate: `Days ${startDay}-${endDay} ${today.toLocaleDateString('en-IN', { month: 'short' })}`,
          sales: Math.max(weekSalesLedger, weekSalesDirect),
          collections: Math.max(weekColLedger, weekColDirect),
        });
      }
      return daysList;
    }

    // Default: This Week (Mon - Sun)
    const currentDayOfWeek = today.getDay(); // 0: Sun, 1: Mon...
    const distanceToMon = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMon);
    monday.setHours(0, 0, 0, 0);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return weekDays.map((dayName, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const formatted = dayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      const daySalesLedger = ledgerEntries
        .filter((e) => e.entryType === 'debit' && isSameCalendarDay(e.entryDate, dayDate))
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const daySalesDirect = sales
        .filter((s) => isSameCalendarDay(s.saleDate || s.createdAt, dayDate))
        .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

      const dayColLedger = ledgerEntries
        .filter((e) => e.entryType === 'credit' && isSameCalendarDay(e.entryDate, dayDate))
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const dayColDirect = payments
        .filter((p) => isSameCalendarDay(p.paymentDate || p.createdAt, dayDate))
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

      return {
        day: dayName,
        formattedDate: `${dayName}, ${formatted}`,
        sales: Math.max(daySalesLedger, daySalesDirect),
        collections: Math.max(dayColLedger, dayColDirect),
      };
    });
  }, [timeRange, ledgerEntries, sales, payments]);

  // Demo Sample Data Generator for testing live chart
  const handleSeedSampleWeekData = async () => {
    setIsRefreshing(true);
    try {
      let activeCustomer = customers[0];
      if (!activeCustomer) {
        activeCustomer = await addCustomer({
          name: 'Ramesh Patel',
          phone: '9876543210',
          village: 'Main Market',
          creditLimit: 50000,
        });
      }

      // Record a live sale
      await createSale({
        customerId: activeCustomer.id,
        subtotal: 3500,
        totalAmount: 3500,
        amountPaid: 1500,
        paymentStatus: 'partially_paid',
        paymentMethod: 'cash',
        items: [{ productId: 'item-1', quantity: 2, unitPrice: 1750, totalPrice: 3500 }],
        notes: 'Live demo transaction entry',
      });

      // Record a live payment
      await createPayment({
        customerId: activeCustomer.id,
        amount: 2000,
        paymentMethod: 'phonepe',
        notes: 'Live demo UPI collection',
      });

      EventBus.triggerFullSync();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: WELCOME BANNER CARD (Emerald Gradient)                */}
      {/* ------------------------------------------------------------- */}
      <div 
        className="dashboard-welcome-card"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(4, 120, 87, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative glow circle */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none'
        }} />

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.65rem', borderRadius: '16px', fontSize: '0.75rem',
            fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Shop Owner Dashboard
          </div>

          <h2 className="dashboard-welcome-title" style={{ fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.25rem', lineHeight: 1.2 }}>
            Namaste, {shopName}
          </h2>

          <p style={{ opacity: 0.9, fontSize: '0.825rem', fontWeight: '500' }}>
            UPI ID: <span style={{ fontWeight: '700', letterSpacing: '0.02em' }}>{upiId}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsRecordSaleOpen(true)}
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              padding: '0.55rem 1rem',
              borderRadius: '14px',
              fontWeight: '800',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'all 200ms'
            }}
          >
            <Plus size={16} />
            <span>+ New Sale</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#064E3B',
              padding: '0.55rem 1.15rem',
              borderRadius: '14px',
              fontWeight: '800',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              transition: 'all 200ms'
            }}
          >
            <QrCode size={18} />
            <span>UPI QR</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2 & 3: STAT CARDS GRID                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="dashboard-main-grid">
        
        {/* TOTAL CUSTOMER DEBT (UDHAAR) CARD */}
        <div 
          className="udhaar-card-span dashboard-udhaar-card"
          style={{
            backgroundColor: '#047857',
            color: '#FFFFFF',
            boxShadow: '0 6px 20px rgba(4, 120, 87, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.85rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>
              Total Customer Debt (Udhaar)
            </span>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.2rem 0.6rem', borderRadius: '12px',
              fontSize: '0.7rem', fontWeight: '700'
            }}>
              {activeCustomersCount} Customers
            </span>
          </div>

          <div>
            <div className="dashboard-udhaar-value" style={{ fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              ₹{totalUdhaar.toLocaleString('en-IN')}
            </div>
            <p style={{ fontSize: '0.775rem', opacity: '0.85', marginTop: '0.25rem' }}>
              Total pending collections across all villages
            </p>
          </div>
        </div>

        {/* TODAY'S CREDIT SALES */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={18} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
              Live
            </span>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysSales.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Today's Credit Sales
            </span>
          </div>
        </div>

        {/* TODAY'S COLLECTIONS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingDown size={18} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
              Live
            </span>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{todaysCollections.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Today's Collections
            </span>
          </div>
        </div>

        {/* ACTIVE CUSTOMERS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {activeCustomersCount}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Active Customers
            </span>
          </div>
        </div>

        {/* TOTAL TRANSACTIONS */}
        <div 
          className="dashboard-stat-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div>
            <div className="dashboard-stat-value" style={{ fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {totalTransactionsCount}
            </div>
            <span style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--text-body)', marginTop: '0.2rem', display: 'block' }}>
              Total Transactions
            </span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 4: QUICK ACTIONS                                          */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginTop: '0.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-heading)', marginBottom: '0.6rem' }}>
          Quick Actions
        </h3>

        <div className="quick-actions-scroll">
          {/* Action 1: New Credit Sale */}
          <button
            onClick={() => setIsRecordSaleOpen(true)}
            className="quick-action-pill"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>+ New Credit Sale</span>
          </button>

          {/* Action 2: Receive Payment */}
          <button
            onClick={() => navigate('/payments/receive')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            <CreditCard size={16} />
            <span>Receive Payment</span>
          </button>

          {/* Action 3: Add Customer */}
          <button
            onClick={() => navigate('/customers/new')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)'
            }}
          >
            <UserPlus size={16} />
            <span>Add Customer</span>
          </button>

          {/* Action 4: Open Ledger */}
          <button
            onClick={() => navigate('/ledger')}
            className="quick-action-pill"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)'
            }}
          >
            <BookOpen size={16} />
            <span>Open Ledger</span>
          </button>

          {/* Action 5: AI Assistant */}
          <button
            onClick={() => navigate('/ai-assistant')}
            className="quick-action-pill"
            style={{
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 3px 10px rgba(139, 92, 246, 0.25)'
            }}
          >
            <Mic size={16} />
            <span>AI Voice Entry</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 5: PERFORMANCE ANALYTICS CHART (LIVE REAL-TIME)           */}
      {/* ------------------------------------------------------------- */}
      <WeeklyChart 
        data={chartData} 
        timeRange={timeRange}
        onTimeRangeChange={(r) => setTimeRange(r)}
        onRefresh={handleFullRefresh}
        isRefreshing={isRefreshing}
        onQuickAddSale={() => setIsRecordSaleOpen(true)}
        onSeedSampleData={handleSeedSampleWeekData}
      />

      {/* ------------------------------------------------------------- */}
      {/* ROW 6: RECENT ACTIVITY STREAM                                 */}
      {/* ------------------------------------------------------------- */}
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
          marginTop: '0.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>
              Recent Activity Stream
            </h3>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          </div>
          <button
            onClick={() => navigate('/ledger')}
            style={{
              color: 'var(--primary)',
              fontWeight: '700',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              border: 'none',
              background: 'none'
            }}
          >
            <span>View Full Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Activity Items */}
        {ledgerEntries.length === 0 && sales.length === 0 && payments.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Receipt size={18} />
              </div>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-heading)', margin: 0 }}>
                  Account Initialized & Ready
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                  Digital ledger created for {shopName}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                Active
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ledgerEntries.slice(0, 5).map((entry) => {
              const isDebit = entry.entryType === 'debit';
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 150ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: isDebit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isDebit ? '#EF4444' : '#10B981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isDebit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-heading)', margin: 0 }}>
                        {entry.customerName || 'Customer'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                        {entry.description || (isDebit ? 'Credit Sale' : 'Payment Collection')} • {new Date(entry.entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      color: isDebit ? '#EF4444' : '#10B981'
                    }}>
                      {isDebit ? `+₹${entry.amount.toLocaleString('en-IN')}` : `-₹${entry.amount.toLocaleString('en-IN')}`}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {isDebit ? 'Udhaar' : 'Jama'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS: UPI QR & RECORD CREDIT SALE                           */}
      {/* ------------------------------------------------------------- */}
      <UpiQrModal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
      />

      <RecordCreditSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
        onSuccess={() => {
          handleFullRefresh();
        }}
      />

    </div>
  );
};

export default Dashboard;
