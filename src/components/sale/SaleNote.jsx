import { formatMoney, formatDateTime, paymentLabel, saleNumber } from '../../utils/format.js';

// Vista previa visual de la nota de venta (se usa en pantalla y para imprimir).
// El id="print-area" permite que solo esto sea visible al imprimir (ver index.css).
export default function SaleNote({ sale, store = {} }) {
  if (!sale) return null;
  const c = sale.customer;

  return (
    <div id="print-area" className="relative mx-auto max-w-2xl bg-white p-8 text-slate-800">
      {/* Marca de agua si la venta está anulada */}
      {sale.status === 'CANCELLED' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-20deg] rounded-lg border-4 border-red-500 px-6 py-2 text-5xl font-extrabold uppercase text-red-500 opacity-30">
            Anulada
          </span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-brand-600 pb-4">
        <div className="flex items-start gap-3">
          {store.logo && (
            <img src={store.logo} alt="logo" className="h-16 w-16 rounded object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{store.name || 'Mi Tienda'}</h1>
            {store.ruc && <p className="text-sm text-slate-500">RUC: {store.ruc}</p>}
            {store.address && <p className="text-sm text-slate-500">{store.address}</p>}
            <p className="text-sm text-slate-500">
              {[store.phone, store.email].filter(Boolean).join('  ·  ')}
            </p>
          </div>
        </div>
        <div className="rounded-lg border-2 border-brand-600 px-4 py-2 text-center">
          <p className="text-xs font-bold uppercase text-brand-600">Nota de Venta</p>
          <p className="text-xl font-extrabold text-brand-700">{saleNumber(sale.number)}</p>
        </div>
      </div>

      {/* Cliente y fecha */}
      <div className="grid grid-cols-2 gap-4 py-4 text-sm">
        <div>
          <p>
            <span className="font-semibold">Cliente:</span> {c?.fullName || 'Cliente Varios'}
          </p>
          {c?.documentId && (
            <p>
              <span className="font-semibold">Documento:</span> {c.documentId}
            </p>
          )}
          {c?.phone && (
            <p>
              <span className="font-semibold">Teléfono:</span> {c.phone}
            </p>
          )}
        </div>
        <div className="text-right">
          <p>
            <span className="font-semibold">Fecha:</span> {formatDateTime(sale.createdAt)}
          </p>
          <p>
            <span className="font-semibold">Atendido por:</span> {sale.user?.name || '—'}
          </p>
          <p>
            <span className="font-semibold">Pago:</span> {paymentLabel(sale.paymentMethod)}
          </p>
        </div>
      </div>

      {/* Detalle */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-600 text-left text-white">
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Código</th>
            <th className="px-2 py-2">Producto</th>
            <th className="px-2 py-2 text-center">Cant.</th>
            <th className="px-2 py-2 text-right">P. Unit.</th>
            <th className="px-2 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {sale.details.map((d, i) => (
            <tr key={d.id || i} className="border-b border-slate-100">
              <td className="px-2 py-2">{i + 1}</td>
              <td className="px-2 py-2">{d.productCode}</td>
              <td className="px-2 py-2">{d.productName}</td>
              <td className="px-2 py-2 text-center">{d.quantity}</td>
              <td className="px-2 py-2 text-right">{formatMoney(d.unitPrice)}</td>
              <td className="px-2 py-2 text-right">{formatMoney(d.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(sale.subtotal)}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento</span>
              <span>- {formatMoney(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-brand-600 pt-1 text-lg font-extrabold text-brand-700">
            <span>TOTAL</span>
            <span>{formatMoney(sale.total)}</span>
          </div>
        </div>
      </div>

      {sale.note && <p className="mt-4 text-sm italic text-slate-500">Nota: {sale.note}</p>}

      {/* Pie */}
      <div className="mt-8 border-t border-slate-200 pt-4 text-center">
        <p className="font-bold text-brand-600">{store.thankYouMessage || '¡Gracias por su compra!'}</p>
        <p className="text-xs text-slate-400">Documento generado por SistemaNota</p>
      </div>
    </div>
  );
}
