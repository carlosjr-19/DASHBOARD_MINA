import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Building, 
  DollarSign, 
  CheckCircle2, 
  Package,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock
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
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Total Insumos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{inventario.length}</span>
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Stock Bajo / Alertas</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-rose-400">{lowStockCount}</span>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Valorización Inventario</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-emerald-400 truncate">{formatMoney(totalValue)}</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Search & Add Action */}
      <div className="flex items-center justify-between gap-2.5 bg-th-18191b p-3 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar material o proveedor..."
            className="w-full bg-th-121314 text-xs text-gray-100 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Agregar Insumo</span>
        </button>
      </div>

      {/* Items List - Table Style horizontal single-row matching Pedidos and Cuentas */}
      <div className="bg-th-18191b rounded-xl border border-gray-800 overflow-hidden shadow-lg">
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300">
            Catálogo de Insumos y Materiales en Stock
          </span>
          <span className="text-xs text-gray-500">{filtered.length} registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-th-141517 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-2 text-center w-8"></th>
                <th className="py-2.5 px-3 min-w-[200px]">MATERIAL / INSUMO</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">PROVEEDOR</th>
                <th className="py-2.5 px-3 text-center min-w-[100px]">COSTO / P. UNIT</th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">STOCK DISPONIBLE</th>
                <th className="py-2.5 px-3 text-center min-w-[100px]">ESTADO</th>
                <th className="py-2.5 px-3 text-right min-w-[110px]">VALOR TOTAL</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const isLow = (item.stock || 0) <= (item.alerta || 5);
                  const isExpanded = expandedItemId === item.id;
                  const itemValue = (item.stock || 0) * (item.precio || 0);

                  return (
                    <React.Fragment key={item.id}>
                      {/* Horizontal Single Line Row */}
                      <tr 
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="hover:bg-th-1f2022 transition-colors cursor-pointer"
                      >
                        {/* Col 0: Chevron */}
                        <td className="py-2.5 px-2 text-center">
                          <button 
                            type="button" 
                            className="p-1 hover:text-gray-50 rounded text-gray-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setExpandedItemId(isExpanded ? null : item.id); }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-orange-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* Col 1: Material / Insumo */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-100 text-xs sm:text-sm">
                            {item.nombre}
                          </div>
                        </td>

                        {/* Col 2: Proveedor */}
                        <td className="py-2.5 px-3 text-center text-gray-400">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800/80 border border-gray-700/80 text-gray-300">
                            {item.proveedor || 'Propio'}
                          </span>
                        </td>

                        {/* Col 3: Costo / P. Unit */}
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-gray-200">
                          {formatMoney(item.precio)}
                        </td>

                        {/* Col 4: Stock Disponible */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-mono font-bold text-xs ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {item.stock} unidades
                          </span>
                        </td>

                        {/* Col 5: Estado */}
                        <td className="py-2.5 px-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Óptimo
                            </span>
                          )}
                        </td>

                        {/* Col 6: Valor Total */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-200">
                          {formatMoney(itemValue)}
                        </td>

                        {/* Col 7: Acciones */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openAddModal(item)}
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                              title="Editar insumo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteInsumo(item.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 transition-colors"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Usos Detail */}
                      {isExpanded && (
                        <tr className="bg-th-121315">
                          <td colSpan={8} className="p-3 pl-8 pr-4">
                            <div className="p-3.5 bg-th-161719 border border-gray-800 rounded-xl text-xs space-y-2.5 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Historial de Usos y Mermas ({item.nombre})
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.usos?.length || 0} movimientos registrados
                                </span>
                              </div>

                              {item.usos && item.usos.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-800 bg-th-141517">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-th-1f2024 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold">
                                        <th className="py-2 px-3 text-center">TIPO</th>
                                        <th className="py-2 px-3 text-center">PEDIDO</th>
                                        <th className="py-2 px-3">MOTIVO / DESCRIPCIÓN</th>
                                        <th className="py-2 px-3 text-center">FECHA</th>
                                        <th className="py-2 px-3 text-right">CANTIDAD</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                                      {item.usos.map((uso, uIdx) => (
                                        <tr key={uIdx} className="hover:bg-gray-800/30 text-gray-300">
                                          <td className="py-2 px-3 text-center font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                              uso.tipo === 'MERMA' 
                                                ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                                            }`}>
                                              {uso.tipo}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-orange-400">
                                            {uso.pedidoId}
                                          </td>
                                          <td className="py-2 px-3 font-sans text-gray-300">
                                            {uso.motivo || 'Consumo en pedido'}
                                          </td>
                                          <td className="py-2 px-3 text-center text-gray-400">
                                            {uso.fecha ? new Date(uso.fecha).toLocaleDateString('es-MX') : '-'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-bold text-rose-400">
                                            -{uso.cant} un.
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-500 italic py-2 text-center">
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
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Boxes className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                    <p className="text-sm font-semibold">No hay insumos registrados</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-th-1e2022 border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-100 text-sm">
                {editingItem ? 'Editar Insumo' : 'Agregar Nuevo Insumo a Stock'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-200">
                <Trash2 className="w-4 h-4 hidden" />
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Nombre del Material *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Vinil Textil Blanco, Taza Blanca 11oz..."
                  className="w-full bg-th-151617 text-gray-200 p-2 rounded-lg border border-gray-700 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Proveedor (Centrado)</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Ej. Papelera del Centro, Propio..."
                  className="w-full bg-th-151617 text-gray-200 p-2 rounded-lg border border-gray-700 text-xs text-center focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-th-151617 text-gray-200 p-2 rounded-lg border border-gray-700 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Cantidad en Stock</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-th-151617 text-gray-200 p-2 rounded-lg border border-gray-700 text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase block mb-1">Alerta Stock Mínimo</label>
                <input
                  type="number"
                  value={alerta}
                  onChange={(e) => setAlerta(e.target.value)}
                  placeholder="5"
                  className="w-full bg-th-151617 text-gray-200 p-2 rounded-lg border border-gray-700 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow"
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
