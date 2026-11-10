import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Mail, MapPin } from 'lucide-react';
import minaLogoBlue from '../assets/mina-logo-blue.png';

function formatFechaDDMMYYYY(rawFecha) {
  if (!rawFecha) return '-';
  const clean = String(rawFecha).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  const dt = new Date(rawFecha);
  if (Number.isNaN(dt.getTime())) return String(rawFecha);
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const y = dt.getFullYear();
  return `${d}/${m}/${y}`;
}

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .1 5.37.1 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.23-1.63a11.92 11.92 0 0 0 5.83 1.49h.01c6.59 0 11.96-5.37 11.96-11.96 0-3.2-1.24-6.2-3.51-8.42zM12.07 21.84h-.01a9.89 9.89 0 0 1-5.04-1.38l-.36-.21-3.7.97.99-3.6-.24-.37a9.87 9.87 0 0 1-1.52-5.29c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm5.42-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
    </svg>
  );
}

export default function ModalCotizacionPdf({ order, onClose }) {
  const contentRef = useRef(null);
  const [pageHeightCm, setPageHeightCm] = useState(18);

  useEffect(() => {
    document.body.classList.add('printing-cotizacion');
    return () => {
      document.body.classList.remove('printing-cotizacion');
    };
  }, []);

  const recalcPageHeight = () => {
    if (!contentRef.current) return;
    // 1 CSS inch = 96px -> 1cm = 37.79527559px
    const pxPerCm = 37.79527559;
    const contentPx = contentRef.current.scrollHeight;
    // Margins: top 2cm + bottom 2cm = 4cm, plus 0.6cm safety buffer so it never spills to 2nd page
    const calculatedCm = contentPx / pxPerCm + 4.6;
    const roundedCm = Math.max(12, Math.ceil(calculatedCm * 10) / 10);
    setPageHeightCm(roundedCm);
  };

  useLayoutEffect(() => {
    recalcPageHeight();
    if (!contentRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => recalcPageHeight());
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [order]);

  if (!order) return null;

  const totalArticulosRaw = (order.productos || []).reduce(
    (acc, p) => acc + (parseFloat(p.cant) || 0),
    0
  );
  const totalArticulos = Number.isInteger(totalArticulosRaw)
    ? totalArticulosRaw
    : Number(totalArticulosRaw.toFixed(2));

  const terminosList = (() => {
    const raw = order.terminos;
    if (Array.isArray(raw)) {
      return raw.map((t) => String(t).trim()).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  })();

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return `$${num.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrint = () => {
    recalcPageHeight();
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const saldoPendiente = Math.max(
    0,
    (parseFloat(order.total) || 0) - (parseFloat(order.pagado) || 0)
  );

  return createPortal(
    <div
      className="print-portal-root fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer"
      onClick={onClose}
    >
      {/* Dynamic @page size: Letter landscape width (27.94cm) x proportional height */}
      <style>{`
        @media print {
          @page {
            size: 27.94cm ${pageHeightCm}cm;
            margin: 0;
          }
        }
      `}</style>

      <div
        className="print-modal-card bg-white text-gray-900 w-[96vw] max-w-[27.94cm] rounded-3xl shadow-2xl overflow-hidden my-auto border border-gray-100 animate-modal-in cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar - Hidden during print */}
        <div className="no-print bg-white text-gray-800 px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-gray-900">Vista Previa de Impresión</span>
            <span className="text-xs text-[#173865] bg-blue-50 px-2.5 py-0.5 rounded-full font-mono font-bold">
              ({order.id})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          className="px-6 py-6 sm:p-[2cm] bg-white text-gray-900 text-sm"
          id="printable-cotizacion"
        >
          <div ref={contentRef} className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-5 border-gray-200 gap-4">
              <div>
                <img
                  src={minaLogoBlue}
                  alt="MINA"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#173865] shrink-0" />
                    <span>ventas.minadesign@gmail.com</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5 text-[#173865] shrink-0" />
                    <span>56 4933 2433</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#173865] shrink-0" />
                    <span>Ciudad de México</span>
                  </p>
                </div>
              </div>

              <div className="text-right space-y-1 shrink-0">
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#173865] font-bold rounded-full text-xs uppercase tracking-wider border border-blue-100">
                  {order.tipo === 'COTIZACION' ? 'COTIZACIÓN' : 'PEDIDO'}
                </span>
                <p className="font-mono text-base font-bold text-gray-900">{order.id}</p>
                <p className="text-xs text-gray-600">
                  <strong>Fecha:</strong> {formatFechaDDMMYYYY(order.fecha)}
                </p>
              </div>
            </div>

            {/* Client Info (fuera de recuadro) */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-800">
                  <span className="font-bold text-gray-500">Cliente: </span>
                  <span className="font-bold text-gray-900">{order.cliente}</span>
                </p>
                {(order.telefono || order.correo) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[
                      order.telefono && `Tel: ${order.telefono}`,
                      order.correo && `Email: ${order.correo}`
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
              </div>

              {order.requiereFactura && (
                <div className="text-xs text-gray-600 text-right">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">
                    Datos Fiscales
                  </span>
                  <p>
                    <strong>RFC:</strong> {order.rfc || 'XAXX010101000'} |{' '}
                    <strong>CP:</strong> {order.cp || '-'}
                  </p>
                  <p>
                    <strong>Razón Social:</strong> {order.razonSocial || order.cliente}
                  </p>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-[#173865] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2 w-12 text-center">Item</th>
                    <th className="py-2.5 px-3 w-[38%]">Producto</th>
                    <th className="py-2.5 px-3 w-[24%] text-center">Detalle</th>
                    <th className="py-2.5 px-2 w-20 text-center">Cantidad</th>
                    <th className="py-2.5 px-3 w-28 text-right">P. Unitario</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {order.productos &&
                    order.productos.map((prod, idx) => {
                      const insumoSpecs = (prod.insumos || [])
                        .map((ins) =>
                          [ins.detalle, ins.medida, ins.nota]
                            .map((v) => (v || '').trim())
                            .filter(Boolean)
                            .join(' | ')
                        )
                        .filter(Boolean);

                      const cantNum = parseFloat(prod.cant) || 0;
                      const puNum = parseFloat(prod.precioUnitario) || 0;

                      return (
                        <tr key={idx}>
                          <td className="py-3 px-2 text-center font-mono font-bold text-gray-500 align-top">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 align-top">
                            <p className="font-semibold text-gray-900">{prod.nombre}</p>
                            {insumoSpecs.length > 0 && (
                              <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                                {insumoSpecs.map((spec, sIdx) => (
                                  <p key={sIdx}>{spec}</p>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-center align-top">
                            {prod.nota ? prod.nota : '—'}
                          </td>
                          <td className="py-3 px-2 text-center font-medium text-gray-700 align-top">
                            {prod.cant}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-700 align-top whitespace-nowrap">
                            {formatMoney(puNum)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 align-top whitespace-nowrap">
                            {formatMoney(cantNum * puNum)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#173865] text-white text-xs font-bold">
                    <td colSpan={6} className="py-2.5 px-3 text-right">
                      Total: {totalArticulos}{' '}
                      {totalArticulos === 1 ? 'artículo' : 'artículos'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Financial Summary - 2cm de separación del último ítem de la tabla */}
            <div className="flex justify-end" style={{ marginTop: '2cm' }}>
              <div className="w-80 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">
                    {formatMoney(order.subtotal || order.total)}
                  </span>
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
                        <span className="font-mono">
                          -{formatMoney(order.retencionIsr)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-baseline font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="font-mono font-bold text-base text-[#173865]">
                    {formatMoney(order.total)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-semibold text-gray-600 pt-1">
                  <span>Anticipo / Pagado:</span>
                  <span className="font-mono font-bold text-base text-green-600">
                    {formatMoney(order.pagado)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-semibold text-gray-700">
                  <span>Saldo Pendiente:</span>
                  <span className="font-mono font-bold text-base text-red-600">
                    {formatMoney(saldoPendiente)}
                  </span>
                </div>
              </div>
            </div>

            {/* Términos y Condiciones (Solo si se agregaron) */}
            {terminosList.length > 0 && (
              <div className="border-t border-gray-200 pt-4 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Términos y Condiciones:</p>
                {terminosList.map((term, idx) => (
                  <p key={idx}>• {term}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
