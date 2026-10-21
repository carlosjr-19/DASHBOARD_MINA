import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  FileText, 
  FileCheck, 
  MessageCircle, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Truck,
  Building,
  Calendar,
  DollarSign,
  Edit3,
  Tag,
  XCircle
} from 'lucide-react';

export default function MobileOrderCard({ 
  order, 
  onStatusClick, 
  onFacturaClick, 
  onPdfClick, 
  onAprobarCotizacion,
  onEdit,
  onDelete
}) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completado':
      case 'Entregado':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
      case 'En Producción':
      case 'En Progreso':
        return 'bg-blue-950/80 text-blue-400 border-blue-700/60';
      case 'Pendiente':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/60';
      case 'Convertido':
        return 'bg-blue-950/90 text-blue-300 border-blue-600/70';
      case 'Cancelado':
        return 'bg-rose-950/80 text-rose-400 border-rose-700/60';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getFacturaBadge = () => {
    if (!order.requiereFactura) return null;
    const estatus = order.facturaEstatus || 'Pendiente';
    const isDone = estatus === 'Facturado';
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFacturaClick(order);
        }}
        className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 transition-all ${
          isDone 
            ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
            : 'bg-yellow-950 text-yellow-300 border-yellow-600'
        }`}
      >
        <FileCheck className="w-3 h-3" />
        <span>{isDone ? 'CFDI Listo' : 'Factura Pendiente'}</span>
      </button>
    );
  };

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const sendWhatsApp = (e) => {
    e.stopPropagation();
    const phone = (order.telefono || '').replace(/\D/g, '');
    const msg = encodeURIComponent(`Hola ${order.cliente}, te escribimos de MINA DESIGN respecto a tu ${order.tipo === 'COTIZACION' ? 'cotización' : 'pedido'} ${order.id}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const restante = Math.max(0, (parseFloat(order.total) || 0) - (parseFloat(order.pagado) || 0));

  const detalleText = order.productos && order.productos.length > 1
    ? `Varios (${order.productos.length})`
    : (order.productos && order.productos.length === 1
        ? `${order.productos[0].cant > 1 ? `${order.productos[0].cant}x ` : ''}${order.productos[0].nombre}`
        : '-');

  const isCancelled = order.estatus === 'Cancelado';

  return (
    <React.Fragment>
      {/* Main Order Row matching image reference */}
      <tr 
        onClick={() => setExpanded(!expanded)} 
        className={`hover:bg-gray-800/40 cursor-pointer transition-colors border-b border-gray-800/80 text-xs ${
          isCancelled ? 'opacity-40 grayscale bg-th-121314/90 text-gray-500' : ''
        }`}
      >
        {/* 1. Expand Chevron */}
        <td className="py-3 px-2 text-center text-gray-400 w-8">
          <button 
            type="button" 
            className="p-1 hover:text-gray-50 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-orange-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>

        {/* 2. ID */}
        <td className="py-3 px-3 whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-md border font-mono font-bold text-xs shadow-sm ${
            isCancelled 
              ? 'bg-gray-900/80 border-gray-800 text-gray-500 line-through' 
              : 'bg-gray-800/80 border-gray-700/80 text-gray-200'
          }`}>
            {order.id}
          </span>
        </td>

        {/* 3. FECHA */}
        <td className={`py-3 px-3 whitespace-nowrap font-mono ${isCancelled ? 'line-through text-gray-600' : 'text-gray-400'}`}>
          {order.fecha ? new Date(order.fecha).toLocaleDateString('es-MX') : '-'}
        </td>

        {/* 4. CLIENTE */}
        <td className={`py-3 px-3 font-bold whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {order.cliente || 'Cliente sin nombre'}
        </td>

        {/* 5. DETALLE */}
        <td className={`py-3 px-3 max-w-[200px] truncate ${isCancelled ? 'line-through text-gray-600' : 'text-gray-300'}`}>
          {detalleText}
        </td>

        {/* 6. TOTAL */}
        <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {formatMoney(order.total)}
        </td>

        {/* 7. RESTANTE */}
        <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-600' : ''}`}>
          {restante > 0 ? (
            <span className={isCancelled ? 'text-gray-600 line-through' : 'text-rose-400'}>{formatMoney(restante)}</span>
          ) : (
            <span className={isCancelled ? 'text-gray-600 line-through' : 'text-emerald-400'}>$0.00</span>
          )}
        </td>

        {/* 8. ESTATUS */}
        <td className="py-3 px-3 text-center whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick(order);
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1 transition-all active:scale-95 leading-tight ${getStatusColor(
              order.estatus
            )}`}
          >
            <span>{order.estatus}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {order.estatus === 'Entregado' && order.fechaEntrega && (
            <div className="text-[10px] text-emerald-400/90 mt-0.5 flex items-center justify-center gap-0.5 font-medium">
              <span>✓ Entregado: {order.fechaEntrega}</span>
            </div>
          )}
        </td>

        {/* 9. FACTURA */}
        <td className="py-3 px-3 text-center whitespace-nowrap">
          {order.requiereFactura ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFacturaClick(order);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1 transition-all ${
                order.facturaEstatus === 'Facturado'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-yellow-950 text-yellow-300 border-yellow-600'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              <span>{order.facturaEstatus === 'Facturado' ? 'CFDI Listo' : 'Pendiente'}</span>
            </button>
          ) : (
            <span className="text-gray-500 font-mono">-</span>
          )}
        </td>

        {/* 10. ACCIONES */}
        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1.5">
            {/* Imprimir / PDF */}
            <button
              onClick={() => onPdfClick(order)}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title="Ver PDF / Imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-orange-400" />
            </button>

            {/* WhatsApp */}
            {order.telefono && (
              <button
                onClick={sendWhatsApp}
                className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 transition-colors"
                title="Contactar por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Editar */}
            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-blue-300 transition-colors"
                title="Editar pedido"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}

            {/* Cancelar Registro */}
            {order.estatus !== 'Cancelado' && onStatusClick && (
              <button
                onClick={() => onStatusClick({ ...order, estatus: 'Cancelado' })}
                className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition-colors"
                title={`Cancelar ${order.tipo === 'COTIZACION' ? 'cotización' : 'pedido'}`}
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Aprobar Cotización */}
            {order.tipo === 'COTIZACION' && !order.convertidaAPedido && order.estatus !== 'Aprobado' && order.estatus !== 'Convertido' && onAprobarCotizacion && (
              <button
                onClick={() => onAprobarCotizacion(order)}
                className="px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                title="Aprobar a Pedido"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Aprobar</span>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details Section */}
      {expanded && (
        <tr className="bg-th-151618">
          <td colSpan={10} className="p-3.5 sm:p-4 border-b border-gray-800">
            {/* Header of Desglose: DESGLOSE DE COSTOS E INSUMOS + Financial metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-800/80">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200">
                DESGLOSE DE COSTOS E INSUMOS
              </span>
              {(() => {
                const totalPiezas = (order.productos || []).reduce((acc, p) => acc + (parseFloat(p.cant) || 1), 0);
                const ventaNum = parseFloat(order.total) || 0;
                const costoInsumosNum = parseFloat(order.costoTotal) || 0;
                const recoleccionNum = parseFloat(order.costoRecoleccion) || (order.recolecciones ? order.recolecciones.reduce((acc, r) => acc + (r.porcion || 0), 0) : 0);
                const gananciaNetaReal = ventaNum - costoInsumosNum - recoleccionNum;
                return (
                  <div className="flex items-center gap-2 sm:gap-3.5 text-xs flex-wrap font-mono">
                    <span className="text-gray-400">
                      Total Productos: <strong className="text-gray-100">{totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'}</strong>
                    </span>
                    <span className="text-gray-400">
                      Venta Total: <strong className="text-gray-100">{formatMoney(ventaNum)}</strong>
                    </span>
                    {recoleccionNum > 0 && (
                      <span className="text-amber-400">
                        Recolección: <strong className="text-amber-300">+{formatMoney(recoleccionNum)}</strong>
                      </span>
                    )}
                    <span className="text-gray-400">
                      Costo Total: <strong className="text-gray-100">{formatMoney(costoInsumosNum)}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-600/70 text-emerald-400 font-semibold text-[11px] sm:text-xs">
                      Ganancia Neta: {formatMoney(gananciaNetaReal)}
                    </span>
                  </div>
                );
              })()}
            </div>

          {/* Table matching reference structure: Compact layout without redundant thead */}
          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-th-141517">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-gray-800/60">
                {order.productos && order.productos.length > 0 ? (
                  order.productos.map((prod, idx) => {
                    const cantProd = parseFloat(prod.cant) || 1;
                    const puProd = parseFloat(prod.precioUnitario) || 0;
                    const precioCobradoProd = cantProd * puProd;
                    
                    const costoInsumosProd = (prod.insumos || []).reduce(
                      (acc, ins) => acc + (parseFloat(ins.costo) || ((parseFloat(ins.cant) || 1) * (parseFloat(ins.costoUnitario) || 0))),
                      0
                    );
                    const costoMermasProd = (prod.mermas || []).reduce(
                      (acc, m) => acc + ((parseFloat(m.cant) || 1) * (parseFloat(m.costoUnitario) || 0)),
                      0
                    );
                    const costoProdTotal = costoInsumosProd + costoMermasProd;
                    const costoUnitProd = cantProd > 0 ? (costoProdTotal / cantProd) : costoProdTotal;
                    const gananciaProd = precioCobradoProd - costoProdTotal;

                    return (
                      <React.Fragment key={idx}>
                        {/* Product Header Row - 9 Columns: Insumo, Detalle, Medida, Nota, Proveedor, Cant, Costo Unit, Subtotal, Método Pago */}
                        <tr className="bg-th-1b1c20 border-t-2 border-b border-gray-700/80 font-medium">
                          <td className="py-2.5 px-3 min-w-[170px]">
                            <div className="font-bold text-gray-100 text-xs sm:text-sm">
                              {cantProd}x {prod.nombre}
                            </div>
                            {prod.proveedor && (
                              <div className="text-[10px] text-gray-400">
                                {prod.proveedor}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center min-w-[110px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            DETALLE
                          </td>
                          <td className="py-2.5 px-2 text-center min-w-[95px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            MEDIDA
                          </td>
                          <td className="py-2.5 px-2 text-center min-w-[110px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            NOTA
                          </td>
                          <td className="py-2.5 px-2 text-center min-w-[100px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            PROVEEDOR
                          </td>
                          <td className="py-2.5 px-2 text-center w-20 min-w-[65px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            CANT.
                          </td>
                          <td className="py-2.5 px-2 text-center w-24 min-w-[80px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            COSTO UNIT.
                          </td>
                          <td className="py-2.5 px-2 text-center w-24 min-w-[85px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            SUBTOTAL COSTO
                          </td>
                          <td className="py-2.5 px-2 text-center w-28 min-w-[95px] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                            MÉTODO DE PAGO
                          </td>
                        </tr>

                        {/* Insumos Rows for this Product */}
                        {prod.insumos && prod.insumos.length > 0 ? (
                          prod.insumos.map((ins, iIdx) => {
                            const cantIns = parseFloat(ins.cant) || 1;
                            const cuIns = parseFloat(ins.costoUnitario) || (parseFloat(ins.costo) || 0) / cantIns;
                            const subtotalIns = parseFloat(ins.costo) || (cantIns * cuIns);

                            return (
                              <tr key={iIdx} className="hover:bg-gray-800/30 text-gray-300 text-[11px] transition-colors">
                                {/* INSUMO */}
                                <td className="py-2 px-3 pl-4">
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-gray-500 font-bold">•</span>
                                    <span className="font-medium text-gray-200">{ins.nombre}</span>
                                  </div>
                                </td>

                                {/* DETALLE */}
                                <td className="py-2 px-2 text-center text-gray-300">
                                  {ins.detalle || <span className="text-gray-600">-</span>}
                                </td>

                                {/* MEDIDA */}
                                <td className="py-2 px-2 text-center text-gray-300 font-mono text-[11px]">
                                  {ins.medida || <span className="text-gray-600">-</span>}
                                </td>

                                {/* NOTA */}
                                <td className="py-2 px-2 text-center text-gray-400">
                                  {ins.nota ? (
                                    <span className="text-amber-400/90">{ins.nota}</span>
                                  ) : (
                                    <span className="text-gray-600">-</span>
                                  )}
                                </td>

                                {/* PROVEEDOR */}
                                <td className="py-2 px-2 text-center text-gray-400">
                                  {ins.proveedor || <span className="text-gray-600">-</span>}
                                </td>

                                {/* CANT. */}
                                <td className="py-2 px-2 text-center w-20 min-w-[65px] font-mono font-medium text-gray-200">
                                  {cantIns}
                                </td>

                                {/* COSTO UNIT. */}
                                <td className="py-2 px-2 text-center w-24 min-w-[80px] font-mono text-gray-300">
                                  {formatMoney(cuIns)}
                                </td>

                                {/* SUBTOTAL COSTO */}
                                <td className="py-2 px-2 text-center w-24 min-w-[85px] font-mono font-bold text-gray-100">
                                  {formatMoney(subtotalIns)}
                                </td>

                                {/* MÉTODO DE PAGO */}
                                <td className="py-2 px-2 text-center w-28 min-w-[95px]">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gray-800/80 border border-gray-700/80 text-gray-300 inline-block">
                                    {ins.metodoPago || 'STOCK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-2 px-4 text-[11px] text-gray-500 italic pl-6">
                              Sin insumos registrados para este producto
                            </td>
                          </tr>
                        )}

                        {/* Mermas if any */}
                        {prod.mermas && prod.mermas.length > 0 && prod.mermas.map((merma, mIdx) => {
                          const cantMerma = parseFloat(merma.cant) || 1;
                          const cuMerma = parseFloat(merma.costoUnitario) || 0;
                          const subtotalMerma = cantMerma * cuMerma;
                          return (
                            <tr key={`merma-${mIdx}`} className="bg-rose-950/20 text-rose-300 text-[11px]">
                              {/* INSUMO */}
                              <td className="py-2 px-3 pl-4">
                                <span className="font-semibold text-rose-400">• [Merma] {merma.material}</span>
                              </td>
                              {/* DETALLE */}
                              <td className="py-2 px-2 text-center text-rose-400/70">
                                Desperdicio
                              </td>
                              {/* MEDIDA */}
                              <td className="py-2 px-2 text-center text-gray-600">
                                -
                              </td>
                              {/* NOTA */}
                              <td className="py-2 px-2 text-center text-rose-400/90">
                                {merma.motivo || '-'}
                              </td>
                              {/* PROVEEDOR */}
                              <td className="py-2 px-2 text-center text-rose-400/70">
                                Propio
                              </td>
                              {/* CANT. */}
                              <td className="py-2 px-2 text-center w-20 min-w-[65px] font-mono">
                                {cantMerma}
                              </td>
                              {/* COSTO UNIT. */}
                              <td className="py-2 px-2 text-center w-24 min-w-[80px] font-mono">
                                {formatMoney(cuMerma)}
                              </td>
                              {/* SUBTOTAL COSTO */}
                              <td className="py-2 px-2 text-center w-24 min-w-[85px] font-mono font-semibold">
                                {formatMoney(subtotalMerma)}
                              </td>
                              {/* MÉTODO DE PAGO */}
                              <td className="py-2 px-2 text-center w-28 min-w-[95px]">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-950/80 border border-rose-800/80 text-rose-300 inline-block">
                                  {merma.metodoPago || 'STOCK'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Product Financial Metrics Footer (Recuadro Naranja movido a la parte de abajo) */}
                        <tr className="bg-th-17181b border-b border-gray-800">
                          <td colSpan={9} className="py-2 px-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-gray-400">
                                Resumen de {prod.nombre}
                              </span>
                              <div className="flex items-center gap-2 sm:gap-3.5 text-[11px] font-mono flex-wrap justify-end">
                                <span className="text-gray-400">
                                  C. Unit.: <strong className="text-gray-200">{formatMoney(costoUnitProd)}</strong>
                                </span>
                                <span className="text-gray-400">
                                  Venta: <strong className="text-gray-200">{formatMoney(precioCobradoProd)}</strong>
                                </span>
                                <span className="text-gray-400">
                                  C. Total: <strong className="text-gray-200">{formatMoney(costoProdTotal)}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/70 text-emerald-400 font-semibold text-[10px] sm:text-[11px]">
                                  Ganancia: {formatMoney(gananciaProd)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-gray-500 italic">
                      No hay productos registrados en este pedido
                    </td>
                  </tr>
                )}

                {/* Gastos de Recolección / Logística en una sola línea */}
                {order.recolecciones && order.recolecciones.length > 0 && order.recolecciones.map((rec, rIdx) => (
                  <tr key={rIdx} className="bg-th-181613 border-t border-amber-900/40 text-[11px]">
                    <td colSpan={9} className="py-2.5 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-gray-300">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-700/60 text-[10px]">
                            {rec.recoleccionId}
                          </span>
                          <span className="text-gray-400 font-mono">
                            {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX') : '-'}
                          </span>
                          <span className="text-gray-300">
                            • Gasto de recolección {rec.recoleccionId}: {rec.conceptos || 'Logística'}
                          </span>
                          {rec.nota && (
                            <span className="text-amber-400/80 italic">— "{rec.nota}"</span>
                          )}
                        </div>
                        <div className="font-mono text-amber-300 font-bold shrink-0">
                          Porción asignada: +{formatMoney(rec.porcion)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Motivo de Cancelación si aplica */}
          {order.estatus === 'Cancelado' && order.motivoCancelacion && (
            <div className="mt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              <strong>Motivo de Cancelación:</strong> {order.motivoCancelacion}
            </div>
          )}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
