/* features/ledger/components/AiPassbookModal.tsx */
import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Sparkles, 
  Building2, 
  User, 
  MapPin, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { generateAiPassbookPdf, type PassbookPdfParams } from '../../../modules/documents/AiPassbookPdfGenerator';

interface AiPassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: PassbookPdfParams;
}

export const AiPassbookModal: React.FC<AiPassbookModalProps> = ({
  isOpen,
  onClose,
  params,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const { shop, customer, entries, dateRangeLabel = 'All Time', totalGaveUdhaar, totalGotJama, netBalance } = params;

  const fmt = (num: number) => {
    return '₹' + Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      const doc = generateAiPassbookPdf(params);
      const safeShopName = (shop.name || 'Shop').replace(/[^a-zA-Z0-9]/g, '_');
      const safePartyName = customer ? customer.name.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Customers';
      const fileName = `${safeShopName}_Passbook_${safePartyName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to download PDF', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const handleShareWhatsApp = () => {
    const party = customer ? customer.name : 'Valued Customer';
    const statusText = netBalance > 0 
      ? `outstanding balance of ${fmt(netBalance)}`
      : `account is completely clear with 0 pending dues`;
    const message = encodeURIComponent(
      `🙏 Dear *${party}*, Greetings from *${shop.name}*!\n\n` +
      `Here is your official Digital Khatta Passbook statement for ${dateRangeLabel}.\n` +
      `• *Total Given (Udhaar):* ${fmt(totalGaveUdhaar)}\n` +
      `• *Total Received (Jama):* ${fmt(totalGotJama)}\n` +
      `• *Net Balance Status:* ${statusText}\n\n` +
      `Thank you for doing business with us! 💐\n` +
      (shop.upiId ? `💳 Quick UPI Pay: ${shop.upiId}\n` : '') +
      `📞 Contact: ${shop.phone || ''}`
    );
    const phone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const fullAddress = [
    shop.address,
    shop.landmark ? `Near ${shop.landmark}` : '',
    shop.city,
    shop.state,
    shop.pincode ? `PIN: ${shop.pincode}` : '',
  ].filter(Boolean).join(', ');

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'modal-fade 0.2s ease',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-card, #FFFFFF)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, #E2E8F0)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card, #FFFFFF)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-heading, #0F172A)' }}>
                AI Digital Passbook & Statement
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                Vector-rendered official PDF with shop details, customer profile & AI insights
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleShareWhatsApp}
              className="btn btn-secondary"
              style={{
                borderRadius: '12px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#16A34A',
                borderColor: 'rgba(22, 163, 74, 0.3)',
              }}
              title="Share statement summary on WhatsApp"
            >
              <Share2 size={15} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="btn btn-primary"
              style={{
                borderRadius: '12px',
                padding: '0.55rem 1.15rem',
                fontSize: '0.825rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#047857',
              }}
            >
              <Download size={16} />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #64748B)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          backgroundColor: 'rgba(15, 23, 42, 0.03)',
        }}>
          {/* Printable Sheet Simulator */}
          <div style={{
            maxWidth: '720px',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            color: '#0F172A',
            fontSize: '0.85rem',
          }}>
            {/* 1. Header Banner */}
            <div style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '1.5rem 1.75rem',
              borderBottom: '4px solid #10B981',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Building2 size={22} style={{ color: '#10B981' }} />
                  <h1 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#FFFFFF', margin: 0 }}>
                    {shop.name || 'Shop KhattaBook'}
                  </h1>
                </div>
                {shop.tagline && (
                  <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    {shop.tagline}
                  </p>
                )}
                {fullAddress && (
                  <p style={{ color: '#CBD5E1', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <MapPin size={13} style={{ color: '#94A3B8' }} />
                    {fullAddress}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '1rem', color: '#94A3B8', fontSize: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {shop.phone && <span>📞 {shop.phone}</span>}
                  {shop.gstin && <span>🏛️ GSTIN: {shop.gstin}</span>}
                  {shop.upiId && <span>💳 UPI: {shop.upiId}</span>}
                </div>
              </div>

              <div style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                textAlign: 'center',
                minWidth: '180px',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#10B981', letterSpacing: '0.05em' }}>
                  OFFICIAL PASSBOOK
                </div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  Period: {dateRangeLabel}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem 1.75rem' }}>
              {/* 2. Customer / Account Information */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <User size={16} style={{ color: '#047857' }} />
                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>
                      {customer ? customer.name : 'All Customers (Store Consolidated Ledger)'}
                    </span>
                  </div>
                  {customer ? (
                    <div style={{ display: 'flex', gap: '1rem', color: '#64748B', fontSize: '0.8rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {customer.phone && <span>Mobile: {customer.phone}</span>}
                      {customer.village && <span>Village / Area: {customer.village}</span>}
                      {customer.creditLimit && customer.creditLimit > 0 && <span>Credit Limit: {fmt(customer.creditLimit)}</span>}
                    </div>
                  ) : (
                    <p style={{ color: '#64748B', fontSize: '0.8rem', margin: 0 }}>
                      Consolidated transaction summary for all active customer accounts.
                    </p>
                  )}
                </div>

                <div style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: netBalance > 0 ? '#FEF2F2' : '#F0FDF4',
                  border: `1px solid ${netBalance > 0 ? '#FECACA' : '#BBF7D0'}`,
                  textAlign: 'right',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: netBalance > 0 ? '#DC2626' : '#16A34A' }}>
                    {netBalance > 0 ? 'NET OUTSTANDING BALANCE' : 'NET ADVANCE / CLEAR'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: netBalance > 0 ? '#DC2626' : '#16A34A' }}>
                    {fmt(netBalance)}
                  </div>
                </div>
              </div>

              {/* 3. AI Insights Callout */}
              <div style={{
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    backgroundColor: '#7C3AED',
                    color: '#FFFFFF',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: '900',
                    letterSpacing: '0.05em',
                  }}>
                    AI LEDGER INSIGHT
                  </span>
                  <span style={{ fontWeight: '800', color: '#5B21B6', fontSize: '0.85rem' }}>
                    {customer
                      ? (netBalance <= 0 ? 'Prime Standing: 100% Settled' : 'Active Credit Relationship')
                      : 'Store-Wide Credit Distribution Health'}
                  </span>
                </div>
                <p style={{ color: '#4C1D95', fontSize: '0.8rem', lineHeight: '1.45', margin: 0 }}>
                  {customer
                    ? (netBalance <= 0
                      ? `Account has zero overdue balance. Customer maintains a perfect track record with reliable settlements.`
                      : `Pending balance of ${fmt(netBalance)}. Recovery rate is steady with active periodic entries. Recommended follow-up interval: Standard 15-day billing.`)
                    : `Total Udhaar given across this view is ${fmt(totalGaveUdhaar)} with ${fmt(totalGotJama)} in received jama collections. Market credit exposure is balanced.`}
                </p>
              </div>

              {/* 4. Financial Summary 3-Tile Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingUp size={14} /> YOU GAVE (UDHAAR)
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#DC2626', marginTop: '0.2rem' }}>
                    {fmt(totalGaveUdhaar)}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <TrendingDown size={14} /> YOU GOT (JAMA)
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#16A34A', marginTop: '0.2rem' }}>
                    {fmt(totalGotJama)}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#475569' }}>
                    NET BALANCE
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: netBalance > 0 ? '#DC2626' : '#16A34A', marginTop: '0.2rem' }}>
                    {fmt(netBalance)}
                  </div>
                </div>
              </div>

              {/* 5. Transaction Table */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.775rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800' }}>DATE</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800' }}>{customer ? 'REF / INVOICE' : 'PARTY & REF'}</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800' }}>PARTICULARS</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800', textAlign: 'right' }}>YOU GAVE (₹)</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800', textAlign: 'right' }}>YOU GOT (₹)</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: '800', textAlign: 'right' }}>BALANCE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
                          No transactions recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry, i) => (
                        <tr key={entry.id} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.55rem 0.85rem', color: '#64748B' }}>
                            {new Date(entry.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td style={{ padding: '0.55rem 0.85rem', fontWeight: '700', color: '#0F172A' }}>
                            {customer ? (entry.invoiceNo || 'Direct') : (entry.customerName || entry.invoiceNo || 'Direct')}
                          </td>
                          <td style={{ padding: '0.55rem 0.85rem', color: '#64748B' }}>
                            {(entry.description || 'Khata Entry').slice(0, 30)}
                          </td>
                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '800', color: entry.entryType === 'debit' ? '#DC2626' : '#CBD5E1' }}>
                            {entry.entryType === 'debit' ? fmt(entry.amount) : '-'}
                          </td>
                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '800', color: entry.entryType === 'credit' ? '#16A34A' : '#CBD5E1' }}>
                            {entry.entryType === 'credit' ? fmt(entry.amount) : '-'}
                          </td>
                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                            {fmt(entry.balanceAfter)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 6. Stamp & Signature Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1rem', borderTop: '1px dashed #CBD5E1' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ height: '50px', borderBottom: '1px solid #94A3B8', marginBottom: '0.4rem' }}></div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Customer Signature / Seal</span>
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ height: '50px', borderBottom: '1px solid #94A3B8', marginBottom: '0.4rem' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0F172A' }}>
                    For {shop.name || 'Store'}
                  </span>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
