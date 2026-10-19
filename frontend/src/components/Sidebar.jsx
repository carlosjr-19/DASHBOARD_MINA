import React from 'react';
import { 
  Package, 
  FileText, 
  Boxes, 
  Wallet, 
  Calculator, 
  Users, 
  Layers,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  pedidos = [],
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

  const pedidosBadge = pedidosActivos > 0 ? pedidosActivos : totalPedidos;

  const tabs = [
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
          ${isOpen ? 'lg:w-60 xl:w-64 lg:flex' : 'lg:hidden'}
          lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]
        `}
      >
        {/* Navigation list */}
        <nav className="flex-1 p-2.5 pt-3 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
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
                      tab.id === 'pedidos'
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
                <p className="text-[10px] text-gray-500 truncate">
                  {user?.rol || 'Administrador'}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
