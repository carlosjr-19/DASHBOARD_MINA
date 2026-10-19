import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Percent, 
  Layers, 
  Building, 
  Tag, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export default function ModalNuevoProducto({
  isOpen,
  onClose,
  onSave,
  editingProduct = null,
  inventario = []
}) {
  const [nombre, setNombre] = useState('');
  const [proveedor, setProveedor] = useState('Propio');
  const [insumos, setInsumos] = useState([]);
  const [precioVenta, setPrecioVenta] = useState('');
  const [margenPorcentaje, setMargenPorcentaje] = useState('');
  const [modoCalculo, setModoCalculo] = useState('precio'); // 'precio' o 'margen'

  // Reset or initialize on open
  useEffect(() => {
    if (editingProduct) {
      setNombre(editingProduct.nombre || '');
      setProveedor(editingProduct.proveedor || 'Propio');
      setInsumos(editingProduct.insumos && editingProduct.insumos.length > 0 
        ? editingProduct.insumos.map(i => ({
            nombre: i.nombre || '',
            detalle: i.detalle || '',
            nota: i.nota || '',
            proveedor: i.proveedor || '',
            metodoPago: i.metodoPago || 'STOCK',
            cant: parseFloat(i.cant) || 1,
            costoUnitario: parseFloat(i.costoUnitario) || 0,
            costo: parseFloat(i.costo) || (parseFloat(i.cant || 1) * parseFloat(i.costoUnitario || 0))
          }))
        : []
      );
      setPrecioVenta(editingProduct.precio ? String(editingProduct.precio) : '');
      setMargenPorcentaje(editingProduct.margen ? String(editingProduct.margen) : '');
      setModoCalculo('precio');
    } else {
      setNombre('');
      setProveedor('Propio');
      setInsumos([
        {
          nombre: '',
          detalle: '',
          nota: '',
          proveedor: '',
          metodoPago: 'STOCK',
          cant: 1,
          costoUnitario: 0,
          costo: 0
        }
      ]);
      setPrecioVenta('');
      setMargenPorcentaje('50');
      setModoCalculo('margen');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Costo Real = suma de todos los insumos
  const costoReal = insumos.reduce((acc, ins) => {
    const cant = parseFloat(ins.cant) || 0;
    const cu = parseFloat(ins.costoUnitario) || 0;
    return acc + (cant * cu);
  }, 0);

  // Manejar cambio de precio de venta -> calcula margen
  const handlePrecioVentaChange = (val) => {
    setPrecioVenta(val);
    setModoCalculo('precio');
    const numPrecio = parseFloat(val) || 0;
    if (costoReal > 0) {
      const ganancia = numPrecio - costoReal;
      const pct = (ganancia / costoReal) * 100;
      setMargenPorcentaje(pct.toFixed(1));
    } else {
      setMargenPorcentaje('0');
    }
  };

  // Manejar cambio de margen % -> calcula precio de venta
  const handleMargenChange = (val) => {
    setMargenPorcentaje(val);
    setModoCalculo('margen');
    const numPct = parseFloat(val) || 0;
    const precioCalc = costoReal * (1 + (numPct / 100));
    setPrecioVenta(precioCalc > 0 ? precioCalc.toFixed(2) : '0');
  };

  // Recalcular si cambia costoReal
  const handleInsumoChange = (idx, field, value) => {
    const updated = [...insumos];
    updated[idx] = { ...updated[idx], [field]: value };
    
    // Auto-fill price & provider if selecting an inventory item
    if (field === 'nombre') {
      const matchInv = inventario.find(inv => inv.nombre.toLowerCase() === value.toLowerCase());
      if (matchInv) {
        if (matchInv.precio) updated[idx].costoUnitario = matchInv.precio;
        if (matchInv.proveedor) updated[idx].proveedor = matchInv.proveedor;
      }
    }

    // Auto-calculate subtotal costo
    const cant = parseFloat(field === 'cant' ? value : updated[idx].cant) || 0;
    const cu = parseFloat(field === 'costoUnitario' ? value : updated[idx].costoUnitario) || 0;
    updated[idx].costo = cant * cu;
    setInsumos(updated);

    // Ajustar precio o margen según modo activo
    const newCostoReal = updated.reduce((acc, i) => acc + ((parseFloat(i.cant) || 0) * (parseFloat(i.costoUnitario) || 0)), 0);
    if (modoCalculo === 'margen') {
      const numPct = parseFloat(margenPorcentaje) || 0;
      const nuevoPrecio = newCostoReal * (1 + (numPct / 100));
      setPrecioVenta(nuevoPrecio > 0 ? nuevoPrecio.toFixed(2) : '0');
    } else {
      const numPrecio = parseFloat(precioVenta) || 0;
      if (newCostoReal > 0) {
        const ganancia = numPrecio - newCostoReal;
        setMargenPorcentaje(((ganancia / newCostoReal) * 100).toFixed(1));
      }
    }
  };

  const addInsumo = () => {
    setInsumos([
      ...insumos,
      {
        nombre: '',
        detalle: '',
        nota: '',
        proveedor: '',
        metodoPago: 'STOCK',
        cant: 1,
        costoUnitario: 0,
        costo: 0
      }
    ]);
  };

  const removeInsumo = (idx) => {
    const updated = insumos.filter((_, i) => i !== idx);
    setInsumos(updated);
    const newCostoReal = updated.reduce((acc, i) => acc + ((parseFloat(i.cant) || 0) * (parseFloat(i.costoUnitario) || 0)), 0);
    if (modoCalculo === 'margen') {
      const numPct = parseFloat(margenPorcentaje) || 0;
      const nuevoPrecio = newCostoReal * (1 + (numPct / 100));
      setPrecioVenta(nuevoPrecio > 0 ? nuevoPrecio.toFixed(2) : '0');
    } else if (newCostoReal > 0) {
      const numPrecio = parseFloat(precioVenta) || 0;
      setMargenPorcentaje((((numPrecio - newCostoReal) / newCostoReal) * 100).toFixed(1));
    }
  };

  const numPrecioFinal = parseFloat(precioVenta) || 0;
  const gananciaNeta = numPrecioFinal - costoReal;
  const margenFinal = costoReal > 0 ? ((gananciaNeta / costoReal) * 100).toFixed(1) : (numPrecioFinal > 0 ? '100' : '0');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingresa el nombre del producto o servicio');
      return;
    }

    const payload = {
      id: editingProduct?.id || null,
      nombre: nombre.trim(),
      proveedor: proveedor.trim() || 'Propio',
      costo: costoReal,
      margen: parseFloat(margenFinal) || 0,
      precio: numPrecioFinal,
      insumos: insumos.map(i => ({
        nombre: i.nombre.trim(),
        detalle: i.detalle?.trim() || '',
        nota: i.nota?.trim() || '',
        proveedor: i.proveedor?.trim() || '',
        metodoPago: i.metodoPago || 'STOCK',
        cant: parseFloat(i.cant) || 1,
        costoUnitario: parseFloat(i.costoUnitario) || 0,
        costo: (parseFloat(i.cant) || 1) * (parseFloat(i.costoUnitario) || 0)
      })).filter(i => i.nombre)
    };

    onSave(payload);
  };

  const formatMoney = (val) => `$${(parseFloat(val) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#18191c] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-[#151618] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">
                {editingProduct ? 'Editar Producto / Servicio' : 'Nuevo Producto o Servicio'}
              </h2>
              <p className="text-xs text-gray-400">
                Define su costo real agregando insumos y calcula tu precio final o ganancia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#141517] p-3.5 rounded-xl border border-gray-800/80">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Nombre del Producto / Servicio <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Taza Mágica 11oz, Letrero Neón, Playera DTF..."
                required
                className="w-full bg-[#1b1c1e] text-xs text-gray-100 px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Proveedor Principal / Sugerido
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej. Propio, Cerámicas G, Tintas Mex..."
                className="w-full bg-[#1b1c1e] text-xs text-gray-100 px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Section 2: Insumos Infinitos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                  Insumos Requeridos para su Elaboración ({insumos.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  Agrega todos los materiales que intervienen para calcular el costo real de fabricación
                </span>
              </div>
              <button
                type="button"
                onClick={addInsumo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            {/* Insumos List / Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#141517]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#18191c] text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
                    <th className="py-2.5 px-3 min-w-[190px]">Nombre Insumo</th>
                    <th className="py-2.5 px-2 min-w-[130px]">Detalle / Medida</th>
                    <th className="py-2.5 px-2 min-w-[120px]">Proveedor</th>
                    <th className="py-2.5 px-2 text-center min-w-[65px]">Cant.</th>
                    <th className="py-2.5 px-2 text-right min-w-[85px]">P. Unit ($)</th>
                    <th className="py-2.5 px-2 text-right min-w-[90px]">Subtotal ($)</th>
                    <th className="py-2.5 px-2 text-center w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {insumos.map((ins, idx) => {
                    const cant = parseFloat(ins.cant) || 0;
                    const cu = parseFloat(ins.costoUnitario) || 0;
                    const subtotal = cant * cu;

                    return (
                      <tr key={idx} className="hover:bg-gray-800/20 transition-colors">
                        {/* Nombre Insumo */}
                        <td className="py-2 px-2.5">
                          <input
                            type="text"
                            list={`inv-list-${idx}`}
                            value={ins.nombre}
                            onChange={(e) => handleInsumoChange(idx, 'nombre', e.target.value)}
                            placeholder="Nombre del insumo..."
                            className="w-full bg-[#1b1c1e] text-xs text-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                          />
                          <datalist id={`inv-list-${idx}`}>
                            {inventario.map((item, iIdx) => (
                              <option key={iIdx} value={item.nombre}>
                                {item.nombre} | ${item.precio} | Stock: {item.stock}
                              </option>
                            ))}
                          </datalist>
                        </td>

                        {/* Detalle */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={ins.detalle}
                            onChange={(e) => handleInsumoChange(idx, 'detalle', e.target.value)}
                            placeholder="11oz, A4, etc."
                            className="w-full bg-[#1b1c1e] text-xs text-gray-300 px-2 py-1.5 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>

                        {/* Proveedor */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={ins.proveedor}
                            onChange={(e) => handleInsumoChange(idx, 'proveedor', e.target.value)}
                            placeholder="Proveedor"
                            className="w-full bg-[#1b1c1e] text-xs text-gray-300 px-2 py-1.5 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>

                        {/* Cantidad */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={ins.cant}
                            onChange={(e) => handleInsumoChange(idx, 'cant', e.target.value)}
                            className="w-16 bg-[#1b1c1e] text-xs text-gray-100 px-1.5 py-1.5 rounded-lg border border-gray-700 text-center font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>

                        {/* Costo Unitario */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={ins.costoUnitario}
                            onChange={(e) => handleInsumoChange(idx, 'costoUnitario', e.target.value)}
                            className="w-20 bg-[#1b1c1e] text-xs text-gray-100 px-1.5 py-1.5 rounded-lg border border-gray-700 text-right font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>

                        {/* Subtotal */}
                        <td className="py-2 px-2 text-right font-mono font-bold text-gray-200">
                          {formatMoney(subtotal)}
                        </td>

                        {/* Eliminar fila */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeInsumo(idx)}
                            disabled={insumos.length === 1}
                            className={`p-1 rounded text-rose-400 hover:bg-rose-950/40 transition-colors ${
                              insumos.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Costo Real, Ganancia y Precio Final */}
          <div className="bg-[#141517] p-4 rounded-xl border border-gray-800 space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Cálculo de Costo Real, Precio y Margen de Ganancia
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Costo Real */}
              <div className="bg-[#1c1d20] p-3 rounded-xl border border-gray-700/80">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Costo Real de Insumos</span>
                <span className="text-xl font-bold font-mono text-gray-100 mt-1 block">
                  {formatMoney(costoReal)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Suma de insumos requeridos</span>
              </div>

              {/* Opción A: Margen de Ganancia Deseado (%) */}
              <div className="bg-[#1c1d20] p-3 rounded-xl border border-gray-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Margen Deseado (%)</span>
                  <Percent className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="any"
                    value={margenPorcentaje}
                    onChange={(e) => handleMargenChange(e.target.value)}
                    placeholder="Ej. 50"
                    className="w-full bg-[#141517] text-base font-bold text-blue-400 px-2.5 py-1.5 rounded-lg border border-blue-500/40 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-blue-400/80 font-bold">%</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Calcula el precio final sugerido</span>
              </div>

              {/* Opción B: Precio Final de Venta ($) */}
              <div className="bg-[#1c1d20] p-3 rounded-xl border border-gray-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Precio Final de Venta ($)</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => handlePrecioVentaChange(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-[#141517] text-base font-bold text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/40 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-emerald-400/80 font-bold">MXN</span>
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">O escribe el precio y calcula ganancia</span>
              </div>
            </div>

            {/* Ganancia Neta Calculada Banner */}
            <div className="bg-[#191b1e] border border-gray-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs text-gray-300 font-medium">
                  Ganancia Neta por Unidad:
                </span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {formatMoney(gananciaNeta)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-gray-400">Rendimiento:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-bold">
                  +{margenFinal}%
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-[#151618] border-t border-gray-800 pt-3 pb-1 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-900/30 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{editingProduct ? 'Actualizar Producto' : 'Guardar en Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
