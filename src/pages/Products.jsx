import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Package, Upload, ImageIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { productApi, categoryApi } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatMoney } from '../utils/format.js';
import ProductImage from '../components/ui/ProductImage.jsx';

const emptyForm = { code: '', name: '', description: '', price: '', stock: '', categoryId: '', image: null };

export default function Products() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    productApi
      .list({ search: debouncedSearch, categoryId, page, pageSize: 10 })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, categoryId, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoryApi.list().then((r) => setCategories(r.categories)); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryId]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  async function openEdit(p) {
    setEditing(p);
    // La lista no trae la imagen (para ser liviana); se carga el detalle completo.
    setForm({
      code: p.code,
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId || '',
      image: null,
    });
    setModalOpen(true);
    if (p.hasImage) {
      try {
        const { product } = await productApi.get(p.id);
        setForm((f) => ({ ...f, image: product.image || null }));
      } catch {
        /* si falla, se puede editar igual sin la imagen previa */
      }
    }
  }

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecciona una imagen');
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), image: form.image ?? '' };
      if (editing) {
        await productApi.update(editing.id, payload);
        toast.success('Producto actualizado');
      } else {
        await productApi.create(payload);
        toast.success('Producto creado');
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
      await productApi.remove(toDelete.id);
      toast.success('Producto eliminado');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const stockBadge = (stock) => {
    if (stock <= 0) return 'bg-red-100 text-red-700';
    if (stock <= 10) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Gestiona tu catálogo e inventario"
        actions={
          isAdmin && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          )
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-56" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando productos..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay productos" icon={Package} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <ProductImage
                        product={p}
                        className="h-10 w-10 rounded"
                        imgClass="h-full w-full object-cover"
                        iconClass="h-5 w-5 text-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatMoney(p.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${stockBadge(p.stock)}`}>{p.stock}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="btn-ghost p-1.5" onClick={() => openEdit(p)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5 text-red-600"
                            onClick={() => setToDelete(p)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </div>

      {/* Modal crear/editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Código *</label>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          {/* Imagen del producto */}
          <div>
            <label className="label">Imagen del producto</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {form.image ? (
                  <img src={form.image} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> Subir
                <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
              </label>
              {form.image && (
                <button type="button" className="btn-ghost text-red-600" onClick={() => setForm({ ...form, image: null })}>
                  Quitar
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Precio *</label>
              <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <label className="label">Stock *</label>
              <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
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
        message={`¿Eliminar el producto "${toDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
