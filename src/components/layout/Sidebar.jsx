import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ReceiptText,
  FileText,
  BarChart3,
  Tags,
  Boxes,
  QrCode,
  Wallet,
  UserCog,
  Settings as SettingsIcon,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Enlaces de navegación. `admin: true` => solo visibles para administradores.
const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { to: '/cash', label: 'Caja', icon: Wallet },
  { to: '/sales', label: 'Historial de ventas', icon: ReceiptText },
  { to: '/quotes', label: 'Cotizaciones', icon: FileText },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/inventory', label: 'Inventario', icon: Boxes, admin: true },
  { to: '/categories', label: 'Categorías', icon: Tags, admin: true },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/reports', label: 'Reportes', icon: BarChart3, admin: true },
  { to: '/catalog-qr', label: 'Catálogo QR', icon: QrCode, admin: true },
  { to: '/users', label: 'Usuarios', icon: UserCog, admin: true },
  { to: '/settings', label: 'Configuración', icon: SettingsIcon, admin: true },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();
  const visible = links.filter((l) => !l.admin || isAdmin);

  return (
    <>
      {/* Fondo oscuro en móvil */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-200 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <div className="rounded-lg bg-brand-600 p-1.5">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SistemaNota</span>
        </div>

        <nav className="space-y-1 p-3">
          {visible.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
