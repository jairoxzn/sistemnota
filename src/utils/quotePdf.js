// Generación del PDF de la cotización / proforma (jsPDF + autotable).
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatDate, formatDateTime, quoteNumber } from './format.js';

function imageFormat(dataUrl) {
  if (!dataUrl) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  return 'PNG';
}

export function buildQuotePdf(quote, store = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 48;
  let textX = marginX;

  // Logo
  if (store.logo) {
    try {
      doc.addImage(store.logo, imageFormat(store.logo), marginX, 32, 56, 56);
      textX = marginX + 68;
    } catch { /* ignora logo inválido */ }
  }

  // Datos de la tienda
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(store.name || 'Mi Tienda', textX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  y += 16;
  if (store.ruc) { doc.text(`RUC: ${store.ruc}`, textX, y); y += 12; }
  if (store.address) { doc.text(store.address, textX, y); y += 12; }
  const contact = [store.phone, store.email].filter(Boolean).join('  ·  ');
  if (contact) { doc.text(contact, textX, y); y += 12; }

  // Recuadro COTIZACIÓN
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.roundedRect(pageW - marginX - 190, 40, 190, 58, 6, 6);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('COTIZACIÓN / PROFORMA', pageW - marginX - 95, 60, { align: 'center' });
  doc.setFontSize(14);
  doc.text(quoteNumber(quote.number), pageW - marginX - 95, 80, { align: 'center' });

  doc.setTextColor(60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Cliente / fecha / validez
  y = Math.max(y, 110) + 6;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageW - marginX, y);
  y += 18;

  const c = quote.customer;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c?.fullName || 'Sin cliente', marginX + 48, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', pageW - marginX - 190, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(quote.createdAt), pageW - marginX - 150, y);
  y += 14;

  if (c?.documentId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(c.documentId), marginX + 62, y);
  }
  if (quote.validUntil) {
    doc.setFont('helvetica', 'bold');
    doc.text('Válida hasta:', pageW - marginX - 190, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(quote.validUntil), pageW - marginX - 120, y);
  }
  y += 8;

  // Tabla de productos
  autoTable(doc, {
    startY: y + 6,
    head: [['#', 'Código', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: quote.details.map((d, i) => [
      i + 1,
      d.productCode,
      d.productName,
      d.quantity,
      formatMoney(d.unitPrice),
      formatMoney(d.subtotal),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: marginX, right: marginX },
  });

  // Totales
  let ty = doc.lastAutoTable.finalY + 16;
  const labelX = pageW - marginX - 180;
  const valueX = pageW - marginX;
  const row = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.text(label, labelX, ty);
    doc.text(value, valueX, ty, { align: 'right' });
    ty += bold ? 20 : 16;
  };
  row('Subtotal:', formatMoney(quote.subtotal));
  if (Number(quote.discount) > 0) row('Descuento:', `- ${formatMoney(quote.discount)}`);
  doc.setDrawColor(37, 99, 235);
  doc.line(labelX, ty - 6, valueX, ty - 6);
  row('TOTAL:', formatMoney(quote.total), true);

  if (quote.note) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Nota: ${quote.note}`, marginX, ty + 4);
  }

  // Pie
  const footY = doc.internal.pageSize.getHeight() - 60;
  doc.setDrawColor(220);
  doc.line(marginX, footY - 16, pageW - marginX, footY - 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Este documento es una cotización, no constituye comprobante de pago.',
    pageW / 2,
    footY,
    { align: 'center' }
  );

  return doc;
}

export function downloadQuotePdf(quote, store) {
  buildQuotePdf(quote, store).save(`${quoteNumber(quote.number)}.pdf`);
}

export function printQuotePdf(quote, store) {
  const doc = buildQuotePdf(quote, store);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
