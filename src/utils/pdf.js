// Generación de la nota de venta en PDF con jsPDF + autotable.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatDateTime, paymentLabel, saleNumber } from './format.js';

// Detecta el formato de imagen a partir del data URL (para jsPDF.addImage)
function imageFormat(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

/**
 * Construye el PDF de una nota de venta.
 * @param {object} sale  venta con { number, createdAt, customer, details, subtotal, discount, total, paymentMethod, user }
 * @param {object} store datos de la tienda { name, ruc, address, phone, email }
 * @returns {jsPDF}
 */
export function buildSalePdf(sale, store = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 48;
  let textX = marginX;

  // ─── Logo (si la tienda tiene uno configurado) ────────────────
  if (store.logo) {
    try {
      doc.addImage(store.logo, imageFormat(store.logo), marginX, 32, 56, 56);
      textX = marginX + 68; // desplaza el texto a la derecha del logo
    } catch {
      /* logo inválido: se ignora */
    }
  }

  // ─── Encabezado: datos de la tienda ───────────────────────────
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

  // ─── Recuadro de la nota de venta (derecha) ───────────────────
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.roundedRect(pageW - marginX - 180, 40, 180, 58, 6, 6);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NOTA DE VENTA', pageW - marginX - 90, 60, { align: 'center' });
  doc.setFontSize(14);
  doc.text(saleNumber(sale.number), pageW - marginX - 90, 80, { align: 'center' });

  doc.setTextColor(60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // ─── Datos del cliente y fecha ────────────────────────────────
  y = Math.max(y, 110) + 6;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageW - marginX, y);
  y += 18;

  const c = sale.customer;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(c?.fullName || 'Cliente Varios', marginX + 48, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', pageW - marginX - 180, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(sale.createdAt), pageW - marginX - 138, y);
  y += 14;

  if (c?.documentId) {
    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(c.documentId), marginX + 62, y);
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Atendido por:', pageW - marginX - 180, y);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.user?.name || '—', pageW - marginX - 108, y);
  y += 8;

  // ─── Tabla de productos ───────────────────────────────────────
  autoTable(doc, {
    startY: y + 6,
    head: [['#', 'Código', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: sale.details.map((d, i) => [
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

  // ─── Totales ──────────────────────────────────────────────────
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

  row('Subtotal:', formatMoney(sale.subtotal));
  if (Number(sale.discount) > 0) row('Descuento:', `- ${formatMoney(sale.discount)}`);
  doc.setDrawColor(37, 99, 235);
  doc.line(labelX, ty - 6, valueX, ty - 6);
  row('TOTAL:', formatMoney(sale.total), true);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Método de pago: ${paymentLabel(sale.paymentMethod)}`, marginX, ty - 4);

  // ─── Pie: mensaje de agradecimiento ───────────────────────────
  const footY = doc.internal.pageSize.getHeight() - 60;
  doc.setDrawColor(220);
  doc.line(marginX, footY - 16, pageW - marginX, footY - 16);
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text(store.thankYouMessage || '¡Gracias por su compra!', pageW / 2, footY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text('Documento generado por SistemaNota', pageW / 2, footY + 14, { align: 'center' });

  return doc;
}

// Descargar la nota como archivo PDF
export function downloadSalePdf(sale, store) {
  const doc = buildSalePdf(sale, store);
  doc.save(`${saleNumber(sale.number)}.pdf`);
}

// Abrir el diálogo de impresión con el PDF
export function printSalePdf(sale, store) {
  const doc = buildSalePdf(sale, store);
  doc.autoPrint();
  const url = doc.output('bloburl');
  window.open(url, '_blank');
}

/**
 * Ticket térmico 80mm (ancho de rollo estándar de impresoras POS).
 * El alto es dinámico según la cantidad de líneas. Fuente monoespaciada
 * y diseño compacto pensado para impresión térmica.
 */
export function buildTicket80(sale, store = {}) {
  const W = 80; // ancho en mm
  const M = 4; // margen lateral
  const lineH = 4; // alto de línea
  // Alto estimado: cabecera + items + totales + pie
  const height = 70 + sale.details.length * 7 + (store.logo ? 20 : 0);

  const doc = new jsPDF({ unit: 'mm', format: [W, height] });
  const center = W / 2;
  let y = 6;

  const text = (t, opts = {}) => {
    doc.text(String(t), opts.x ?? center, y, { align: opts.align || 'center', ...opts });
  };
  const line = () => {
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(M, y, W - M, y);
    doc.setLineDashPattern([], 0);
    y += 3;
  };

  // Logo
  if (store.logo) {
    try {
      doc.addImage(store.logo, imageFormat(store.logo), center - 8, y, 16, 16);
      y += 18;
    } catch { /* ignora logo inválido */ }
  }

  // Cabecera
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  text(store.name || 'Mi Tienda');
  y += lineH;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  if (store.ruc) { text(`RUC: ${store.ruc}`); y += 3; }
  if (store.address) { text(store.address); y += 3; }
  if (store.phone) { text(store.phone); y += 3; }
  y += 1;
  line();

  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  text(`NOTA DE VENTA ${saleNumber(sale.number)}`);
  y += lineH;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  text(formatDateTime(sale.createdAt));
  y += 3;
  doc.text(`Cliente: ${sale.customer?.fullName || 'Cliente Varios'}`, M, y);
  y += 3;
  if (sale.customer?.documentId) { doc.text(`Doc: ${sale.customer.documentId}`, M, y); y += 3; }
  line();

  // Detalle (nombre en una línea; cant x precio ... subtotal en la siguiente)
  doc.setFontSize(7);
  for (const d of sale.details) {
    doc.text(d.productName.slice(0, 40), M, y);
    y += 3;
    doc.text(`${d.quantity} x ${formatMoney(d.unitPrice)}`, M, y);
    doc.text(formatMoney(d.subtotal), W - M, y, { align: 'right' });
    y += 4;
  }
  line();

  // Totales
  const totalRow = (label, value, bold = false) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 9 : 7);
    doc.text(label, M, y);
    doc.text(value, W - M, y, { align: 'right' });
    y += bold ? 5 : 4;
  };
  totalRow('Subtotal:', formatMoney(sale.subtotal));
  if (Number(sale.discount) > 0) totalRow('Descuento:', `-${formatMoney(sale.discount)}`);
  totalRow('TOTAL:', formatMoney(sale.total), true);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(`Pago: ${paymentLabel(sale.paymentMethod)}`, M, y);
  y += 4;
  line();

  // Pie
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  text(store.thankYouMessage || '¡Gracias por su compra!');
  y += 4;

  return doc;
}

// Imprimir el ticket térmico
export function printTicket80(sale, store) {
  const doc = buildTicket80(sale, store);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

// Descargar el ticket térmico
export function downloadTicket80(sale, store) {
  const doc = buildTicket80(sale, store);
  doc.save(`ticket-${saleNumber(sale.number)}.pdf`);
}
