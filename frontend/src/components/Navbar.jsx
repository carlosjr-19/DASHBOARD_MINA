import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Menu
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ 
  currentTab, 
  user, 
  onLogout,
  sidebarOpen,
  onToggleSidebar,
  onOpenNuevoPedido,
  onOpenNuevoIngreso,
  onOpenNuevoEgreso
}) {
  const tabLabels = {
    pendientes: 'Pendientes',
    pedidos: 'Pedidos',
    cotizaciones: 'Cotizaciones',
    productos: 'Catálogo',
    inventario: 'Inventario',
    finanzas: 'Cuentas',
    calculadora: 'Calculadora',
    clientes: 'Clientes'
  };

  const currentTabLabel = tabLabels[currentTab] || 'Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 no-print h-[62px] flex items-center shadow-sm">
      <div className="w-full px-4 sm:px-8 flex items-center justify-between gap-3">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {/* Toggle button */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
              sidebarOpen
                ? 'bg-purple-50 text-[#3511A3] border border-purple-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
            }`}
            title={sidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
            aria-label="Abrir o cerrar menú lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current section indicator (Jobie pill style) */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-gray-900 tracking-tight">
              {currentTabLabel}
            </span>
            <span className="hidden sm:inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#3511A3] border border-purple-100">
              MINA ERP
            </span>
          </div>
        </div>

        {/* Right Side: Action Buttons (All Rounded Pills) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenNuevoPedido}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#3511A3] hover:bg-[#2B0E85] text-white text-xs font-bold rounded-full shadow-md shadow-indigo-900/15 active:scale-95 transition-all"
            title="Crear nuevo pedido"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Pedido</span>
          </button>

          <button
            onClick={onOpenNuevoIngreso}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#00C988] hover:bg-[#00B377] text-white text-xs font-bold rounded-full shadow-md shadow-emerald-900/15 active:scale-95 transition-all"
            title="Registrar Ingreso"
          >
            <ArrowDownLeft className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="hidden sm:inline">Ingreso</span>
          </button>

          <button
            onClick={onOpenNuevoEgreso}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#FF4D6D] hover:bg-[#E63956] text-white text-xs font-bold rounded-full shadow-md shadow-rose-900/15 active:scale-95 transition-all"
            title="Registrar Egreso"
          >
            <ArrowUpRight className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="hidden sm:inline">Egreso</span>
          </button>

          <ThemeToggle />

          {/* User Profile avatar pill */}
          <div className="relative flex items-center pl-1">
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-extrabold text-[#3511A3] shadow-sm transition-colors"
              title={`Usuario: ${user?.nombre || 'Admin'} - Clic para cerrar sesión`}
            >
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'M'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
