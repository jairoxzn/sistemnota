import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <p className="text-slate-500">La página que buscas no existe.</p>
      <Link to="/" className="btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
