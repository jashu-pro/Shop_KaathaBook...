// src/modules/documents/AiReportPdfGenerator.ts
import jsPDF from 'jspdf';

export interface ReportPdfParams {
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
  };
  periodLabel: string;
  totalRevenue: number;
  totalCollections: number;
  totalUdhaarOutstanding: number;
  grossProfit: number;
  profitMarginPercent: number;
  sales: Array<{
    invoiceNo: string;
    saleDate: string;
    customerName?: string;
    totalAmount: number;
    amountPaid: number;
    paymentStatus: string;
  }>;
  debtors: Array<{
    name: string;
    phone?: string;
    village?: string;
    currentBalance: number;
    tag?: string;
  }>;
}

export const generateAiReportPdf = (params: ReportPdfParams): jsPDF => {
  const {
    shop,
    periodLabel,
    totalRevenue,
    totalCollections,
    totalUdhaarOutstanding,
    grossProfit,
    profitMarginPercent,
    sales,
    debtors,
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  const fmt = (num: number) => {
    return 'Rs. ' + Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const drawHeader = (_pageNumber?: number) => {
    // Header background
    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Accent line
    doc.setFillColor(5, 150, 105); // Emerald
    doc.rect(0, 40, pageWidth, 2, 'F');

    // Shop Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text((shop.name || 'SHOP KHATTABOOK').toUpperCase(), marginX, 15);

    // Subtitle / Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    const fullAddress = [
      shop.address,
      shop.landmark ? `Near ${shop.landmark}` : '',
      shop.city,
      shop.state,
      shop.pincode ? `PIN: ${shop.pincode}` : '',
    ].filter(Boolean).join(', ');
    if (fullAddress) {
      doc.text(fullAddress, marginX, 22, { maxWidth: 120 });
    }

    const metaLine = [
      shop.phone ? `Phone: ${shop.phone}` : '',
      shop.gstin ? `GSTIN: ${shop.gstin}` : '',
      shop.upiId ? `UPI: ${shop.upiId}` : '',
    ].filter(Boolean).join('   |   ');
    if (metaLine) {
      doc.text(metaLine, marginX, 30);
    }

    // Right Badge
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - marginX - 58, 8, 58, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(52, 211, 153);
    doc.text('BUSINESS AUDIT REPORT', pageWidth - marginX - 29, 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`Period: ${periodLabel}`, pageWidth - marginX - 29, 22, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - marginX - 29, 28, { align: 'center' });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Shop KhattaBook  •  AI Generated Financial Statement', marginX, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
  };

  drawHeader(1);

  let currentY = 48;

  // 1. AI Financial Executive Summary Box
  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2.5, 2.5, 'FD');

  doc.setFillColor(124, 58, 237);
  doc.roundedRect(marginX + 3, currentY + 3, 26, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('AI ANALYSIS', marginX + 16, currentY + 6.8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(91, 33, 182);
  doc.text(`Store Financial Health: ${profitMarginPercent >= 20 ? 'Strong Performance' : 'Stable Flow'}`, marginX + 32, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(76, 29, 149);
  const aiNarrative = `Total revenue of ${fmt(totalRevenue)} generated with ${fmt(grossProfit)} estimated gross margin (${profitMarginPercent}%). Cash collection of ${fmt(totalCollections)} recorded with ${fmt(totalUdhaarOutstanding)} active market credit remaining. ${debtors.length} active debtors in book.`;
  doc.text(aiNarrative, marginX + 4, currentY + 14, { maxWidth: contentWidth - 8 });

  currentY += 26;

  // 2. Metric KPI Cards (4 Cards)
  const cardWidth = (contentWidth - 9) / 4;

  const cards = [
    { title: 'TOTAL SALES (REVENUE)', val: fmt(totalRevenue), bg: [239, 246, 255], border: [191, 219, 254], color: [29, 78, 216] },
    { title: 'TOTAL COLLECTIONS', val: fmt(totalCollections), bg: [240, 253, 244], border: [187, 247, 208], color: [21, 128, 61] },
    { title: 'TOTAL OUTSTANDING (UDHAAR)', val: fmt(totalUdhaarOutstanding), bg: [254, 242, 242], border: [254, 202, 202], color: [185, 28, 28] },
    { title: 'ESTIMATED PROFIT', val: fmt(grossProfit), bg: [250, 245, 255], border: [233, 213, 255], color: [109, 40, 217] },
  ];

  cards.forEach((c, i) => {
    const cardX = marginX + i * (cardWidth + 3);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(cardX, currentY, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.title, cardX + 3, currentY + 5.5, { maxWidth: cardWidth - 6 });

    doc.setFontSize(9.5);
    doc.text(c.val, cardX + 3, currentY + 13.5);
  });

  currentY += 23;

  // 3. Top Debtors (Outstanding Customers)
  if (debtors.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Top Outstanding Debtors (Udhaar Balance)', marginX, currentY + 4);
    currentY += 7;

    // Mini Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('CUSTOMER NAME', marginX + 3, currentY + 4.8);
    doc.text('PHONE', marginX + 55, currentY + 4.8);
    doc.text('VILLAGE / AREA', marginX + 95, currentY + 4.8);
    doc.text('STATUS', marginX + 135, currentY + 4.8);
    doc.text('DUE AMOUNT (Rs)', marginX + contentWidth - 3, currentY + 4.8, { align: 'right' });
    currentY += 7;

    debtors.slice(0, 8).forEach((d, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(marginX, currentY, contentWidth, 6.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, currentY + 6.5, marginX + contentWidth, currentY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(d.name.slice(0, 24), marginX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(d.phone || '-', marginX + 55, currentY + 4.5);
      doc.text((d.village || '-').slice(0, 20), marginX + 95, currentY + 4.5);
      doc.text(d.tag || 'Regular', marginX + 135, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(fmt(d.currentBalance), marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });

      currentY += 6.5;
    });

    currentY += 6;
  }

  // 4. Sales Summary Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Recent Sales & Invoices in Selected Period', marginX, currentY + 4);
  currentY += 7;

  doc.setFillColor(15, 23, 42);
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE NO', marginX + 3, currentY + 4.8);
  doc.text('DATE', marginX + 45, currentY + 4.8);
  doc.text('CUSTOMER', marginX + 75, currentY + 4.8);
  doc.text('TOTAL BILL', marginX + 125, currentY + 4.8, { align: 'right' });
  doc.text('AMOUNT PAID', marginX + 155, currentY + 4.8, { align: 'right' });
  doc.text('DUE (Dr)', marginX + contentWidth - 3, currentY + 4.8, { align: 'right' });
  currentY += 7;

  let pageNum = 1;

  if (sales.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No sales recorded in this period.', pageWidth / 2, currentY + 8, { align: 'center' });
    currentY += 15;
  } else {
    sales.slice(0, 15).forEach((s, idx) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        pageNum++;
        drawHeader(pageNum);
        currentY = 48;
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(marginX, currentY, contentWidth, 6.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(s.invoiceNo, marginX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(new Date(s.saleDate).toLocaleDateString('en-IN'), marginX + 45, currentY + 4.5);
      doc.text((s.customerName || 'Walk-in').slice(0, 20), marginX + 75, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.text(fmt(s.totalAmount), marginX + 125, currentY + 4.5, { align: 'right' });

      doc.setTextColor(22, 163, 74);
      doc.text(fmt(s.amountPaid), marginX + 155, currentY + 4.5, { align: 'right' });

      const due = Math.max(0, s.totalAmount - s.amountPaid);
      doc.setTextColor(due > 0 ? 220 : 100, due > 0 ? 38 : 116, due > 0 ? 38 : 139);
      doc.text(due > 0 ? fmt(due) : 'CLEAR', marginX + contentWidth - 3, currentY + 4.5, { align: 'right' });

      currentY += 6.5;
    });
  }

  // Draw Footers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  return doc;
};
