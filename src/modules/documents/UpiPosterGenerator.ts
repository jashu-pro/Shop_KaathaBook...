// src/modules/documents/UpiPosterGenerator.ts
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface UpiPosterParams {
  shopName: string;
  upiId: string;
  merchantName: string;
  fixedAmount?: number;
  customerPhone?: string;
}

export const generateUpiPoster = async (params: UpiPosterParams): Promise<Blob> => {
  // A4 dimensions: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Construct Standard NPCI UPI URI Scheme
  let upiString = `upi://pay?pa=${encodeURIComponent(params.upiId)}&pn=${encodeURIComponent(params.shopName)}&cu=INR`;
  if (params.fixedAmount && params.fixedAmount > 0) {
    upiString += `&am=${params.fixedAmount.toFixed(2)}`;
  }

  const qrDataUrl = await QRCode.toDataURL(upiString, {
    width: 600,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  // Background Header Branding
  doc.setFillColor(15, 23, 42); // Tailwind Slate-900
  doc.rect(0, 0, 210, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(params.shopName.toUpperCase(), 105, 30, { align: 'center' });

  // Scan & Pay Card
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text('Scan with Any UPI App to Pay', 105, 75, { align: 'center' });

  // Embed QR
  doc.addImage(qrDataUrl, 'PNG', 45, 90, 120, 120);

  // Merchant Meta Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`UPI ID: ${params.upiId}`, 105, 225, { align: 'center' });
  doc.text(`Beneficiary: ${params.merchantName}`, 105, 235, { align: 'center' });

  // Supported Gateways Footer Badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(25, 255, 160, 20, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('GPay  •  PhonePe  •  Paytm  •  BHIM  •  Any Banking UPI', 105, 267, { align: 'center' });

  return doc.output('blob');
};
