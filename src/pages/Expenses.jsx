import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { expenseApi } from '../services/index.js';
import { formatMoney, formatDate, EXPENSE_CATEGORY_LABELS } from '../utils/format.js';

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { category: 'OTHER', description: '', amount: '', date: todayStr(), note: '' };

export default function Expenses() {
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    expenseApi
      .list({
        category: categoryFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        pageSize: 15,
      })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [categoryFilter, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [categoryFilter, dateFrom, dateTo]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(exp) {
    setEditing(exp);
    setForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      date: exp.date.slice(0, 10),
      note: exp.note || '',
    });
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) {
        await expenseApi.update(editing.id, payload);
        toast.success('Gasto actualizado');
      } else {
        await expenseApi.create(payload);
        toast.success('Gasto registrado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await expenseApi.remove(toDelete.id);
      toast.success('Gasto eliminado');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Egresos operativos: alquiler, servicios, sueldos y más"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Registrar gasto
          </button>
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setCategoryFilter('')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              categoryFilter === '' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                categoryFilter === key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <input type="date" className="input py-1.5 text-sm" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" className="input py-1.5 text-sm" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 card flex items-center justify-between p-4">
        <span className="text-sm text-slate-500">Total del filtro actual</span>
        <span className="text-xl font-bold text-red-600">{formatMoney(data.totalAmount)}</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando gastos..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay gastos registrados" icon={Receipt} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-slate-100 text-slate-600">{EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{exp.description}</p>
                      {exp.note && <p className="text-xs text-slate-400">{exp.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{formatMoney(exp.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{exp.user?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(exp)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="btn-ghost p-1.5 text-red-600" onClick={() => setToDelete(exp)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar gasto' : 'Registrar gasto'}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoría *</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" value={form.date} max={todayStr()} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="label">Descripción *</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej. Alquiler del local - agosto"
              required
            />
          </div>

          <div>
            <label className="label">Monto (S/) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Nota</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Observación opcional" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        loading={deleting}
        message={`¿Eliminar el gasto "${toDelete?.description}"?`}
      />
    </div>
  );
}
