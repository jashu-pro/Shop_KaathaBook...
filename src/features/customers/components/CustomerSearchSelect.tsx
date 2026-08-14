/* features/customers/components/CustomerSearchSelect.tsx */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import type { Customer } from '../types';

interface CustomerSearchSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  customers: Customer[];
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onChange,
  customers = [],
  placeholder = 'Search customer by name, phone, or village...',
  label = 'Select Customer',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c && c.id === value) || null;
  }, [customers, value]);

  // Filter customers by name, phone, village, address
  const filteredCustomers = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) => {
      if (!c) return false;
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '');
      const village = (c.village || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || village.includes(q) || address.includes(q);
    });
  }, [customers, searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CU';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleSelectCustomer = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem' }}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}

      {/* Selected Customer View or Search Box Trigger */}
      {selectedCustomer && !isOpen ? (
        <div
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #3B82F6',
            borderRadius: '16px',
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
            transition: 'all 150ms ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '0.9rem',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid #DBEAFE'
            }}>
              {selectedCustomer.photoUrl ? (
                <img src={selectedCustomer.photoUrl} alt={selectedCustomer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitials(selectedCustomer.name)}</span>
              )}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.925rem', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.village && (
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    ({selectedCustomer.village})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                <span>📱 {selectedCustomer.phone || 'No phone'}</span>
                <span style={{
                  fontWeight: '800',
                  color: selectedCustomer.currentBalance > 0 ? '#DC2626' : selectedCustomer.currentBalance < 0 ? '#16A34A' : '#64748B'
                }}>
                  • ₹{Math.abs(selectedCustomer.currentBalance || 0)} {selectedCustomer.currentBalance > 0 ? 'Udhaar' : selectedCustomer.currentBalance < 0 ? 'Advance' : 'Settled'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={handleClearSelection}
              style={{
                backgroundColor: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Change Customer"
            >
              <X size={15} />
            </button>
            <ChevronDown size={18} style={{ color: '#64748B' }} />
          </div>
        </div>
      ) : (
        /* Search Input Box */
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="input-field"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            style={{
              paddingLeft: '2.5rem',
              paddingRight: '2.5rem',
              borderRadius: '16px',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              border: isOpen ? '2px solid #3B82F6' : '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: '600',
              boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none'
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Floating Dropdown Results Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 200,
            padding: '0.4rem'
          }}
        >
          {filteredCustomers.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
              No customer found matching "{searchQuery}"
            </div>
          ) : (
            filteredCustomers.map((c) => {
              if (!c) return null;
              const isSelected = c.id === value;
              const isUdhaar = Number(c.currentBalance) > 0;
              const isAdvance = Number(c.currentBalance) < 0;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c.id)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    transition: 'background-color 120ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* Avatar Initials / Photo */}
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid #DBEAFE'
                    }}>
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{getInitials(c.name)}</span>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                          {c.name}
                        </span>
                        {c.village && (
                          <span style={{ fontSize: '0.725rem', color: '#64748B' }}>
                            • 📍 {c.village}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.05rem' }}>
                        📱 {c.phone || 'No Phone'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                      backgroundColor: isUdhaar ? '#FEF2F2' : isAdvance ? '#F0FDF4' : '#F8FAFC',
                      color: isUdhaar ? '#DC2626' : isAdvance ? '#16A34A' : '#64748B',
                      border: `1px solid ${isUdhaar ? '#FEE2E2' : isAdvance ? '#DCFCE7' : '#E2E8F0'}`
                    }}>
                      ₹{Math.abs(Number(c.currentBalance) || 0)} {isUdhaar ? 'Udhaar' : isAdvance ? 'Advance' : 'Settled'}
                    </span>
                    {isSelected && <Check size={16} style={{ color: '#3B82F6' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchSelect;
