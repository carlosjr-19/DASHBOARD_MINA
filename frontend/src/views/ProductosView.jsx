import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  DollarSign, 
  TrendingUp, 
  Boxes, 
  Tag, 
  Building 
} from 'lucide-react';

export default function ProductosView({
  catalogo = [],
  onOpenNuevoProducto,
  onEditProducto,
  onDeleteProducto
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filtrado por búsqueda
  const filtered = catalogo.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchNombre = (p.nombre || '').toLowerCase().includes(term);
    const matchProv = (p.proveedor || '').toLowerCase().includes(term);
    return matchNombre || matchProv;
  });

  // Métricas financieras del catálogo
  const totalItems = catalogo.length;
  const costoPromedio = totalItems > 0 ? catalogo.reduce((acc, p) => acc + (parseFloat(p.costo) || 0), 0) / totalItems : 0;
  const precioPromedio = totalItems > 0 ? catalogo.reduce((acc, p) => acc + (parseFloat(p.precio) || 0), 0) / totalItems : 0;
  const gananciaPromedio = precioPromedio - costoPromedio;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatMoney = (val) => `$${(parseFloat(val) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Catálogo Activo</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{totalItems}</span>
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Costo Promedio</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-gray-200">{formatMoney(costoPromedio)}</span>
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Precio Venta Promedio</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-orange-400">{formatMoney(precioPromedio)}</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Ganancia Promedio</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-emerald-400">{formatMoney(gananciaPromedio)}</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Add Product */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-th-18191b p-3 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-th-121314 text-xs text-gray-100 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={onOpenNuevoProducto}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Nuevo Producto / Servicio</span>
        </button>
      </div>

      {/* Product List Table matching Imagen 2 */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-th-161719 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-th-131416 text-[10px] sm:text-[11px] font-bold uppercase text-gray-400">
              <th className="py-3 px-2 w-8 text-center"></th>
              <th className="py-3 px-3 min-w-[200px]">PRODUCTO / SERVICIO</th>
              <th className="py-3 px-3 text-center min-w-[130px]">PROVEEDOR</th>
              <th className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px]">COSTO REAL</th>
              <th className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px]">MARGEN %</th>
              <th className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px]">GANANCIA</th>
              <th className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px]">PRECIO FINAL</th>
              <th className="py-3 px-3 text-center w-24 min-w-[90px]">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length > 0 ? (
              filtered.map((prod) => {
                const isExp = expandedId === prod.id;
                const insumos = prod.insumos || [];
                const costo = parseFloat(prod.costo) || 0;
                const precio = parseFloat(prod.precio) || 0;
                const ganancia = precio - costo;
                const margenPct = costo > 0 ? Math.round((ganancia / costo) * 100) : (precio > 0 ? 100 : 0);

                return (
                  <React.Fragment key={prod.id || prod.nombre}>
                    {/* Main Product Row */}
                    <tr 
                      onClick={() => toggleExpand(prod.id)}
                      className="hover:bg-gray-800/40 cursor-pointer transition-colors text-xs"
                    >
                      {/* Chevron */}
                      <td className="py-3 px-2 text-center text-gray-400">
                        <button
                          type="button"
                          className="p-1 hover:text-gray-50 rounded transition-colors"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(prod.id); }}
                        >
                          {isExp ? (
                            <ChevronDown className="w-4 h-4 text-orange-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Producto / Servicio */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-100 text-sm">{prod.nombre}</span>
                      </td>

                      {/* Proveedor (Centrado) */}
                      <td className="py-3 px-3 text-center text-gray-400">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-800/60 border border-gray-700/60 text-gray-300">
                          {prod.proveedor || 'Propio'}
                        </span>
                      </td>

                      {/* Costo Real (Centrado) */}
                      <td className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px] font-mono font-bold text-gray-200">
                        {formatMoney(costo)}
                      </td>

                      {/* Margen % (Centrado) */}
                      <td className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px] font-mono font-medium text-gray-300">
                        {margenPct}%
                      </td>

                      {/* Ganancia (Centrado) */}
                      <td className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px] font-mono font-bold text-emerald-400">
                        {formatMoney(ganancia)}
                      </td>

                      {/* Precio Final (Centrado) */}
                      <td className="py-3 px-3 text-center w-28 min-w-[110px] max-w-[120px] font-mono font-bold text-gray-100 text-sm">
                        {formatMoney(precio)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditProducto(prod)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-blue-300 transition-colors"
                            title="Editar producto"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => onDeleteProducto(prod.id)}
                            className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 transition-colors"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Insumos Sub-table (matching Imagen 2) */}
                    {isExp && (
                      <tr className="bg-th-141517">
                        <td colSpan={8} className="p-3 pl-8 sm:pl-10 border-b border-gray-800">
                          <div className="bg-th-18191c rounded-xl border border-gray-800/80 p-3 max-w-4xl shadow-inner">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-gray-800 text-[10px] font-bold uppercase text-gray-400">
                                  <th className="py-2 px-3 min-w-[180px]">INSUMO</th>
                                  <th className="py-2 px-3 min-w-[150px]">DETALLE / MEDIDA</th>
                                  <th className="py-2 px-3 min-w-[120px]">PROVEEDOR</th>
                                  <th className="py-2 px-3 text-right min-w-[100px]">COSTO REAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800/50">
                                {insumos.length > 0 ? (
                                  insumos.map((ins, iIdx) => (
                                    <tr key={iIdx} className="hover:bg-gray-800/20 text-gray-300">
                                      <td className="py-2 px-3 font-semibold text-gray-200">
                                        {ins.nombre}
                                      </td>
                                      <td className="py-2 px-3 text-gray-400">
                                        {ins.detalle || ins.nota || '-'}
                                      </td>
                                      <td className="py-2 px-3 text-gray-400">
                                        {ins.proveedor || '-'}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-gray-100">
                                        {formatMoney(ins.costo || ((ins.cant || 1) * (ins.costoUnitario || 0)))}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-3 px-3 text-center text-gray-500 italic">
                                      No hay insumos registrados para este producto
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <Layers className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-semibold">No se encontraron productos ni servicios</p>
                  <p className="text-xs mt-1">
                    Agrega tu primer producto con insumos para calcular su costo real y ganancia.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
