// src/modules/documents/AiPassbookPdfGenerator.ts
import jsPDF from 'jspdf';

export interface PassbookPdfParams {
  shop: {
    name: string;
    tagline?: string;
    businessType?: string;
    address?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    gstin?: string;
    upiId?: string;
    logoUrl?: string;
  };
  customer?: {
    name: string;
    phone?: string;
    village?: string;
    address?: string;
    creditLimit?: number;
    currentBalance?: number;
  } | null;
  entries: Array<{
    id: string;
    entryDate: string;
    entryType: 'debit' | 'credit';
    amount: number;
    balanceAfter: number;
    description?: string;
    invoiceNo?: string;
    customerName?: string;
    customerPhone?: string;
  }>;
  dateRangeLabel?: string;
  totalGaveUdhaar: number;
  totalGotJama: number;
  netBalance: number;
}

export const generateAiPassbookPdf = (params: PassbookPdfParams): jsPDF => {
  const {
    shop,
    customer,
    entries,
    dateRangeLabel = 'All Time',
    totalGaveUdhaar,
    totalGotJama,
    netBalance,
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Format currency helper
  const fmt = (num: number) => {
    return 'Rs. ' + Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format Date helper
  const fmtDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  // AI Narrative Generator based on customer financial ledger behavior
  const generateAiInsight = (): { title: string; narrative: string; badge: string; color: [number, number, number] } => {
    if (customer) {
      if (netBalance <= 0) {
        return {
          title: 'AI Ledger Insight: Excellent Standing',
          narrative: `Customer ${customer.name} has settled all outstanding dues. The account has a clean credit record with zero overdue balance. High trust profile recommended for future trade credit.`,
          badge: 'ACCOUNT CLEAR / SETTLED',
          color: [16, 185, 129], // Emerald
        };
      }
      const ratio = totalGaveUdhaar > 0 ? (totalGotJama / totalGaveUdhaar) * 100 : 100;
      if (ratio >= 65) {
        return {
          title: 'AI Ledger Insight: Active & Healthy Credit Cycle',
          narrative: `Customer ${customer.name} maintains a steady ${ratio.toFixed(0)}% recovery rate. Pending balance of ${fmt(netBalance)} is within normal credit terms. Friendly payment reminder can be sent around regular billing intervals.`,
          badge: 'HEALTHY TRADE CREDIT',
          color: [59, 130, 246], // Blue
        };
      }
      return {
        title: 'AI Ledger Insight: Payment Follow-up Recommended',
        narrative: `Outstanding balance of ${fmt(netBalance)} detected with low recent collections. Recommend sending an automated WhatsApp statement or polite settlement reminder to accelerate cash recovery.`,
        badge: 'COLLECTION DUE',
        color: [245, 158, 11], // Amber
      };
    } else {
      return {
        title: 'AI Consolidated Store Analytics',
        narrative: `Total Udhaar disbursed: ${fmt(totalGaveUdhaar)} across ${entries.length} recorded entries. Total collections received: ${fmt(totalGotJama)}. Net store credit floating in market: ${fmt(netBalance)}. Recovery cycle operates normally across customer portfolio.`,
        badge: 'STORE-WIDE METRICS',
        color: [79, 70, 229], // Indigo
      };
    }
  };

  const aiInsight = generateAiInsight();

  let currentY = 0;

  // Header Draw Function
  const drawHeader = (_pageNumber?: number) => {
    // Top Accent Bar
    doc.setFillColor(15, 23, 42); // Deep Navy Slate-900
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Accent line
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 42, pageWidth, 2, 'F');

    // Shop Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    const shopTitle = (shop.name || 'SHOP KHATTABOOK').toUpperCase();
    doc.text(shopTitle, marginX, 16);

    // Shop Tagline / Business Type
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // Slate-300
    const subtitleParts = [
      shop.tagline,
      shop.businessType ? `Category: ${shop.businessType}` : '',
    ].filter(Boolean);
    if (subtitleParts.length > 0) {
      doc.text(subtitleParts.join('  •  '), marginX, 22);
    }

    // Shop Address & Contacts
    const fullAddress = [
      shop.address,
      shop.landmark ? `Near ${shop.landmark}` : '',
      shop.city,
      shop.state,
      shop.pincode ? `PIN: ${shop.pincode}` : '',
    ].filter(Boolean).join(', ');

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    if (fullAddress) {
      doc.text(fullAddress, marginX, 28, { maxWidth: 120 });
    }

    const contactLine = [
      shop.phone ? `Mobile: ${shop.phone}` : '',
      shop.gstin ? `GSTIN: ${shop.gstin}` : '',
      shop.upiId ? `UPI: ${shop.upiId}` : '',
    ].filter(Boolean).join('   |   ');
    if (contactLine) {
      doc.text(contactLine, marginX, 36);
    }

    // Right Box: Document Type Badge
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(pageWidth - marginX - 60, 10, 60, 24, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('OFFICIAL KHATTA PASSBOOK', pageWidth - marginX - 30, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - marginX - 30, 24, { align: 'center' });
    doc.text(`Period: ${dateRangeLabel}`, pageWidth - marginX - 30, 30, { align: 'center' });

    currentY = 48;
  };

  // Footer Draw Function
  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Verified Digital Ledger Statement  •  Shop KhattaBook Retail OS', marginX, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
  };

  // Start Page 1
  drawHeader(1);

  // -----------------------------------------------------------------
  // 1. PARTY / CUSTOMER INFORMATION CARD
  // -----------------------------------------------------------------
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 3, 3, 'FD');

  if (customer) {
    // Left: Customer Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(customer.name.toUpperCase(), marginX + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const custLoc = [customer.phone ? `Phone: ${customer.phone}` : '', customer.village ? `Village: ${customer.village}` : '', customer.address].filter(Boolean).join('  •  ');
    doc.text(custLoc || 'Customer Account', marginX + 4, currentY + 14);

    if (customer.creditLimit && customer.creditLimit > 0) {
      doc.text(`Approved Credit Limit: ${fmt(customer.creditLimit)}`, marginX + 4, currentY + 20);
    } else {
      doc.text('Account Type: Regular Khata Holder', marginX + 4, currentY + 20);
    }

    // Right: Status Tag
    const isDue = netBalance > 0;
    doc.setFillColor(isDue ? 254 : 240, isDue ? 242 : 253, isDue ? 242 : 244);
    doc.setDrawColor(isDue ? 252 : 187, isDue ? 165 : 247, isDue ? 165 : 208);
    doc.roundedRect(pageWidth - marginX - 54, currentY + 4, 50, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isDue ? 220 : 16, isDue ? 38 : 149, isDue ? 38 : 74);
    doc.text(isDue ? 'OUTSTANDING BALANCE' : 'NO DUES PENDING', pageWidth - marginX - 29, currentY + 10, { align: 'center' });
    doc.setFontSize(9.5);
    doc.text(fmt(netBalance), pageWidth - marginX - 29, currentY + 16, { align: 'center' });
  } else {
    // General Shop Khatta Passbook
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('CONSOLIDATED STORE BAHI KHATTA', marginX + 4, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Comprehensive transaction statement for all registered customers and trade credit accounts.`, marginX + 4, currentY + 15);
    doc.text(`Total Active Entries: ${entries.length} transactions in selected view`, marginX + 4, currentY + 21);
  }

  currentY += 28;

  // -----------------------------------------------------------------
  // 2. AI BUSINESS & CREDIT INSIGHT BANNER
  // -----------------------------------------------------------------
  doc.setFillColor(245, 243, 255); // Light Violet-50
  doc.setDrawColor(221, 214, 254); // Violet-200
  doc.roundedRect(marginX, currentY, contentWidth, 20, 2.5, 2.5, 'FD');

  // AI Icon badge
  doc.setFillColor(124, 58, 237); // Purple-600
  doc.roundedRect(marginX + 3, currentY + 3, 26, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('AI INSIGHT', marginX + 16, currentY + 6.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(91, 33, 182); // Violet-900
  doc.text(aiInsight.title, marginX + 32, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(76, 29, 149);
  doc.text(aiInsight.narrative, marginX + 4, currentY + 13, { maxWidth: contentWidth - 8 });

  currentY += 24;

  // -----------------------------------------------------------------
  // 3. FINANCIAL SUMMARY METRIC TILES
  // -----------------------------------------------------------------
  const tileWidth = (contentWidth - 6) / 3;

  // Tile 1: You Gave (Udhaar)
  doc.setFillColor(254, 242, 242); // Red-50
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(marginX, currentY, tileWidth, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(185, 28, 28);
  doc.text('YOU GAVE (UDHAAR DEBIT)', marginX + 4, currentY + 6);
  doc.setFontSize(11);
  doc.text(fmt(totalGaveUdhaar), marginX + 4, currentY + 14);

  // Tile 2: You Got (Jama)
  const tile2X = marginX + tileWidth + 3;
  doc.setFillColor(240, 253, 244); // Green-50
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(tile2X, currentY, tileWidth, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(21, 128, 61);
  doc.text('YOU GOT (JAMA CREDIT)', tile2X + 4, currentY + 6);
  doc.setFontSize(11);
  doc.text(fmt(totalGotJama), tile2X + 4, currentY + 14);

  // Tile 3: Net Balance
  const tile3X = marginX + (tileWidth + 3) * 2;
  const isNetPositive = netBalance > 0;
  doc.setFillColor(isNetPositive ? 255 : 248, isNetPositive ? 247 : 250, isNetPositive ? 237 : 252);
  doc.setDrawColor(isNetPositive ? 254 : 226, isNetPositive ? 215 : 232, isNetPositive ? 170 : 240);
  doc.roundedRect(tile3X, currentY, tileWidth, 18, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(isNetPositive ? 194 : 15, isNetPositive ? 65 : 23, isNetPositive ? 12 : 42);
  doc.text(isNetPositive ? 'NET DUE FROM PARTY' : 'NET ADVANCE / SETTLED', tile3X + 4, currentY + 6);
  doc.setFontSize(11);
  doc.text(fmt(netBalance), tile3X + 4, currentY + 14);

  currentY += 23;

  // -----------------------------------------------------------------
  // 4. TRANSACTION TABLE
  // -----------------------------------------------------------------
  const colX = {
    date: marginX,
    party: marginX + 28,
    details: marginX + 70,
    gave: marginX + 118,
    got: marginX + 148,
    balance: marginX + 178, // right aligned
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(marginX, y, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    doc.text('DATE', colX.date + 2, y + 5.5);
    doc.text(customer ? 'INVOICE / REF' : 'CUSTOMER & REF', colX.party + 2, y + 5.5);
    doc.text('NOTE / DETAILS', colX.details + 2, y + 5.5);
    doc.text('YOU GAVE (Dr)', colX.gave + 20, y + 5.5, { align: 'right' });
    doc.text('YOU GOT (Cr)', colX.got + 20, y + 5.5, { align: 'right' });
    doc.text('BALANCE', marginX + contentWidth - 2, y + 5.5, { align: 'right' });
  };

  drawTableHeader(currentY);
  currentY += 8;

  let pageNum = 1;

  if (entries.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No ledger transactions recorded in this period.', pageWidth / 2, currentY + 14, { align: 'center' });
    currentY += 25;
  } else {
    entries.forEach((entry, idx) => {
      // Check for page overflow
      if (currentY > pageHeight - 32) {
        drawFooter(pageNum, pageNum); // temporary
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        drawTableHeader(currentY);
        currentY += 8;
      }

      // Alternate row background
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(marginX, currentY, contentWidth, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, currentY + 7.5, marginX + contentWidth, currentY + 7.5);

      // Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(fmtDate(entry.entryDate), colX.date + 2, currentY + 5);

      // Customer / Ref
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const partyText = customer
        ? (entry.invoiceNo || 'Entry')
        : (entry.customerName ? `${entry.customerName.slice(0, 18)}` : (entry.invoiceNo || 'Direct'));
      doc.text(partyText, colX.party + 2, currentY + 5);

      // Details / Notes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const note = (entry.description || 'Khata Record').slice(0, 28);
      doc.text(note, colX.details + 2, currentY + 5);

      // You Gave (Debit - Red)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (entry.entryType === 'debit') {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(fmt(entry.amount), colX.gave + 20, currentY + 5, { align: 'right' });
      } else {
        doc.setTextColor(203, 213, 225);
        doc.text('-', colX.gave + 15, currentY + 5);
      }

      // You Got (Credit - Green)
      if (entry.entryType === 'credit') {
        doc.setTextColor(22, 163, 74); // Green
        doc.text(fmt(entry.amount), colX.got + 20, currentY + 5, { align: 'right' });
      } else {
        doc.setTextColor(203, 213, 225);
        doc.text('-', colX.got + 15, currentY + 5);
      }

      // Running Balance
      doc.setTextColor(15, 23, 42);
      doc.text(fmt(entry.balanceAfter), marginX + contentWidth - 2, currentY + 5, { align: 'right' });

      currentY += 7.5;
    });
  }

  // -----------------------------------------------------------------
  // 5. SIGNATURE & STAMP BLOCK (Check if space exists on page)
  // -----------------------------------------------------------------
  if (currentY > pageHeight - 45) {
    drawFooter(pageNum, pageNum);
    doc.addPage();
    pageNum++;
    drawHeader(pageNum);
  }

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 6;

  // Stamp / Signature Boxes
  const boxWidth = 55;
  const leftBoxX = marginX + 10;
  const rightBoxX = marginX + contentWidth - boxWidth - 10;

  // Left Box: Customer Acknowledgement
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(leftBoxX, currentY, boxWidth, 20, 2, 2, 'D');
  doc.setLineDashPattern([], 0); // reset
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Signature / Seal', leftBoxX + boxWidth / 2, currentY + 16, { align: 'center' });

  // Right Box: Shop Signature
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(rightBoxX, currentY, boxWidth, 20, 2, 2, 'D');
  doc.setLineDashPattern([], 0);
  doc.text(`Authorized Signatory for:`, rightBoxX + boxWidth / 2, currentY + 13, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((shop.name || 'Store Owner').slice(0, 24), rightBoxX + boxWidth / 2, currentY + 17, { align: 'center' });

  // Draw footers on all pages
  const totalPagesCount = doc.getNumberOfPages();
  for (let p = 1; p <= totalPagesCount; p++) {
    doc.setPage(p);
    drawFooter(p, totalPagesCount);
  }

  return doc;
};
