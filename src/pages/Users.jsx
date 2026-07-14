import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, KeyRound, UserCog, ShieldCheck, User as UserIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { userApi } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatDate } from '../utils/format.js';

const emptyForm = { name: '', email: '', password: '', role: 'SELLER' };

export default function Users() {
  const { user: me } = useAuth();
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [pwUser, setPwUser] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    userApi
      .list({ search: debouncedSearch, page, pageSize: 10 })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(u) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await userApi.update(editing.id, { name: form.name, email: form.email, role: form.role });
        toast.success('Usuario actualizado');
      } else {
        await userApi.create(form);
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    try {
      await userApi.update(u.id, { active: !u.active });
      toast.success(u.active ? 'Usuario desactivado' : 'Usuario activado');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    if (newPw.length < 6) return toast.error('Mínimo 6 caracteres');
    setPwSaving(true);
    try {
      await userApi.resetPassword(pwUser.id, newPw);
      toast.success('Contraseña actualizada');
      setPwUser(null);
      setNewPw('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Administra el acceso de vendedores y administradores"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar por nombre o correo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando usuarios..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay usuarios" icon={UserCog} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.name}
                      {u.id === me.id && <span className="ml-2 badge bg-brand-100 text-brand-700">tú</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role === 'ADMIN' ? <ShieldCheck className="mr-1 h-3 w-3" /> : <UserIcon className="mr-1 h-3 w-3" />}
                        {u.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => openEdit(u)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="btn-ghost p-1.5" onClick={() => { setPwUser(u); setNewPw(''); }} title="Resetear contraseña">
                          <KeyRound className="h-4 w-4" />
                        </button>
                        {u.id !== me.id && (
                          <button
                            className={`btn-ghost p-1.5 ${u.active ? 'text-red-600' : 'text-emerald-600'}`}
                            onClick={() => toggleActive(u)}
                            title={u.active ? 'Desactivar' : 'Activar'}
                          >
                            {u.active ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
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

      {/* Crear / editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Correo electrónico *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          {!editing && (
            <div>
              <label className="label">Contraseña *</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              <p className="mt-1 text-xs text-slate-400">Mínimo 6 caracteres</p>
            </div>
          )}
          <div>
            <label className="label">Rol *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={editing?.id === me.id}>
              <option value="SELLER">Vendedor / Cajero</option>
              <option value="ADMIN">Administrador</option>
            </select>
            {editing?.id === me.id && <p className="mt-1 text-xs text-amber-600">No puedes cambiar tu propio rol.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Resetear contraseña */}
      <Modal open={!!pwUser} onClose={() => setPwUser(null)} title={`Nueva contraseña · ${pwUser?.name || ''}`} size="sm">
        <form onSubmit={onResetPassword} className="space-y-4">
          <div>
            <label className="label">Nueva contraseña *</label>
            <input type="text" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" autoFocus />
            <p className="mt-1 text-xs text-slate-400">Comparte la nueva contraseña con el usuario.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPwUser(null)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={pwSaving}>{pwSaving ? 'Guardando...' : 'Actualizar contraseña'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
