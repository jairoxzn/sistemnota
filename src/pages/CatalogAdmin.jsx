// Página ADMIN: muestra el QR y el enlace del catálogo público para compartir.
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Download, Copy, ExternalLink, Share2, QrCode } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';

export default function CatalogAdmin() {
  const catalogUrl = `${window.location.origin}/catalog`;
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    // Genera el QR del enlace público como imagen (data URL)
    QRCode.toDataURL(catalogUrl, { width: 320, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => toast.error('No se pudo generar el QR'));
  }, [catalogUrl]);

  function downloadQr() {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'catalogo-qr.png';
    a.click();
  }

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl);
    toast.success('Enlace copiado');
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Catálogo de productos', url: catalogUrl });
      } catch { /* cancelado */ }
    } else {
      copyLink();
    }
  }

  return (
    <div>
      <PageHeader
        title="Catálogo QR"
        subtitle="Comparte tu catálogo con clientes mediante un enlace o código QR"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* QR */}
        <div className="card flex flex-col items-center p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-700">
            <QrCode className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold">Código QR del catálogo</h3>
          </div>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR del catálogo" className="h-64 w-64 rounded-lg border border-slate-200" />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-lg bg-slate-100" />
          )}
          <button className="btn-primary mt-4" onClick={downloadQr} disabled={!qrDataUrl}>
            <Download className="h-4 w-4" /> Descargar QR (PNG)
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Imprímelo en tu local o compártelo por WhatsApp/redes. Al escanearlo, tus clientes verán el catálogo.
          </p>
        </div>

        {/* Enlace y acciones */}
        <div className="card space-y-4 p-6">
          <div>
            <h3 className="font-semibold text-slate-700">Enlace público</h3>
            <p className="mt-1 text-sm text-slate-500">Cualquiera con este enlace puede ver el catálogo (sin necesidad de iniciar sesión).</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700">{catalogUrl}</span>
            <button className="btn-ghost p-1.5" onClick={copyLink} title="Copiar"><Copy className="h-4 w-4" /></button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={catalogUrl} target="_blank" rel="noreferrer" className="btn-secondary">
              <ExternalLink className="h-4 w-4" /> Abrir catálogo
            </a>
            <button className="btn-secondary" onClick={copyLink}><Copy className="h-4 w-4" /> Copiar enlace</button>
            <button className="btn-primary" onClick={share}><Share2 className="h-4 w-4" /> Compartir</button>
          </div>

          <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
            <p className="font-semibold">💡 Consejo</p>
            <p className="mt-1 text-brand-700">
              El catálogo muestra el nombre, imagen y precio de tus productos activos. Sube imágenes desde
              <b> Productos</b> y personaliza tu logo/datos en <b>Configuración</b> para que se vea profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
