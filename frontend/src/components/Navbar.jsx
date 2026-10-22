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
    <header className="sticky top-0 z-40 bg-th-18191b/95 backdrop-blur border-b border-gray-800 no-print h-[57px] flex items-center">
      <div className="w-full px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          {/* Toggle button */}
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center active:scale-95 ${
              sidebarOpen
                ? 'bg-orange-600/20 text-orange-400 border border-orange-500/40 hover:bg-orange-600/30'
                : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-gray-50 border border-gray-700/60'
            }`}
            title={sidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
            aria-label="Abrir o cerrar menú lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-900/30 text-sm">
              M
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-gray-50">MINA DESIGN</span>
              <span className="text-[10px] text-orange-400 block -mt-0.5">ERP SYSTEM</span>
            </div>
          </div>

          {/* Current section indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-800 text-xs">
            <span className="text-gray-500">/</span>
            <span className="text-gray-200 font-semibold">{currentTabLabel}</span>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenNuevoPedido}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            title="Crear nuevo pedido"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="hidden xs:inline sm:inline">Pedido</span>
          </button>

          <button
            onClick={onOpenNuevoIngreso}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            title="Registrar Ingreso"
          >
            <ArrowDownLeft className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Ingreso</span>
          </button>

          <button
            onClick={onOpenNuevoEgreso}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
            title="Registrar Egreso"
          >
            <ArrowUpRight className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Egreso</span>
          </button>

          <ThemeToggle />

        </div>
      </div>
    </header>
  );
}
