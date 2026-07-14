import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, ReceiptText, FileDown, Ban } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Modal from '../components/ui/Modal.jsx';
import SaleNoteModal from '../components/sale/SaleNoteModal.jsx';
import { saleApi } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney, formatDateTime, paymentLabel, saleNumber } from '../utils/format.js';
import { exportToExcel } from '../utils/exportExcel.js';

export default function Sales() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [store, setStore] = useState({});

  // Anulación
  const [toCancel, setToCancel] = useState(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    saleApi
      .list({ from: from || undefined, to: to || undefined, page, pageSize: 12 })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [from, to, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [from, to]);

  async function openNote(id) {
    try {
      const res = await saleApi.get(id);
      setStore(res.store || {});
      setSelected(res.sale);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function onCancel() {
    if (reason.trim().length < 3) return toast.error('Indica el motivo de la anulación');
    setCancelling(true);
    try {
      await saleApi.cancel(toCancel.id, reason.trim());
      toast.success('Venta anulada y stock repuesto');
      setToCancel(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  function exportExcel() {
    if (data.items.length === 0) return toast.error('No hay ventas para exportar');
    const rows = data.items.map((s) => ({
      Nota: saleNumber(s.number),
      Fecha: formatDateTime(s.createdAt),
      Estado: s.status === 'CANCELLED' ? 'Anulada' : 'Activa',
      Cliente: s.customer?.fullName || 'Cliente Varios',
      'Método de pago': paymentLabel(s.paymentMethod),
      Vendedor: s.user?.name || '',
      Subtotal: Number(s.subtotal),
      Descuento: Number(s.discount),
      Total: Number(s.total),
    }));
    exportToExcel(rows, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`, 'Ventas');
  }

  return (
    <div>
      <PageHeader
        title="Historial de ventas"
        subtitle="Consulta, reimprime, descarga y anula notas de venta"
        actions={
          <button className="btn-secondary" onClick={exportExcel}>
            <FileDown className="h-4 w-4" /> Exportar Excel
          </button>
        }
      />

      {/* Filtros de fecha */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <button className="btn-ghost" onClick={() => { setFrom(''); setTo(''); }}>Limpiar filtros</button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando ventas..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay ventas registradas" icon={ReceiptText} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((s) => {
                  const cancelled = s.status === 'CANCELLED';
                  return (
                    <tr key={s.id} className={`hover:bg-slate-50 ${cancelled ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-brand-700">{saleNumber(s.number)}</span>
                        {cancelled && <span className="ml-2 badge bg-red-100 text-red-700">Anulada</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{s.customer?.fullName || 'Cliente Varios'}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-slate-100 text-slate-600">{paymentLabel(s.paymentMethod)}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${cancelled ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {formatMoney(s.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="btn-secondary py-1" onClick={() => openNote(s.id)}>
                            <Eye className="h-4 w-4" /> Ver
                          </button>
                          {isAdmin && !cancelled && (
                            <button className="btn-ghost py-1 text-red-600" onClick={() => { setToCancel(s); setReason(''); }} title="Anular venta">
                              <Ban className="h-4 w-4" /> Anular
                            </button>
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

      <SaleNoteModal open={!!selected} onClose={() => setSelected(null)} sale={selected} store={store} />

      {/* Modal de anulación */}
      <Modal open={!!toCancel} onClose={() => setToCancel(null)} title={`Anular ${toCancel ? saleNumber(toCancel.number) : ''}`} size="sm">
        <p className="text-sm text-slate-600">
          Se anulará la venta y se <b>repondrá el stock</b> de los productos. Esta acción queda registrada y no se puede deshacer.
        </p>
        <div className="mt-4">
          <label className="label">Motivo de la anulación *</label>
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Error en la venta, devolución del cliente..."
            autoFocus
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setToCancel(null)} disabled={cancelling}>Cancelar</button>
          <button className="btn-danger" onClick={onCancel} disabled={cancelling}>
            {cancelling ? 'Anulando...' : 'Anular venta'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
