import React from 'react';
import { 
  Package, 
  FileText, 
  Boxes, 
  Wallet, 
  Calculator, 
  Users, 
  Layers,
  LogOut,
  ListTodo
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  pedidos = [],
  pendientes = [],
  user,
  onLogout
}) {
  // Badges calculation - exactamente igual a la lógica de PedidosView
  const pedidosActivos = pedidos.filter(
    (p) =>
      p.tipo !== 'COTIZACION' &&
      !p.id?.startsWith('CMD-') &&
      (p.estatus || '').toUpperCase() !== 'COTIZACION' &&
      !['entregado', 'completado', 'cancelado'].includes((p.estatus || '').toLowerCase())
  ).length;

  const totalPedidos = pedidos.filter(
    (p) =>
      p.tipo !== 'COTIZACION' &&
      !p.id?.startsWith('CMD-') &&
      (p.estatus || '').toUpperCase() !== 'COTIZACION'
  ).length;

  const cotizacionesCount = pedidos.filter(
    (p) =>
      p.tipo === 'COTIZACION' ||
      p.id?.startsWith('CMD-') ||
      (p.estatus || '').toUpperCase() === 'COTIZACION'
  ).length;

  const pendientesActivos = pendientes.filter(
    (p) => !['atendido', 'concluido', 'culminado', 'cancelado'].includes((p.estatus || '').toLowerCase())
  ).length;

  const pedidosBadge = pedidosActivos > 0 ? pedidosActivos : totalPedidos;

  const tabs = [
    { id: 'pendientes', label: 'Pendientes', icon: ListTodo, badge: pendientesActivos },
    { id: 'pedidos', label: 'Pedidos', icon: Package, badge: pedidosBadge },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, badge: cotizacionesCount },
    { id: 'productos', label: 'Catálogo', icon: Layers },
    { id: 'inventario', label: 'Inventario', icon: Boxes },
    { id: 'finanzas', label: 'Cuentas', icon: Wallet },
    { id: 'calculadora', label: 'Calculadora', icon: Calculator },
    { id: 'clientes', label: 'Clientes', icon: Users },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden no-print transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar element */}
      <aside
        className={`
          no-print flex flex-col bg-th-161719 border-r border-gray-800/80
          /* Mobile styles (fixed drawer overlay) */
          fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:static lg:z-20
          ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}
          /* Desktop styles (collapsible visibility) */
          ${!isOpen ? 'lg:flex' : 'lg:flex'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-md shadow-orange-900/40 text-sm">
              M
            </div>
            <div>
              <h1 className="font-bold text-sm text-gray-100 tracking-wide">
                MINA DESIGN
              </h1>
              <span className="text-[10px] text-gray-400 block -mt-0.5 font-medium">
                SISTEMA INTEGRAL
              </span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-200 p-1 rounded-md"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon 
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-orange-400' : 'text-gray-400 group-hover:text-gray-200'
                    }`} 
                  />
                  <span className="truncate">{tab.label}</span>
                </div>

                {(tab.id === 'pedidos' || tab.badge > 0) && (
                  <span
                    className={`min-w-[18px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center leading-none ${
                      tab.id === 'pendientes'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-950/60'
                        : tab.id === 'pedidos'
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-950/60'
                          : isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-300 group-hover:bg-gray-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-gray-800/80 bg-th-131416">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-gray-200 truncate">
                  {user?.nombre || 'Admin'}
                </p>
                <span className="text-[10px] text-gray-400 capitalize block -mt-0.5">
                  {user?.rol || 'Administrador'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
