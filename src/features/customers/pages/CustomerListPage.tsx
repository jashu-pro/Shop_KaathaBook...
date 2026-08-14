import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Users, 
  ArrowUpDown, 
  Filter, 
  RotateCw, 
  AlertCircle
} from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { EditCustomerModal } from '../components/EditCustomerModal';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';
import { CustomerProfileCard } from '../components/CustomerProfileCard';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
import type { Customer } from '../types';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, isLoading, error, refetch } = useCustomers();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'udhaar' | 'settled' | 'advance' | 'vip' | 'risk'>('all');
  const [sortOption, setSortOption] = useState<'highest_udhaar' | 'name_asc' | 'recent'>('highest_udhaar');

  // Modal Control States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const [recordSaleCustomerId, setRecordSaleCustomerId] = useState<string | null>(null);

  // Multi-field Search, Filter, and Sort Processing
  const processedCustomers = useMemo(() => {
    let result = (customers || []).filter((c) => {
      if (!c) return false;
      const q = (searchQuery || '').toLowerCase().trim();
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '');
      const village = (c.village || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      const balance = Number(c.currentBalance) || 0;
      const tag = (c.tag || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        village.includes(q) ||
        address.includes(q);

      let matchesFilter = true;
      if (filterTab === 'udhaar') matchesFilter = balance > 0;
      else if (filterTab === 'settled') matchesFilter = balance === 0;
      else if (filterTab === 'advance') matchesFilter = balance < 0;
      else if (filterTab === 'vip') matchesFilter = tag === 'vip';
      else if (filterTab === 'risk') matchesFilter = tag === 'risk';

      return matchesSearch && matchesFilter;
    });

    // Sort processing
    return result.sort((a, b) => {
      const balanceA = Number(a?.currentBalance) || 0;
      const balanceB = Number(b?.currentBalance) || 0;
      const nameA = a?.name || '';
      const nameB = b?.name || '';

      if (sortOption === 'highest_udhaar') {
        return balanceB - balanceA;
      }
      if (sortOption === 'name_asc') {
        return nameA.localeCompare(nameB);
      }
      if (sortOption === 'recent') {
        const dateA = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const dateB = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });
  }, [customers, searchQuery, filterTab, sortOption]);

  const totalUdhaarBalance = useMemo(() => {
    return (customers || []).reduce((acc, c) => {
      const bal = Number(c?.currentBalance) || 0;
      return acc + (bal > 0 ? bal : 0);
    }, 0);
  }, [customers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP PAGE TITLE & ADD CUSTOMER ACTION BAR                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>
              Customer Directory
            </h1>
            <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: '800' }}>
              {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Total Pending Udhaar: <strong style={{ color: 'var(--error)' }}>₹{totalUdhaarBalance.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Add Customer Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.35rem', gap: '0.5rem', borderRadius: '18px', fontWeight: '800' }}
        >
          <UserPlus size={18} />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, FILTER PILLS & SORT SELECTOR BAR                      */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-card, 24px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Search Bar & Sort Dropdown */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Multi-field Search Input */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, phone, village, address..."
              style={{ paddingLeft: '2.75rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              style={{ fontWeight: '700', fontSize: '0.85rem' }}
            >
              <option value="highest_udhaar">Sort: Highest Udhaar</option>
              <option value="name_asc">Sort: Name (A → Z)</option>
              <option value="recent">Sort: Recent Activity</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: '0.2rem' }} />

          {[
            { id: 'all', label: 'All' },
            { id: 'udhaar', label: '🔴 Udhaar' },
            { id: 'settled', label: '🟢 Settled' },
            { id: 'advance', label: '🟢 Advance' },
            { id: 'vip', label: '⭐ VIP' },
            { id: 'risk', label: '⚠️ Risk' },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '16px',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: isActive ? 'var(--primary)' : 'var(--text-body)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOMER PROFILE CARDS GRID / SKELETON / EMPTY / ERROR         */}
      {/* ------------------------------------------------------------- */}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '24px' }} />
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>Unable to Load Customers</h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            Something went wrong while fetching customer data.
          </p>
          <button onClick={() => refetch()} className="btn btn-secondary" style={{ gap: '0.4rem', margin: '0 auto' }}>
            <RotateCw size={16} /> Retry
          </button>
        </div>
      ) : processedCustomers.length === 0 ? (
        /* Empty State */
        <div style={{
          padding: '3.5rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <Users size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            {searchQuery || filterTab !== 'all' ? 'No Customers Match Criteria' : 'No Customers Yet'}
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.875rem', marginTop: '0.35rem', marginBottom: '1.5rem' }}>
            {searchQuery || filterTab !== 'all'
              ? 'Try adjusting your search terms or filter selection.'
              : 'Start building your merchant digital ledger by adding your first customer.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', gap: '0.5rem', margin: '0 auto' }}
          >
            <UserPlus size={18} /> + Add First Customer
          </button>
        </div>
      ) : (
        /* Customer Profile Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {processedCustomers.map((customer) => (
            <CustomerProfileCard
              key={customer.id}
              customer={customer}
              onSelect={(cust) => setDetailsCustomer(cust)}
              onNewBill={(id) => setRecordSaleCustomerId(id)}
              onCollectPayment={(id) => navigate(`/payments/receive?customerId=${id}`)}
              onEdit={(cust) => setEditingCustomer(cust)}
            />
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refetch();
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          isOpen={!!editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            refetch();
          }}
        />
      )}

      {/* Customer Details & Khatta Ledger Modal */}
      {detailsCustomer && (
        <CustomerDetailsModal
          customer={detailsCustomer}
          isOpen={!!detailsCustomer}
          onClose={() => setDetailsCustomer(null)}
          onNewBill={(id) => setRecordSaleCustomerId(id)}
          onCollectPayment={(id) => navigate(`/payments/receive?customerId=${id}`)}
          onEdit={(cust) => {
            setDetailsCustomer(null);
            setEditingCustomer(cust);
          }}
        />
      )}

      {/* Record Credit Sale Modal Integration */}
      {recordSaleCustomerId && (
        <RecordCreditSaleModal
          isOpen={!!recordSaleCustomerId}
          onClose={() => setRecordSaleCustomerId(null)}
          initialCustomerId={recordSaleCustomerId}
          onSuccess={() => {
            setRecordSaleCustomerId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default CustomerListPage;
