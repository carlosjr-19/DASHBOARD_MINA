import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  ShoppingBag,
  ChevronDown,
  X
} from 'lucide-react';

export default function CalculadoraView({ 
  materiales = [], 
  onSaveMaterial, 
  onDeleteMaterial,
  onExportarAPedido 
}) {
  const [selectedMatId, setSelectedMatId] = useState(materiales[0]?.id || '');
  const [anchoCm, setAnchoCm] = useState(35);
  const [altoCm, setAltoCm] = useState(35);
  const [cantidad, setCantidad] = useState(1);

  // New material modal
  const [showAddMat, setShowAddMat] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newProveedor, setNewProveedor] = useState('');
  const [newAncho, setNewAncho] = useState(100);
  const [newAlto, setNewAlto] = useState(100);
  const [newCosto, setNewCosto] = useState(100);

  const currentMat = materiales.find(m => String(m.id) === String(selectedMatId)) || materiales[0];

  // Dimensiones del sustrato base en m2
  const anchoBaseM = ((currentMat?.ancho || 100) / 100);
  const altoBaseM = ((currentMat?.alto || 100) / 100);
  const areaBaseM2 = anchoBaseM * altoBaseM;
  const costoPorM2 = areaBaseM2 > 0 ? ((currentMat?.costo || 0) / areaBaseM2) : 0;

  // Dimensiones requeridas por pieza
  const anchoReqM = (parseFloat(anchoCm) || 0) / 100;
  const altoReqM = (parseFloat(altoCm) || 0) / 100;
  const cantNum = Math.max(1, parseFloat(cantidad) || 1);

  const areaPiezaM2 = anchoReqM * altoReqM;
  const areaTotalM2 = areaPiezaM2 * cantNum;

  // Costo proporcional exacto
  const costoPorPieza = areaPiezaM2 * costoPorM2;
  const costoTotal = areaTotalM2 * costoPorM2;

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    try {
      await onSaveMaterial({
        nombre: newNombre.trim(),
        proveedor: newProveedor.trim() || 'Propio',
        ancho: parseFloat(newAncho) || 100,
        alto: parseFloat(newAlto) || 100,
        costo: parseFloat(newCosto) || 0
      });
      setShowAddMat(false);
      setNewNombre('');
      setNewProveedor('');
      setNewCosto(100);
    } catch (err) {
      alert(err.message || 'Error al guardar material');
    }
  };

  const exportar = () => {
    if (onExportarAPedido) {
      onExportarAPedido({
        nombre: `${currentMat?.nombre || 'Cálculo de Área'} (${anchoCm}x${altoCm} cm)`,
        cant: cantNum,
        precioUnitario: costoPorPieza,
        costoUnitario: costoPorPieza,
        proveedor: currentMat?.proveedor || 'Propio',
        insumos: [
          {
            nombre: currentMat?.nombre || 'Material',
            detalle: `${anchoCm}x${altoCm} cm (${areaTotalM2.toFixed(3)} m²)`,
            cant: cantNum,
            costoUnitario: costoPorPieza,
            costo: costoTotal,
            metodoPago: 'STOCK',
            proveedor: currentMat?.proveedor || 'Propio'
          }
        ]
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Grid matching structure from Images 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Base de Materiales */}
        <div className="lg:col-span-7 xl:col-span-7 bg-[#1c1d1f] p-4 sm:p-5 rounded-2xl border border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-100">
                Base de Materiales
              </h2>
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {materiales.length} {materiales.length === 1 ? 'material registrado' : 'materiales registrados'}
              </span>
            </div>

            <button
              onClick={() => setShowAddMat(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#17253a] hover:bg-orange-600 text-blue-300 hover:text-white border border-blue-900/60 hover:border-orange-500 shadow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Agregar Material</span>
            </button>
          </div>

          {/* Table matching reference image structure */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] sm:text-[11px] font-bold uppercase text-gray-400 border-b border-gray-800/60">
                  <th className="py-2.5 px-3">MATERIAL</th>
                  <th className="py-2.5 px-3 text-center">PROVEEDOR</th>
                  <th className="py-2.5 px-3 text-center">MEDIDA (CM)</th>
                  <th className="py-2.5 px-3 text-right">COSTO BASE</th>
                  <th className="py-2.5 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {materiales.length > 0 ? (
                  materiales.map((m) => {
                    const isSelected = String(m.id) === String(selectedMatId || currentMat?.id);

                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMatId(m.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-600/15 text-orange-200'
                            : 'hover:bg-gray-800/40 text-gray-200'
                        }`}
                        title="Haz clic para cargar en la Calculadora Rápida"
                      >
                        <td className="py-3 px-3 font-bold text-gray-100">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            )}
                            <span>{m.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-400">
                          {m.proveedor || 'Propio'}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-300">
                          <span className="bg-[#141517] px-2 py-0.5 rounded text-[11px] border border-gray-800 font-medium">
                            {m.ancho || 0}x{m.alto || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-100">
                          {formatMoney(m.costo)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {onDeleteMaterial && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMaterial(m.id);
                              }}
                              className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                              title="Eliminar material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No hay materiales registrados. Agrega uno con el botón superior.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Calculadora Rápida */}
        <div className="lg:col-span-5 xl:col-span-5 bg-[#1c1d1f] p-4 sm:p-5 rounded-2xl border border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-800/80">
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-100">
              Calculadora Rápida
            </h2>
          </div>

          {/* Selector de Material */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">
              Seleccionar Material
            </label>
            <div className="relative">
              <select
                value={selectedMatId || currentMat?.id || ''}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="w-full bg-[#151617] text-gray-100 p-3 rounded-xl border border-gray-700 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none appearance-none pr-9 cursor-pointer"
              >
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} | {m.proveedor || 'Propio'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>

            {currentMat && (
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-0.5">
                <span>
                  Medida del material: <span className="font-semibold text-gray-200">{currentMat.ancho || 0} CM X {currentMat.alto || 0} CM</span>
                </span>
                <span>
                  Costo base: <span className="font-semibold text-gray-200">{formatMoney(currentMat.costo)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Inputs Ancho y Alto lado a lado (idéntico a Imagen 2 y 3) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-gray-400 text-center block mb-1">
                Ancho (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={anchoCm}
                onChange={(e) => setAnchoCm(e.target.value)}
                className="w-full bg-[#151617] text-gray-100 p-3 rounded-xl border border-gray-700 font-bold text-center text-sm focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 text-center block mb-1">
                Alto (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={altoCm}
                onChange={(e) => setAltoCm(e.target.value)}
                className="w-full bg-[#151617] text-gray-100 p-3 rounded-xl border border-gray-700 font-bold text-center text-sm focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Tarjeta de Resultado Principal (Costo Proporcional del Área) */}
          <div className="rounded-2xl bg-gradient-to-br from-[#122238] to-[#0d1624] border border-blue-900/60 p-5 text-center shadow-lg relative overflow-hidden">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-300 tracking-wider block mb-1">
              Costo Proporcional del Área
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {formatMoney(costoTotal)}
            </div>
            <div className="text-[11px] text-blue-200/60 mt-2 flex items-center justify-center gap-2">
              <span>Área: {areaTotalM2.toFixed(3)} m²</span>
              <span>•</span>
              <span>Costo m²: {formatMoney(costoPorM2)}</span>
            </div>
          </div>

          {/* Botón Exportar a Pedido */}
          {onExportarAPedido && (
            <button
              onClick={exportar}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>Exportar a Pedido Activo</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para Agregar Material */}
      {showAddMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1c1d1f] border border-gray-700 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-gray-100 text-base">Nuevo Material / Sustrato</h3>
              <button
                type="button"
                onClick={() => setShowAddMat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Nombre del Material *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lona Front 13oz, DTF textil, Vinil..."
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-[#151617] text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej. Gráficos SA, Tintas Mex..."
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value)}
                  className="w-full bg-[#151617] text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Ancho base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100"
                    value={newAncho}
                    onChange={(e) => setNewAncho(e.target.value)}
                    className="w-full bg-[#151617] text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Largo base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100"
                    value={newAlto}
                    onChange={(e) => setNewAlto(e.target.value)}
                    className="w-full bg-[#151617] text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Costo Base total ($ MXN) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="100.00"
                  value={newCosto}
                  onChange={(e) => setNewCosto(e.target.value)}
                  className="w-full bg-[#151617] text-gray-100 p-2.5 rounded-lg border border-gray-700 text-emerald-400 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddMat(false)}
                  className="px-3.5 py-2 rounded-lg text-gray-400 hover:text-white bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
