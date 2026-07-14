import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, Users, AlertTriangle, PackagePlus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { reportApi } from '../services/index.js';
import { formatMoney } from '../utils/format.js';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportApi.summary(),
      reportApi.salesByPeriod('day'),
      reportApi.topProducts(5),
      reportApi.lowStock(),
    ])
      .then(([s, sales, top, low]) => {
        setSummary(s.summary);
        setSalesData(sales.data);
        setTopProducts(top.data);
        setLowStock(low.items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-20" label="Cargando dashboard..." />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general de tu negocio" />

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas de hoy"
          value={formatMoney(summary.today.total)}
          hint={`${summary.today.count} venta(s)`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Ventas del mes"
          value={formatMoney(summary.month.total)}
          hint={`${summary.month.count} venta(s)`}
          icon={ShoppingBag}
          color="brand"
        />
        <StatCard
          title="Productos activos"
          value={summary.totalProducts}
          hint={`${summary.lowStockCount} con stock bajo`}
          icon={Package}
          color="violet"
        />
        <StatCard title="Clientes" value={summary.totalCustomers} icon={Users} color="amber" />
      </div>

      {/* Alertas de stock bajo / productos por reabastecer */}
      {lowStock.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">
              {lowStock.length} producto(s) por reabastecer
            </span>
            <Link to="/inventory" className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline">
              <PackagePlus className="h-4 w-4" /> Registrar entrada
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 12).map((p) => (
              <span
                key={p.id}
                className={`badge ${p.outOfStock ? 'bg-red-100 text-red-700' : 'bg-white text-amber-700 ring-1 ring-amber-200'}`}
              >
                {p.name} · {p.outOfStock ? 'agotado' : `${p.stock} u.`}
              </span>
            ))}
            {lowStock.length > 12 && (
              <span className="badge bg-white text-slate-500 ring-1 ring-slate-200">+{lowStock.length - 12} más</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de ventas */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-800">Ventas de los últimos 14 días</h3>
          {salesData.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Aún no hay ventas registradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(l) => `Fecha: ${l}`} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos */}
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Productos más vendidos</h3>
          {topProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Sin datos.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.quantitySold} unidades</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{formatMoney(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
