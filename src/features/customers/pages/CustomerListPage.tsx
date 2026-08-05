/* features/customers/pages/CustomerListPage.tsx */
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  FileText, 
  PhoneCall, 
  Send, 
  ChevronRight, 
  Plus,
  Users
} from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';
import { RecordCreditSaleModal } from '../../sales/components/RecordCreditSaleModal';
import type { Customer } from '../types';
import { useNavigate } from 'react-router-dom';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, isLoading, refetch } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creditCustomerId, setCreditCustomerId] = useState<string | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.village && c.village.toLowerCase().includes(q));

      let matchesTag = true;
      if (activeTagFilter === 'vip') matchesTag = c.tag?.toLowerCase() === 'vip';
      else if (activeTagFilter === 'regular') matchesTag = c.tag?.toLowerCase() === 'regular' || !c.tag;
      else if (activeTagFilter === 'risk') matchesTag = c.tag?.toLowerCase() === 'risk';
      else if (activeTagFilter === 'new') matchesTag = new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 3600 * 1000;

      return matchesQuery && matchesTag;
    });
  }, [customers, searchQuery, activeTagFilter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarBg = (customer: Customer) => {
    if (customer.tag === 'risk') return { bg: '#FEE2E2', text: '#DC2626' };
    if (customer.tag === 'vip') return { bg: '#ECFDF5', text: '#059669' };
    const initials = getInitials(customer.name);
    if (initials.startsWith('V')) return { bg: '#FEF3C7', text: '#D97706' };
    if (initials.startsWith('K')) return { bg: '#FEF3C7', text: '#B45309' };
    return { bg: '#E0E7FF', text: '#4338CA' };
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'modal-slide 0.3s ease' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & ACTION BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Name, Village, Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '2.6rem',
              paddingTop: '0.7rem',
              paddingBottom: '0.7rem',
              borderRadius: '16px',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E2E8F0'
            }}
          />
        </div>

        {/* Action Buttons: PDF & Add Customer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              backgroundColor: '#ECFDF5',
              color: '#047857',
              border: '1.5px solid #A7F3D0',
              borderRadius: '16px',
              padding: '0.65rem 1.15rem',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} />
            <span>Download All Customers PDF ({customers.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '0.65rem 1.25rem',
              fontWeight: '700',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)'
            }}
          >
            <UserPlus size={18} />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY FILTER CHIPS ROW                                     */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {[
          { id: 'all', label: 'All Customers' },
          { id: 'vip', label: 'VIP' },
          { id: 'regular', label: 'Regular' },
          { id: 'risk', label: 'Risk' },
          { id: 'new', label: 'New' },
        ].map((tab) => {
          const selected = activeTagFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTagFilter(tab.id)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '14px',
                fontSize: '0.825rem',
                fontWeight: selected ? '800' : '600',
                backgroundColor: selected ? '#059669' : '#FFFFFF',
                color: selected ? '#FFFFFF' : '#475569',
                border: selected ? 'none' : '1.5px solid #E2E8F0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOMERS LIST CARDS                                          */}
      {/* ------------------------------------------------------------- */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '18px' }} />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '3.5rem 1.5rem',
          textAlign: 'center', border: '1.5px solid #E2E8F0'
        }}>
          <Users size={44} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A' }}>
            No Customers Found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '1.25rem' }}>
            {searchQuery ? `No customer matching "${searchQuery}"` : 'Get started by creating your customer directory'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '14px',
              padding: '0.65rem 1.25rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <UserPlus size={16} /> Add Customer Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredCustomers.map((customer) => {
            const hasUdhaar = customer.currentBalance > 0;
            const avatarStyle = getAvatarBg(customer);
            const tagLabel = (customer.tag || 'REGULAR').toUpperCase();

            return (
              <div
                key={customer.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  padding: '1.1rem 1.35rem',
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 150ms ease'
                }}
              >
                {/* Top Section: Avatar, Name/Village & Tag/Balance */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                  
                  {/* Left Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      backgroundColor: avatarStyle.bg,
                      color: avatarStyle.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {customer.photoUrl ? (
                        <img src={customer.photoUrl} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(customer.name)
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
                        {customer.name}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '500' }}>
                        {customer.village || 'Location N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Right Tag & Balance */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.675rem',
                      fontWeight: '800',
                      letterSpacing: '0.04em',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      backgroundColor: customer.tag === 'risk' ? '#FEF2F2' : customer.tag === 'vip' ? '#ECFDF5' : '#FFFBEB',
                      color: customer.tag === 'risk' ? '#DC2626' : customer.tag === 'vip' ? '#059669' : '#D97706',
                      border: `1px solid ${customer.tag === 'risk' ? '#FCA5A5' : customer.tag === 'vip' ? '#6EE7B7' : '#FDE68A'}`
                    }}>
                      • {tagLabel}
                    </span>

                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: '800',
                      color: hasUdhaar ? '#DC2626' : '#10B981'
                    }}>
                      ₹{customer.currentBalance}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Mobile/Timestamp & Quick Action Icon Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '0.65rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155' }}>
                      +91 {customer.phone || 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                      {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(customer.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Icon Actions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {customer.phone && (
                      <>
                        <a
                          href={`tel:${customer.phone}`}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            backgroundColor: '#F8FAFC',
                            border: '1.5px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#334155',
                            textDecoration: 'none'
                          }}
                          title="Call Customer"
                        >
                          <PhoneCall size={15} />
                        </a>

                        <a
                          href={`https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${customer.name}, your current Khatta pending balance is ₹${customer.currentBalance}. Thank you!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            backgroundColor: '#F8FAFC',
                            border: '1.5px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#059669',
                            textDecoration: 'none'
                          }}
                          title="Send WhatsApp Reminder"
                        >
                          <Send size={15} />
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => setCreditCustomerId(customer.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.775rem',
                        fontWeight: '700',
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      <Plus size={13} /> Credit
                    </button>

                    <button
                      onClick={() => setDetailsCustomer(customer)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="View Details & Bahi Ledger"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
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

      {/* Customer Details & Bahi Ledger Modal */}
      <CustomerDetailsModal
        customer={detailsCustomer}
        isOpen={Boolean(detailsCustomer)}
        onClose={() => setDetailsCustomer(null)}
        onNewBill={(cId) => setCreditCustomerId(cId)}
        onCollectPayment={(cId) => navigate(`/payments/receive?customerId=${cId}`)}
      />

    </div>
  );
};

export default CustomerListPage;
