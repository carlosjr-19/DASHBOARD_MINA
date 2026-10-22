import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Printer, 
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
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Cotizaciones Emitidas</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{listCotizaciones.length}</span>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Pendientes de Aprobación</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-amber-400">{pendientesCount}</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Monto Presupuestado</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-blue-400 truncate">{formatMoney(totalPresupuestado)}</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-2.5 bg-th-18191b p-3 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cotización por cliente o folio (CMD-...)"
            className="w-full bg-th-121314 text-xs text-gray-100 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={onOpenNuevoPedido}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Cotizaciones Table Container matching reference image */}
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
                  onAprobarCotizacion={onAprobarCotizacion}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  <FileText className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-semibold">No hay cotizaciones registradas</p>
                  <p className="text-xs mt-1">Crea una cotización para enviarla en PDF al cliente.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
