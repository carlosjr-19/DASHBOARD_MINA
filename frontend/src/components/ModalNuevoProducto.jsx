import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Percent, 
  Layers, 
  Save
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
  const [modoCalculo, setModoCalculo] = useState('precio');
  const [activeInvDropdown, setActiveInvDropdown] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setNombre(editingProduct.nombre || '');
      setProveedor(editingProduct.proveedor || 'Propio');
      setInsumos(editingProduct.insumos && editingProduct.insumos.length > 0 
        ? editingProduct.insumos.map(i => ({
            nombre: i.nombre || '',
            detalle: i.detalle || '',
            medida: i.medida || '',
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
    setActiveInvDropdown(null);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const costoReal = insumos.reduce((acc, ins) => {
    const cant = parseFloat(ins.cant) || 0;
    const cu = parseFloat(ins.costoUnitario) || 0;
    return acc + (cant * cu);
  }, 0);

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

  const handleMargenChange = (val) => {
    setMargenPorcentaje(val);
    setModoCalculo('margen');
    const numPct = parseFloat(val) || 0;
    const precioCalc = costoReal * (1 + (numPct / 100));
    setPrecioVenta(precioCalc > 0 ? precioCalc.toFixed(2) : '0');
  };

  const handleInsumoChange = (idx, field, value) => {
    const updated = [...insumos];
    updated[idx] = { ...updated[idx], [field]: value };
    
    if (field === 'nombre') {
      const matchInv = inventario.find(inv => inv.nombre.toLowerCase() === value.toLowerCase());
      if (matchInv) {
        if (matchInv.precio) updated[idx].costoUnitario = matchInv.precio;
        if (matchInv.proveedor) updated[idx].proveedor = matchInv.proveedor;
      }
    }

    const cant = parseFloat(field === 'cant' ? value : updated[idx].cant) || 0;
    const cu = parseFloat(field === 'costoUnitario' ? value : updated[idx].costoUnitario) || 0;
    updated[idx].costo = cant * cu;
    setInsumos(updated);

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
        medida: '',
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
        medida: i.medida?.trim() || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-modal-in cursor-default" onClick={(e) => { e.stopPropagation(); setActiveInvDropdown(null); }}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {editingProduct ? 'Editar Producto / Servicio' : 'Nuevo Producto / Servicio'}
              </h2>
              <p className="text-xs text-gray-400">
                Define su costo real agregando insumos y calcula tu precio final o ganancia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 pl-2">
                Nombre del Producto / Servicio *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full bg-white text-xs text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173865] font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 pl-2">
                Proveedor Principal / Sugerido
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full bg-white text-xs text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173865] font-bold"
              />
            </div>
          </div>

          {/* Section 2: Insumos */}
          <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-[#173865] block">
                  Insumos Necesarios ({insumos.length})
                </span>
                <span className="text-xs text-gray-500">
                  Agrega todos los materiales que intervienen para calcular el costo real
                </span>
              </div>
              <button
                type="button"
                onClick={addInsumo}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-blue-50 text-[#173865] border border-blue-200 text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            <div className="overflow-visible rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold uppercase text-gray-400">
                    <th className="py-2.5 px-3 min-w-[190px]">Nombre Insumo</th>
                    <th className="py-2.5 px-2 min-w-[130px]">Detalle / Medida</th>
                    <th className="py-2.5 px-2 min-w-[120px]">Proveedor</th>
                    <th className="py-2.5 px-2 text-center min-w-[65px]">Cant.</th>
                    <th className="py-2.5 px-2 text-right min-w-[85px]">P. Unit ($)</th>
                    <th className="py-2.5 px-2 text-right min-w-[90px]">Subtotal ($)</th>
                    <th className="py-2.5 px-2 text-center w-9"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insumos.map((ins, idx) => {
                    const cant = parseFloat(ins.cant) || 0;
                    const cu = parseFloat(ins.costoUnitario) || 0;
                    const subtotal = cant * cu;
                    const filteredInv = inventario.filter(item =>
                      !ins.nombre || item.nombre.toLowerCase().includes(ins.nombre.toLowerCase())
                    );

                    return (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2 px-2.5 relative">
                          <input
                            type="text"
                            value={ins.nombre}
                            onFocus={(e) => { e.stopPropagation(); setActiveInvDropdown(idx); }}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { handleInsumoChange(idx, 'nombre', e.target.value); setActiveInvDropdown(idx); }}
                            className="w-full bg-gray-50 text-xs text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865] font-semibold"
                          />
                          {activeInvDropdown === idx && filteredInv.length > 0 && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-2.5 right-2.5 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-modal-in"
                            >
                              {filteredInv.map((item, iIdx) => (
                                <div
                                  key={iIdx}
                                  onClick={() => { handleInsumoChange(idx, 'nombre', item.nombre); setActiveInvDropdown(null); }}
                                  className="px-3.5 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                                >
                                  <span className="truncate">{item.nombre}</span>
                                  <span className="text-[11px] text-[#173865] font-black ml-2 whitespace-nowrap">${item.precio}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={ins.detalle}
                            onChange={(e) => handleInsumoChange(idx, 'detalle', e.target.value)}
                            className="w-full bg-gray-50 text-xs text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865]"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={ins.proveedor}
                            onChange={(e) => handleInsumoChange(idx, 'proveedor', e.target.value)}
                            className="w-full bg-gray-50 text-xs text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865]"
                          />
                        </td>

                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={ins.cant}
                            onChange={(e) => handleInsumoChange(idx, 'cant', e.target.value)}
                            className="w-16 bg-gray-50 text-xs text-gray-900 px-2 py-1.5 rounded-full border border-gray-200 text-center font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865]"
                          />
                        </td>

                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={ins.costoUnitario}
                            onChange={(e) => handleInsumoChange(idx, 'costoUnitario', e.target.value)}
                            className="w-20 bg-gray-50 text-xs text-gray-900 px-2 py-1.5 rounded-full border border-gray-200 text-right font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865]"
                          />
                        </td>

                        <td className="py-2 px-2 text-right font-black text-gray-900">
                          {formatMoney(subtotal)}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeInsumo(idx)}
                            disabled={insumos.length === 1}
                            className={`w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors ${
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
          <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              Cálculo de Costo Real, Precio y Margen de Ganancia
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Costo Real de Insumos</span>
                <span className="text-xl font-black text-gray-900 mt-1 block">
                  {formatMoney(costoReal)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">Suma de insumos requeridos</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-[#173865]">Margen Deseado (%)</span>
                  <Percent className="w-3.5 h-3.5 text-[#173865]" />
                </div>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    step="any"
                    value={margenPorcentaje}
                    onChange={(e) => handleMargenChange(e.target.value)}
                    className="w-full bg-blue-50/50 text-base font-black text-[#173865] px-4 py-1.5 rounded-full border border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-[#173865] font-bold">%</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-green-700">Precio Final Venta ($)</span>
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => handlePrecioVentaChange(e.target.value)}
                    required
                    className="w-full bg-green-50/60 text-base font-black text-green-700 px-4 py-1.5 rounded-full border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-green-700 font-bold">MXN</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-600 font-bold">
                  Ganancia Neta por Unidad:
                </span>
                <span className="font-black text-base text-green-600">
                  {formatMoney(gananciaNeta)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-semibold">Rendimiento:</span>
                <span className="px-3 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-800 font-black">
                  +{margenFinal}%
                </span>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 pb-1 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
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
