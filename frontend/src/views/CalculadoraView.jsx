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
  const [selectedMatId, setSelectedMatId] = useState('');
  const [anchoCm, setAnchoCm] = useState(100);
  const [altoCm, setAltoCm] = useState(100);
  const [cantidad, setCantidad] = useState(1);
  const [costoBaseCliente, setCostoBaseCliente] = useState('');

  // New material modal
  const [showAddMat, setShowAddMat] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newProveedor, setNewProveedor] = useState('');
  const [newAncho, setNewAncho] = useState(100);
  const [newAlto, setNewAlto] = useState(100);
  const [newCosto, setNewCosto] = useState(100);
  const [newPrecioCliente, setNewPrecioCliente] = useState('');

  const currentMat = selectedMatId 
    ? (materiales.find(m => String(m.id) === String(selectedMatId)) || null) 
    : null;

  const handleSelectMaterial = (mat) => {
    if (!mat) {
      setSelectedMatId('');
      setCostoBaseCliente('');
      return;
    }
    setSelectedMatId(mat.id);
    const pCli = mat.precioCliente ?? mat.precio_cliente;
    setCostoBaseCliente(pCli && pCli > 0 ? String(pCli) : '');
    if (mat.ancho) setAnchoCm(mat.ancho);
    if (mat.alto) setAltoCm(mat.alto);
  };

  // Dimensiones del material base
  const baseAncho = parseFloat(currentMat?.ancho) || 100;
  const baseAlto = parseFloat(currentMat?.alto) || 100;
  const baseAreaCm2 = baseAncho * baseAlto;
  const baseAreaM2 = baseAreaCm2 / 10000;

  // Medidas especificadas por el usuario
  const reqAncho = parseFloat(anchoCm) || 0;
  const reqAlto = parseFloat(altoCm) || 0;
  const cantNum = Math.max(1, parseFloat(cantidad) || 1);

  const reqAreaCm2 = reqAncho * reqAlto;
  const areaPiezaM2 = reqAreaCm2 / 10000;
  const areaTotalM2 = areaPiezaM2 * cantNum;

  // Factor de proporción de área respecto al material base
  const factorProporcion = (currentMat && baseAreaCm2 > 0) ? (reqAreaCm2 / baseAreaCm2) : 0;

  // 1. Costo Real (lo que a ti te cuesta proporcionalmente al costo base del proveedor)
  const costoBaseProveedor = parseFloat(currentMat?.costo) || 0;
  const costoRealPieza = costoBaseProveedor * factorProporcion;
  const costoRealTotal = costoRealPieza * cantNum;

  // 2. Costo al Cliente (calculado proporcionalmente según el costo base de venta que tú definas)
  const costoBaseClienteNum = parseFloat(costoBaseCliente) || 0;
  const precioClientePieza = costoBaseClienteNum * factorProporcion;
  const precioClienteTotal = precioClientePieza * cantNum;

  // 3. Ganancia Estimada y Métricas
  const gananciaEstimada = precioClienteTotal > 0 ? (precioClienteTotal - costoRealTotal) : 0;
  const margenPorcentaje = precioClienteTotal > 0 ? ((gananciaEstimada / precioClienteTotal) * 100) : 0;
  const costoPorM2Real = (currentMat && baseAreaM2 > 0) ? (costoBaseProveedor / baseAreaM2) : 0;
  const costoPorM2Cliente = (currentMat && baseAreaM2 > 0) ? (costoBaseClienteNum / baseAreaM2) : 0;

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    try {
      const nuevoMat = {
        nombre: newNombre.trim(),
        proveedor: newProveedor.trim() || 'Propio',
        ancho: parseFloat(newAncho) || 100,
        alto: parseFloat(newAlto) || 100,
        costo: parseFloat(newCosto) || 0,
        precioCliente: parseFloat(newPrecioCliente) || 0,
        precio_cliente: parseFloat(newPrecioCliente) || 0
      };
      await onSaveMaterial(nuevoMat);
      setShowAddMat(false);
      setNewNombre('');
      setNewProveedor('');
      setNewCosto(100);
      setNewPrecioCliente('');
    } catch (err) {
      alert(err.message || 'Error al guardar material');
    }
  };

  const exportar = () => {
    if (!currentMat) return;
    if (onExportarAPedido) {
      const precioUnit = cantNum > 0 ? (precioClienteTotal / cantNum) : precioClienteTotal;
      const costoUnit = cantNum > 0 ? (costoRealTotal / cantNum) : costoRealTotal;
      onExportarAPedido({
        nombre: `${currentMat?.nombre || 'Cálculo de Área'} (${reqAncho}x${reqAlto} cm)`,
        cant: cantNum,
        precioUnitario: precioUnit,
        costoUnitario: costoUnit,
        proveedor: currentMat?.proveedor || 'Propio',
        insumos: [
          {
            nombre: currentMat?.nombre || 'Material',
            detalle: `${reqAncho}x${reqAlto} cm`,
            medida: `${reqAncho}x${reqAlto} cm`,
            cant: cantNum,
            costoUnitario: costoUnit,
            costo: costoRealTotal,
            metodoPago: 'STOCK',
            proveedor: currentMat?.proveedor || 'Propio'
          }
        ]
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 2-Column Grid matching structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Base de Materiales */}
        <div className="lg:col-span-7 xl:col-span-7 bg-th-1c1d1f p-4 sm:p-5 rounded-2xl border border-gray-800 shadow-sm space-y-4">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-th-17253a hover:bg-orange-600 text-blue-300 hover:text-white border border-blue-900/60 hover:border-orange-500 shadow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-current" />
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
                  <th className="py-2.5 px-3 text-center">COSTO BASE PROVEEDOR ($)</th>
                  <th className="py-2.5 px-3 text-center">COSTO BASE CLIENTE ($)</th>
                  <th className="py-2.5 px-3 text-center">GANANCIA ($)</th>
                  <th className="py-2.5 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {materiales.length > 0 ? (
                  materiales.map((m) => {
                    const isSelected = Boolean(selectedMatId && String(m.id) === String(selectedMatId));
                    const precCli = m.precioCliente ?? m.precio_cliente;
                    const costoNum = parseFloat(m.costo) || 0;
                    const ganancia = precCli && precCli > 0 ? (precCli - costoNum) : null;

                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleSelectMaterial(m)}
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
                          <span className="bg-th-141517 px-2 py-0.5 rounded text-[11px] border border-gray-800 font-medium">
                            {m.ancho || 0}x{m.alto || 0}
                          </span>
                        </td>
                        {/* Costo Base Proveedor ($) Centrado */}
                        <td className="py-3 px-3 text-center font-bold text-gray-100 font-mono">
                          {formatMoney(m.costo)}
                        </td>
                        {/* Costo Base Cliente ($) Centrado */}
                        <td className="py-3 px-3 text-center font-bold text-orange-400 font-mono">
                          {precCli && precCli > 0 ? formatMoney(precCli) : <span className="text-gray-600">-</span>}
                        </td>
                        {/* Ganancia ($) en Verde Centrada */}
                        <td className="py-3 px-3 text-center font-bold text-emerald-400 font-mono">
                          {ganancia !== null ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                              {formatMoney(ganancia)}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {onDeleteMaterial && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedMatId && String(m.id) === String(selectedMatId)) {
                                  handleSelectMaterial(null);
                                }
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
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No hay materiales registrados. Agrega uno con el botón superior.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Calculadora Rápida */}
        <div className="lg:col-span-5 xl:col-span-5 bg-th-1c1d1f p-4 sm:p-5 rounded-2xl border border-gray-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-800/80">
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-100">
              Calculadora Rápida
            </h2>
          </div>

          {/* Selector de Material */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 block">
              Seleccionar Material
            </label>
            <div className="relative">
              <select
                value={selectedMatId || ''}
                onChange={(e) => {
                  const found = materiales.find(m => String(m.id) === String(e.target.value));
                  handleSelectMaterial(found || null);
                }}
                className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-xl border border-gray-700 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none appearance-none pr-9 cursor-pointer"
              >
                <option value="">-- Seleccionar Material --</option>
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} | {m.proveedor || 'Propio'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {currentMat ? (
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-0.5">
                <span>
                  Medida del material: <span className="font-semibold text-gray-200">{currentMat.ancho || 0} CM X {currentMat.alto || 0} CM</span>
                </span>
                <span>
                  Costo base: <span className="font-semibold text-gray-200">{formatMoney(currentMat.costo)}</span>
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-gray-500 italic px-1 pt-0.5">
                Selecciona un material de la lista o de la tabla izquierda para comenzar a calcular
              </div>
            )}
          </div>

          {/* Fila 1: Tres columnas: Ancho, Alto y Costo Real */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] text-gray-400 text-center block mb-1 font-semibold">
                Ancho (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={anchoCm}
                onChange={(e) => setAnchoCm(e.target.value)}
                className="w-full bg-th-151617 text-gray-100 py-2 px-2 rounded-xl border border-gray-700 font-bold text-center text-xs sm:text-sm focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 text-center block mb-1 font-semibold">
                Alto (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={altoCm}
                onChange={(e) => setAltoCm(e.target.value)}
                className="w-full bg-th-151617 text-gray-100 py-2 px-2 rounded-xl border border-gray-700 font-bold text-center text-xs sm:text-sm focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-blue-400 text-center block mb-1 font-semibold">
                Costo Real
              </label>
              <input
                type="text"
                readOnly
                value={formatMoney(currentMat ? costoRealTotal : 0)}
                className="w-full bg-th-151617 text-blue-400 py-2 px-2 rounded-xl border border-gray-700 font-bold text-center text-xs sm:text-sm font-mono focus:outline-none cursor-default select-none"
              />
            </div>
          </div>

          {/* Fila 2: Costo Base al Cliente */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300 font-semibold">
                Costo Base al Cliente ($)
              </label>
              {currentMat && (
                <span className="text-[10px] text-gray-400">
                  (Por {baseAncho} x {baseAlto} cm)
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-orange-400 font-mono font-bold text-xs select-none">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={costoBaseCliente}
                onChange={(e) => setCostoBaseCliente(e.target.value)}
                className="w-full bg-th-151617 text-orange-400 pl-7 pr-3 py-2 rounded-xl border border-gray-700 font-bold text-sm focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Tarjeta de Resultados Compacta: Precio Final Cliente (Naranja), Ganancia (Verde), Área y Costo m2 */}
          <div className="rounded-xl bg-gradient-to-br from-th-122238 to-th-0d1624 border border-blue-900/60 p-3.5 shadow-md space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5 text-center">
              {/* Precio Final al Cliente (en NARANJA) */}
              <div className="bg-orange-950/30 p-2.5 rounded-lg border border-orange-900/40">
                <span className="text-[10px] uppercase font-bold text-orange-300 tracking-wider block mb-0.5">
                  Precio Final Cliente
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-orange-500 font-mono">
                  {currentMat && costoBaseClienteNum > 0 ? formatMoney(precioClienteTotal) : '$0.00'}
                </div>
                <span className="text-[9px] text-orange-300/70 block mt-0.5">
                  {currentMat ? `Para ${reqAncho} x ${reqAlto} cm` : 'Sin material seleccionado'}
                </span>
              </div>

              {/* Tu Ganancia Estimada (en VERDE) */}
              <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block mb-0.5">
                  Ganancia Estimada
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-emerald-500 font-mono">
                  {currentMat && costoBaseClienteNum > 0 ? formatMoney(gananciaEstimada) : '$0.00'}
                </div>
                <span className="text-[9px] text-emerald-300/70 block mt-0.5">
                  Margen: {currentMat && precioClienteTotal > 0 ? margenPorcentaje.toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            {/* Fila de Métricas Técnicas: Área y Costo por m2 */}
            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-around text-[10px] sm:text-[11px] text-blue-200/80 font-mono flex-wrap gap-1">
              <span>Área: <strong className="text-gray-100">{currentMat ? areaTotalM2.toFixed(3) : '0.000'} m²</strong></span>
              <span>•</span>
              <span>Costo Real: <strong className="text-gray-100">{formatMoney(currentMat ? costoPorM2Real : 0)}/m²</strong></span>
              <span>•</span>
              <span>Costo Cliente: <strong className="text-orange-400">{formatMoney(currentMat ? costoPorM2Cliente : 0)}/m²</strong></span>
            </div>
          </div>

          {/* Botón Exportar a Pedido */}
          {onExportarAPedido && (
            <button
              onClick={exportar}
              disabled={!currentMat}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 ${
                currentMat 
                  ? 'bg-orange-600 hover:bg-orange-500 text-white active:scale-95 cursor-pointer' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-current" />
              <span>Exportar a Pedido Activo</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para Agregar Material */}
      {showAddMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-th-1c1d1f border border-gray-700 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-gray-100 text-base">Nuevo Material / Sustrato</h3>
              <button
                type="button"
                onClick={() => setShowAddMat(false)}
                className="text-gray-400 hover:text-gray-50"
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
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Proveedor</label>
                <input
                  type="text"
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value)}
                  className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Ancho base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAncho}
                    onChange={(e) => setNewAncho(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Largo base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAlto}
                    onChange={(e) => setNewAlto(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Costo Base Proveedor ($ MXN) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-blue-400 font-mono font-bold text-xs select-none">$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newCosto}
                      onChange={(e) => setNewCosto(e.target.value)}
                      className="w-full bg-th-151617 text-gray-100 pl-7 pr-2.5 py-2.5 rounded-lg border border-gray-700 text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Precio Base al Cliente ($ MXN)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-orange-400 font-mono font-bold text-xs select-none">$</span>
                    <input
                      type="number"
                      step="any"
                      value={newPrecioCliente}
                      onChange={(e) => setNewPrecioCliente(e.target.value)}
                      className="w-full bg-th-151617 text-gray-100 pl-7 pr-2.5 py-2.5 rounded-lg border border-gray-700 text-orange-400 font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddMat(false)}
                  className="px-3.5 py-2 rounded-lg text-gray-400 hover:text-gray-50 bg-gray-800 transition-colors"
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
