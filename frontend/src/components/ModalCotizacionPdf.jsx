import React from 'react';
import { X, Printer, Download } from 'lucide-react';

export default function ModalCotizacionPdf({ order, onClose }) {
  if (!order) return null;

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="theme-fixed bg-white text-gray-900 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-auto border border-gray-300">
        {/* Modal Toolbar - Hidden during print */}
        <div className="no-print bg-th-1e2022 text-gray-200 px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Vista Previa Formato Carta / A4</span>
            <span className="text-xs text-orange-400 font-mono">({order.id})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-100 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container (Standard Letter / A4 proportion) */}
        <div className="p-8 sm:p-12 bg-white text-gray-900 space-y-6 text-sm" id="printable-cotizacion">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-6 border-gray-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-xl">
                  M
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">MINA DESIGN</h1>
                  <p className="text-xs text-gray-500">Diseño, Impresión y Fabricación</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                <p>ventas.minadesign@gmail.com</p>
                <p>Tel: +52 222 123 4567</p>
                <p>Puebla, México</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 font-bold rounded text-xs uppercase tracking-wider">
                {order.tipo === 'COTIZACION' ? 'COTIZACIÓN' : 'PEDIDO'}
              </span>
              <p className="font-mono text-base font-bold text-gray-900">{order.id}</p>
              <p className="text-xs text-gray-500">
                <strong>Fecha:</strong> {order.fecha ? new Date(order.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </p>
              {order.fechaEntrega && (
                <p className="text-xs text-gray-500">
                  <strong>Entrega:</strong> {order.fechaEntrega}
                </p>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Cliente</span>
              <p className="font-semibold text-gray-900 text-sm">{order.cliente}</p>
              {order.telefono && <p className="text-xs text-gray-600">Tel: {order.telefono}</p>}
              {order.correo && <p className="text-xs text-gray-600">Email: {order.correo}</p>}
            </div>

            {order.requiereFactura && (
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 block mb-1">Datos Fiscales</span>
                <p className="text-xs text-gray-700"><strong>RFC:</strong> {order.rfc || 'XAXX010101000'}</p>
                <p className="text-xs text-gray-700"><strong>Razón Social:</strong> {order.razonSocial || order.cliente}</p>
                <p className="text-xs text-gray-700"><strong>CP:</strong> {order.cp || '-'} | <strong>Uso:</strong> {order.usoCfdi || 'G03'}</p>
              </div>
            )}
          </div>

          {/* Products Table - Spacious and cleanly separated */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-2.5 px-3 w-16 text-center">Cant</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 w-28 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {order.productos && order.productos.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 text-center font-medium text-gray-700">{prod.cant}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-900">{prod.nombre}</p>
                      {prod.proveedor && (
                        <p className="text-[11px] text-gray-500 mt-0.5">Catálogo / Ref: {prod.proveedor}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">{formatMoney(prod.precioUnitario)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      {formatMoney(prod.cant * prod.precioUnitario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatMoney(order.subtotal || order.total)}</span>
              </div>
              {order.requiereFactura && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>IVA (16%):</span>
                    <span className="font-mono">{formatMoney(order.iva)}</span>
                  </div>
                  {order.retencionIsr > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Retención ISR:</span>
                      <span className="font-mono">-{formatMoney(order.retencionIsr)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="font-mono text-orange-600">{formatMoney(order.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Anticipo / Pagado:</span>
                <span className="font-mono text-emerald-600">{formatMoney(order.pagado)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Saldo Pendiente:</span>
                <span className="font-mono text-rose-600">{formatMoney(order.total - order.pagado)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Payment Instructions */}
          <div className="border-t border-gray-200 pt-4 text-[11px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-700">Términos y Condiciones:</p>
            <p>• Los tiempos de entrega comienzan a partir de la confirmación del anticipo del 50% y visto bueno de diseño.</p>
            <p>• Precios sujetos a cambio sin previo aviso. Esta cotización tiene una vigencia de 15 días naturales.</p>
            <p>• Cuentas para depósito o transferencia disponibles en nuestras formas de pago autorizadas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
