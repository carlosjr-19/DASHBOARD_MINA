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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-th-1e2022 border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-100 text-sm">
            Cambiar Estatus: <span className="text-orange-400 font-mono">{order?.id}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Seleccionar Nuevo Estado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ESTADOS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                    selectedStatus === st
                      ? 'bg-orange-600/30 text-orange-300 border-orange-500 ring-1 ring-orange-500'
                      : 'bg-th-151617 text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {selectedStatus === 'Entregado' && (
            <div className="space-y-1.5 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Fecha de Entrega
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full bg-th-121314 text-xs text-gray-200 border border-emerald-900/60 rounded p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {selectedStatus === 'Cancelado' && (
            <div className="space-y-1.5 bg-rose-950/20 p-3 rounded-lg border border-rose-900/40">
              <label className="text-xs font-semibold text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Motivo de Cancelación
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={2}
                className="w-full bg-th-121314 text-xs text-gray-200 border border-rose-900/60 rounded p-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="p-3 bg-th-17181a border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 flex items-center gap-1.5 shadow"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{loading ? 'Guardando...' : 'Actualizar Estado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
