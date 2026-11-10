import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  DollarSign
} from 'lucide-react';
import MobileOrderCard from '../components/MobileOrderCard';

export default function CotizacionesView({ 
  pedidos = [], 
  onStatusClick, 
  onFacturaClick, 
  onPdfClick, 
  onAprobarCotizacion,
  onOpenNuevoPedido,
  onEdit,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only COTIZACION type
  const listCotizaciones = pedidos.filter(p => p.tipo === 'COTIZACION');

  const filtered = listCotizaciones.filter((c) => {
    return (
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort descending: newest quotes at top, 001, 002 at bottom
  const sorted = [...filtered].sort((a, b) => {
    return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalPresupuestado = listCotizaciones.reduce((acc, c) => acc + (c.total || 0), 0);
  const pendientesCount = listCotizaciones.filter(c => c.estatus === 'Pendiente').length;

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Cotizaciones Emitidas</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{listCotizaciones.length}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Pendientes de Aprobación</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600">{pendientesCount}</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all col-span-2 sm:col-span-1">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Monto Presupuestado</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-[#173865] dark:text-blue-400 truncate">{formatMoney(totalPresupuestado)}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-100 pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
          />
        </div>

        <button
          onClick={onOpenNuevoPedido}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Cotizaciones Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-2 sm:p-3 lg:p-4 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-1.5 w-7"></th>
                <th className="py-3 px-1.5 xl:px-2.5">ID</th>
                <th className="py-3 px-1.5 xl:px-2.5">Fecha</th>
                <th className="py-3 px-1.5 xl:px-2.5">Cliente</th>
                <th className="py-3 px-1.5 xl:px-2.5">Detalle</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-right">Total</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-right">Restante</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-right text-green-600">Ganancia</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-center">Estatus</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-center">Factura</th>
                <th className="py-3 px-1.5 xl:px-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {sorted.length > 0 ? (
                sorted.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    onStatusClick={onStatusClick}
                    onFacturaClick={onFacturaClick}
                    onPdfClick={onPdfClick}
                    onAprobarCotizacion={onAprobarCotizacion}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-500">No hay cotizaciones registradas</p>
                    <p className="text-xs mt-1">Crea una cotización para enviarla en PDF al cliente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
