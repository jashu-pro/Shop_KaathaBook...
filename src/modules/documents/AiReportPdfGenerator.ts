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

type Rgb = [number, number, number];

interface Cell {
  text: string;
  bold?: boolean;
  color?: Rgb;
}

interface Column {
  label: string;
  width: number;
  align?: 'left' | 'right';
}

const NAVY: Rgb = [15, 23, 42];
const SLATE: Rgb = [71, 85, 105];
const MUTED: Rgb = [100, 116, 139];
const GREEN: Rgb = [22, 163, 74];
const RED: Rgb = [220, 38, 38];
const AMBER: Rgb = [217, 119, 6];

const MAX_DEBTOR_ROWS = 15;
const MAX_SALE_ROWS = 60;

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

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const headerHeight = 44;
  const contentTop = headerHeight + 9;
  const contentBottom = pageHeight - 20;
  const rowHeight = 7;

  // Helvetica has no ₹ glyph, so amounts are printed as "Rs."
  const fmt = (num: number) =>
    'Rs. ' + Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const setText = (font: 'normal' | 'bold' | 'italic', size: number, color: Rgb) => {
    doc.setFont('helvetica', font);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const clip = (text: string, maxWidth: number) => {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && doc.getTextWidth(out + '...') > maxWidth) out = out.slice(0, -1);
    return out + '...';
  };

  /* ── Header (repeated on every page) ─────────────────────────── */
  const drawHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setFillColor(5, 150, 105);
    doc.rect(0, headerHeight, pageWidth, 2, 'F');

    // The badge on the right starts at x = 138, so the name must stay left of it.
    const nameMaxWidth = 118;
    const name = (shop.name || 'SHOP KHATTABOOK').toUpperCase();

    setText('bold', 17, [255, 255, 255]);
    let size = 17;
    while (size > 11 && doc.getTextWidth(name) > nameMaxWidth) {
      size -= 0.5;
      doc.setFontSize(size);
    }

    let nameLines: string[] = [name];
    if (doc.getTextWidth(name) > nameMaxWidth) {
      doc.setFontSize(12);
      nameLines = (doc.splitTextToSize(name, nameMaxWidth) as string[]).slice(0, 2);
    }
    nameLines.forEach((line, i) => doc.text(line, marginX, 14 + i * 6));

    const fullAddress = [
      shop.address,
      shop.landmark ? `Near ${shop.landmark}` : '',
      shop.city,
      shop.state,
      shop.pincode ? `PIN ${shop.pincode}` : '',
    ].filter(Boolean).join(', ');
    const metaLine = [
      shop.phone ? `Phone: ${shop.phone}` : '',
      shop.gstin ? `GSTIN: ${shop.gstin}` : '',
    ].filter(Boolean).join('   |   ');

    setText('normal', 8.5, [203, 213, 225]);
    const infoLines: string[] = [];
    if (fullAddress) infoLines.push(...(doc.splitTextToSize(fullAddress, nameMaxWidth) as string[]).slice(0, 2));
    if (metaLine) infoLines.push(metaLine);
    const infoTop = nameLines.length === 1 ? 22 : 27;
    infoLines.forEach((line, i) => doc.text(line, marginX, infoTop + i * 4.6));

    // Right badge: report title, period, generated date
    const badgeW = 58;
    const badgeX = pageWidth - marginX - badgeW;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(badgeX, 8, badgeW, 28, 2, 2, 'F');
    const cx = badgeX + badgeW / 2;
    setText('bold', 10, [52, 211, 153]);
    doc.text('BUSINESS REPORT', cx, 16, { align: 'center' });
    setText('normal', 8, [226, 232, 240]);
    const periodLines = (doc.splitTextToSize(periodLabel, badgeW - 8) as string[]).slice(0, 2);
    periodLines.forEach((line, i) => doc.text(line, cx, 22.5 + i * 4, { align: 'center' }));
    setText('normal', 7.5, [148, 163, 184]);
    doc.text(`Generated ${new Date().toLocaleDateString('en-IN')}`, cx, 32, { align: 'center' });
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 9;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4.5, pageWidth - marginX, footerY - 4.5);
    setText('normal', 7.5, MUTED);
    doc.text(`${shop.name || 'Shop KhattaBook'}  •  Prepared with Shop KhattaBook`, marginX, footerY);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
  };

  /* ── Section heading with accent bar ─────────────────────────── */
  const drawSectionTitle = (title: string, y: number) => {
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX, y, 1.4, 5.5, 'F');
    setText('bold', 10.5, NAVY);
    doc.text(title, marginX + 4, y + 4.3);
  };

  /* ── Generic table with page breaks and a repeating header row ── */
  const drawTable = (
    title: string,
    columns: Column[],
    rows: Cell[][],
    headFill: Rgb,
    startY: number,
    emptyMessage: string,
    note?: string,
  ): number => {
    let y = startY;

    const drawHead = (heading: string) => {
      drawSectionTitle(heading, y);
      y += 8;
      doc.setFillColor(headFill[0], headFill[1], headFill[2]);
      doc.rect(marginX, y, contentWidth, rowHeight, 'F');
      setText('bold', 7.5, [255, 255, 255]);
      let x = marginX;
      columns.forEach((col) => {
        if (col.align === 'right') doc.text(col.label, x + col.width - 2.5, y + 4.7, { align: 'right' });
        else doc.text(col.label, x + 2.5, y + 4.7);
        x += col.width;
      });
      y += rowHeight;
    };

    // Keep a heading and at least two rows together
    if (y + 8 + rowHeight * 3 > contentBottom) {
      doc.addPage();
      drawHeader();
      y = contentTop;
    }
    drawHead(title);

    if (rows.length === 0) {
      setText('italic', 8.5, MUTED);
      doc.text(emptyMessage, marginX + 3, y + 6);
      return y + 14;
    }

    rows.forEach((row, idx) => {
      if (y + rowHeight > contentBottom) {
        doc.addPage();
        drawHeader();
        y = contentTop;
        drawHead(`${title} (continued)`);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);

      let x = marginX;
      row.forEach((cell, i) => {
        const col = columns[i];
        setText(cell.bold ? 'bold' : 'normal', 8, cell.color || SLATE);
        const text = clip(cell.text, col.width - 5);
        if (col.align === 'right') doc.text(text, x + col.width - 2.5, y + 4.8, { align: 'right' });
        else doc.text(text, x + 2.5, y + 4.8);
        x += col.width;
      });
      y += rowHeight;
    });

    if (note) {
      setText('italic', 7.5, MUTED);
      doc.text(note, marginX + 2.5, y + 4.5);
      y += 6;
    }
    return y + 8;
  };

  /* ── Page 1 ──────────────────────────────────────────────────── */
  drawHeader();
  let y = contentTop;

  // Plain-language summary
  const paidBills = sales.filter((s) => s.totalAmount - s.amountPaid <= 0).length;
  const billsWithDue = sales.length - paidBills;
  const debtorCount = debtors.length;
  const summary =
    sales.length === 0
      ? `No sales were recorded for this period. ${fmt(totalCollections)} was collected, and ${fmt(totalUdhaarOutstanding)} is still pending from ${debtorCount} customer${debtorCount === 1 ? '' : 's'}.`
      : `${sales.length} bill${sales.length === 1 ? '' : 's'} worth ${fmt(totalRevenue)} (${paidBills} fully paid, ${billsWithDue} with dues). ` +
        `${fmt(totalCollections)} was collected, and ${fmt(totalUdhaarOutstanding)} is still pending from ${debtorCount} customer${debtorCount === 1 ? '' : 's'}. ` +
        `Estimated profit is ${fmt(grossProfit)} (${profitMarginPercent}% margin).`;

  setText('normal', 8.5, [51, 65, 85]);
  const summaryLines = doc.splitTextToSize(summary, contentWidth - 10) as string[];
  const summaryBoxH = 13 + summaryLines.length * 4.4;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(marginX, y, contentWidth, summaryBoxH, 2.5, 2.5, 'FD');
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(marginX + 4, y + 4, 20, 5, 1, 1, 'F');
  setText('bold', 6.5, [255, 255, 255]);
  doc.text('SUMMARY', marginX + 14, y + 7.6, { align: 'center' });
  setText('normal', 8.5, [51, 65, 85]);
  summaryLines.forEach((line, i) => doc.text(line, marginX + 5, y + 14.5 + i * 4.4));
  y += summaryBoxH + 6;

  // KPI cards
  const gap = 3;
  const cardWidth = (contentWidth - gap * 3) / 4;
  const cards: Array<{ title: string; value: string; bg: Rgb; border: Rgb; color: Rgb }> = [
    { title: 'TOTAL SALES', value: fmt(totalRevenue), bg: [239, 246, 255], border: [191, 219, 254], color: [29, 78, 216] },
    { title: 'COLLECTED', value: fmt(totalCollections), bg: [240, 253, 244], border: [187, 247, 208], color: [21, 128, 61] },
    { title: 'PENDING (UDHAAR)', value: fmt(totalUdhaarOutstanding), bg: [254, 242, 242], border: [254, 202, 202], color: [185, 28, 28] },
    { title: 'EST. PROFIT', value: fmt(grossProfit), bg: [250, 245, 255], border: [233, 213, 255], color: [109, 40, 217] },
  ];

  cards.forEach((card, i) => {
    const x = marginX + i * (cardWidth + gap);
    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.roundedRect(x, y, cardWidth, 19, 2, 2, 'FD');

    setText('bold', 6.5, card.color);
    doc.text(card.title, x + 3, y + 6);

    let size = 11;
    setText('bold', size, card.color);
    while (size > 7 && doc.getTextWidth(card.value) > cardWidth - 6) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    doc.text(card.value, x + 3, y + 14.5);
  });
  y += 19 + 9;

  // Top debtors
  const topDebtors = [...debtors].sort((a, b) => b.currentBalance - a.currentBalance);
  y = drawTable(
    'Customers With Pending Balance',
    [
      { label: 'CUSTOMER', width: 52 },
      { label: 'PHONE', width: 34 },
      { label: 'VILLAGE / AREA', width: 40 },
      { label: 'TYPE', width: 24 },
      { label: 'DUE', width: 32, align: 'right' },
    ],
    topDebtors.slice(0, MAX_DEBTOR_ROWS).map((d) => [
      { text: d.name, bold: true, color: NAVY },
      { text: d.phone || '-' },
      { text: d.village || '-' },
      { text: d.tag || 'Regular' },
      { text: fmt(d.currentBalance), bold: true, color: RED },
    ]),
    [30, 41, 59],
    y,
    'No pending balances. All customers are clear.',
    topDebtors.length > MAX_DEBTOR_ROWS ? `Showing the top ${MAX_DEBTOR_ROWS} of ${topDebtors.length} customers by amount due.` : undefined,
  );

  // Sales
  drawTable(
    'Sales & Invoices',
    [
      { label: 'INVOICE', width: 38 },
      { label: 'DATE', width: 24 },
      { label: 'CUSTOMER', width: 46 },
      { label: 'BILL TOTAL', width: 24, align: 'right' },
      { label: 'PAID', width: 24, align: 'right' },
      { label: 'DUE', width: 26, align: 'right' },
    ],
    sales.slice(0, MAX_SALE_ROWS).map((s) => {
      const due = Math.max(0, s.totalAmount - s.amountPaid);
      return [
        { text: s.invoiceNo, bold: true, color: NAVY },
        { text: new Date(s.saleDate).toLocaleDateString('en-IN') },
        { text: s.customerName || 'Walk-in' },
        { text: fmt(s.totalAmount), bold: true, color: NAVY },
        { text: fmt(s.amountPaid), color: GREEN },
        due > 0
          ? { text: fmt(due), bold: true, color: s.amountPaid > 0 ? AMBER : RED }
          : { text: 'Paid', bold: true, color: GREEN },
      ];
    }),
    [15, 23, 42],
    y,
    'No sales recorded in this period.',
    sales.length > MAX_SALE_ROWS ? `Showing ${MAX_SALE_ROWS} of ${sales.length} bills. Use Export Excel for the full list.` : undefined,
  );

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(p, totalPages);
  }

  return doc;
};
