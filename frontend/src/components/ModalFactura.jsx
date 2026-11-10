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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900 text-lg">
              Gestión Fiscal / Facturación
            </h3>
            <span className="text-xs text-[#173865] font-mono font-bold">{order?.id} - {order?.cliente}</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-1.5 text-xs">
            <span className="font-bold text-[#173865] uppercase text-[10px] tracking-wider block">
              Datos Fiscales Registrados
            </span>
            <div className="grid grid-cols-2 gap-2 text-gray-700">
              <div><strong className="text-gray-500">RFC:</strong> {order?.rfc || 'No especificado'}</div>
              <div><strong className="text-gray-500">CP:</strong> {order?.cp || 'No especificado'}</div>
              <div className="col-span-2"><strong className="text-gray-500">Razón Social:</strong> {order?.razonSocial || order?.cliente}</div>
              <div><strong className="text-gray-500">Régimen:</strong> {order?.regimenFiscal || 'General'}</div>
              <div><strong className="text-gray-500">Uso CFDI:</strong> {order?.usoCfdi || 'G03 Gastos en general'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1 pl-2">
                Estado Factura
              </label>
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value)}
                className="select-pill w-full text-xs py-2"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Facturado">Facturado (Emitida)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1 pl-2">
                Fecha Emisión
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-white text-gray-800 border border-gray-200 rounded-full px-4 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#173865] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase block pl-2">
              Comprobante / Archivo Fiscal (PDF / XML)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-[#173865] transition-colors bg-gray-50">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.xml,.zip"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#173865]"
              >
                <Upload className="w-5 h-5" />
                <span className="font-bold">{archivoNombre ? archivoNombre : 'Seleccionar archivo (PDF o XML)'}</span>
                <span className="text-[10px] text-gray-400">Máx 5MB</span>
              </label>
            </div>

            {archivoData && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800 font-bold">
                <span className="truncate max-w-[240px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  {archivoNombre || 'Archivo adjunto'}
                </span>
                <a
                  href={archivoData}
                  download={archivoNombre || 'comprobante_fiscal'}
                  className="p-1 hover:text-[#173865]"
                  title="Descargar comprobante"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Guardando...' : 'Guardar Factura'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
