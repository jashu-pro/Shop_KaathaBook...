// src/features/reports/components/CalendarPdfExportModal.tsx
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  FileText, 
  Download, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { generateAiReportPdf } from '../../../modules/documents/AiReportPdfGenerator';

export type PdfExportMode = 'this-day' | 'specific-date' | 'yearly';

interface CalendarPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: any;
  sales: any[];
  payments: any[];
  customers: any[];
}

export const CalendarPdfExportModal: React.FC<CalendarPdfExportModalProps> = ({
  isOpen,
  onClose,
  shop,
  sales = [],
  payments = [],
  customers = [],
}) => {
  // Mode selection: 'this-day' | 'specific-date' | 'yearly'
  const [mode, setMode] = useState<PdfExportMode>('this-day');

  // Dynamic Date Bounds (never hardcoded)
  const todayObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayObj.toISOString().slice(0, 10), [todayObj]);
  const currentYear = useMemo(() => todayObj.getFullYear(), [todayObj]);
  
  // Earliest allowable date: 5 years in the past
  const minDateStr = useMemo(() => {
    const minD = new Date();
    minD.setFullYear(minD.getFullYear() - 5);
    return minD.toISOString().slice(0, 10);
  }, []);

  // State for specific date and year inputs
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic available years list (current year back to 5 years ago)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Safety checks & validation
  const validateInputs = (): boolean => {
    setValidationError(null);

    if (mode === 'specific-date') {
      if (!selectedDate) {
        setValidationError('Please select a valid calendar date.');
        return false;
      }
      const chosen = new Date(selectedDate);
      if (isNaN(chosen.getTime())) {
        setValidationError('Invalid date format.');
        return false;
      }
      if (selectedDate > todayStr) {
        setValidationError('Future dates are not permitted. Please pick today or an earlier date.');
        return false;
      }
      if (selectedDate < minDateStr) {
        setValidationError(`Date cannot be earlier than ${minDateStr}.`);
        return false;
      }
    }

    if (mode === 'yearly') {
      if (!selectedYear || isNaN(selectedYear)) {
        setValidationError('Please select a valid year.');
        return false;
      }
      if (selectedYear > currentYear) {
        setValidationError('Future years cannot be selected.');
        return false;
      }
      if (selectedYear < currentYear - 5) {
        setValidationError('Historical reports are restricted to the last 5 years.');
        return false;
      }
    }

    return true;
  };

  // Filter records dynamically based on chosen mode and date/year
  const filteredData = useMemo(() => {
    let matchedSales: any[] = [];
    let matchedPayments: any[] = [];
    let periodLabel = '';

    if (mode === 'this-day') {
      matchedSales = sales.filter((s) => (s.saleDate || s.createdAt || '').startsWith(todayStr));
      matchedPayments = payments.filter((p) => (p.paymentDate || p.createdAt || '').startsWith(todayStr));
      periodLabel = `Daily Report - Today (${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (mode === 'specific-date') {
      matchedSales = sales.filter((s) => (s.saleDate || s.createdAt || '').startsWith(selectedDate));
      matchedPayments = payments.filter((p) => (p.paymentDate || p.createdAt || '').startsWith(selectedDate));
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      periodLabel = `Specific Date Report (${formattedDate})`;
    } else if (mode === 'yearly') {
      matchedSales = sales.filter((s) => {
        const d = new Date(s.saleDate || s.createdAt);
        return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
      });
      matchedPayments = payments.filter((p) => {
        const d = new Date(p.paymentDate || p.createdAt);
        return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
      });
      periodLabel = `Annual Financial Statement (Year ${selectedYear})`;
    }

    const totalRevenue = matchedSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalCollections = matchedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalUdhaarOutstanding = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
    const grossProfit = Math.max(0, Math.round(totalRevenue * 0.25));
    const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 25;

    const debtorsList = customers
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);

    return {
      matchedSales,
      matchedPayments,
      totalRevenue,
      totalCollections,
      totalUdhaarOutstanding,
      grossProfit,
      profitMarginPercent,
      debtorsList,
      periodLabel,
    };
  }, [mode, selectedDate, selectedYear, todayStr, sales, payments, customers]);

  // Handle PDF Generation & Download
  const handleDownload = async () => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    try {
      // Artificial short delay for smooth UI feedback
      await new Promise((r) => setTimeout(r, 200));

      const doc = generateAiReportPdf({
        shop: {
          name: shop?.name || 'Shop KhattaBook',
          tagline: shop?.tagline,
          businessType: shop?.businessType,
          address: shop?.address,
          landmark: shop?.landmark,
          city: shop?.city,
          state: shop?.state,
          pincode: shop?.pincode,
          phone: shop?.phone,
          gstin: shop?.gstin,
          upiId: shop?.upiId,
        },
        periodLabel: filteredData.periodLabel,
        totalRevenue: filteredData.totalRevenue,
        totalCollections: filteredData.totalCollections,
        totalUdhaarOutstanding: filteredData.totalUdhaarOutstanding,
        grossProfit: filteredData.grossProfit,
        profitMarginPercent: filteredData.profitMarginPercent,
        sales: filteredData.matchedSales,
        debtors: filteredData.debtorsList,
      });

      const safeShopName = (shop?.name || 'Shop').replace(/[^a-zA-Z0-9]/g, '_');
      let dateTag = todayStr;
      if (mode === 'specific-date') dateTag = selectedDate;
      if (mode === 'yearly') dateTag = `Year_${selectedYear}`;

      doc.save(`${safeShopName}_${mode.toUpperCase()}_Report_${dateTag}.pdf`);
      onClose();
    } catch {
      setValidationError('Failed to compile PDF. Please verify your data and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-pdf-title"
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'modal-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(5, 150, 105, 0.08), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 id="calendar-pdf-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                Calendar PDF Export
              </h3>
              <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Select date mode to generate official ledger statement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Mode Selector Tabs */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              Select PDF Report Mode:
            </label>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
                padding: '0.35rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Mode 1: This-Day */}
              <button
                type="button"
                onClick={() => {
                  setMode('this-day');
                  setValidationError(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: mode === 'this-day' ? '#059669' : 'transparent',
                  color: mode === 'this-day' ? '#FFFFFF' : 'var(--text-heading)',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'this-day' ? '0 4px 12px rgba(5, 150, 105, 0.35)' : 'none'
                }}
              >
                <Clock size={16} />
                <span>This-Day</span>
              </button>

              {/* Mode 2: Specific Date */}
              <button
                type="button"
                onClick={() => {
                  setMode('specific-date');
                  setValidationError(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: mode === 'specific-date' ? '#059669' : 'transparent',
                  color: mode === 'specific-date' ? '#FFFFFF' : 'var(--text-heading)',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'specific-date' ? '0 4px 12px rgba(5, 150, 105, 0.35)' : 'none'
                }}
              >
                <CalendarIcon size={16} />
                <span>Specific Date</span>
              </button>

              {/* Mode 3: Yearly */}
              <button
                type="button"
                onClick={() => {
                  setMode('yearly');
                  setValidationError(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.65rem 0.4rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: mode === 'yearly' ? '#059669' : 'transparent',
                  color: mode === 'yearly' ? '#FFFFFF' : 'var(--text-heading)',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: mode === 'yearly' ? '0 4px 12px rgba(5, 150, 105, 0.35)' : 'none'
                }}
              >
                <CalendarDays size={16} />
                <span>Yearly</span>
              </button>
            </div>
          </div>

          {/* Dynamic Date Input Section according to Mode */}
          <div 
            style={{
              backgroundColor: 'var(--bg-input, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1rem',
            }}
          >
            {/* Mode 1: This-Day info */}
            {mode === 'this-day' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Generating report for today:
                  </div>
                  <div style={{ fontSize: '0.975rem', fontWeight: '800', color: 'var(--text-heading)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Specific Date Picker */}
            {mode === 'specific-date' && (
              <div>
                <label 
                  htmlFor="specific-date-picker"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.4rem' }}
                >
                  Choose Calendar Date:
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="specific-date-picker"
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    min={minDateStr}
                    onChange={(e) => {
                      setValidationError(null);
                      setSelectedDate(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card, #0f172a)',
                      color: 'var(--text-heading)',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <span>Max date: Today ({todayStr})</span>
                  <span>Allowed: Last 5 Years</span>
                </div>
              </div>
            )}

            {/* Mode 3: Yearly Select */}
            {mode === 'yearly' && (
              <div>
                <label 
                  htmlFor="year-select"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.4rem' }}
                >
                  Choose Calendar Year:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => {
                    setValidationError(null);
                    setSelectedYear(Number(e.target.value));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card, #0f172a)',
                    color: 'var(--text-heading)',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr} {yr === currentYear ? '(Current Year)' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Includes 12 months (Jan 1 – Dec 31, {selectedYear})
                </div>
              </div>
            )}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                color: '#EF4444',
                fontSize: '0.825rem',
                fontWeight: '600'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Real-time Summary Card for Selected Mode */}
          <div 
            style={{
              backgroundColor: 'rgba(5, 150, 105, 0.06)',
              border: '1px solid rgba(5, 150, 105, 0.2)',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview Dataset
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                {filteredData.periodLabel}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sales Recorded</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-heading)', marginTop: '0.1rem' }}>
                  {filteredData.matchedSales.length} bills (₹{filteredData.totalRevenue.toLocaleString('en-IN')})
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Collections (Jama)</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#10B981', marginTop: '0.1rem' }}>
                  {filteredData.matchedPayments.length} entries (₹{filteredData.totalCollections.toLocaleString('en-IN')})
                </div>
              </div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
                color: 'var(--text-heading)',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              style={{
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '800',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {isGenerating ? (
                <>
                  <Download size={16} className="spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Download {mode === 'this-day' ? 'Daily' : mode === 'specific-date' ? 'Date' : 'Yearly'} PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Data Security & Privacy Footnote */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={13} color="#10B981" />
              <span>Client-side PDF generation: No user data leaked or sent externally.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
