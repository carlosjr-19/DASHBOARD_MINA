import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

const ESTADOS = [
  'Pendiente',
  'En Producción',
  'En Progreso',
  'Completado',
  'Entregado',
  'Cancelado'
];

export default function ModalCambiarEstatus({ order, onClose, onSave }) {
  const [selectedStatus, setSelectedStatus] = useState(order?.estatus || 'Pendiente');
  const [motivoCancelacion, setMotivoCancelacion] = useState(order?.motivoCancelacion || '');
  const [fechaEntrega, setFechaEntrega] = useState(
    order?.fechaEntrega || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (selectedStatus === 'Cancelado' && !motivoCancelacion.trim()) {
      alert('Por favor especifica el motivo de la cancelación.');
      return;
    }
    setLoading(true);
    try {
      await onSave(
        order.id, 
        selectedStatus, 
        motivoCancelacion, 
        selectedStatus === 'Entregado' ? fechaEntrega : null
      );
      onClose();
    } catch (err) {
      alert(err.message || 'Error al actualizar estatus');
    } finally {
      setLoading(false);
    }
  };

  const getBtnClasses = (st) => {
    const isSel = selectedStatus === st;
    if (!isSel) return 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
    if (st === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-2 ring-yellow-400 font-black';
    if (st === 'En Producción' || st === 'En Progreso') return 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400 font-black';
    if (st === 'Completado' || st === 'Entregado') return 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-400 font-black';
    return 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400 font-black';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-modal-in cursor-default p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900 text-lg">Cambiar Estatus</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{order?.id} - {order?.cliente}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block pl-1">
              Selecciona el nuevo estatus:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`py-2.5 px-3 rounded-2xl font-bold text-xs border transition-all text-center ${getBtnClasses(st)}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {selectedStatus === 'Entregado' && (
            <div className="space-y-2 bg-green-50 p-4 rounded-2xl border border-green-200">
              <label className="text-xs font-black text-green-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-green-600" />
                ¿Qué día se entregó?
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full bg-white text-sm text-gray-800 border border-green-300 rounded-full px-4 py-2 font-bold shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          )}

          {selectedStatus === 'Cancelado' && (
            <div className="space-y-2 bg-red-50 p-4 rounded-2xl border border-red-200">
              <label className="text-xs font-black text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Motivo de Cancelación
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={2}
                className="w-full bg-white text-xs font-medium text-gray-800 border border-red-300 rounded-2xl p-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{loading ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
