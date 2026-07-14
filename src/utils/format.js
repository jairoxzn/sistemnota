// Helpers de formato reutilizables.
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'S/';

export function formatMoney(value) {
  const n = Number(value || 0);
  return `${CURRENCY} ${n.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const PAYMENT_LABELS = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

export function paymentLabel(method) {
  return PAYMENT_LABELS[method] || method;
}

// Número de nota formateado: NV-000001
export function saleNumber(n) {
  return `NV-${String(n).padStart(6, '0')}`;
}

// Número de cotización formateado: COT-000001
export function quoteNumber(n) {
  return `COT-${String(n).padStart(6, '0')}`;
}

export const QUOTE_STATUS = {
  PENDING: { label: 'Pendiente', badge: 'bg-blue-100 text-blue-700' },
  CONVERTED: { label: 'Convertida', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Anulada', badge: 'bg-red-100 text-red-700' },
};
