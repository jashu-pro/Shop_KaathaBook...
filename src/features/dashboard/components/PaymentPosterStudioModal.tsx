/* features/dashboard/components/PaymentPosterStudioModal.tsx */
import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Palette,
  Maximize2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuthStore } from '../../../stores/authStore';

export type PosterTheme = 'emerald' | 'indigo' | 'festive' | 'minimal';
export type PosterSize = 'a4' | 'a5' | 'counter';

interface PaymentPosterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
  initialCustomerName?: string;
}

export const PaymentPosterStudioModal: React.FC<PaymentPosterStudioModalProps> = ({
  isOpen,
  onClose,
  initialAmount = 0,
  initialCustomerName = ''
}) => {
  const { shop } = useAuthStore();
  const posterRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<PosterTheme>('emerald');
  const [size, setSize] = useState<PosterSize>('a4');
  const [customTagline, setCustomTagline] = useState(shop?.tagline || 'Scan & Pay with Any UPI App');
  const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const shopName = shop?.name || 'Sri Seetharam Cloth & Ready';
  const upiId = shop?.upiId || `${shop?.phone || '8121157489-2'}@nyes`;
  const phone = shop?.phone || '';
  const city = [shop?.city, shop?.state].filter(Boolean).join(', ');

  const numAmount = Number(amount) || 0;

  // Build standard NPCI UPI URI
  const upiUri = useMemo(() => {
    let uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;
    if (numAmount > 0) {
      uri += `&am=${numAmount.toFixed(2)}`;
    }
    if (customerName.trim()) {
      uri += `&tn=${encodeURIComponent(`Payment for ${customerName.trim()}`)}`;
    }
    return uri;
  }, [upiId, shopName, numAmount, customerName]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Direct PDF Export using html2canvas and jsPDF (No 2-page or browser dialog issues)
  const handleDownloadPdf = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, // High-DPI 300 DPI export
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // A4: 210 x 297 mm, A5: 148 x 210 mm, Counter Card: 100 x 140 mm
      const formatMap: Record<PosterSize, [number, number]> = {
        a4: [210, 297],
        a5: [148, 210],
        counter: [100, 140]
      };

      const [pdfWidth, pdfHeight] = formatMap[size];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `${shopName.replace(/\s+/g, '_')}_UPI_Poster_${size.toUpperCase()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF poster', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // High-Resolution PNG Export
  const handleDownloadPng = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `${shopName.replace(/\s+/g, '_')}_UPI_Poster.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct clean print
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Theme-specific styles
  const themeStyles = {
    emerald: {
      bg: 'linear-gradient(145deg, #064E3B 0%, #047857 40%, #059669 100%)',
      cardBg: '#FFFFFF',
      accentColor: '#059669',
      subAccent: '#10B981',
      textColor: '#FFFFFF',
      badgeBg: 'rgba(255, 255, 255, 0.18)',
      badgeText: '#FFFFFF',
      footerBg: '#022C22',
      border: '2px solid rgba(255, 255, 255, 0.15)'
    },
    indigo: {
      bg: 'linear-gradient(145deg, #1E1B4B 0%, #312E81 45%, #4F46E5 100%)',
      cardBg: '#FFFFFF',
      accentColor: '#4F46E5',
      subAccent: '#818CF8',
      textColor: '#FFFFFF',
      badgeBg: 'rgba(255, 255, 255, 0.18)',
      badgeText: '#FFFFFF',
      footerBg: '#0F172A',
      border: '2px solid rgba(255, 255, 255, 0.15)'
    },
    festive: {
      bg: 'linear-gradient(145deg, #78350F 0%, #92400E 40%, #D97706 100%)',
      cardBg: '#FFFFFF',
      accentColor: '#D97706',
      subAccent: '#F59E0B',
      textColor: '#FFFFFF',
      badgeBg: 'rgba(255, 255, 255, 0.18)',
      badgeText: '#FFFFFF',
      footerBg: '#451A03',
      border: '2px solid rgba(255, 255, 255, 0.2)'
    },
    minimal: {
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      accentColor: '#0F172A',
      subAccent: '#3B82F6',
      textColor: '#0F172A',
      badgeBg: '#E2E8F0',
      badgeText: '#0F172A',
      footerBg: '#F1F5F9',
      border: '2px solid #E2E8F0'
    }
  }[theme];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '28px',
          maxWidth: '1080px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                Payment Poster & QR Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                AI-styled, high-resolution printable PDF & standee poster generator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ borderRadius: '50%', padding: '0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Body: Left Controls | Right Live Poster Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          flex: 1,
          overflowY: 'auto'
        }}>
          
          {/* LEFT: Customizer Controls Panel */}
          <div style={{
            padding: '1.5rem',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            overflowY: 'auto'
          }}>

            {/* Template Themes Selector */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                <Palette size={15} style={{ color: 'var(--primary)' }} />
                <span>1. Poster Design Theme</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'emerald', label: 'Classic Emerald', gradient: 'linear-gradient(135deg, #064E3B, #059669)' },
                  { id: 'indigo', label: 'Modern Indigo', gradient: 'linear-gradient(135deg, #1E1B4B, #4F46E5)' },
                  { id: 'festive', label: 'Festive Gold', gradient: 'linear-gradient(135deg, #78350F, #D97706)' },
                  { id: 'minimal', label: 'Acrylic Minimal', gradient: 'linear-gradient(135deg, #E2E8F0, #F8FAFC)' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as PosterTheme)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '14px',
                      border: theme === t.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      boxShadow: theme === t.id ? '0 4px 12px var(--primary-glow)' : 'none',
                      transition: 'all 150ms'
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: t.gradient }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Poster Physical Paper Size */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-heading)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                <Maximize2 size={15} style={{ color: 'var(--primary)' }} />
                <span>2. Print Format & Size</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.45rem' }}>
                {[
                  { id: 'a4', label: 'A4 Poster', desc: 'Wall Mount' },
                  { id: 'a5', label: 'A5 Standee', desc: 'Tabletop' },
                  { id: 'counter', label: 'Card / Sticker', desc: 'Pocket Mini' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSize(s.id as PosterSize)}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: '12px',
                      border: size === s.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: size === s.id ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: size === s.id ? 'var(--primary)' : 'var(--text-heading)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.825rem', fontWeight: '800' }}>{s.label}</span>
                    <span style={{ fontSize: '0.675rem', opacity: 0.75 }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tagline / Subtitle Customization */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Tagline / Catchphrase</label>
              <input
                type="text"
                className="input-field"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
                placeholder="e.g. Scan & Pay with Any UPI App"
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Optional Specific Bill Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Fixed Amount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Optional"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Merchant UPI ID Info */}
            <div style={{
              padding: '0.85rem',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Configured UPI ID</span>
                <p style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-heading)' }}>{upiId}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="btn btn-secondary btn-icon"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderRadius: '10px' }}
              >
                {copiedUpi ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Quick Export Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{
                  padding: '0.85rem',
                  borderRadius: '16px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Download size={18} />
                <span>{isGenerating ? 'Generating High-Res PDF...' : 'Download PDF Poster (1-Click)'}</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isGenerating}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.825rem', gap: '0.4rem' }}
                >
                  <ImageIcon size={15} />
                  <span>Save Image</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-secondary"
                  style={{ padding: '0.65rem', borderRadius: '12px', fontSize: '0.825rem', gap: '0.4rem' }}
                >
                  <Printer size={15} />
                  <span>Print Direct</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: Live High-Resolution Printable Poster Container */}
          <div style={{
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            overflowY: 'auto'
          }}>

            {/* Standalone Poster Element to Render as Canvas / PDF */}
            <div
              ref={posterRef}
              id="printable-payment-poster"
              style={{
                width: size === 'counter' ? '320px' : size === 'a5' ? '380px' : '440px',
                minHeight: size === 'counter' ? '460px' : size === 'a5' ? '540px' : '620px',
                background: themeStyles.bg,
                color: themeStyles.textColor,
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                border: themeStyles.border,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 1.75rem 1.5rem 1.75rem',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box'
              }}
            >
              {/* Background ambient lighting */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }} />

              {/* Top Verified Header Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                backgroundColor: themeStyles.badgeBg,
                color: themeStyles.badgeText,
                fontSize: '0.725rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                marginBottom: '1rem',
                textTransform: 'uppercase'
              }}>
                <ShieldCheck size={14} />
                <span>Shop KhattaBook • Verified Merchant</span>
              </div>

              {/* Shop Title */}
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: '900',
                lineHeight: 1.15,
                margin: 0,
                color: themeStyles.textColor,
                letterSpacing: '-0.5px'
              }}>
                {shopName}
              </h1>

              {/* Tagline */}
              <p style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: themeStyles.textColor,
                opacity: 0.9,
                marginTop: '0.35rem',
                marginBottom: '1.25rem'
              }}>
                {customTagline}
              </p>

              {/* Center Crisp White QR Frame Card */}
              <div style={{
                width: '100%',
                maxWidth: '280px',
                backgroundColor: themeStyles.cardBg,
                borderRadius: '24px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                margin: 'auto 0'
              }}>
                {/* QR Code Container */}
                <div style={{
                  padding: '0.65rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1.5px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    crossOrigin="anonymous"
                    style={{
                      width: '210px',
                      height: '210px',
                      display: 'block',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                {/* Amount / Customer Specific Tag */}
                {numAmount > 0 ? (
                  <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                      {customerName ? `Bill for ${customerName}` : 'Amount to Pay'}
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#047857', lineHeight: 1.1 }}>
                      ₹{numAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '0.65rem',
                    fontSize: '0.775rem',
                    fontWeight: '700',
                    color: '#64748B'
                  }}>
                    Enter any amount on your phone
                  </div>
                )}

                {/* UPI VPA Pill */}
                <div style={{
                  marginTop: '0.65rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#F1F5F9',
                  fontSize: '0.775rem',
                  fontWeight: '800',
                  color: '#0F172A',
                  letterSpacing: '0.02em',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  UPI: {upiId}
                </div>
              </div>

              {/* Supported Payment Logos Badges Row */}
              <div style={{
                marginTop: '1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                flexWrap: 'wrap'
              }}>
                {['GPay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Amazon Pay'].map((app) => (
                  <span
                    key={app}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      color: themeStyles.textColor,
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    {app}
                  </span>
                ))}
              </div>

              {/* Thank you note */}
              <div style={{
                marginTop: '0.85rem',
                fontSize: '0.85rem',
                fontWeight: '800',
                letterSpacing: '0.03em',
                color: themeStyles.textColor,
                textTransform: 'uppercase',
                opacity: 0.95
              }}>
                ✦ Thank You For Shopping With Us ✦
              </div>

              {/* Footer Phone & Address */}
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.725rem',
                fontWeight: '700',
                color: themeStyles.textColor,
                opacity: 0.9
              }}>
                <span>{city || 'Verified Merchant'}</span>
                <span>{phone ? `📞 ${phone}` : 'Shop KhattaBook POS'}</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentPosterStudioModal;
