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
  ListTodo,
  X
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden no-print transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar element estilo Jobie */}
      <aside
        className={`
          no-print flex flex-col bg-gradient-to-b from-[#3511A3] via-[#2F0E93] to-[#240974] text-white border-r border-[#3E16BF]/30
          /* Mobile styles (fixed drawer overlay) */
          fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:static lg:z-20
          ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}
          /* Desktop styles (collapsible visibility) */
          ${!isOpen ? 'lg:flex' : 'lg:flex'}
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#3511A3] flex items-center justify-center font-black text-lg shadow-lg shadow-black/20">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-wide">
                MINA DESIGN
              </h1>
              <span className="text-[10px] text-purple-200/80 block -mt-0.5 font-bold tracking-wider">
                SISTEMA INTEGRAL
              </span>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button 
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Pill Shape) */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
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
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-white text-[#3511A3] shadow-md shadow-black/15 translate-x-1'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon 
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#3511A3]' : 'text-white/70 group-hover:text-white'
                    }`} 
                  />
                  <span className="truncate">{tab.label}</span>
                </div>

                {(tab.id === 'pedidos' || tab.badge > 0) && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center leading-none transition-all ${
                      isActive
                        ? 'bg-[#3511A3] text-white shadow-sm'
                        : 'bg-white/20 text-white group-hover:bg-white/30'
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
        <div className="p-3.5 border-t border-white/10 bg-black/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {user?.nombre || 'Admin'}
                </p>
                <span className="text-[10px] text-purple-200 capitalize block -mt-0.5 font-medium">
                  {user?.rol || 'Administrador'}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-white/70 hover:text-rose-300 hover:bg-white/10 transition-colors flex-shrink-0"
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
