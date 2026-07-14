import { useEffect, useState } from 'react';

// Retorna el valor "estabilizado" tras `delay` ms sin cambios.
// Útil para búsquedas sin disparar una petición por cada tecla.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
