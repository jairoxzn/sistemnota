import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, PackagePlus, ArrowDownUp, PackageMinus, Boxes } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { stockMovementApi, productApi } from '../services/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatDateTime } from '../utils/format.js';

// Etiquetas y estilos por tipo de movimiento
const TYPE_META = {
  ENTRY: { label: 'Entrada', badge: 'bg-emerald-100 text-emerald-700', icon: PackagePlus },
  ADJUSTMENT: { label: 'Ajuste', badge: 'bg-blue-100 text-blue-700', icon: ArrowDownUp },
  LOSS: { label: 'Merma', badge: 'bg-red-100 text-red-700', icon: PackageMinus },
  SALE: { label: 'Venta', badge: 'bg-slate-100 text-slate-600', icon: ArrowDownUp },
  SALE_CANCELLED: { label: 'Anulación', badge: 'bg-amber-100 text-amber-700', icon: ArrowDownUp },
};

const emptyForm = { productId: '', type: 'ENTRY', quantity: '', reason: '' };

export default function Inventory() {
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Buscador de producto para el formulario
  const [prodSearch, setProdSearch] = useState('');
  const [prodResults, setProdResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const debouncedProd = useDebounce(prodSearch, 300);

  const load = useCallback(() => {
    setLoading(true);
    stockMovementApi
      .list({ type: typeFilter || undefined, page, pageSize: 15 })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [typeFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [typeFilter]);

  useEffect(() => {
    if (debouncedProd.trim().length < 2) { setProdResults([]); return; }
    productApi.list({ search: debouncedProd, pageSize: 6 }).then((r) => setProdResults(r.items));
  }, [debouncedProd]);

  function openModal() {
    setForm(emptyForm);
    setSelectedProduct(null);
    setProdSearch('');
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!form.productId) return toast.error('Selecciona un producto');
    setSaving(true);
    try {
      await stockMovementApi.create({
        productId: form.productId,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason,
      });
      toast.success('Movimiento registrado');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  const quantityHint = {
    ENTRY: 'Unidades que ingresan al inventario',
    LOSS: 'Unidades que se descuentan por merma/pérdida',
    ADJUSTMENT: 'Usa negativo para restar (ej. -5) o positivo para sumar',
  }[form.type];

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Entradas de mercancía, ajustes, mermas e historial (kardex)"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <Plus className="h-4 w-4" /> Registrar movimiento
          </button>
        }
      />

      {/* Filtro por tipo */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {[['', 'Todos'], ['ENTRY', 'Entradas'], ['ADJUSTMENT', 'Ajustes'], ['LOSS', 'Mermas'], ['SALE', 'Ventas'], ['SALE_CANCELLED', 'Anulaciones']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              typeFilter === val ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando movimientos..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay movimientos de inventario" icon={Boxes} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-center">Cambio</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((m) => {
                  const meta = TYPE_META[m.type] || TYPE_META.ADJUSTMENT;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{m.product?.name}</p>
                        <p className="font-mono text-xs text-slate-400">{m.product?.code}</p>
                      </td>
                      <td className="px-4 py-3"><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                      <td className={`px-4 py-3 text-center font-semibold ${m.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.quantity >= 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {m.previousStock} → <b className="text-slate-700">{m.newStock}</b>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{m.reason || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{m.user?.name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </div>

      {/* Modal registrar movimiento */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar movimiento de inventario">
        <form onSubmit={onSave} className="space-y-4">
          {/* Producto */}
          <div>
            <label className="label">Producto *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-500">Stock actual: {selectedProduct.stock}</p>
                </div>
                <button type="button" className="btn-ghost text-sm" onClick={() => { setSelectedProduct(null); setForm({ ...form, productId: '' }); }}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className="input"
                  placeholder="Buscar producto por nombre o código..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                />
                {prodResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {prodResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => { setSelectedProduct(p); setForm({ ...form, productId: p.id }); setProdResults([]); }}
                        >
                          <span className="font-medium text-slate-700">{p.name}</span>
                          <span className="text-xs text-slate-400">stock {p.stock}</span>
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
              <label className="label">Tipo *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="ENTRY">Entrada / Compra</option>
                <option value="ADJUSTMENT">Ajuste (+/-)</option>
                <option value="LOSS">Merma / Pérdida</option>
              </select>
            </div>
            <div>
              <label className="label">Cantidad *</label>
              <input
                type="number"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-400">{quantityHint}</p>

          <div>
            <label className="label">Motivo / Observación</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej. Compra a proveedor, conteo físico, producto dañado..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
