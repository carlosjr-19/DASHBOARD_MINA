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
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden no-print transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar element */}
      <aside
        className={`
          no-print flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          /* Mobile styles (fixed drawer overlay) */
          fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:static lg:z-20
          ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-sm' : '-translate-x-full lg:translate-x-0'}
          /* Desktop styles (collapsible visibility) */
          ${!isOpen ? 'lg:flex' : 'lg:flex'}
        `}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#173865] flex items-center justify-center font-bold text-white shadow-md text-base">
              M
            </div>
            <div>
              <h1 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
                MINA
              </h1>
              <span className="text-xs font-semibold text-[#173865] dark:text-blue-400 uppercase block -mt-0.5 tracking-wide">
                DESIGN
              </span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm transition-all group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#173865] dark:text-blue-300 font-bold shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon 
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#173865] dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  <span className="truncate">{tab.label}</span>
                </div>

                {(tab.id === 'pedidos' || tab.badge > 0) && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none ${
                      tab.id === 'pendientes'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : tab.id === 'pedidos'
                          ? 'bg-[#173865] text-white shadow-sm'
                          : isActive
                            ? 'bg-[#173865] text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200'
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
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#173865] text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {user?.nombre || 'Admin'}
                </p>
                <span className="text-[10px] text-gray-400 capitalize block -mt-0.5 font-medium">
                  {user?.rol || 'Administrador'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
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
