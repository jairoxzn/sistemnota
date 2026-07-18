import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { productImageUrl } from '../../utils/images.js';

// Imagen de producto con fallback: si el producto no tiene imagen o la imagen
// falla al cargar (dato dañado, 404, etc.), muestra un ícono placeholder
// en lugar del ícono de "imagen rota" del navegador.
export default function ProductImage({ product, className = '', imgClass = '', iconClass = 'h-10 w-10 text-slate-200' }) {
  const url = productImageUrl(product);
  const [failed, setFailed] = useState(false);

  // Reinicia el estado de error si cambia el producto/imagen
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div className={`flex items-center justify-center overflow-hidden bg-slate-50 ${className}`}>
        <Package className={iconClass} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden bg-slate-50 ${className}`}>
      <img
        src={url}
        alt={product.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClass}
      />
    </div>
  );
}
