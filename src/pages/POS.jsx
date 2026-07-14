import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UserPlus,
  X,
  CreditCard,
  Package,
  Wallet,
  LockOpen,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SaleNoteModal from '../components/sale/SaleNoteModal.jsx';
import { productApi, customerApi, saleApi, cashApi, settingsApi } from '../services/index.js';
import { useCartStore } from '../store/cartStore.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatMoney, PAYMENT_LABELS } from '../utils/format.js';
import { productImageUrl } from '../utils/images.js';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [store, setStore] = useState({});

  // Control de caja: si la tienda exige caja abierta, no se puede cobrar sin ella
  const [cashOpen, setCashOpen] = useState(false);
  const [requireCash, setRequireCash] = useState(true);

  const cart = useCartStore();

  const refreshCash = useCallback(() => {
    Promise.all([cashApi.current(), settingsApi.get()])
      .then(([cur, s]) => {
        setCashOpen(!!cur.current);
        setRequireCash(s.settings?.requireCashRegister ?? true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { refreshCash(); }, [refreshCash]);

  const blockedByCash = requireCash && !cashOpen;

  const loadProducts = useCallback(() => {
    setLoading(true);
    productApi
      .list({ search: debouncedSearch, pageSize: 24 })
      .then((r) => setProducts(r.items))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Buscar clientes al escribir
  useEffect(() => {
    if (customerSearch.trim().length < 2) { setCustomerResults([]); return; }
    customerApi.list({ search: customerSearch, pageSize: 6 }).then((r) => setCustomerResults(r.items));
  }, [customerSearch]);

  async function confirmSale() {
    if (confirming) return; // evita doble envío
    // Construye los ítems válidos (con id y cantidad > 0) y bloquea si no hay ninguno
    const items = cart.items
      .filter((i) => i.id && i.quantity > 0)
      .map((i) => ({ productId: i.id, quantity: i.quantity }));
    if (items.length === 0) return toast.error('Agrega al menos un producto al carrito');
    if (blockedByCash) return toast.error('Debes abrir la caja antes de vender');
    setConfirming(true);
    try {
      const payload = {
        customerId: cart.customer?.id || null,
        paymentMethod: cart.paymentMethod,
        discount: Number(cart.discount) || 0,
        items,
      };
      const res = await saleApi.create(payload);
      setStore(res.store || {});
      setCompletedSale(res.sale);
      toast.success('¡Venta registrada!');
      cart.clear();
      loadProducts(); // refrescar stock
    } catch (err) {
      // Muestra el motivo específico de validación, no solo "Datos inválidos"
      toast.error(err.details?.[0]?.message || err.message || 'No se pudo registrar la venta');
    } finally {
      setConfirming(false);
    }
  }

  const subtotal = cart.subtotal();
  const total = cart.total();

  return (
    <div>
      <PageHeader title="Punto de Venta" subtitle="Selecciona productos y genera la nota de venta" />

      {/* Aviso: se exige caja abierta para poder vender */}
      {blockedByCash && (
        <div className="mb-4 flex flex-col items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-amber-800">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">
              No hay una caja abierta. Debes abrir caja para poder registrar ventas.
            </span>
          </div>
          <Link to="/cash" className="btn-primary">
            <LockOpen className="h-4 w-4" /> Abrir caja
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Catálogo de productos ─── */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <Spinner className="py-16" label="Cargando productos..." />
          ) : products.length === 0 ? (
            <div className="card"><EmptyState message="Sin productos" icon={Package} /></div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => {
                const disabled = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => cart.addItem(p)}
                    disabled={disabled}
                    className="card flex flex-col p-3 text-left transition hover:border-brand-400 hover:shadow disabled:opacity-50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                      <span className={`badge ${p.stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {p.stock}
                      </span>
                    </div>
                    {productImageUrl(p) && (
                      <img src={productImageUrl(p)} alt={p.name} className="mb-2 h-20 w-full rounded-md object-cover" loading="lazy" />
                    )}
                    <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="mt-2 text-lg font-bold text-brand-600">{formatMoney(p.price)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Carrito ─── */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <ShoppingCart className="h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-800">Carrito</h3>
              <span className="badge ml-auto bg-brand-100 text-brand-700">{cart.count()} items</span>
            </div>

            {/* Selector de cliente */}
            <div className="border-b border-slate-200 px-4 py-3">
              {cart.customer ? (
                <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{cart.customer.fullName}</p>
                    <p className="text-xs text-slate-500">{cart.customer.documentId}</p>
                  </div>
                  <button className="btn-ghost p-1" onClick={() => cart.setCustomer(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserPlus className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className="input pl-9 text-sm"
                    placeholder="Buscar cliente (opcional)..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => setShowCustomerList(true)}
                  />
                  {showCustomerList && customerResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {customerResults.map((c) => (
                        <li key={c.id}>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                              cart.setCustomer(c);
                              setCustomerSearch('');
                              setShowCustomerList(false);
                            }}
                          >
                            <p className="font-medium text-slate-700">{c.fullName}</p>
                            <p className="text-xs text-slate-400">{c.documentId}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {cart.items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Agrega productos al carrito</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {cart.items.map((i) => (
                    <li key={i.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{i.name}</p>
                          <p className="text-xs text-slate-400">{formatMoney(i.price)} c/u</p>
                        </div>
                        <button className="btn-ghost p-1 text-red-500" onClick={() => cart.removeItem(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button className="btn-secondary p-1" onClick={() => cart.setQuantity(i.id, i.quantity - 1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            className="w-12 rounded border border-slate-300 py-1 text-center text-sm"
                            value={i.quantity}
                            onChange={(e) => cart.setQuantity(i.id, parseInt(e.target.value) || 1)}
                          />
                          <button
                            className="btn-secondary p-1"
                            onClick={() => cart.setQuantity(i.id, i.quantity + 1)}
                            disabled={i.quantity >= i.stock}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {formatMoney(i.price * i.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pago y total */}
            <div className="space-y-3 border-t border-slate-200 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Método de pago</label>
                  <select
                    className="input py-1.5 text-sm"
                    value={cart.paymentMethod}
                    onChange={(e) => cart.setPaymentMethod(e.target.value)}
                  >
                    {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Descuento</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input py-1.5 text-sm"
                    value={cart.discount}
                    onChange={(e) => cart.setDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento</span>
                    <span>- {formatMoney(Math.min(cart.discount, subtotal))}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={cart.clear} disabled={cart.items.length === 0}>
                  Limpiar
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={confirmSale}
                  disabled={confirming || cart.items.length === 0 || blockedByCash}
                  title={blockedByCash ? 'Abre la caja para poder cobrar' : undefined}
                >
                  <CreditCard className="h-4 w-4" />
                  {confirming ? 'Procesando...' : blockedByCash ? 'Caja cerrada' : 'Cobrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nota de venta generada */}
      <SaleNoteModal
        open={!!completedSale}
        onClose={() => setCompletedSale(null)}
        sale={completedSale}
        store={store}
      />
    </div>
  );
}
