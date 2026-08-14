/* features/customers/components/CustomerProfileCard.tsx */
import React from 'react';
import { PhoneCall, Send, CreditCard, BookOpen, AlertTriangle, Edit3, Receipt } from 'lucide-react';
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

  return (
    <div
      className="glass-panel"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-card, 24px)',
        border: '1px solid var(--border-color)',
        padding: '1.25rem 1.35rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      {/* Top Header: Avatar, Name, Phone & Tag Badge + Edit Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => onSelect(customer)}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '16px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-heading)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '1.05rem', overflow: 'hidden', flexShrink: 0,
            border: '1px solid var(--border-color)'
          }}>
            {customer.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{getInitials(customer.name)}</span>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
              {customer.name}
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              📱 {formattedPhone} {customer.village ? `• 📍 ${customer.village}` : ''}
            </p>
          </div>
        </div>

        {/* Tag Badge & Edit Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            className={`badge ${
              customer.tag === 'risk' ? 'badge-error' : customer.tag === 'vip' ? 'badge-success' : 'badge-neutral'
            }`}
            style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em' }}
          >
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
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-heading)',
                padding: '0.25rem 0.55rem',
                borderRadius: '10px',
                fontSize: '0.725rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 150ms ease'
              }}
              title={`Edit ${customer.name}'s Profile`}
            >
              <Edit3 size={13} style={{ color: 'var(--primary)' }} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Udhaar & Balance Display */}
      <div style={{
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        backgroundColor: isUdhaar ? 'var(--error-light)' : isAdvance ? 'var(--primary-light)' : 'var(--bg-secondary)',
        border: `1px solid ${isUdhaar ? 'rgba(239, 68, 68, 0.2)' : isAdvance ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
            {isUdhaar ? 'Outstanding Udhaar (Owes Shop)' : isAdvance ? 'Advance Balance' : 'Settled Balance'}
          </span>
          <div style={{
            fontSize: '1.35rem',
            fontWeight: '800',
            color: isUdhaar ? 'var(--error)' : isAdvance ? 'var(--primary)' : 'var(--text-heading)',
            marginTop: '0.1rem'
          }}>
            ₹{Math.abs(customer.currentBalance).toLocaleString('en-IN')}
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: '800',
          padding: '0.35rem 0.75rem',
          borderRadius: '12px',
          backgroundColor: isUdhaar ? 'var(--error)' : isAdvance ? 'var(--primary)' : 'var(--text-muted)',
          color: '#FFFFFF'
        }}>
          {isUdhaar ? '🔴 Udhaar' : isAdvance ? '🟢 Advance' : '🟢 Settled'}
        </span>
      </div>

      {/* Credit Limit Progress Indicator */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Credit Limit</span>
          <span style={{ color: isLimitExceeded ? 'var(--error)' : 'var(--text-heading)' }}>
            ₹{Math.max(customer.currentBalance, 0).toLocaleString('en-IN')} / ₹{creditLimit.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${usedPercentage}%`,
            backgroundColor: isLimitExceeded ? 'var(--error)' : usedPercentage > 85 ? '#F59E0B' : 'var(--primary)',
            borderRadius: '10px',
            transition: 'width 300ms ease'
          }} />
        </div>

        {isLimitExceeded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--error)', fontSize: '0.725rem', fontWeight: '700', marginTop: '0.35rem' }}>
            <AlertTriangle size={13} />
            <span>⚠ Credit Limit Exceeded</span>
          </div>
        )}
      </div>

      {/* Quick Actions Grid: Call | WhatsApp | + Bill | Payment | Ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: onNewBill ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: '0.45rem', paddingTop: '0.25rem' }}>
        <a
          href={cleanPhone ? `tel:${cleanPhone}` : '#'}
          className="btn btn-secondary btn-icon"
          style={{ textDecoration: 'none', padding: '0.55rem 0.2rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700', gap: '0.25rem' }}
          title={`Call ${customer.name}`}
        >
          <PhoneCall size={15} style={{ color: 'var(--primary)' }} />
          <span>Call</span>
        </a>

        <a
          href={cleanPhone ? `https://wa.me/91${cleanPhone}?text=${whatsappMsg}` : '#'}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-icon"
          style={{ textDecoration: 'none', padding: '0.55rem 0.2rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700', gap: '0.25rem', color: '#047857' }}
          title={`Send WhatsApp reminder to ${customer.name}`}
        >
          <Send size={15} />
          <span>Chat</span>
        </a>

        {onNewBill && (
          <button
            type="button"
            onClick={() => onNewBill(customer.id)}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 0.2rem',
              borderRadius: '14px',
              fontSize: '0.75rem',
              fontWeight: '800',
              gap: '0.2rem',
              backgroundColor: '#059669',
              color: '#FFFFFF'
            }}
            title={`Record New Bill for ${customer.name}`}
          >
            <Receipt size={15} />
            <span>+ Bill</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onCollectPayment(customer.id)}
          className="btn btn-primary"
          style={{
            padding: '0.55rem 0.2rem',
            borderRadius: '14px',
            fontSize: '0.75rem',
            fontWeight: '800',
            gap: '0.2rem',
            backgroundColor: '#10B981',
            color: '#FFFFFF'
          }}
          title={`Collect Payment from ${customer.name}`}
        >
          <CreditCard size={15} />
          <span>Pay</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(customer)}
          className="btn btn-secondary"
          style={{ padding: '0.55rem 0.2rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700', gap: '0.2rem' }}
          title="View Customer Ledger"
        >
          <BookOpen size={15} />
          <span>Ledger</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerProfileCard;
