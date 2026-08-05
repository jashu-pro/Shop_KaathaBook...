/* features/ledger/pages/LedgerPage.tsx */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus, 
  CreditCard, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  UserCheck
} from 'lucide-react';
import { useLedger } from '../hooks/useLedger';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
import type { LedgerDateFilter } from '../types';

const LedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers } = useCustomers();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<LedgerDateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);

  const { entries, isLoading, refetch } = useLedger(
    selectedCustomerId === 'all' ? undefined : selectedCustomerId
  );

  // Compute Metrics
  const totalGaveUdhaar = useMemo(() => {
    return entries.filter((e) => e.entryType === 'debit').reduce((acc, e) => acc + e.amount, 0);
  }, [entries]);

  const totalGotJama = useMemo(() => {
    return entries.filter((e) => e.entryType === 'credit').reduce((acc, e) => acc + e.amount, 0);
  }, [entries]);

  const netBalance = totalGaveUdhaar - totalGotJama;

  // Filtered entries by date & search query
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (entry.customerName && entry.customerName.toLowerCase().includes(q)) ||
        (entry.customerPhone && entry.customerPhone.includes(q)) ||
        (entry.description && entry.description.toLowerCase().includes(q));

      let matchesDate = true;
      const entryTime = new Date(entry.entryDate).getTime();
      const now = Date.now();

      if (dateFilter === 'today') {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        matchesDate = entryTime >= startOfDay;
      } else if (dateFilter === 'week') {
        const startOfWeek = now - 7 * 24 * 3600 * 1000;
        matchesDate = entryTime >= startOfWeek;
      } else if (dateFilter === 'month') {
        const startOfMonth = now - 30 * 24 * 3600 * 1000;
        matchesDate = entryTime >= startOfMonth;
      }

      return matchesSearch && matchesDate;
    });
  }, [entries, searchQuery, dateFilter]);

  const handleExportPassbook = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & KPI SUMMARY BAR                                   */}
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
            <BookOpen size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Digital Bahi Khatta Ledger
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {filteredEntries.length} Entries
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Traditional Red (You Gave) vs Green (You Got) Bahi notebook ledger with running balances.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportPassbook}
            className="btn btn-secondary"
            style={{ borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: '700', fontSize: '0.825rem' }}
          >
            <FileText size={16} />
            <span>PDF Passbook</span>
          </button>

          <button
            onClick={() => navigate('/payments/receive')}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: '700', fontSize: '0.825rem', backgroundColor: '#10B981' }}
          >
            <CreditCard size={16} />
            <span>+ Got Payment (Jama)</span>
          </button>

          <button
            onClick={() => setIsRecordSaleModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1.15rem', fontWeight: '700', fontSize: '0.85rem', backgroundColor: '#059669' }}
          >
            <Plus size={18} />
            <span>+ Gave Credit (Udhaar)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KPI METRICS CARDS: GAVE vs GOT vs NET                         */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {/* You Gave (Udhaar / Debit) */}
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
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              You Gave (Udhaar Debit)
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#EF4444', marginTop: '0.1rem' }}>
              ₹{totalGaveUdhaar.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight size={22} />
          </div>
        </div>

        {/* You Got (Jama / Credit) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '18px',
          padding: '1.1rem 1.25rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              You Got (Jama Credit)
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#10B981', marginTop: '0.1rem' }}>
              ₹{totalGotJama.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownLeft size={22} />
          </div>
        </div>

        {/* Net Outstanding Balance */}
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
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Net Outstanding Debt
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: netBalance > 0 ? '#EF4444' : '#10B981', marginTop: '0.1rem' }}>
              ₹{netBalance.toLocaleString('en-IN')} {netBalance > 0 ? 'Udhaar' : 'Clear'}
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FILTERS BAR: CUSTOMER SELECTOR & DATE RANGE CHIPS             */}
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
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Customer Dropdown */}
          <div style={{ minWidth: '220px' }}>
            <select
              className="input-field"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{
                borderRadius: '14px',
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <option value="all">👥 All Customers Khatta</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.village ? `(${c.village})` : ''} - ₹{c.currentBalance} Udhaar
                </option>
              ))}
            </select>
          </div>

          {/* Search Field */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search description, invoice no, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>
        </div>

        {/* Date Filter Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as LedgerDateFilter)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                fontSize: '0.775rem',
                fontWeight: dateFilter === tab.id ? '700' : '500',
                backgroundColor: dateFilter === tab.id ? 'var(--primary)' : 'var(--bg-secondary)',
                color: dateFilter === tab.id ? '#FFFFFF' : 'var(--text-body)',
                border: 'none',
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
      {/* TRADITIONAL BAHI KHATTA TABLE                                 */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
      }}>
        {/* Table Bahi Header */}
        <div style={{
          backgroundColor: '#059669',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.8fr 1fr 1fr 1.2fr',
          gap: '0.5rem',
          fontWeight: '800',
          fontSize: '0.85rem',
          alignItems: 'center'
        }}>
          <span>Date & Time</span>
          <span>Customer & Details</span>
          <span style={{ textAlign: 'right' }}>You Gave (Udhaar ₹)</span>
          <span style={{ textAlign: 'right' }}>You Got (Jama ₹)</span>
          <span style={{ textAlign: 'right' }}>Running Balance</span>
        </div>

        {/* Table Entries */}
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookOpen size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              No Bahi Ledger Entries
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {searchQuery ? `No ledger entry matching "${searchQuery}"` : 'Transactions will appear here automatically when sales or payments are recorded'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredEntries.map((entry) => {
              const isDebit = entry.entryType === 'debit';

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.8fr 1fr 1fr 1.2fr',
                    gap: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.825rem',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  {/* Date & Time */}
                  <div>
                    <span style={{ fontWeight: '700', color: 'var(--text-heading)', display: 'block' }}>
                      {new Date(entry.entryDate).toLocaleDateString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {new Date(entry.entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Customer & Description */}
                  <div>
                    <span style={{ fontWeight: '800', color: 'var(--text-heading)', display: 'block' }}>
                      {entry.customerName || 'Shop Customer'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {entry.description || (isDebit ? 'Credit Sale Bill' : 'Payment Collection')}
                    </span>
                  </div>

                  {/* You Gave (Udhaar / Debit) */}
                  <div style={{ textAlign: 'right', fontWeight: '800', color: isDebit ? '#EF4444' : 'var(--text-muted)' }}>
                    {isDebit ? `₹${entry.amount}` : '-'}
                  </div>

                  {/* You Got (Jama / Credit) */}
                  <div style={{ textAlign: 'right', fontWeight: '800', color: !isDebit ? '#10B981' : 'var(--text-muted)' }}>
                    {!isDebit ? `₹${entry.amount}` : '-'}
                  </div>

                  {/* Running Balance */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '10px',
                      fontSize: '0.775rem',
                      fontWeight: '800',
                      backgroundColor: entry.balanceAfter > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: entry.balanceAfter > 0 ? '#EF4444' : '#10B981'
                    }}>
                      ₹{entry.balanceAfter} {entry.balanceAfter > 0 ? 'Udhaar' : 'Clear'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Credit Sale Modal */}
      <RecordCreditSaleModal
        isOpen={isRecordSaleModalOpen}
        onClose={() => setIsRecordSaleModalOpen(false)}
        onSuccess={() => refetch()}
      />

    </div>
  );
};

export default LedgerPage;
