/* features/sales/pages/SalesListPage.tsx */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Plus, 
  Search, 
  Calendar, 
  Trash2,
  Filter,
  Eye
} from 'lucide-react';
import { useSales } from '../hooks/useSales';
import { InvoiceDetailsModal } from '../components/InvoiceDetailsModal';
import type { Sale, SalesFilterTab } from '../types';

export const SalesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { sales, isLoading, removeSale, refetch } = useSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SalesFilterTab>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);

  const totalSalesCount = sales.length;

  const totalRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  const totalUdhaarPending = useMemo(() => {
    return sales.reduce((acc, s) => acc + Math.max(0, (Number(s.totalAmount) || 0) - (Number(s.amountPaid) || 0)), 0);
  }, [sales]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return sales.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q));

      let matchesTab = true;
      if (activeTab === 'unpaid') matchesTab = s.paymentStatus === 'unpaid';
      else if (activeTab === 'partially_paid') matchesTab = s.paymentStatus === 'partially_paid';
      else if (activeTab === 'paid') matchesTab = s.paymentStatus === 'paid';

      let matchesDate = true;
      const saleTime = new Date(s.saleDate || s.createdAt).getTime();
      if (dateFilter === 'today') {
        matchesDate = saleTime >= todayStart;
      } else if (dateFilter === 'week') {
        matchesDate = saleTime >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = saleTime >= monthAgo;
      }

      return matchesSearch && matchesTab && matchesDate;
    });
  }, [sales, searchQuery, activeTab, dateFilter]);

  const handleDeleteSale = async (e: React.MouseEvent, id: string, invoiceNo: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete sale invoice ${invoiceNo}?`)) {
      await removeSale(id);
      refetch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & KPI METRICS SUMMARY                               */}
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
            <Receipt size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Sales & Credit Invoices
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {totalSalesCount} Invoices
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Track Kirana credit sales, customer billing history, itemized receipts & paper photos.
          </p>
        </div>

        {/* Total Metrics & New Sale Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Sales Volume
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: '700' }}>
              ₹{totalUdhaarPending.toLocaleString('en-IN')} Pending Udhaar
            </span>
          </div>

          <button
            onClick={() => navigate('/sales/new')}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1.25rem', fontWeight: '800', fontSize: '0.875rem', backgroundColor: '#059669' }}
          >
            <Plus size={18} />
            <span>New Sale (POS)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, STATUS TABS & DATE RANGE FILTERS                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by invoice number, customer name, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>

          {/* Date Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              style={{ borderRadius: '12px', padding: '0.45rem 0.75rem', fontSize: '0.8rem', fontWeight: '700', backgroundColor: 'var(--bg-card)' }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week (Last 7 Days)</option>
              <option value="month">This Month (Last 30 Days)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'all', label: `All Sales (${totalSalesCount})` },
            { id: 'unpaid', label: `Unpaid Udhaar` },
            { id: 'partially_paid', label: `Partially Paid` },
            { id: 'paid', label: `Full Paid` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SalesFilterTab)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? '800' : '600',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-body)',
                backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                border: activeTab === tab.id ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SALES CARDS GRID                                              */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '3rem 1.5rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <Receipt size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Sales Invoices Found
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No invoice matching "${searchQuery}"` : 'Record your first credit sale to get started'}
          </p>
          <button onClick={() => navigate('/sales/new')} className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Create Credit Sale Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
          {filteredSales.map((sale) => {
            const isUnpaid = sale.paymentStatus === 'unpaid';
            const isPartial = sale.paymentStatus === 'partially_paid';
            const dueAmount = Math.max(0, (Number(sale.totalAmount) || 0) - (Number(sale.amountPaid) || 0));

            return (
              <div
                key={sale.id}
                onClick={() => setSelectedSaleForDetails(sale)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '20px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 120ms ease, box-shadow 120ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(15, 23, 42, 0.03)';
                }}
              >
                {/* Header: Invoice No & Payment Status Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.02em' }}>
                      {sale.invoiceNo}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.15rem' }}>
                      {sale.customerName || 'Walk-in Customer'}
                    </h4>
                    {sale.customerPhone && (
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        📱 {sale.customerPhone}
                      </span>
                    )}
                  </div>

                  <div style={{
                    backgroundColor: isUnpaid
                      ? 'rgba(239, 68, 68, 0.1)'
                      : isPartial
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                    color: isUnpaid ? '#EF4444' : isPartial ? '#D97706' : '#10B981',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '800'
                  }}>
                    {isUnpaid ? 'Udhaar' : isPartial ? 'Partially Paid' : 'Paid'}
                  </div>
                </div>

                {/* Amount Breakdown Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Bill:</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-heading)' }}>
                      ₹{sale.totalAmount}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: dueAmount > 0 ? '#EF4444' : '#10B981', fontWeight: '700' }}>
                      {dueAmount > 0 ? 'Pending Udhaar:' : 'Settled:'}
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: dueAmount > 0 ? '#EF4444' : '#10B981' }}>
                      {dueAmount > 0 ? `₹${dueAmount}` : '₹0'}
                    </div>
                  </div>
                </div>

                {/* Date, Items count & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-IN')}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSaleForDetails(sale);
                      }}
                      className="btn btn-secondary"
                      style={{ borderRadius: '8px', padding: '0.25rem 0.5rem', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSale(e, sale.id, sale.invoiceNo)}
                      style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Sale Record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedSaleForDetails && (
        <InvoiceDetailsModal
          isOpen={!!selectedSaleForDetails}
          onClose={() => setSelectedSaleForDetails(null)}
          sale={selectedSaleForDetails}
        />
      )}

    </div>
  );
};

export default SalesListPage;
