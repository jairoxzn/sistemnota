import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { FileDown, FileText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { reportApi } from '../services/index.js';
import { formatMoney } from '../utils/format.js';
import { exportToExcel } from '../utils/exportExcel.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PERIODS = [
  { key: 'day', label: 'Por día' },
  { key: 'week', label: 'Por semana' },
  { key: 'month', label: 'Por mes' },
];

export default function Reports() {
  const [period, setPeriod] = useState('day');
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([reportApi.salesByPeriod(period), reportApi.topProducts(10), reportApi.stock()])
      .then(([sales, top, st]) => {
        setSalesData(sales.data);
        setTopProducts(top.data);
        setStock(st.data);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [period]);

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

  function exportTopPdf() {
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

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Análisis de ventas e inventario" />

      {/* Ventas por período */}
      <div className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">Ventas ({formatMoney(totalRevenue)})</h3>
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
