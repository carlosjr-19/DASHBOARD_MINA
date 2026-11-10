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

  // Custom pill dropdown estado para materiales (igual a ref_site.html)
  const [matDropdownOpen, setMatDropdownOpen] = useState(false);

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

  // 1. Costo Real
  const costoBaseProveedor = parseFloat(currentMat?.costo) || 0;
  const costoRealPieza = costoBaseProveedor * factorProporcion;
  const costoRealTotal = costoRealPieza * cantNum;

  // 2. Costo al Cliente
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Base de Materiales */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Base de Materiales
              </h2>
              <span className="text-xs text-gray-400 block mt-0.5">
                {materiales.length} {materiales.length === 1 ? 'material registrado' : 'materiales registrados'}
              </span>
            </div>

            <button
              onClick={() => setShowAddMat(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#173865] hover:bg-blue-900 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Material</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3 text-center">Proveedor</th>
                  <th className="py-3 px-3 text-center">Medida (cm)</th>
                  <th className="py-3 px-3 text-center">Costo Prov. ($)</th>
                  <th className="py-3 px-3 text-center">Costo Cliente ($)</th>
                  <th className="py-3 px-3 text-center">Ganancia ($)</th>
                  <th className="py-3 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
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
                            ? 'bg-blue-50/70 text-[#173865]'
                            : 'hover:bg-gray-50/80 text-gray-700'
                        }`}
                        title="Haz clic para cargar en la Calculadora Rápida"
                      >
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#173865] shrink-0" />
                            )}
                            <span>{m.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-gray-500">
                          {m.proveedor || 'Propio'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] text-gray-700 font-semibold">
                            {m.ancho || 0}x{m.alto || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-800">
                          {formatMoney(m.costo)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#173865]">
                          {precCli && precCli > 0 ? formatMoney(precCli) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-green-700">
                          {ganancia !== null ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200">
                              {formatMoney(ganancia)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
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
                              className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
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
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No hay materiales registrados. Agrega uno con el botón superior.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Calculadora Rápida */}
        <div className="lg:col-span-5 bg-gradient-to-b from-white to-blue-50/70 dark:from-gray-900 dark:to-gray-900 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-800 p-6 space-y-4">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-9 h-9 bg-blue-100 text-[#173865] rounded-full flex items-center justify-center shadow-sm">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Calculadora Rápida
            </h2>
          </div>

          {/* Custom Pill Dropdown para Material (exacto ref_site.html) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block pl-2">
              Seleccionar Material
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMatDropdownOpen(!matDropdownOpen)}
                className="w-full bg-white border border-gray-200 rounded-full px-5 py-2.5 text-left text-xs font-bold text-gray-800 shadow-sm flex items-center justify-between hover:border-[#173865] transition focus:outline-none focus:ring-2 focus:ring-[#173865]/20"
              >
                <span className={!currentMat ? 'text-gray-400 font-semibold' : 'text-gray-800 font-bold truncate'}>
                  {currentMat ? `${currentMat.nombre} • ${currentMat.proveedor || 'Propio'}` : 'Elige un material...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${matDropdownOpen ? 'rotate-180 text-[#173865]' : ''}`} />
              </button>

              {matDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMatDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-[26px] shadow-[0_14px_38px_-6px_rgba(23,56,101,0.22)] border border-gray-100 p-1.5 z-40 max-h-56 overflow-y-auto animate-modal-in space-y-0.5">
                    <div
                      onClick={() => { handleSelectMaterial(null); setMatDropdownOpen(false); }}
                      className="px-4 py-2 rounded-full hover:bg-[#eff4ff] cursor-pointer text-xs font-semibold text-gray-500 transition-colors"
                    >
                      -- Sin selección --
                    </div>
                    {materiales.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => { handleSelectMaterial(m); setMatDropdownOpen(false); }}
                        className={`px-4 py-2 rounded-full hover:bg-[#eff4ff] cursor-pointer text-xs font-bold flex justify-between items-center transition-colors ${
                          String(selectedMatId) === String(m.id) ? 'bg-[#eff4ff] text-[#173865]' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{m.nombre}</span>
                          <span className="text-[10px] text-gray-400 font-normal">{m.proveedor || 'Propio'}</span>
                        </div>
                        <span className="text-xs text-[#173865] font-black ml-2 whitespace-nowrap">{formatMoney(m.costo)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {currentMat ? (
              <div className="flex items-center justify-between text-[11px] text-gray-500 px-2 pt-0.5">
                <span>
                  Medida base: <strong className="text-gray-800">{currentMat.ancho || 0} x {currentMat.alto || 0} cm</strong>
                </span>
                <span>
                  Costo base: <strong className="text-gray-800">{formatMoney(currentMat.costo)}</strong>
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 italic px-2 pt-0.5">
                Selecciona un material de la lista o de la tabla izquierda
              </div>
            )}
          </div>

          {/* Fila 1: Ancho, Alto y Costo Real */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[11px] text-gray-600 text-center block mb-1 font-bold">
                Ancho (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={anchoCm}
                onChange={(e) => setAnchoCm(e.target.value)}
                className="w-full bg-white text-gray-900 py-2 px-3 rounded-full border border-gray-200 font-bold text-center text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 text-center block mb-1 font-bold">
                Alto (cm)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={altoCm}
                onChange={(e) => setAltoCm(e.target.value)}
                className="w-full bg-white text-gray-900 py-2 px-3 rounded-full border border-gray-200 font-bold text-center text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#173865] text-center block mb-1 font-bold">
                Costo Real
              </label>
              <input
                type="text"
                readOnly
                value={formatMoney(currentMat ? costoRealTotal : 0)}
                className="w-full bg-blue-50 text-[#173865] py-2 px-3 rounded-full border border-blue-200 font-black text-center text-sm focus:outline-none cursor-default select-none"
              />
            </div>
          </div>

          {/* Fila 2: Costo Base al Cliente */}
          <div>
            <div className="flex items-center justify-between mb-1 px-2">
              <label className="text-xs text-gray-700 font-bold">
                Costo Base al Cliente ($)
              </label>
              {currentMat && (
                <span className="text-[10px] text-gray-400">
                  (Por {baseAncho} x {baseAlto} cm)
                </span>
              )}
            </div>
            <div className="flex items-center bg-white rounded-full border border-gray-200 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#173865]">
              <span className="text-[#173865] font-bold text-xs mr-1.5 select-none">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={costoBaseCliente}
                onChange={(e) => setCostoBaseCliente(e.target.value)}
                className="w-full bg-transparent text-[#173865] border-none p-0 font-black text-sm outline-none"
              />
            </div>
          </div>

          {/* Tarjeta de Resultados Compacta */}
          <div className="rounded-3xl bg-[#173865] p-5 text-white shadow-lg space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider block mb-0.5">
                  Precio Final Cliente
                </span>
                <div className="text-xl font-black text-white">
                  {currentMat && costoBaseClienteNum > 0 ? formatMoney(precioClienteTotal) : '$0.00'}
                </div>
                <span className="text-[10px] text-blue-200 block mt-0.5">
                  {currentMat ? `Para ${reqAncho} x ${reqAlto} cm` : 'Sin material'}
                </span>
              </div>

              <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-400/30">
                <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider block mb-0.5">
                  Ganancia Estimada
                </span>
                <div className="text-xl font-black text-emerald-300">
                  {currentMat && costoBaseClienteNum > 0 ? formatMoney(gananciaEstimada) : '$0.00'}
                </div>
                <span className="text-[10px] text-emerald-200 block mt-0.5">
                  Margen: {currentMat && precioClienteTotal > 0 ? margenPorcentaje.toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-around text-[11px] text-blue-100 flex-wrap gap-1">
              <span>Área: <strong className="text-white">{currentMat ? areaTotalM2.toFixed(3) : '0.000'} m²</strong></span>
              <span>•</span>
              <span>Real: <strong className="text-white">{formatMoney(currentMat ? costoPorM2Real : 0)}/m²</strong></span>
              <span>•</span>
              <span>Cliente: <strong className="text-emerald-300">{formatMoney(currentMat ? costoPorM2Cliente : 0)}/m²</strong></span>
            </div>
          </div>

          {onExportarAPedido && (
            <button
              onClick={exportar}
              disabled={!currentMat}
              className={`w-full py-3 px-5 rounded-full text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                currentMat 
                  ? 'bg-[#173865] hover:bg-blue-900 text-white active:scale-95 cursor-pointer hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Exportar a Pedido Activo</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para Agregar Material */}
      {showAddMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setShowAddMat(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-gray-900 text-lg">Agregar Material Base</h3>
              <button
                type="button"
                onClick={() => setShowAddMat(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">Nombre del Material *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173865]"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">Proveedor</label>
                <input
                  type="text"
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173865]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Ancho Base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAncho}
                    onChange={(e) => setNewAncho(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-center font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Largo Base (cm) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAlto}
                    onChange={(e) => setNewAlto(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-center font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Costo Proveedor ($) *</label>
                  <div className="flex items-center bg-white rounded-full border border-gray-200 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#173865]">
                    <span className="text-gray-400 font-bold text-xs mr-1 select-none">$</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newCosto}
                      onChange={(e) => setNewCosto(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-gray-800 font-bold outline-none text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Precio Cliente ($)</label>
                  <div className="flex items-center bg-white rounded-full border border-gray-200 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#173865]">
                    <span className="text-[#173865] font-bold text-xs mr-1 select-none">$</span>
                    <input
                      type="number"
                      step="any"
                      value={newPrecioCliente}
                      onChange={(e) => setNewPrecioCliente(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[#173865] font-bold outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMat(false)}
                  className="flex-1 py-3 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full bg-[#173865] hover:bg-blue-900 text-white font-bold transition-all shadow-md"
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
