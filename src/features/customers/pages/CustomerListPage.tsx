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
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
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
  const [creditCustomerId, setCreditCustomerId] = useState<string | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP PORTAL HEADER & KPI SUMMARY BAR                            */}
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
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)' }}>
              Customer Directory
            </h2>
            <span className="badge badge-success" style={{ marginLeft: '0.25rem', fontSize: '0.7rem' }}>
              {customers.length} Total
            </span>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '0.825rem' }}>
            Manage Kirana credit (Udhaar) accounts, village collection lists, and WhatsApp reminders.
          </p>
        </div>

        {/* Udhaar Summary & Add Customer Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Udhaar Pending
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#EF4444', lineHeight: 1.1 }}>
              ₹{totalUdhaarBalance.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {debtorsCount} pending collection(s)
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ borderRadius: '14px', padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '0.85rem' }}
          >
            <UserPlus size={18} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SEARCH, FILTER TABS & VILLAGE CHIPS                           */}
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
        {/* Top Controls: Search Bar & Sort Dropdown */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{
            flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, mobile, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.85rem', borderRadius: '14px' }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', fontSize: '0.8rem' }}
            >
              <option value="balance-desc">Highest Udhaar First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
          {[
            { id: 'all', label: `All (${customers.length})` },
            { id: 'udhaar', label: `Pending Udhaar (${debtorsCount})` },
            { id: 'clear', label: `Clear Balance (${customers.length - debtorsCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CustomerFilterTab)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Village Filter:
            </span>
            <button
              onClick={() => setSelectedVillage('all')}
              style={{
                padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
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
                  padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '600',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)', borderRadius: '20px', padding: '3rem 1.5rem',
          textAlign: 'center', border: '1px solid var(--border-color)'
        }}>
          <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading)' }}>
            No Customers Found
          </h3>
          <p style={{ color: 'var(--text-body)', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No customer matching "${searchQuery}"` : 'Get started by adding your first shop customer'}
          </p>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ borderRadius: '14px', fontSize: '0.85rem' }}>
            <UserPlus size={16} /> Add Customer Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filteredCustomers.map((customer) => {
            const hasUdhaar = customer.currentBalance > 0;

            return (
              <div
                key={customer.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '18px',
                  padding: '1.15rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  transition: 'all 200ms ease'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: hasUdhaar ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-light)',
                      color: hasUdhaar ? '#EF4444' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '0.95rem', flexShrink: 0
                    }}>
                      {getInitials(customer.name)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                        {customer.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                        <MapPin size={12} /> {customer.village || 'No village specified'}
                      </p>
                    </div>
                  </div>

                  {/* Current Balance Badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      backgroundColor: hasUdhaar ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: hasUdhaar ? '#EF4444' : '#10B981',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.775rem',
                      fontWeight: '800'
                    }}>
                      {hasUdhaar ? `₹${customer.currentBalance} Udhaar` : '₹0 Clear'}
                    </div>
                  </div>
                </div>

                {/* Contact Actions Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-body)', fontWeight: '600', fontSize: '0.775rem' }}>
                    <Phone size={13} style={{ color: 'var(--primary)' }} />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>

                  {customer.phone && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {/* Call Action */}
                      <a
                        href={`tel:${customer.phone}`}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', borderRadius: '8px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Call Customer"
                      >
                        <PhoneCall size={13} />
                      </a>

                      {/* WhatsApp Action */}
                      <a
                        href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(`Namaste ${customer.name}, your current Shop KhattaBook pending balance is ₹${customer.currentBalance}. Thank you!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', borderRadius: '8px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions: Give Credit & Receive Payment */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => setCreditCustomerId(customer.id)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.775rem', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
                  >
                    <Plus size={13} /> + Give Credit
                  </button>

                  <button
                    onClick={() => navigate(`/payments/receive?customerId=${customer.id}`)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.5rem 0.6rem', fontSize: '0.775rem', borderRadius: '12px' }}
                  >
                    <CreditCard size={13} /> Pay ₹
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

      {/* Record Credit Sale Modal */}
      <RecordCreditSaleModal
        isOpen={Boolean(creditCustomerId)}
        initialCustomerId={creditCustomerId || ''}
        onClose={() => setCreditCustomerId(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default CustomerListPage;
