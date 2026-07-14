import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet, LockOpen, Lock, Banknote, CreditCard, ArrowLeftRight, MoreHorizontal, History,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { cashApi } from '../services/index.js';
import { formatMoney, formatDateTime } from '../utils/format.js';

const METHOD_META = {
  CASH: { label: 'Efectivo', icon: Banknote },
  TRANSFER: { label: 'Transferencia', icon: ArrowLeftRight },
  CARD: { label: 'Tarjeta', icon: CreditCard },
  OTHER: { label: 'Otro', icon: MoreHorizontal },
};

export default function CashRegister() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openNote, setOpenNote] = useState('');

  const [closeModal, setCloseModal] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([cashApi.current(), cashApi.list({ pageSize: 10 })])
      .then(([cur, list]) => {
        setCurrent(cur.current);
        setHistory(list.items);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doOpen(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await cashApi.open({ openingAmount: Number(openingAmount) || 0, note: openNote });
      toast.success('Caja abierta');
      setOpenModal(false); setOpeningAmount(''); setOpenNote('');
      load();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function doClose(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await cashApi.close({ countedAmount: Number(countedAmount) || 0, note: closeNote });
      const diff = Number(r.cash.difference);
      toast.success(diff === 0 ? 'Caja cerrada y cuadrada ✔' : `Caja cerrada · diferencia ${formatMoney(diff)}`);
      setCloseModal(false); setCountedAmount(''); setCloseNote('');
      load();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  if (loading) return <Spinner className="py-20" label="Cargando caja..." />;

  const diffPreview = current ? (Number(countedAmount || 0) - current.expectedCash) : 0;

  return (
    <div>
      <PageHeader
        title="Caja"
        subtitle="Apertura, arqueo y cierre de caja por turno"
        actions={
          current ? (
            <button className="btn-danger" onClick={() => setCloseModal(true)}>
              <Lock className="h-4 w-4" /> Cerrar caja
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setOpenModal(true)}>
              <LockOpen className="h-4 w-4" /> Abrir caja
            </button>
          )
        }
      />

      {/* Estado de la caja */}
      {current ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Resumen efectivo */}
          <div className="card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2"><Wallet className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Caja abierta</p>
                <p className="text-xs text-slate-400">desde {formatDateTime(current.openedAt)}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Monto inicial</dt><dd className="font-medium">{formatMoney(current.openingAmount)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">+ Ventas en efectivo</dt><dd className="font-medium text-emerald-600">{formatMoney(current.breakdown.byMethod.CASH)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold text-slate-700">Efectivo esperado</dt>
                <dd className="font-bold text-brand-700">{formatMoney(current.expectedCash)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-400">Abierta por {current.openedBy?.name}</p>
          </div>

          {/* Ventas del turno por método */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="mb-4 font-semibold text-slate-800">
              Ventas del turno · {current.breakdown.salesCount} venta(s) · {formatMoney(current.breakdown.salesTotal)}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(METHOD_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <div key={key} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-slate-500">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{meta.label}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{formatMoney(current.breakdown.byMethod[key])}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Solo el efectivo cuenta para el arqueo. Tarjeta/transferencia no van en el cajón físico.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState message="No hay una caja abierta. Abre una para empezar el turno." icon={Wallet} />
        </div>
      )}

      {/* Historial */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <History className="h-5 w-5" />
          <h3 className="font-semibold">Historial de cajas</h3>
        </div>
        <div className="card overflow-hidden">
          {history.length === 0 ? (
            <EmptyState message="Sin sesiones de caja" icon={Wallet} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Apertura</th>
                    <th className="px-4 py-3">Cierre</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Inicial</th>
                    <th className="px-4 py-3 text-right">Esperado</th>
                    <th className="px-4 py-3 text-right">Contado</th>
                    <th className="px-4 py-3 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((c) => {
                    const diff = c.difference == null ? null : Number(c.difference);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(c.openedAt)}<br /><span className="text-xs text-slate-400">{c.openedBy?.name}</span></td>
                        <td className="px-4 py-3 text-slate-600">{c.closedAt ? formatDateTime(c.closedAt) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${c.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {c.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatMoney(c.openingAmount)}</td>
                        <td className="px-4 py-3 text-right">{c.expectedAmount == null ? '—' : formatMoney(c.expectedAmount)}</td>
                        <td className="px-4 py-3 text-right">{c.countedAmount == null ? '—' : formatMoney(c.countedAmount)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${diff == null ? 'text-slate-400' : diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {diff == null ? '—' : (diff > 0 ? '+' : '') + formatMoney(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal abrir caja */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir caja" size="sm">
        <form onSubmit={doOpen} className="space-y-4">
          <div>
            <label className="label">Monto inicial en caja *</label>
            <input type="number" min="0" step="0.01" className="input" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} required autoFocus placeholder="0.00" />
            <p className="mt-1 text-xs text-slate-400">Dinero con el que empiezas el turno (fondo de caja).</p>
          </div>
          <div>
            <label className="label">Nota (opcional)</label>
            <input className="input" value={openNote} onChange={(e) => setOpenNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpenModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Abriendo...' : 'Abrir caja'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal cerrar caja (arqueo) */}
      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Cerrar caja (arqueo)" size="sm">
        {current && (
          <form onSubmit={doClose} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Efectivo esperado</span><span className="font-bold text-brand-700">{formatMoney(current.expectedCash)}</span></div>
            </div>
            <div>
              <label className="label">Efectivo contado *</label>
              <input type="number" min="0" step="0.01" className="input" value={countedAmount} onChange={(e) => setCountedAmount(e.target.value)} required autoFocus placeholder="0.00" />
              <p className="mt-1 text-xs text-slate-400">Cuenta el dinero físico del cajón e ingrésalo aquí.</p>
            </div>
            {countedAmount !== '' && (
              <div className={`rounded-lg p-3 text-sm font-semibold ${diffPreview === 0 ? 'bg-emerald-50 text-emerald-700' : diffPreview > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                Diferencia: {(diffPreview > 0 ? '+' : '') + formatMoney(diffPreview)}
                {diffPreview === 0 ? ' · caja cuadrada' : diffPreview > 0 ? ' · sobrante' : ' · faltante'}
              </div>
            )}
            <div>
              <label className="label">Nota de cierre (opcional)</label>
              <input className="input" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCloseModal(false)}>Cancelar</button>
              <button type="submit" className="btn-danger" disabled={busy}>{busy ? 'Cerrando...' : 'Cerrar caja'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
