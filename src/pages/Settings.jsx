import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Upload, Trash2, Store } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { settingsApi } from '../services/index.js';

const empty = {
  name: '', ruc: '', address: '', phone: '', email: '',
  currency: 'S/', thankYouMessage: '', lowStockThreshold: 10, requireCashRegister: true, logo: null,
};

// Máximo del logo antes de comprimir (para no exceder el límite del body)
const MAX_LOGO_BYTES = 400 * 1024; // 400 KB en base64 aprox.

export default function Settings() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then((r) => setForm({ ...empty, ...r.settings }))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecciona una imagen');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (dataUrl.length > MAX_LOGO_BYTES * 1.4) {
        toast.error('El logo es muy grande (máx. ~300 KB). Usa una imagen más pequeña.');
        return;
      }
      setForm((f) => ({ ...f, logo: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        requireCashRegister: !!form.requireCashRegister,
        logo: form.logo ?? '',
      };
      const r = await settingsApi.update(payload);
      setForm({ ...empty, ...r.settings });
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.details?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner className="py-20" label="Cargando configuración..." />;

  return (
    <div>
      <PageHeader title="Configuración de la tienda" subtitle="Estos datos aparecen en la nota de venta" />

      <form onSubmit={onSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Logo */}
        <div className="card h-fit p-5">
          <label className="label">Logo del negocio</label>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
              {form.logo ? (
                <img src={form.logo} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <Store className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="flex gap-2">
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> Subir
                <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
              </label>
              {form.logo && (
                <button type="button" className="btn-ghost text-red-600" onClick={() => setForm((f) => ({ ...f, logo: null }))}>
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              )}
            </div>
            <p className="text-center text-xs text-slate-400">PNG o JPG, recomendado cuadrado y &lt; 300 KB</p>
          </div>
        </div>

        {/* Datos */}
        <div className="card space-y-4 p-5 lg:col-span-2">
          <div>
            <label className="label">Nombre del negocio *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">RUC / Identificación fiscal</label>
              <input className="input" value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Correo electrónico</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Símbolo de moneda</label>
              <input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Umbral de stock bajo</label>
              <input type="number" min="0" className="input" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
              <p className="mt-1 text-xs text-slate-400">Alerta cuando el stock sea ≤ este valor</p>
            </div>
            <div>
              <label className="label">Mensaje de agradecimiento</label>
              <input className="input" value={form.thankYouMessage} onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })} placeholder="¡Gracias por su compra!" />
            </div>
          </div>

          {/* Exigir caja abierta para vender */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={!!form.requireCashRegister}
              onChange={(e) => setForm({ ...form, requireCashRegister: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">Exigir caja abierta para vender</span>
              <span className="block text-xs text-slate-400">
                Si está activo, no se puede registrar una venta ni convertir cotizaciones sin una caja abierta.
              </span>
            </span>
          </label>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
