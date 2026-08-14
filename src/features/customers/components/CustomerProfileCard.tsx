/* features/customers/components/CustomerProfileCard.tsx */
import React from 'react';
import { PhoneCall, Send, CreditCard, ChevronRight, Edit3, Receipt } from 'lucide-react';
import type { Customer } from '../types';
import { useAuthStore } from '../../../stores/authStore';

interface CustomerProfileCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
  onCollectPayment: (customerId: string) => void;
  onNewBill?: (customerId: string) => void;
  onEdit?: (customer: Customer) => void;
}

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({
  customer,
  onSelect,
  onCollectPayment,
  onNewBill,
  onEdit
}) => {
  const { shop } = useAuthStore();
  const shopName = shop?.name || 'Shop KhattaBook Store';

  if (!customer) return null;

  const customerName = customer.name || 'Unnamed Customer';
  const currentBalance = Number(customer.currentBalance) || 0;
  const creditLimit = Number(customer.creditLimit) || 50000;
  const currentTag = customer.tag || 'Regular';

  // Normalize Indian phone numbers
  const cleanPhone = customer.phone ? String(customer.phone).replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : customer.phone || 'No Phone';

  // Financial Balance Definitions from Repository Data
  const isUdhaar = currentBalance > 0;
  const isAdvance = currentBalance < 0;

  // Credit Limit Percentage calculation
  const usedPercentage = Math.min(Math.round((Math.max(currentBalance, 0) / creditLimit) * 100), 100);
  const isLimitExceeded = currentBalance > creditLimit;

  // Avatar Initials safely
  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CU';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // WhatsApp Message Generator
  const whatsappMsg = encodeURIComponent(
    `🙏 ${shopName}\n\nHello ${customerName},\n\nYour current Khatta balance is ₹${Math.abs(currentBalance).toLocaleString('en-IN')}.\n\nPlease clear the pending amount at your convenience.\n\nThank you!`
  );

  const tagLower = currentTag.toLowerCase();
  const tagColor = 
    tagLower === 'vip' ? { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6', border: '#DBEAFE' } :
    tagLower === 'risk' ? { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', border: '#FEE2E2' } :
    tagLower === 'new' ? { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E', border: '#DCFCE7' } :
    { bg: '#F8FAFC', text: '#475569', dot: '#64748B', border: '#E2E8F0' };

  return (
    <div
      onClick={() => onSelect(customer)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '0.8rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        position: 'relative'
      }}
      className="customer-card-hover"
    >
      {/* Top Header: Avatar + Customer Name + Village + Status Tag & Edit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Compact Avatar Square */}
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '0.9rem', overflow: 'hidden', flexShrink: 0,
            border: '1px solid #DBEAFE'
          }}>
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{getInitials(customerName)}</span>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.15 }}>
              {customerName}
            </h4>
            <p style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.1rem' }}>
              {customer.village || customer.address || 'Khatta Customer'}
            </p>
          </div>
        </div>

        {/* Status Pill Tag & Edit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: tagColor.bg,
              color: tagColor.text,
              border: `1px solid ${tagColor.border}`,
              fontSize: '0.65rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: tagColor.dot }} />
            {currentTag}
          </span>

          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }}
              style={{
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                padding: '0.2rem 0.4rem',
                borderRadius: '8px',
                fontSize: '0.675rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              title={`Edit ${customerName}'s Profile`}
            >
              <Edit3 size={11} style={{ color: '#3B82F6' }} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Phone Number */}
      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1E293B' }}>
        {formattedPhone}
      </div>

      {/* Compact Balance Banner */}
      <div style={{
        backgroundColor: isUdhaar ? '#FEF2F2' : isAdvance ? '#F0FDF4' : '#F8FAFC',
        border: `1px solid ${isUdhaar ? '#FEE2E2' : isAdvance ? '#DCFCE7' : '#E2E8F0'}`,
        borderRadius: '12px',
        padding: '0.45rem 0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            {isUdhaar ? 'OUTSTANDING UDHAAR' : isAdvance ? 'ADVANCE BALANCE' : 'SETTLED'}
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '800',
            color: isUdhaar ? '#DC2626' : isAdvance ? '#16A34A' : '#0F172A'
          }}>
            ₹{Math.abs(currentBalance).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Slim Progress Bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${usedPercentage}%`,
            backgroundColor: isLimitExceeded ? '#DC2626' : usedPercentage > 85 ? '#F59E0B' : '#10B981',
            borderRadius: '4px',
            transition: 'width 250ms ease'
          }} />
        </div>
      </div>

      {/* Bottom Actions Row: Limit info + Compact Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '600' }}>
          Limit: ₹{creditLimit.toLocaleString('en-IN')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {/* Call Icon Button */}
          <a
            href={cleanPhone ? `tel:${cleanPhone}` : '#'}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '30px', height: '30px', borderRadius: '9px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', cursor: 'pointer'
            }}
            title={`Call ${customerName}`}
          >
            <PhoneCall size={14} />
          </a>

          {/* WhatsApp Icon Button */}
          <a
            href={cleanPhone ? `https://wa.me/91${cleanPhone}?text=${whatsappMsg}` : '#'}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '30px', height: '30px', borderRadius: '9px',
              backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7',
              color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', cursor: 'pointer'
            }}
            title={`WhatsApp message to ${customerName}`}
          >
            <Send size={13} />
          </a>

          {/* + Bill Button */}
          {onNewBill && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNewBill(customer.id);
              }}
              style={{
                height: '30px', padding: '0 0.5rem', borderRadius: '9px',
                backgroundColor: '#059669', color: '#FFFFFF', border: 'none',
                fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem',
                cursor: 'pointer'
              }}
              title={`Record New Bill for ${customerName}`}
            >
              <Receipt size={12} />
              <span>+ Bill</span>
            </button>
          )}

          {/* Pay Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCollectPayment(customer.id);
            }}
            style={{
              height: '30px', padding: '0 0.5rem', borderRadius: '9px',
              backgroundColor: '#10B981', color: '#FFFFFF', border: 'none',
              fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem',
              cursor: 'pointer'
            }}
            title={`Collect Payment from ${customerName}`}
          >
            <CreditCard size={12} />
            <span>Pay</span>
          </button>

          {/* Open Details Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(customer);
            }}
            style={{
              width: '30px', height: '30px', borderRadius: '9px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={`View full details of ${customerName}`}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileCard;
