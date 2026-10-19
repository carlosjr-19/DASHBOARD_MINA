import React, { useState } from 'react';
import { X, Upload, CheckCircle2, FileText, Download } from 'lucide-react';

export default function ModalFactura({ order, onClose, onSave }) {
  const [estatus, setEstatus] = useState(order?.facturaEstatus || 'Pendiente');
  const [fecha, setFecha] = useState(order?.facturaFecha || new Date().toISOString().split('T')[0]);
  const [archivoData, setArchivoData] = useState(order?.facturaArchivoData || '');
  const [archivoNombre, setArchivoNombre] = useState(order?.facturaArchivoNombre || '');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoNombre(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setArchivoData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(order.id, {
        facturaEstatus: estatus,
        facturaFecha: fecha,
        facturaArchivoData: archivoData,
        facturaArchivoNombre: archivoNombre
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Error al guardar factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-th-1e2022 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="font-bold text-gray-100 text-sm">
              Gestión Fiscal / Facturación
            </h3>
            <span className="text-xs text-orange-400 font-mono">{order?.id} - {order?.cliente}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Datos Fiscales del Cliente */}
          <div className="bg-th-151617 p-3 rounded-lg border border-gray-800 space-y-1.5 text-xs">
            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider block">
              Datos Fiscales Registrados
            </span>
            <div className="grid grid-cols-2 gap-2 text-gray-300">
              <div><strong className="text-gray-500">RFC:</strong> {order?.rfc || 'No especificado'}</div>
              <div><strong className="text-gray-500">CP:</strong> {order?.cp || 'No especificado'}</div>
              <div className="col-span-2"><strong className="text-gray-500">Razón Social:</strong> {order?.razonSocial || order?.cliente}</div>
              <div><strong className="text-gray-500">Régimen:</strong> {order?.regimenFiscal || 'General'}</div>
              <div><strong className="text-gray-500">Uso CFDI:</strong> {order?.usoCfdi || 'G03 Gastos en general'}</div>
            </div>
          </div>

          {/* Estado de Facturación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">
                Estado Factura
              </label>
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value)}
                className="w-full bg-th-151617 text-gray-200 border border-gray-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Facturado">Facturado (Emitida)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">
                Fecha Emisión
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-th-151617 text-gray-200 border border-gray-700 rounded-lg p-2 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Adjuntar CFDI / PDF / XML */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase block">
              Comprobante / Archivo Fiscal (PDF / XML)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-600 transition-colors bg-th-151617/50">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.xml,.zip"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-orange-400"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <span>{archivoNombre ? archivoNombre : 'Seleccionar archivo (PDF o XML)'}</span>
                <span className="text-[10px] text-gray-500">Máx 5MB</span>
              </label>
            </div>

            {archivoData && (
              <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300">
                <span className="truncate max-w-[240px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  {archivoNombre || 'Archivo adjunto'}
                </span>
                <a
                  href={archivoData}
                  download={archivoNombre || 'comprobante_fiscal'}
                  className="p-1 hover:text-gray-50"
                  title="Descargar comprobante"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-th-17181a border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 bg-gray-800"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 flex items-center gap-1.5 shadow"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Guardando...' : 'Guardar Factura'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
