import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Store, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, ShieldCheck, Zap, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { publicApi } from '../services/index.js';

const BENEFITS = [
  { icon: Zap, text: 'Punto de venta rápido con nota en PDF y ticket térmico' },
  { icon: ShieldCheck, text: 'Control de inventario, caja diaria y reportes' },
  { icon: Store, text: 'Cotizaciones y catálogo con QR para tus clientes' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // En desarrollo se precargan las credenciales de prueba; en producción, vacías.
  const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@sistemnota.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'Admin123!' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Marca de la tienda (nombre + logo) desde el endpoint público
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    publicApi.branding().then((r) => setBranding(r.branding)).catch(() => {});
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;
  const from = location.state?.from?.pathname || '/';

  // Detecta si Bloq Mayús está activo (para avisar en el campo de contraseña)
  function checkCaps(e) {
    if (e.getModifierState) setCapsOn(e.getModifierState('CapsLock'));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate(from, { replace: true });
    } catch (err) {
      // Mensaje visible en la propia pantalla, además del toast
      setError(err.message || 'No se pudo iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  }

  const storeName = branding?.name || 'SistemaNota';

  return (
    <div className="flex min-h-screen bg-white">
      {/* ─── Panel izquierdo (marca) ─── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        {/* Decoración */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-900/30 blur-2xl" />

        <div className="relative z-10 flex items-center gap-3">
          {branding?.logo ? (
            <img src={branding.logo} alt={storeName} className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
          ) : (
            <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur"><Store className="h-7 w-7" /></div>
          )}
          <span className="text-xl font-bold">{storeName}</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight">
            Gestiona tu negocio<br />de principio a fin.
          </h1>
          <p className="mt-3 max-w-md text-brand-100">
            Ventas, inventario, caja y reportes en un solo lugar.
          </p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white/15 p-1.5"><Icon className="h-4 w-4" /></div>
                <span className="text-sm text-brand-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-brand-200">
          © {2026} {storeName} · SistemaNota
        </div>
      </div>

      {/* ─── Panel derecho (formulario) ─── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Marca compacta (solo en móvil) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            {branding?.logo ? (
              <img src={branding.logo} alt={storeName} className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              <div className="rounded-xl bg-brand-600 p-3 text-white"><Store className="h-7 w-7" /></div>
            )}
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{storeName}</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Error inline */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Correo electrónico</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={checkCaps}
                  onKeyDown={checkCaps}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Aviso de Bloq Mayús */}
              {capsOn && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" /> Bloq Mayús está activado
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Iniciar sesión <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Enlace al catálogo público */}
          <div className="mt-4 text-center">
            <Link to="/catalog" className="text-sm font-medium text-brand-600 hover:underline">
              Ver catálogo de productos
            </Link>
          </div>

          {/* Credenciales de prueba: solo en desarrollo */}
          {import.meta.env.DEV && (
            <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">Credenciales de prueba (solo dev):</p>
              <p>Admin: admin@sistemnota.com / Admin123!</p>
              <p>Vendedor: vendedor@sistemnota.com / Vendedor123!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
