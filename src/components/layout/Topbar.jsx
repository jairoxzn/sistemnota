import { Menu, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const roleLabel = { ADMIN: 'Administrador', SELLER: 'Vendedor' };

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button className="btn-ghost p-2 lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden text-sm text-slate-500 lg:block">
        Bienvenido de nuevo, <span className="font-semibold text-slate-700">{user?.name}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-8 w-8 text-slate-400" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-700">{user?.name}</p>
            <p className="text-xs text-slate-400">{roleLabel[user?.role]}</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={logout} title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
