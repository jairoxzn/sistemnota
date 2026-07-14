import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Search, Trash2, FileText, Eye, ShoppingCart, Ban, Minus, X, UserPlus, Printer, Download,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import SaleNoteModal from '../components/sale/SaleNoteModal.jsx';
import { quoteApi, productApi, customerApi } from '../services/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatMoney, formatDateTime, formatDate, quoteNumber, QUOTE_STATUS, PAYMENT_LABELS } from '../utils/format.js';
import { downloadQuotePdf, printQuotePdf } from '../utils/quotePdf.js';

export default function Quotes() {
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Builder (nueva cotización)
  const [builderOpen, setBuilderOpen] = useState(false);
  const [lines, setLines] = useState([]); // { id, code, name, price, quantity }
  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [prodSearch, setProdSearch] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const debouncedProd = useDebounce(prodSearch, 300);
  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);
  const debouncedCust = useDebounce(custSearch, 300);

  // Ver cotización / convertir
  const [view, setView] = useState(null);
  const [store, setStore] = useState({});
  const [convertQuote, setConvertQuote] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [converting, setConverting] = useState(false);
  const [resultingSale, setResultingSale] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    quoteApi
      .list({ status: statusFilter || undefined, page, pageSize: 12 })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  useEffect(() => {
    if (debouncedProd.trim().length < 2) { setProdResults([]); return; }
    productApi.list({ search: debouncedProd, pageSize: 6 }).then((r) => setProdResults(r.items));
  }, [debouncedProd]);
  useEffect(() => {
    if (debouncedCust.trim().length < 2) { setCustResults([]); return; }
    customerApi.list({ search: debouncedCust, pageSize: 5 }).then((r) => setCustResults(r.items));
  }, [debouncedCust]);

  function resetBuilder() {
    setLines([]); setCustomer(null); setDiscount(0); setValidUntil(''); setNote('');
    setProdSearch(''); setProdResults([]); setCustSearch('');
  }
  function openBuilder() { resetBuilder(); setBuilderOpen(true); }

  function addLine(p) {
    setLines((ls) => {
      const ex = ls.find((l) => l.id === p.id);
      if (ex) return ls.map((l) => (l.id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { id: p.id, code: p.code, name: p.name, price: Number(p.price), quantity: 1 }];
    });
    setProdSearch(''); setProdResults([]);
  }
  const setQty = (id, q) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, q) } : l)));
  const removeLine = (id) => setLines((ls) => ls.filter((l) => l.id !== id));

  const subtotal = lines.reduce((a, l) => a + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - Math.min(Number(discount) || 0, subtotal));

  async function saveQuote() {
    if (lines.length === 0) return toast.error('Agrega al menos un producto');
    setSaving(true);
    try {
      await quoteApi.create({
        customerId: customer?.id || null,
        discount: Number(discount) || 0,
        note,
        validUntil: validUntil || null,
        items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
      });
      toast.success('Cotización creada');
      setBuilderOpen(false);
      load();
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openView(id) {
    try {
      const r = await quoteApi.get(id);
      setStore(r.store || {});
      setView(r.quote);
    } catch (e) { toast.error(e.message); }
  }

  async function doConvert() {
    setConverting(true);
    try {
      const r = await quoteApi.convert(convertQuote.id, payMethod);
      setStore(r.store || {});
      setResultingSale(r.sale);
      setConvertQuote(null);
      toast.success('Cotización convertida en venta');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConverting(false);
    }
  }

  async function cancelQuote(q) {
    try {
      await quoteApi.cancel(q.id);
      toast.success('Cotización anulada');
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      <PageHeader
        title="Cotizaciones / Proformas"
        subtitle="Genera presupuestos y conviértelos en venta con un clic"
        actions={
          <button className="btn-primary" onClick={openBuilder}>
            <Plus className="h-4 w-4" /> Nueva cotización
          </button>
        }
      />

      {/* Filtro por estado */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {[['', 'Todas'], ['PENDING', 'Pendientes'], ['CONVERTED', 'Convertidas'], ['CANCELLED', 'Anuladas']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${statusFilter === v ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando cotizaciones..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay cotizaciones" icon={FileText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Válida hasta</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((q) => {
                  const st = QUOTE_STATUS[q.status];
                  return (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-brand-700">{quoteNumber(q.number)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(q.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{q.customer?.fullName || 'Sin cliente'}</td>
                      <td className="px-4 py-3 text-slate-500">{q.validUntil ? formatDate(q.validUntil) : '—'}</td>
                      <td className="px-4 py-3"><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatMoney(q.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="btn-secondary py-1" onClick={() => openView(q.id)}><Eye className="h-4 w-4" /> Ver</button>
                          {q.status === 'PENDING' && (
                            <>
                              <button className="btn-primary py-1" onClick={() => { setConvertQuote(q); setPayMethod('CASH'); }}>
                                <ShoppingCart className="h-4 w-4" /> A venta
                              </button>
                              <button className="btn-ghost py-1 text-red-600" onClick={() => cancelQuote(q)} title="Anular">
                                <Ban className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </div>

      {/* ─── Builder de cotización ─── */}
      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)} title="Nueva cotización" size="xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Izquierda: buscar y agregar productos */}
          <div>
            <label className="label">Agregar productos</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input className="input pl-10" placeholder="Buscar por nombre o código..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
              {prodResults.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {prodResults.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => addLine(p)}>
                        <span className="font-medium text-slate-700">{p.name}</span>
                        <span className="text-xs text-slate-400">{formatMoney(p.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto">
              {lines.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Sin productos aún</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{l.name}</p>
                        <p className="text-xs text-slate-400">{formatMoney(l.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="btn-secondary p-1" onClick={() => setQty(l.id, l.quantity - 1)}><Minus className="h-3 w-3" /></button>
                        <input className="w-12 rounded border border-slate-300 py-1 text-center text-sm" value={l.quantity} onChange={(e) => setQty(l.id, parseInt(e.target.value) || 1)} />
                        <button className="btn-secondary p-1" onClick={() => setQty(l.id, l.quantity + 1)}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="w-20 text-right text-sm font-semibold text-slate-700">{formatMoney(l.price * l.quantity)}</span>
                      <button className="btn-ghost p-1 text-red-500" onClick={() => removeLine(l.id)}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Derecha: cliente, validez, descuento, total */}
          <div className="space-y-3">
            <div>
              <label className="label">Cliente (opcional)</label>
              {customer ? (
                <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-800">{customer.fullName}</span>
                  <button className="btn-ghost p-1" onClick={() => setCustomer(null)}><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="relative">
                  <UserPlus className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="input pl-9" placeholder="Buscar cliente..." value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
                  {custResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {custResults.map((c) => (
                        <li key={c.id}>
                          <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setCustomer(c); setCustSearch(''); setCustResults([]); }}>
                            {c.fullName} <span className="text-xs text-slate-400">· {c.documentId}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Válida hasta</label>
                <input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
              <div>
                <label className="label">Descuento</label>
                <input type="number" min="0" step="0.01" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Nota / observación</label>
              <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
              {Number(discount) > 0 && <div className="flex justify-between text-red-500"><span>Descuento</span><span>- {formatMoney(Math.min(discount, subtotal))}</span></div>}
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900"><span>Total</span><span>{formatMoney(total)}</span></div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setBuilderOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveQuote} disabled={saving}>{saving ? 'Guardando...' : 'Crear cotización'}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── Ver cotización (detalle + PDF) ─── */}
      <Modal open={!!view} onClose={() => setView(null)} title={view ? quoteNumber(view.number) : ''} size="lg">
        {view && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p><b>Cliente:</b> {view.customer?.fullName || 'Sin cliente'}</p>
                <p className="text-slate-500">{formatDateTime(view.createdAt)}{view.validUntil ? ` · válida hasta ${formatDate(view.validUntil)}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => printQuotePdf(view, store)}><Printer className="h-4 w-4" /> Imprimir</button>
                <button className="btn-primary" onClick={() => downloadQuotePdf(view, store)}><Download className="h-4 w-4" /> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr><th className="px-3 py-2">Producto</th><th className="px-3 py-2 text-center">Cant.</th><th className="px-3 py-2 text-right">P. Unit.</th><th className="px-3 py-2 text-right">Subtotal</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {view.details.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-2">{d.productName}</td>
                      <td className="px-3 py-2 text-center">{d.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(d.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right text-lg font-bold text-brand-700">Total: {formatMoney(view.total)}</div>
          </div>
        )}
      </Modal>

      {/* ─── Convertir a venta ─── */}
      <Modal open={!!convertQuote} onClose={() => setConvertQuote(null)} title="Convertir en venta" size="sm">
        <p className="text-sm text-slate-600">
          Se generará una venta con los precios de la cotización {convertQuote && <b>{quoteNumber(convertQuote.number)}</b>} y se
          <b> descontará el stock</b>. Se validará la disponibilidad al momento.
        </p>
        <div className="mt-4">
          <label className="label">Método de pago</label>
          <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConvertQuote(null)} disabled={converting}>Cancelar</button>
          <button className="btn-primary" onClick={doConvert} disabled={converting}>{converting ? 'Convirtiendo...' : 'Generar venta'}</button>
        </div>
      </Modal>

      {/* Nota de venta resultante de la conversión */}
      <SaleNoteModal open={!!resultingSale} onClose={() => setResultingSale(null)} sale={resultingSale} store={store} />
    </div>
  );
}
