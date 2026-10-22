import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import MobileOrderCard from '../components/MobileOrderCard';

export default function PedidosView({ 
  pedidos = [], 
  onStatusClick, 
  onFacturaClick, 
  onPdfClick, 
  onOpenNuevoPedido,
  onEdit,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // Filter only PEDIDO type
  const listPedidos = pedidos.filter(p => p.tipo !== 'COTIZACION');

  // Filter logic
  const filtered = listPedidos.filter((p) => {
    const matchSearch = 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'TODOS' || p.estatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // Sort descending: newest orders at the top, 001, 002 at the bottom
  const sorted = [...filtered].sort((a, b) => {
    return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Financial summary
  const totalCobrado = listPedidos.reduce((acc, p) => acc + (p.pagado || 0), 0);
  const totalGanancia = listPedidos.reduce((acc, p) => acc + (p.ganancia || 0), 0);
  const activosCount = listPedidos.filter(p => !['Entregado', 'Completado', 'Cancelado'].includes(p.estatus)).length;

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Total Pedidos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{listPedidos.length}</span>
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">En Producción / Activos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-blue-400">{activosCount}</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Total Cobrado</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-emerald-400 truncate">{formatMoney(totalCobrado)}</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Ganancia Real</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-emerald-400 truncate">{formatMoney(totalGanancia)}</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-th-18191b p-2.5 rounded-xl border border-gray-800">
        {/* Buscador más pequeño */}
        <div className="relative w-full sm:w-60 md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-th-121314 text-[11px] text-gray-100 pl-8 pr-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'Pendiente', label: 'Pendientes' },
            { id: 'En Producción', label: 'En producción' },
            { id: 'Completado', label: 'Completados' },
            { id: 'Entregado', label: 'Entregados' },
            { id: 'Cancelado', label: 'Cancelados' }
          ].map((st) => {
            const isSelected = statusFilter === st.id;
            const count = st.id === 'TODOS'
              ? listPedidos.length
              : listPedidos.filter(p => (p.estatus || '').toLowerCase() === st.id.toLowerCase()).length;

            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                    : 'bg-th-151617 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`min-w-[16px] h-4 px-0.5 rounded-full text-xs font-bold flex items-center justify-center leading-none ${
                    isSelected
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'bg-gray-800 text-gray-200 border border-gray-700/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table Container matching reference image */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-th-161719 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-th-131416 text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
              <th className="py-3 px-2 w-8"></th>
              <th className="py-3 px-3 min-w-[95px]">ID</th>
              <th className="py-3 px-3 min-w-[100px]">FECHA</th>
              <th className="py-3 px-3 min-w-[130px]">CLIENTE</th>
              <th className="py-3 px-3 min-w-[180px]">DETALLE</th>
              <th className="py-3 px-3 text-right min-w-[95px]">TOTAL</th>
              <th className="py-3 px-3 text-right min-w-[95px]">RESTANTE</th>
              <th className="py-3 px-3 text-right min-w-[95px] text-emerald-500 dark:text-emerald-400">GANANCIA</th>
              <th className="py-3 px-3 text-center min-w-[130px]">ESTATUS</th>
              <th className="py-3 px-3 text-center min-w-[110px]">FACTURA</th>
              <th className="py-3 px-3 text-center min-w-[110px]">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {sorted.length > 0 ? (
              sorted.map((order) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  onStatusClick={onStatusClick}
                  onFacturaClick={onFacturaClick}
                  onPdfClick={onPdfClick}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  <Package className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-semibold">No se encontraron pedidos</p>
                  <p className="text-xs mt-1">Crea uno nuevo con el botón superior "+ Pedido".</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
