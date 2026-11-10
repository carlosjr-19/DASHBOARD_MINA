import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  DollarSign, 
  TrendingUp, 
  Boxes
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
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Catálogo Activo</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{totalItems}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Costo Promedio</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-gray-800 dark:text-gray-200">{formatMoney(costoPromedio)}</span>
            <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Precio Venta Promedio</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-[#173865] dark:text-blue-400">{formatMoney(precioPromedio)}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-green-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Ganancia Promedio</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-green-700 dark:text-green-400">{formatMoney(gananciaPromedio)}</span>
            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Add Product */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-100 pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
          />
        </div>

        <button
          onClick={onOpenNuevoProducto}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto / Servicio</span>
        </button>
      </div>

      {/* Product List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 sm:p-5 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-x-visible">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-2 w-8 text-center"></th>
                <th className="py-3.5 px-2.5">Producto / Servicio</th>
                <th className="py-3.5 px-2.5 text-center">Proveedor</th>
                <th className="py-3.5 px-2.5 text-center">Costo Real</th>
                <th className="py-3.5 px-2.5 text-center">Margen %</th>
                <th className="py-3.5 px-2.5 text-center text-green-600">Ganancia</th>
                <th className="py-3.5 px-2.5 text-center text-[#173865]">Precio Final</th>
                <th className="py-3.5 px-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
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
                        className={`cursor-pointer transition-colors text-xs ${isExp ? 'bg-blue-50/40' : 'hover:bg-gray-50/70'}`}
                      >
                        {/* Chevron */}
                        <td className="py-3.5 px-2 text-center text-gray-400">
                          <button
                            type="button"
                            className="p-1 hover:text-[#173865] rounded-full transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(prod.id); }}
                          >
                            {isExp ? (
                              <ChevronDown className="w-4 h-4 text-[#173865]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* Producto / Servicio */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{prod.nombre}</span>
                        </td>

                        {/* Proveedor (Centrado) */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {prod.proveedor || 'Propio'}
                          </span>
                        </td>

                        {/* Costo Real (Centrado) */}
                        <td className="py-3.5 px-3 text-center font-bold text-gray-600 text-sm">
                          {formatMoney(costo)}
                        </td>

                        {/* Margen % (Centrado) */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">
                            {margenPct}%
                          </span>
                        </td>

                        {/* Ganancia (Centrado) */}
                        <td className="py-3.5 px-3 text-center font-bold text-green-600 text-sm">
                          {formatMoney(ganancia)}
                        </td>

                        {/* Precio Final (Centrado) */}
                        <td className="py-3.5 px-3 text-center font-black text-[#173865] text-base">
                          {formatMoney(precio)}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditProducto(prod)}
                              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-[#173865] flex items-center justify-center transition-colors"
                              title="Editar producto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteProducto(prod.id)}
                              className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                              title="Eliminar del catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Insumos Sub-table */}
                      {isExp && (
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                          <td colSpan={8} className="p-3 pl-8 sm:pl-12">
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 max-w-3xl shadow-sm">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <th className="py-2 px-3 min-w-[180px]">Insumo</th>
                                    <th className="py-2 px-3 text-center min-w-[150px]">Detalle / Medida</th>
                                    <th className="py-2 px-3 text-center min-w-[120px]">Proveedor</th>
                                    <th className="py-2 px-3 text-right min-w-[100px]">Costo Real</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {insumos.length > 0 ? (
                                    insumos.map((ins, iIdx) => (
                                      <tr key={iIdx} className="hover:bg-gray-50 text-gray-700">
                                        <td className="py-2 px-3 font-bold text-gray-900">
                                          {ins.nombre}
                                        </td>
                                        <td className="py-2 px-3 text-center text-gray-600">
                                          {ins.detalle || ins.nota || '-'}
                                        </td>
                                        <td className="py-2 px-3 text-center text-gray-600">
                                          {ins.proveedor || '-'}
                                        </td>
                                        <td className="py-2 px-3 text-right font-black text-[#173865]">
                                          {formatMoney(ins.costo || ((ins.cant || 1) * (ins.costoUnitario || 0)))}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="py-3 px-3 text-center text-gray-400 italic">
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
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Layers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-500">No hay productos registrados en el catálogo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
