/* features/customers/components/CustomerProfileCard.tsx */
import React from 'react';
import { PhoneCall, Send, CreditCard, ChevronRight, Edit3, Receipt, AlertTriangle } from 'lucide-react';
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

  // Normalize Indian phone numbers
  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : customer.phone || 'No Phone';

  // Financial Balance Definitions from Repository Data
  const isUdhaar = customer.currentBalance > 0;
  const isAdvance = customer.currentBalance < 0;

  // Credit Limit Percentage calculation
  const creditLimit = customer.creditLimit || 50000;
  const usedPercentage = Math.min(Math.round((Math.max(customer.currentBalance, 0) / creditLimit) * 100), 100);
  const isLimitExceeded = customer.currentBalance > creditLimit;

  // Avatar Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // WhatsApp Message Generator
  const whatsappMsg = encodeURIComponent(
    `🙏 ${shopName}\n\nHello ${customer.name},\n\nYour current Khatta balance is ₹${Math.abs(customer.currentBalance).toLocaleString('en-IN')}.\n\nPlease clear the pending amount at your convenience.\n\nThank you!`
  );

  const tagColor = 
    customer.tag?.toLowerCase() === 'vip' ? { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6', border: '#DBEAFE' } :
    customer.tag?.toLowerCase() === 'risk' ? { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', border: '#FEE2E2' } :
    customer.tag?.toLowerCase() === 'new' ? { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E', border: '#DCFCE7' } :
    { bg: '#F8FAFC', text: '#475569', dot: '#64748B', border: '#E2E8F0' };

  return (
    <div
      onClick={() => onSelect(customer)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        padding: '1.25rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
      className="customer-card-hover"
    >
      {/* Top Header: Avatar + Customer Name + Subtitle (Hostel/Village) + Status Tag */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Avatar / Initials Square Container */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.05rem', overflow: 'hidden', flexShrink: 0,
            border: '1px solid #DBEAFE'
          }}>
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{getInitials(customer.name)}</span>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>
              {customer.name}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
              {customer.village || customer.address || 'Khatta Customer'}
            </p>
          </div>
        </div>

        {/* Status Pill Tag with colored bullet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              backgroundColor: tagColor.bg,
              color: tagColor.text,
              border: `1px solid ${tagColor.border}`,
              fontSize: '0.725rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tagColor.dot }} />
            {customer.tag || 'REGULAR'}
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
                padding: '0.25rem 0.5rem',
                borderRadius: '10px',
                fontSize: '0.725rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={`Edit ${customer.name}'s Profile`}
            >
              <Edit3 size={13} style={{ color: '#3B82F6' }} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Phone Number */}
      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>{formattedPhone}</span>
      </div>

      {/* Balance Pill & Credit Limit Progress */}
      <div style={{
        backgroundColor: isUdhaar ? '#FEF2F2' : isAdvance ? '#F0FDF4' : '#F8FAFC',
        border: `1px solid ${isUdhaar ? '#FEE2E2' : isAdvance ? '#DCFCE7' : '#E2E8F0'}`,
        borderRadius: '16px',
        padding: '0.75rem 0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
            {isUdhaar ? 'Outstanding Udhaar' : isAdvance ? 'Advance Balance' : 'Settled Balance'}
          </span>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: '800',
            color: isUdhaar ? '#DC2626' : isAdvance ? '#16A34A' : '#0F172A'
          }}>
            ₹{Math.abs(customer.currentBalance).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Credit Limit bar */}
        <div style={{ width: '100%', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${usedPercentage}%`,
            backgroundColor: isLimitExceeded ? '#DC2626' : usedPercentage > 85 ? '#F59E0B' : '#10B981',
            borderRadius: '8px',
            transition: 'width 300ms ease'
          }} />
        </div>
      </div>

      {/* Bottom Actions Row: Call | WhatsApp | + Bill | Pay | Open Details (❯) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.2rem', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
          Limit: ₹{creditLimit.toLocaleString('en-IN')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Call Icon Button */}
          <a
            href={cleanPhone ? `tel:${cleanPhone}` : '#'}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', cursor: 'pointer'
            }}
            title={`Call ${customer.name}`}
          >
            <PhoneCall size={16} />
          </a>

          {/* WhatsApp / Chat Icon Button */}
          <a
            href={cleanPhone ? `https://wa.me/91${cleanPhone}?text=${whatsappMsg}` : '#'}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7',
              color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', cursor: 'pointer'
            }}
            title={`WhatsApp message to ${customer.name}`}
          >
            <Send size={15} />
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
                height: '36px', padding: '0 0.65rem', borderRadius: '12px',
                backgroundColor: '#059669', color: '#FFFFFF', border: 'none',
                fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem',
                cursor: 'pointer'
              }}
              title={`Record New Bill for ${customer.name}`}
            >
              <Receipt size={14} />
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
              height: '36px', padding: '0 0.65rem', borderRadius: '12px',
              backgroundColor: '#10B981', color: '#FFFFFF', border: 'none',
              fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem',
              cursor: 'pointer'
            }}
            title={`Collect Payment from ${customer.name}`}
          >
            <CreditCard size={14} />
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
              width: '36px', height: '36px', borderRadius: '12px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={`View full details of ${customer.name}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileCard;
