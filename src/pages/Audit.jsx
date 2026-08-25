import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { auditApi, userApi } from '../services/index.js';
import { formatDateTime, AUDIT_ACTION_LABELS } from '../utils/format.js';

const ACTIONS = Object.entries(AUDIT_ACTION_LABELS);

const ACTION_BADGE = {
  PRODUCT_PRICE_CHANGED: 'bg-blue-100 text-blue-700',
  SALE_CANCELLED: 'bg-amber-100 text-amber-700',
  STOCK_ADJUSTED: 'bg-violet-100 text-violet-700',
  USER_ROLE_CHANGED: 'bg-emerald-100 text-emerald-700',
  USER_STATUS_CHANGED: 'bg-slate-100 text-slate-600',
};

export default function Audit() {
  const [data, setData] = useState({ items: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userApi.list({ pageSize: 100 }).then((r) => setUsers(r.items)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    auditApi
      .list({
        action: actionFilter || undefined,
        userId: userFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        pageSize: 20,
      })
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [actionFilter, userFilter, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [actionFilter, userFilter, dateFrom, dateTo]);

  return (
    <div>
      <PageHeader title="Auditoría" subtitle="Cambios de precio, anulaciones, ajustes de stock y gestión de usuarios" />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="input w-auto py-1.5 text-sm" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">Todas las acciones</option>
          {ACTIONS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="input w-auto py-1.5 text-sm" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1.5">
          <input type="date" className="input py-1.5 text-sm" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" className="input py-1.5 text-sm" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner className="py-16" label="Cargando auditoría..." />
        ) : data.items.length === 0 ? (
          <EmptyState message="No hay registros de auditoría para este filtro" icon={ShieldCheck} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ACTION_BADGE[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {AUDIT_ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.summary}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{log.user?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
