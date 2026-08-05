/* features/reports/pages/Reports.tsx */
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  FileText, 
  Download, 
  Send, 
  PieChart
} from 'lucide-react';
import { useSales } from '../../sales/hooks/useSales';
import { usePayments } from '../../payments/hooks/usePayments';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { exportToCSV } from '../utils/csvExporter';
import type { ReportPeriod, ReportTab } from '../types';

const Reports: React.FC = () => {
  const { sales } = useSales();
  const { payments } = usePayments();
  const { customers } = useCustomers();

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  // Time Window Filter Helper
  const periodWindowTime = useMemo(() => {
    const now = Date.now();
    if (period === 'daily') return now - 1 * 24 * 3600 * 1000;
    if (period === 'weekly') return now - 7 * 24 * 3600 * 1000;
    return now - 30 * 24 * 3600 * 1000; // monthly
  }, [period]);

  // Filtered Sales & Payments
  const periodSales = useMemo(() => {
    return sales.filter((s) => new Date(s.saleDate || s.createdAt).getTime() >= periodWindowTime);
  }, [sales, periodWindowTime]);

  const periodPayments = useMemo(() => {
    return payments.filter((p) => new Date(p.paymentDate || p.createdAt).getTime() >= periodWindowTime);
  }, [payments, periodWindowTime]);

  // Metrics Calculations
  const totalRevenue = useMemo(() => {
    return periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [periodSales]);

  const totalCollected = useMemo(() => {
    return periodPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [periodPayments]);

  const totalUdhaarOutstanding = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  }, [customers]);

  // Profit Calculation (Estimated based on 25% average profit margin if cost price missing)
  const grossProfit = useMemo(() => {
    const estimatedCost = totalRevenue * 0.75;
    return Math.max(0, Math.round(totalRevenue - estimatedCost));
  }, [totalRevenue]);

  const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 25;

  // Chart Data Generator (Last 7 Days)
  const chartDaysData = useMemo(() => {
    const days: { label: string; sales: number; payments: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const daySalesTotal = sales
        .filter((s) => (s.saleDate || s.createdAt).startsWith(dateStr))
        .reduce((acc, s) => acc + s.totalAmount, 0);

      const dayPaymentsTotal = payments
        .filter((p) => (p.paymentDate || p.createdAt).startsWith(dateStr))
        .reduce((acc, p) => acc + p.amount, 0);

      days.push({
        label: dayLabel,
        sales: daySalesTotal,
        payments: dayPaymentsTotal,
      });
    }
    return days;
  }, [sales, payments]);

  const maxChartVal = useMemo(() => {
    const max = Math.max(...chartDaysData.map((d) => Math.max(d.sales, d.payments)));
    return max > 0 ? max : 1000;
  }, [chartDaysData]);

  // Outstanding Debtors List
  const debtorsList = useMemo(() => {
    return customers
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [customers]);

  // Exports
  const handleExportExcel = () => {
    if (activeTab === 'outstanding') {
      const rows = debtorsList.map((d) => ({
        'Customer Name': d.name,
        Phone: d.phone || 'N/A',
        Village: d.village || 'N/A',
        'Pending Udhaar Balance (₹)': d.currentBalance,
        Risk: d.tag || 'REGULAR',
      }));
      exportToCSV(`KhattaBook_Outstanding_Report_${period}`, rows);
    } else {
      const rows = periodSales.map((s) => ({
        'Invoice No': s.invoiceNo,
        Date: new Date(s.saleDate).toLocaleDateString('en-IN'),
        Customer: s.customerName || 'Walk-in',
        'Total Bill (₹)': s.totalAmount,
        'Amount Paid (₹)': s.amountPaid,
        'Udhaar Due (₹)': Math.max(0, s.totalAmount - s.amountPaid),
        Status: s.paymentStatus,
      }));
      exportToCSV(`KhattaBook_Sales_Report_${period}`, rows);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP REPORT HEADER & PERIOD SELECTOR                           */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Business Analytics & Reports
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {period.toUpperCase()}
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Financial health, profit margins, outstanding debt summaries, and PDF/Excel exports.
          </p>
        </div>

        {/* Period Selector & Export Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Period Selector Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.2rem' }}>
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as ReportPeriod)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.775rem',
                  fontWeight: period === p.id ? '800' : '600',
                  backgroundColor: period === p.id ? '#059669' : 'transparent',
                  color: period === p.id ? '#FFFFFF' : 'var(--text-body)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportExcel}
            className="btn btn-secondary"
            style={{ borderRadius: '14px', padding: '0.6rem 1rem', fontWeight: '700', fontSize: '0.825rem' }}
          >
            <Download size={16} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.6rem 1.15rem', fontWeight: '700', fontSize: '0.85rem', backgroundColor: '#059669' }}
          >
            <FileText size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FINANCIAL METRICS SUMMARY CARDS                               */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {/* Total Sales Revenue */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.1rem 1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Sales Revenue
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.1rem' }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700' }}>
              {periodSales.length} Transactions
            </span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Payments Collected */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.1rem 1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Payments Collected
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', marginTop: '0.1rem' }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {periodPayments.length} Collections
            </span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} />
          </div>
        </div>

        {/* Outstanding Udhaar */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.1rem 1.25rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Outstanding Debt
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#EF4444', marginTop: '0.1rem' }}>
              ₹{totalUdhaarOutstanding.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: '700' }}>
              {debtorsList.length} Debtors
            </span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.1rem 1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Gross Profit
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669', marginTop: '0.1rem' }}>
              ₹{grossProfit.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '700' }}>
              {profitMarginPercent}% Profit Margin
            </span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={20} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REPORT TABS NAVIGATION                                        */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '0.75rem 1rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overview & Charts' },
          { id: 'profit', label: 'Profit & Loss' },
          { id: 'outstanding', label: `Outstanding Debt (${debtorsList.length})` },
          { id: 'customers', label: 'Customer Sales' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? '800' : '600',
              color: activeTab === tab.id ? '#059669' : 'var(--text-body)',
              backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT 1: OVERVIEW & INTERACTIVE CHARTS                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                7-Day Sales vs Collections Analytics
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-body)', marginTop: '0.1rem' }}>
                Daily comparative bar trend of Credit Sales issued vs Payments received
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#059669' }} /> Sales
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#3B82F6' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6' }} /> Collections
              </span>
            </div>
          </div>

          {/* SVG Multi-Bar Chart */}
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '1.2rem', paddingTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {chartDaysData.map((d, idx) => {
              const salesHeight = Math.max(10, Math.round((d.sales / maxChartVal) * 160));
              const paymentsHeight = Math.max(10, Math.round((d.payments / maxChartVal) * 160));

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px' }}>
                    {/* Sales Bar */}
                    <div
                      title={`Sales: ₹${d.sales}`}
                      style={{
                        width: '16px',
                        height: `${salesHeight}px`,
                        backgroundColor: '#059669',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 300ms ease'
                      }}
                    />
                    {/* Payments Bar */}
                    <div
                      title={`Collections: ₹${d.payments}`}
                      style={{
                        width: '16px',
                        height: `${paymentsHeight}px`,
                        backgroundColor: '#3B82F6',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 300ms ease'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT 2: PROFIT & LOSS                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'profit' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            Profit & Loss Summary ({period.toUpperCase()})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: '16px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Sales Revenue:</span>
              <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>₹{totalRevenue}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Cost of Goods Sold (COGS):</span>
              <span style={{ fontWeight: '800', color: '#EF4444' }}>- ₹{totalRevenue - grossProfit}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', fontSize: '1.1rem' }}>
              <span style={{ fontWeight: '800', color: 'var(--text-heading)' }}>Gross Net Profit:</span>
              <span style={{ fontWeight: '800', color: '#059669' }}>₹{grossProfit} ({profitMarginPercent}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT 3: OUTSTANDING DEBTORS REPORT                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'outstanding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {debtorsList.length === 0 ? (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', color: '#10B981' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>All Customer Accounts Clear! 🎉</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>No pending Udhaar debt owed.</p>
            </div>
          ) : (
            debtorsList.map((customer) => (
              <div
                key={customer.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {customer.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Mobile: {customer.phone || 'N/A'} | Village: {customer.village || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: '700' }}>Pending Debt</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#EF4444' }}>
                      ₹{customer.currentBalance}
                    </div>
                  </div>

                  {customer.phone && (
                    <a
                      href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${customer.name}, your current Khatta balance is ₹${customer.currentBalance}. Please clear it at your earliest. Thank you!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ borderRadius: '12px', fontSize: '0.775rem', padding: '0.45rem 0.85rem', color: '#10B981' }}
                    >
                      <Send size={14} /> Send WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB CONTENT 4: CUSTOMER SALES REPORT                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {customers.map((c) => {
            const customerSalesCount = sales.filter((s) => s.customerId === c.id).length;
            const customerSpent = sales.filter((s) => s.customerId === c.id).reduce((acc, s) => acc + s.totalAmount, 0);

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {c.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {customerSalesCount} Transactions | Total Volume: ₹{customerSpent}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Balance</span>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: c.currentBalance > 0 ? '#EF4444' : '#10B981' }}>
                    ₹{c.currentBalance}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Reports;
