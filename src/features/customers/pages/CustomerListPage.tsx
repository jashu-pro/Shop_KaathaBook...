/* features/customers/pages/CustomerListPage.tsx */
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MessageSquare, 
  MapPin, 
  CreditCard, 
  Plus, 
  ArrowUpDown,
  PhoneCall
} from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { AddCustomerModal } from '../components/AddCustomerModal';
import type { CustomerFilterTab } from '../types';
import { useNavigate } from 'react-router-dom';

const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, isLoading, refetch } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerFilterTab>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'balance-desc' | 'name-asc' | 'recent'>('balance-desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Extract unique villages
  const villages = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.village) set.add(c.village);
    });
    return Array.from(set);
  }, [customers]);

  // Compute Total Metrics
  const totalUdhaarBalance = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c) => c.currentBalance > 0).length;
  }, [customers]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !query || 
          c.name.toLowerCase().includes(query) || 
          (c.phone && c.phone.includes(query)) ||
          (c.village && c.village.toLowerCase().includes(query));

        // Tab filter
        let matchesTab = true;
        if (activeTab === 'udhaar') matchesTab = c.currentBalance > 0;
        else if (activeTab === 'clear') matchesTab = c.currentBalance === 0;
        else if (activeTab === 'advance') matchesTab = c.currentBalance < 0;

        // Village filter
        let matchesVillage = true;
        if (selectedVillage !== 'all') {
          matchesVillage = c.village?.toLowerCase() === selectedVillage.toLowerCase();
        }

        return matchesQuery && matchesTab && matchesVillage;
      })
      .sort((a, b) => {
        if (sortBy === 'balance-desc') return b.currentBalance - a.currentBalance;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [customers, searchQuery, activeTab, selectedVillage, sortBy]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP PORTAL HEADER & KPI SUMMARY BAR                            */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card, 28px)',
        padding: '1.75rem 2rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Customer Directory
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem' }}>
              {customers.length} Total
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>
            Manage Kirana credit (Udhaar) accounts, village collection lists, and WhatsApp reminders.
          </p>
        </div>

        {/* Udhaar Summary & Add Customer Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Udhaar Pending
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#EF4444', lineHeight: 1.1 }}>
              ₹{totalUdhaarBalance.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {debtorsCount} pending collection(s)
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: '18px', padding: '0.85rem 1.5rem', fontWeight: '700' }}
          >
            <UserPlus size={20} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, FILTER TABS & VILLAGE CHIPS                           */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Top Controls: Search Bar & Sort Dropdown */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{
            flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '1.2rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by customer name, mobile number, or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.8rem' }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '0.85rem 1rem', borderRadius: '18px', fontSize: '0.85rem' }}
            >
              <option value="balance-desc">Highest Udhaar First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'all', label: `All Customers (${customers.length})` },
            { id: 'udhaar', label: `Pending Udhaar (${debtorsCount})` },
            { id: 'clear', label: `Clear Balance (${customers.length - debtorsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CustomerFilterTab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-body)',
                backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Village Chips Filter */}
        {villages.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Village Filter:
            </span>
            <button
              onClick={() => setSelectedVillage('all')}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '600',
                backgroundColor: selectedVillage === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: selectedVillage === 'all' ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none'
              }}
            >
              All Villages
            </button>
            {villages.map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVillage(v)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '600',
                  backgroundColor: selectedVillage === v ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: selectedVillage === v ? '#FFFFFF' : 'var(--text-body)', cursor: 'pointer', border: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOMER CARDS GRID                                           */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '24px' }} />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '28px', padding: '4rem 2rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Customers Found
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            {searchQuery ? `No customer matching "${searchQuery}"` : 'Get started by adding your first shop customer'}
          </p>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ borderRadius: '18px' }}>
            <UserPlus size={18} /> Add Customer Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredCustomers.map((customer) => {
            const hasUdhaar = customer.currentBalance > 0;

            return (
              <div
                key={customer.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '24px',
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  transition: 'all 200ms ease'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: hasUdhaar ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)',
                      color: hasUdhaar ? '#EF4444' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '1.1rem'
                    }}>
                      {getInitials(customer.name)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                        {customer.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <MapPin size={13} /> {customer.village || 'No village specified'}
                      </p>
                    </div>
                  </div>

                  {/* Current Balance Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      backgroundColor: hasUdhaar ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: hasUdhaar ? '#EF4444' : '#10B981',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: '800'
                    }}>
                      {hasUdhaar ? `₹${customer.currentBalance} Udhaar` : '₹0 Clear'}
                    </div>
                  </div>
                </div>

                {/* Contact Actions Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-body)', fontWeight: '600' }}>
                    <Phone size={14} style={{ color: 'var(--primary)' }} />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>

                  {customer.phone && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Call Action */}
                      <a
                        href={`tel:${customer.phone}`}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '32px', height: '32px', borderRadius: '10px' }}
                        title="Call Customer"
                      >
                        <PhoneCall size={14} />
                      </a>

                      {/* WhatsApp Action */}
                      <a
                        href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(`Namaste ${customer.name}, your current Shop KhattaBook pending balance is ₹${customer.currentBalance}. Thank you!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '32px', height: '32px', borderRadius: '10px', color: '#10B981' }}
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare size={14} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions: Give Credit & Receive Payment */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigate(`/sales/new?customerId=${customer.id}`)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.8rem', borderRadius: '14px' }}
                  >
                    <Plus size={14} /> + Give Credit
                  </button>

                  <button
                    onClick={() => navigate(`/payments/receive?customerId=${customer.id}`)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.8rem', borderRadius: '14px' }}
                  >
                    <CreditCard size={14} /> Pay ₹
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default CustomerListPage;
