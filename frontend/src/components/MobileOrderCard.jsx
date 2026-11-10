import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  FileCheck, 
  MessageCircle, 
  Printer, 
  CheckCircle2, 
  Truck,
  Edit3,
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
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'En Producción':
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'Convertido':
        return 'bg-blue-100 text-[#173865] border-blue-200 hover:bg-blue-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
    }
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
  const gananciaPedido = order.gananciaReal !== undefined ? parseFloat(order.gananciaReal) : (order.ganancia !== undefined ? parseFloat(order.ganancia) : ((parseFloat(order.total) || 0) - (parseFloat(order.costoTotal) || 0) - (parseFloat(order.costoRecoleccion) || 0)));

  const detalleText = order.productos && order.productos.length > 1
    ? `Varios (${order.productos.length})`
    : (order.productos && order.productos.length === 1
        ? `${order.productos[0].cant > 1 ? `${order.productos[0].cant}x ` : ''}${order.productos[0].nombre}`
        : '-');

  const isCancelled = order.estatus === 'Cancelado';

  return (
    <React.Fragment>
      {/* Main Order Row */}
      <tr 
        onClick={() => setExpanded(!expanded)} 
        className={`cursor-pointer transition-colors text-xs ${
          isCancelled
            ? 'opacity-45 grayscale bg-gray-50 text-gray-400'
            : expanded
              ? 'bg-blue-50/40'
              : 'hover:bg-gray-50/80'
        }`}
      >
        {/* 1. Expand Chevron */}
        <td className="py-3.5 px-2 text-center text-gray-400 w-8">
          <button 
            type="button" 
            className="p-1 hover:text-[#173865] rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-[#173865]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>

        {/* 2. ID */}
        <td className="py-3.5 px-3 whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
            isCancelled 
              ? 'bg-gray-100 text-gray-400 line-through' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {order.id}
          </span>
        </td>

        {/* 3. FECHA */}
        <td className={`py-3.5 px-3 whitespace-nowrap text-xs font-medium ${isCancelled ? 'line-through text-gray-400' : 'text-gray-500'}`}>
          {order.fecha ? new Date(order.fecha).toLocaleDateString('es-MX') : '-'}
        </td>

        {/* 4. CLIENTE */}
        <td className={`py-3.5 px-3 font-bold whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
          {order.cliente || 'Cliente sin nombre'}
        </td>

        {/* 5. DETALLE */}
        <td className={`py-3.5 px-3 max-w-[200px] truncate text-xs ${isCancelled ? 'line-through text-gray-400' : 'text-gray-500'}`}>
          {detalleText}
        </td>

        {/* 6. TOTAL */}
        <td className={`py-3.5 px-3 text-right font-bold whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
          {formatMoney(order.total)}
        </td>

        {/* 7. RESTANTE */}
        <td className={`py-3.5 px-3 text-right font-black whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-400' : ''}`}>
          {restante > 0.001 ? (
            <span className={isCancelled ? 'text-gray-400 line-through' : 'text-red-500'}>{formatMoney(restante)}</span>
          ) : (
            <span className={isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}>$0.00</span>
          )}
        </td>

        {/* 8. GANANCIA DIRECTA */}
        <td className={`py-3.5 px-3 text-right font-black whitespace-nowrap text-sm ${isCancelled ? 'line-through text-gray-400' : 'text-green-600'}`}>
          {formatMoney(gananciaPedido)}
        </td>

        {/* 9. ESTATUS */}
        <td className="py-3.5 px-3 text-center whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick(order);
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm inline-flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 ${getStatusColor(
              order.estatus
            )}`}
            title="Haz clic para cambiar el estatus"
          >
            <span>{order.estatus}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {order.estatus === 'Entregado' && order.fechaEntrega && (
            <div className="text-[10px] text-green-600 mt-1 flex items-center justify-center gap-0.5 font-bold">
              <span>✓ Entregado: {order.fechaEntrega}</span>
            </div>
          )}
        </td>

        {/* 10. FACTURA */}
        <td className="py-3.5 px-3 text-center whitespace-nowrap">
          {order.requiereFactura ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFacturaClick(order);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-black border shadow-sm inline-flex items-center gap-1 transition-all transform hover:scale-105 ${
                order.facturaEstatus === 'Facturado'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              <span>{order.facturaEstatus === 'Facturado' ? 'CFDI Listo' : 'Pendiente'}</span>
            </button>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </td>

        {/* 11. ACCIONES */}
        <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => onPdfClick(order)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Ver PDF / Imprimir"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {order.telefono && (
              <button
                onClick={sendWhatsApp}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                title="Contactar por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(order)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-[#173865] transition-colors"
                title="Editar pedido"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {order.estatus !== 'Cancelado' && onStatusClick && (
              <button
                onClick={() => onStatusClick({ ...order, estatus: 'Cancelado' })}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                title={`Cancelar ${order.tipo === 'COTIZACION' ? 'cotización' : 'pedido'}`}
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {order.tipo === 'COTIZACION' && !order.convertidaAPedido && order.estatus !== 'Aprobado' && order.estatus !== 'Convertido' && onAprobarCotizacion && (
              <button
                onClick={() => onAprobarCotizacion(order)}
                className="px-3 py-1.5 rounded-full bg-[#173865] hover:bg-blue-900 text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
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
        <tr className="bg-gray-50/70 border-b border-gray-100">
          <td colSpan={11} className="p-4">
            <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-4 w-full shadow-sm space-y-3">
              {/* Header of Desglose */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-200">
                <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                  Desglose de Costos e Insumos
                </span>
                {(() => {
                  const totalPiezas = (order.productos || []).reduce((acc, p) => acc + (parseFloat(p.cant) || 1), 0);
                  const ventaNum = parseFloat(order.total) || 0;
                  const costoInsumosNum = parseFloat(order.costoTotal) || 0;
                  const recoleccionNum = parseFloat(order.costoRecoleccion) || (order.recolecciones ? order.recolecciones.reduce((acc, r) => acc + (r.porcion || 0), 0) : 0);
                  const gananciaNetaReal = ventaNum - costoInsumosNum - recoleccionNum;
                  return (
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="text-gray-600 font-medium">
                        Total Productos: <strong className="text-gray-900 font-bold">{totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'}</strong>
                      </span>
                      <span className="text-gray-600 font-medium">
                        Venta Total: <strong className="text-gray-900 font-bold">{formatMoney(ventaNum)}</strong>
                      </span>
                      {recoleccionNum > 0 && (
                        <span className="text-amber-700 font-bold">
                          Recolección: <strong>+{formatMoney(recoleccionNum)}</strong>
                        </span>
                      )}
                      <span className="text-gray-600 font-medium">
                        Costo Total: <strong className="text-gray-900 font-bold">{formatMoney(costoInsumosNum)}</strong>
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700 font-bold text-xs">
                        Ganancia Neta: {formatMoney(gananciaNetaReal)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Sub-table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-gray-100">
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
                            <tr className="bg-gray-100/90 border-t border-b border-gray-200 font-bold">
                              <td className="py-2.5 px-3 min-w-[170px]">
                                <div className="font-black text-gray-900 text-xs">
                                  {cantProd}x {prod.nombre}
                                </div>
                                {prod.proveedor && (
                                  <div className="text-[11px] text-gray-500 font-normal">
                                    ({prod.proveedor})
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center min-w-[110px] text-[10px] font-bold uppercase text-gray-500">Detalle</td>
                              <td className="py-2.5 px-2 text-center min-w-[95px] text-[10px] font-bold uppercase text-gray-500">Medida</td>
                              <td className="py-2.5 px-2 text-center min-w-[110px] text-[10px] font-bold uppercase text-gray-500">Nota</td>
                              <td className="py-2.5 px-2 text-center min-w-[100px] text-[10px] font-bold uppercase text-gray-500">Proveedor</td>
                              <td className="py-2.5 px-2 text-center w-20 text-[10px] font-bold uppercase text-gray-500">Cant.</td>
                              <td className="py-2.5 px-2 text-center w-24 text-[10px] font-bold uppercase text-gray-500">Costo Unit.</td>
                              <td className="py-2.5 px-2 text-center w-24 text-[10px] font-bold uppercase text-gray-500">Subtotal Costo</td>
                              <td className="py-2.5 px-2 text-center w-28 text-[10px] font-bold uppercase text-gray-500">Método Pago</td>
                            </tr>

                            {prod.insumos && prod.insumos.length > 0 ? (
                              prod.insumos.map((ins, iIdx) => {
                                const cantIns = parseFloat(ins.cant) || 1;
                                const cuIns = parseFloat(ins.costoUnitario) || (parseFloat(ins.costo) || 0) / cantIns;
                                const subtotalIns = parseFloat(ins.costo) || (cantIns * cuIns);

                                return (
                                  <tr key={iIdx} className="hover:bg-blue-50/30 text-gray-700 text-xs transition-colors">
                                    <td className="py-2 px-3 pl-4">
                                      <div className="flex items-start gap-1.5">
                                        <span className="text-gray-400">•</span>
                                        <span className="font-semibold text-gray-800">{ins.nombre}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center text-gray-600">{ins.detalle || '-'}</td>
                                    <td className="py-2 px-2 text-center text-gray-600 font-mono text-[11px]">{ins.medida || '-'}</td>
                                    <td className="py-2 px-2 text-center text-amber-800 font-medium">{ins.nota || '-'}</td>
                                    <td className="py-2 px-2 text-center text-gray-500">{ins.proveedor || '-'}</td>
                                    <td className="py-2 px-2 text-center font-bold text-gray-700">{cantIns}</td>
                                    <td className="py-2 px-2 text-center text-gray-600">{formatMoney(cuIns)}</td>
                                    <td className="py-2 px-2 text-center font-bold text-gray-900">{formatMoney(subtotalIns)}</td>
                                    <td className="py-2 px-2 text-center">
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 border border-gray-200 text-gray-700 inline-block">
                                        {ins.metodoPago || 'STOCK'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={9} className="py-2 px-4 text-xs text-gray-400 italic pl-6">
                                  Sin insumos registrados para este producto
                                </td>
                              </tr>
                            )}

                            {prod.mermas && prod.mermas.length > 0 && prod.mermas.map((merma, mIdx) => {
                              const cantMerma = parseFloat(merma.cant) || 1;
                              const cuMerma = parseFloat(merma.costoUnitario) || 0;
                              const subtotalMerma = cantMerma * cuMerma;
                              return (
                                <tr key={`merma-${mIdx}`} className="bg-red-50/70 text-red-700 text-xs">
                                  <td className="py-2 px-3 pl-4 font-bold">• [Merma] {merma.material}</td>
                                  <td className="py-2 px-2 text-center">Desperdicio</td>
                                  <td className="py-2 px-2 text-center text-gray-400">-</td>
                                  <td className="py-2 px-2 text-center">{merma.motivo || '-'}</td>
                                  <td className="py-2 px-2 text-center">Propio</td>
                                  <td className="py-2 px-2 text-center font-bold">{cantMerma}</td>
                                  <td className="py-2 px-2 text-center">{formatMoney(cuMerma)}</td>
                                  <td className="py-2 px-2 text-center font-bold">{formatMoney(subtotalMerma)}</td>
                                  <td className="py-2 px-2 text-center">
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 border border-red-200 text-red-700 inline-block">
                                      {merma.metodoPago || 'STOCK'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}

                            <tr className="bg-gray-50 border-b border-gray-200">
                              <td colSpan={9} className="py-2 px-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                  <span className="text-[11px] uppercase font-bold text-gray-500">
                                    Resumen de {prod.nombre}
                                  </span>
                                  <div className="flex items-center gap-3 text-xs flex-wrap justify-end">
                                    <span className="text-gray-600">C. Unit.: <strong className="text-gray-900">{formatMoney(costoUnitProd)}</strong></span>
                                    <span className="text-gray-600">Venta: <strong className="text-gray-900">{formatMoney(precioCobradoProd)}</strong></span>
                                    <span className="text-gray-600">C. Total: <strong className="text-gray-900">{formatMoney(costoProdTotal)}</strong></span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-800 font-black text-[11px]">
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
                        <td colSpan={9} className="py-4 text-center text-gray-400 italic">
                          No hay productos registrados en este pedido
                        </td>
                      </tr>
                    )}

                    {order.recolecciones && order.recolecciones.length > 0 && order.recolecciones.map((rec, rIdx) => (
                      <tr key={rIdx} className="bg-amber-50/70 border-t border-amber-200 text-xs">
                        <td colSpan={9} className="py-2.5 px-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-amber-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                                {rec.recoleccionId}
                              </span>
                              <span className="text-amber-700 font-medium">
                                {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX') : '-'}
                              </span>
                              <span>• Gasto de recolección {rec.recoleccionId}: {rec.conceptos || 'Logística'}</span>
                              {rec.nota && <span className="text-amber-700 italic">— "{rec.nota}"</span>}
                            </div>
                            <div className="font-black text-amber-900 shrink-0">
                              Porción asignada: +{formatMoney(rec.porcion)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {order.estatus === 'Cancelado' && order.motivoCancelacion && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  <strong>Motivo de Cancelación:</strong> {order.motivoCancelacion}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
