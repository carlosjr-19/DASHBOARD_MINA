import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  DollarSign, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  Clock,
  X
} from 'lucide-react';

export default function InventarioView({ 
  inventario = [], 
  onSaveInsumo, 
  onDeleteInsumo 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [alerta, setAlerta] = useState('5');
  const [loading, setLoading] = useState(false);

  const filtered = inventario.filter((i) => {
    return (
      i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const lowStockCount = inventario.filter(i => (i.stock || 0) <= (i.alerta || 5)).length;
  const totalValue = inventario.reduce((acc, i) => acc + ((i.stock || 0) * (i.precio || 0)), 0);

  const openAddModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setNombre(item.nombre);
      setProveedor(item.proveedor || '');
      setPrecio(item.precio);
      setStock(item.stock);
      setAlerta(item.alerta || '5');
    } else {
      setEditingItem(null);
      setNombre('');
      setProveedor('');
      setPrecio('');
      setStock('');
      setAlerta('5');
    }
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    try {
      await onSaveInsumo({
        id: editingItem ? editingItem.id : null,
        nombre: nombre.trim(),
        proveedor: proveedor.trim() || 'Propio',
        precio: parseFloat(precio) || 0,
        stock: parseFloat(stock) || 0,
        alerta: parseFloat(alerta) || 5
      });
      setShowAddModal(false);
    } catch (err) {
      alert(err.message || 'Error al guardar insumo');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Total Insumos</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{inventario.length}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-red-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Stock Bajo / Alertas</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-red-600">{lowStockCount}</span>
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-green-200 transition-all col-span-2 sm:col-span-1">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Valorización Inventario</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-green-700 truncate">{formatMoney(totalValue)}</span>
            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Add Action */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
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
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Insumo</span>
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            Catálogo de Insumos y Materiales en Stock
          </span>
          <span className="text-xs font-semibold text-gray-400">{filtered.length} registrados</span>
        </div>

        <div className="overflow-x-auto lg:overflow-x-visible p-2 sm:p-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-1.5 text-center w-7"></th>
                <th className="py-3 px-2">Material / Insumo</th>
                <th className="py-3 px-2 text-center">Proveedor</th>
                <th className="py-3 px-2 text-center">Costo / P. Unit</th>
                <th className="py-3 px-2 text-center">Stock Disponible</th>
                <th className="py-3 px-2 text-center">Estado</th>
                <th className="py-3 px-2 text-right">Valor Total</th>
                <th className="py-3 px-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const isLow = (item.stock || 0) <= (item.alerta || 5);
                  const isExpanded = expandedItemId === item.id;
                  const itemValue = (item.stock || 0) * (item.precio || 0);

                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/70'}`}
                      >
                        <td className="py-3 px-2 text-center">
                          <button 
                            type="button" 
                            className="p-1 hover:text-[#173865] rounded-full text-gray-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setExpandedItemId(isExpanded ? null : item.id); }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#173865]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                            {item.nombre}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {item.proveedor || 'Propio'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-gray-600 text-sm">
                          {formatMoney(item.precio)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`font-black text-xs px-3 py-1 rounded-full border ${isLow ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {item.stock} un.
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Bajo
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Óptimo
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-gray-100 text-sm">
                          {formatMoney(itemValue)}
                        </td>

                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openAddModal(item)}
                              className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-[#173865] flex items-center justify-center transition-colors"
                              title="Editar insumo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteInsumo(item.id)}
                              className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Usos Detail */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                          <td colSpan={8} className="p-3 pl-8 pr-4">
                            <div className="p-4 bg-white border border-gray-200 rounded-2xl text-xs space-y-2.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#173865] flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Historial de Usos y Mermas ({item.nombre})
                                </span>
                                <span className="text-[11px] text-gray-400 font-semibold">
                                  {item.usos?.length || 0} movimientos registrados
                                </span>
                              </div>

                              {item.usos && item.usos.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 text-[10px] uppercase font-bold">
                                        <th className="py-2 px-3 text-center">Tipo</th>
                                        <th className="py-2 px-3 text-center">Pedido</th>
                                        <th className="py-2 px-3">Motivo / Descripción</th>
                                        <th className="py-2 px-3 text-center">Fecha</th>
                                        <th className="py-2 px-3 text-right">Cantidad</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs">
                                      {item.usos.map((uso, uIdx) => (
                                        <tr key={uIdx} className="hover:bg-gray-50 text-gray-700">
                                          <td className="py-2 px-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                              uso.tipo === 'MERMA' 
                                                ? 'bg-red-100 text-red-700 border-red-200' 
                                                : 'bg-blue-50 text-[#173865] border-blue-200'
                                            }`}>
                                              {uso.tipo}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center font-mono font-bold text-[#173865]">
                                            {uso.pedidoId}
                                          </td>
                                          <td className="py-2 px-3 text-gray-700 font-medium">
                                            {uso.motivo || 'Consumo en pedido'}
                                          </td>
                                          <td className="py-2 px-3 text-center text-gray-400">
                                            {uso.fecha ? new Date(uso.fecha).toLocaleDateString('es-MX') : '-'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-bold text-red-600">
                                            -{uso.cant} un.
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic py-2 text-center">
                                  No hay registros de consumo o merma en pedidos aún para este insumo.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-500">No hay insumos registrados</p>
                    <p className="text-xs mt-1">Agrega materiales para control de inventario y deducción automática.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Insumo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                  {editingItem ? 'Editar Insumo / Material' : 'Nuevo Insumo / Material'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1 pl-2">Nombre del Material *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#173865] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1 pl-2">Proveedor</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#173865] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1 pl-2">Precio Real (Costo Unitario)</label>
                <div className="flex items-center bg-white rounded-full border border-gray-200 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#173865]">
                  <span className="text-gray-400 font-bold mr-1">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1 pl-2">Stock que tengo</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-xs text-center font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1 pl-2">Alerta Mínima</label>
                  <input
                    type="number"
                    value={alerta}
                    onChange={(e) => setAlerta(e.target.value)}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-xs text-center font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 shadow-md transition-all"
                >
                  {loading ? 'Guardando...' : 'Guardar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
