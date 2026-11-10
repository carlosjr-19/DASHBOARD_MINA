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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm no-print h-16 flex items-center">
      <div className="w-full px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {/* Toggle button */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-full transition-all flex items-center justify-center active:scale-95 border shadow-sm ${
              sidebarOpen
                ? 'bg-blue-50 text-[#173865] border-blue-100 hover:bg-blue-100'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
            title={sidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
            aria-label="Abrir o cerrar menú lateral"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Brand (mobile / compact) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#173865] flex items-center justify-center font-bold text-white shadow-sm text-sm">
              M
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-gray-900 dark:text-gray-100">MINA</span>
              <span className="text-[10px] font-semibold text-[#173865] dark:text-blue-400 block -mt-1 uppercase">DESIGN</span>
            </div>
          </div>

          {/* Current section indicator */}
          <div className="hidden md:flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
              {currentTabLabel}
            </h2>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={onOpenNuevoPedido}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-blue-50 text-[#173865] hover:bg-blue-100 border border-blue-100 text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all"
            title="Crear nuevo pedido"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Pedido</span>
          </button>

          <button
            onClick={onOpenNuevoIngreso}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all"
            title="Registrar Ingreso"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ingreso</span>
          </button>

          <button
            onClick={onOpenNuevoEgreso}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs font-bold rounded-full shadow-sm active:scale-95 transition-all"
            title="Registrar Egreso"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Egreso</span>
          </button>

          <ThemeToggle />

          {/* User Profile avatar pill */}
          <div className="relative flex items-center pl-1">
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-[#173865] text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white hover:scale-105 transition-transform cursor-pointer"
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
