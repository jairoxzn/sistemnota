// Catálogo PÚBLICO — accesible sin login (se comparte con clientes por enlace/QR).
import { useEffect, useState } from 'react';
import {
  Search, Package, Phone, Mail, MapPin, Store, Clock, MessageCircle,
  Facebook, Instagram, Music2,
} from 'lucide-react';
import { publicApi } from '../services/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import ProductImage from '../components/ui/ProductImage.jsx';
import Spinner from '../components/ui/Spinner.jsx';

// Enlace de WhatsApp (wa.me) con mensaje opcional. Devuelve null si no hay número.
function waLink(number, text) {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

export default function PublicCatalog() {
  const [store, setStore] = useState({});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const debounced = useDebounce(search, 300);

  const currency = store.currency || 'S/';
  const money = (v) => `${currency} ${Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    setLoading(true);
    publicApi
      .catalog({ search: debounced || undefined, categoryId: categoryId || undefined })
      .then((r) => {
        setStore(r.store);
        setProducts(r.products);
        setCategories(r.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debounced, categoryId]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Encabezado del negocio */}
      <header className="bg-gradient-to-r from-brand-700 to-brand-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center gap-4">
            {store.logo ? (
              <img src={store.logo} alt="logo" className="h-16 w-16 rounded-xl bg-white object-contain p-1" />
            ) : (
              <div className="rounded-xl bg-white/15 p-3"><Store className="h-8 w-8" /></div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{store.name || 'Catálogo'}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-100">
                {store.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{store.phone}</span>}
                {store.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{store.email}</span>}
                {store.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{store.address}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input className="input pl-10" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-56" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <Spinner className="py-20" label="Cargando catálogo..." />
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Package className="mx-auto h-12 w-12" />
            <p className="mt-2">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <ProductImage
                  product={p}
                  className="h-40 w-full"
                  imgClass="h-full w-full object-contain p-2"
                  iconClass="h-12 w-12 text-slate-200"
                />
                <div className="p-3">
                  {p.category && <span className="text-xs text-brand-600">{p.category}</span>}
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800">{p.name}</p>
                  {p.description && <p className="line-clamp-2 mt-0.5 text-xs text-slate-400">{p.description}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-brand-600">{money(p.price)}</span>
                    <span className={`badge ${p.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.available ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Información de la tienda */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-2 font-semibold text-slate-800">{store.name || 'Nuestra tienda'}</h3>
            {store.address && (
              <p className="flex items-start gap-2 text-sm text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" /> {store.address}
              </p>
            )}
            {store.mapsUrl && (
              <a href={store.mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                <MapPin className="h-4 w-4" /> Ver en Google Maps
              </a>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-800">Contacto</h3>
            <ul className="space-y-1.5 text-sm text-slate-500">
              {store.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {store.phone}</li>}
              {store.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {store.email}</li>}
              {store.whatsapp && (
                <li>
                  <a href={waLink(store.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-emerald-600 hover:underline">
                    <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-800">Horario</h3>
            {store.hours ? (
              <p className="flex items-start gap-2 text-sm text-slate-500">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" /> {store.hours}
              </p>
            ) : (
              <p className="text-sm text-slate-400">—</p>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-800">Síguenos</h3>
            <div className="flex gap-3">
              {store.facebook && (
                <a href={store.facebook} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {store.instagram && (
                <a href={store.instagram} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {store.tiktok && (
                <a href={store.tiktok} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="TikTok">
                  <Music2 className="h-5 w-5" />
                </a>
              )}
              {!store.facebook && !store.instagram && !store.tiktok && (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-slate-400">Catálogo generado por SistemaNota</p>
      </section>

      {/* Botón flotante de WhatsApp (siempre visible) */}
      {store.whatsapp && (
        <a
          href={waLink(store.whatsapp, `¡Hola ${store.name || ''}! Vi su catálogo y quisiera hacer un pedido.`)}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-600"
          aria-label="Pedir por WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="hidden sm:inline">Pedir por WhatsApp</span>
        </a>
      )}
    </div>
  );
}
