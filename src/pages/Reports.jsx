import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { FileDown, FileText, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { reportApi } from '../services/index.js';
import { formatMoney, PAYMENT_LABELS } from '../utils/format.js';
import { exportToExcel } from '../utils/exportExcel.js';

const PERIODS = [
  { key: 'day', label: 'Por día' },
  { key: 'week', label: 'Por semana' },
  { key: 'month', label: 'Por mes' },
  { key: 'custom', label: 'Personalizado' },
];

// Colores por método de pago (coherentes con los usados en Caja/POS).
const PAYMENT_COLORS = {
  CASH: '#16a34a',
  TRANSFER: '#0284c7',
  CARD: '#7c3aed',
  YAPE: '#9333ea',
  PLIN: '#0d9488',
  OTHER: '#64748b',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

export default function Reports() {
  const [period, setPeriod] = useState('day');
  const [dateFrom, setDateFrom] = useState(daysAgoStr(29));
  const [dateTo, setDateTo] = useState(todayStr());
  const [salesData, setSalesData] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (period === 'custom' && (!dateFrom || !dateTo)) return;
    const params = period === 'custom' ? { period, from: dateFrom, to: dateTo } : { period };
    setLoading(true);
    Promise.all([
      reportApi.salesByPeriod(params),
      reportApi.paymentMethods(params),
      reportApi.expenses(params),
      reportApi.topProducts(10),
      reportApi.stock(),
    ])
      .then(([sales, pm, exp, top, st]) => {
        setSalesData(sales.data);
        setPaymentBreakdown(pm.data);
        setExpensesTotal(exp.total);
        setTopProducts(top.data);
        setStock(st.data);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo]);

  function exportStockExcel() {
    exportToExcel(
      stock.map((s) => ({
        Código: s.code,
        Producto: s.name,
        Categoría: s.category,
        Stock: s.stock,
        Precio: s.price,
        'Valor inventario': s.value,
      })),
      'stock_actual.xlsx',
      'Stock'
    );
  }

  async function exportTopPdf() {
    // jsPDF se carga bajo demanda (import dinámico) para aligerar la carga inicial
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte: Productos más vendidos', 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [['#', 'Código', 'Producto', 'Cantidad', 'Ingresos']],
      body: topProducts.map((p, i) => [i + 1, p.code, p.name, p.quantitySold, formatMoney(p.revenue)]),
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save('productos_mas_vendidos.pdf');
  }

  if (loading) return <Spinner className="py-20" label="Cargando reportes..." />;

  const totalRevenue = salesData.reduce((a, s) => a + s.total, 0);
  const inventoryValue = stock.reduce((a, s) => a + s.value, 0);
  const netProfit = totalRevenue - expensesTotal;

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Análisis de ventas, gastos e inventario" />

      {/* Ingresos / Gastos / Utilidad neta del período seleccionado */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Ingresos" value={formatMoney(totalRevenue)} icon={TrendingUp} color="green" />
        <StatCard title="Gastos" value={formatMoney(expensesTotal)} icon={TrendingDown} color="red" />
        <StatCard
          title="Utilidad neta"
          value={formatMoney(netProfit)}
          hint={netProfit < 0 ? 'El período cerró en pérdida' : undefined}
          icon={Scale}
          color={netProfit >= 0 ? 'brand' : 'red'}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ventas por período */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-800">Ventas ({formatMoney(totalRevenue)})</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      period === p.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {period === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    className="input py-1.5 text-sm"
                    value={dateFrom}
                    max={dateTo || todayStr()}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="text-xs text-slate-400">a</span>
                  <input
                    type="date"
                    className="input py-1.5 text-sm"
                    value={dateTo}
                    min={dateFrom || undefined}
                    max={todayStr()}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          {salesData.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Sin datos en este período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por método de pago */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-slate-800">Métodos de pago</h3>
          {paymentBreakdown.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Sin datos en este período.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="total"
                    nameKey="method"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {paymentBreakdown.map((p) => (
                      <Cell key={p.method} fill={PAYMENT_COLORS[p.method] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      formatMoney(value),
                      PAYMENT_LABELS[item.payload.method] || item.payload.method,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5 text-sm">
                {paymentBreakdown.map((p) => (
                  <li key={p.method} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PAYMENT_COLORS[p.method] || '#94a3b8' }}
                      />
                      <span className="truncate">{PAYMENT_LABELS[p.method] || p.method}</span>
                    </span>
                    <span className="shrink-0 font-medium text-slate-700">
                      {formatMoney(p.total)} <span className="text-xs text-slate-400">({p.percent}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top productos */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Productos más vendidos</h3>
            <button className="btn-secondary py-1" onClick={exportTopPdf}>
              <FileText className="h-4 w-4" /> PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-center">Cant.</th>
                  <th className="py-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-center">{p.quantitySold}</td>
                    <td className="py-2 text-right font-medium">{formatMoney(p.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock actual */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Stock actual</h3>
              <p className="text-xs text-slate-400">Valor inventario: {formatMoney(inventoryValue)}</p>
            </div>
            <button className="btn-secondary py-1" onClick={exportStockExcel}>
              <FileDown className="h-4 w-4" /> Excel
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Producto</th>
                  <th className="py-2 text-center">Stock</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">
                      {s.name}
                      {s.stock <= 10 && <span className="ml-2 badge bg-amber-100 text-amber-700">bajo</span>}
                    </td>
                    <td className="py-2 text-center">{s.stock}</td>
                    <td className="py-2 text-right">{formatMoney(s.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
