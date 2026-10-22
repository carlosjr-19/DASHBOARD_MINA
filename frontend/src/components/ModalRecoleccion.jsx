import React, { useState, useMemo } from 'react';
import { 
  X, 
  Truck, 
  Fuel, 
  Coffee, 
  DollarSign, 
  CheckSquare, 
  Square, 
  Layers, 
  Scale, 
  Percent,
  CreditCard
} from 'lucide-react';

const CUENTAS = [
  'NU MINA',
  'NU EMI',
  'MERCADO PAGO',
  'EFECTIVO',
  'NU TDC',
  'PLATA TDC'
];

export default function ModalRecoleccion({ pedidos = [], onClose, onSave }) {
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Gastos individuales con su respectiva cuenta de pago
  const [gastoGasolina, setGastoGasolina] = useState('');
  const [cuentaGasolina, setCuentaGasolina] = useState('NU TDC');

  const [gastoDesayuno, setGastoDesayuno] = useState('');
  const [cuentaDesayuno, setCuentaDesayuno] = useState('EFECTIVO');

  const [gastoOtros, setGastoOtros] = useState('');
  const [cuentaOtros, setCuentaOtros] = useState('NU EMI');

  const [nota, setNota] = useState('');
  const [modoReparto, setModoReparto] = useState('PROPORCIONAL'); // 'PROPORCIONAL' | 'EQUITATIVO'

  // Pedidos activos disponibles para prorratear
  const pedidosDisponibles = useMemo(() => {
    return pedidos.filter(p => p.tipo !== 'COTIZACION' && p.estatus !== 'Cancelado');
  }, [pedidos]);

  // Estado de pedidos seleccionados y productos seleccionados por cada pedido:
  // selectedOrders: { [pedidoId]: boolean }
  // selectedProducts: { [pedidoId]: { [prodIndex]: boolean } }
  const [selectedOrders, setSelectedOrders] = useState(() => {
    const init = {};
    pedidosDisponibles.forEach(p => {
      init[p.id] = true;
    });
    return init;
  });

  const [selectedProducts, setSelectedProducts] = useState(() => {
    const init = {};
    pedidosDisponibles.forEach(p => {
      init[p.id] = {};
      const prods = p.productos && p.productos.length > 0 ? p.productos : [{ nombre: 'General' }];
      prods.forEach((_, idx) => {
        init[p.id][idx] = true;
      });
    });
    return init;
  });

  const [loading, setLoading] = useState(false);

  // Toggle order selection
  const toggleOrder = (orderId) => {
    const willBeChecked = !selectedOrders[orderId];
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: willBeChecked
    }));

    // If order was checked, check all its products by default
    if (willBeChecked) {
      const order = pedidosDisponibles.find(p => p.id === orderId);
      const prods = order && order.productos && order.productos.length > 0 ? order.productos : [{ nombre: 'General' }];
      setSelectedProducts(prev => {
        const nextOrderProds = { ...(prev[orderId] || {}) };
        prods.forEach((_, idx) => {
          nextOrderProds[idx] = true;
        });
        return {
          ...prev,
          [orderId]: nextOrderProds
        };
      });
    }
  };

  // Toggle individual product selection for an order
  const toggleProduct = (orderId, prodIdx) => {
    setSelectedProducts(prev => {
      const current = prev[orderId] ? { ...prev[orderId] } : {};
      current[prodIdx] = !current[prodIdx];
      
      // If at least one product is checked, ensure order is checked
      const hasAnyChecked = Object.values(current).some(Boolean);
      if (hasAnyChecked && !selectedOrders[orderId]) {
        setSelectedOrders(oPrev => ({ ...oPrev, [orderId]: true }));
      } else if (!hasAnyChecked && selectedOrders[orderId]) {
        setSelectedOrders(oPrev => ({ ...oPrev, [orderId]: false }));
      }

      return {
        ...prev,
        [orderId]: current
      };
    });
  };

  const toggleSelectAll = () => {
    const activeOrderIds = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
    const allSelected = activeOrderIds.length === pedidosDisponibles.length;

    const newOrders = {};
    const newProds = {};

    pedidosDisponibles.forEach(p => {
      newOrders[p.id] = !allSelected;
      newProds[p.id] = {};
      const prods = p.productos && p.productos.length > 0 ? p.productos : [{ nombre: 'General' }];
      prods.forEach((_, idx) => {
        newProds[p.id][idx] = !allSelected;
      });
    });

    setSelectedOrders(newOrders);
    setSelectedProducts(newProds);
  };

  // Financial calculations
  const gas = parseFloat(gastoGasolina) || 0;
  const des = parseFloat(gastoDesayuno) || 0;
  const otr = parseFloat(gastoOtros) || 0;
  const totalGasto = gas + des + otr;

  // Active selected orders list
  const activeSelectedOrders = useMemo(() => {
    return pedidosDisponibles.filter(p => selectedOrders[p.id]);
  }, [pedidosDisponibles, selectedOrders]);

  // Count items per order and total items
  const { orderItemCounts, totalItems } = useMemo(() => {
    const counts = {};
    let total = 0;

    activeSelectedOrders.forEach(order => {
      const prods = order.productos && order.productos.length > 0 ? order.productos : [{ nombre: 'General' }];
      const orderProdsState = selectedProducts[order.id] || {};
      let checkedInOrder = 0;

      prods.forEach((_, idx) => {
        if (orderProdsState[idx]) {
          checkedInOrder += 1;
        }
      });

      // If order is checked but had 0 specific products checked, count as 1
      if (checkedInOrder === 0) checkedInOrder = 1;

      counts[order.id] = checkedInOrder;
      total += checkedInOrder;
    });

    return { orderItemCounts: counts, totalItems: total };
  }, [activeSelectedOrders, selectedProducts]);

  // Calculate portion per order
  const repartoCalculado = useMemo(() => {
    if (activeSelectedOrders.length === 0 || totalGasto <= 0) return {};

    const res = {};
    if (modoReparto === 'PROPORCIONAL' && totalItems > 0) {
      const costPerItem = totalGasto / totalItems;
      let sumDistributed = 0;

      activeSelectedOrders.forEach((p, idx) => {
        const items = orderItemCounts[p.id] || 1;
        if (idx === activeSelectedOrders.length - 1) {
          // Adjust rounding on the last element so total matches exactly
          res[p.id] = Math.max(0, Math.round((totalGasto - sumDistributed) * 100) / 100);
        } else {
          const portion = Math.round((items * costPerItem) * 100) / 100;
          res[p.id] = portion;
          sumDistributed += portion;
        }
      });
    } else {
      // Partes iguales
      const numPeds = activeSelectedOrders.length;
      const equalPortion = Math.round((totalGasto / numPeds) * 100) / 100;
      let sumDistributed = 0;

      activeSelectedOrders.forEach((p, idx) => {
        if (idx === activeSelectedOrders.length - 1) {
          res[p.id] = Math.max(0, Math.round((totalGasto - sumDistributed) * 100) / 100);
        } else {
          res[p.id] = equalPortion;
          sumDistributed += equalPortion;
        }
      });
    }

    return res;
  }, [activeSelectedOrders, totalGasto, modoReparto, totalItems, orderItemCounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalGasto <= 0) {
      alert('Por favor ingresa al menos un gasto mayor a $0 (Gasolina, Desayuno u Otros)');
      return;
    }
    if (activeSelectedOrders.length === 0) {
      alert('Por favor selecciona al menos 1 pedido para prorratear el gasto de recolección.');
      return;
    }

    setLoading(true);
    try {
      const repartoPayload = activeSelectedOrders.map(p => ({
        pedidoId: p.id,
        porcion: repartoCalculado[p.id] || 0,
        itemsCount: orderItemCounts[p.id] || 1
      }));

      await onSave({
        fecha,
        cuentaGasolina,
        gastoGasolina: gas,
        cuentaDesayuno,
        gastoDesayuno: des,
        cuentaOtros,
        gastoOtros: otr,
        totalGasto,
        nota: nota.trim(),
        pedidosIds: activeSelectedOrders.map(p => p.id),
        reparto: repartoPayload
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Error al registrar la recolección');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-th-18191c border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-th-1f2024">
          <div className="flex items-center gap-2.5 text-orange-400">
            <Truck className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-gray-100 text-sm">Registrar Gasto de Recolección / Logística</h3>
              <p className="text-[11px] text-gray-400">Prorrateo proporcional con método de pago individual por concepto</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Fecha del Viaje */}
          <div>
            <label className="text-gray-400 font-semibold block mb-1 uppercase tracking-wider text-[10px]">
              Fecha de Recolección
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-th-121314 text-gray-200 p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
            />
          </div>

          {/* Desglose de Gastos con Método de Pago Individual */}
          <div className="bg-th-131416 p-3.5 rounded-xl border border-gray-800 space-y-3">
            <span className="text-[10px] uppercase font-bold text-gray-300 block tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-400" />
              Gastos del Viaje y Métodos de Pago
            </span>

            {/* 1. Gasolina */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-th-18191c p-2.5 rounded-lg border border-gray-800">
              <div className="sm:col-span-4 flex items-center gap-1.5 text-amber-400 font-semibold">
                <Fuel className="w-4 h-4 shrink-0" />
                <span>Gasolina ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoGasolina}
                  onChange={(e) => setGastoGasolina(e.target.value)}
                  className="w-full bg-th-121314 text-gray-100 font-mono p-1.5 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={cuentaGasolina}
                  onChange={(e) => setCuentaGasolina(e.target.value)}
                  className="w-full bg-th-121314 text-gray-200 p-1.5 rounded border border-gray-700 text-[11px] focus:outline-none"
                >
                  {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 2. Desayuno / Comida */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-th-18191c p-2.5 rounded-lg border border-gray-800">
              <div className="sm:col-span-4 flex items-center gap-1.5 text-orange-400 font-semibold">
                <Coffee className="w-4 h-4 shrink-0" />
                <span>Desayuno / Alimentos ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoDesayuno}
                  onChange={(e) => setGastoDesayuno(e.target.value)}
                  className="w-full bg-th-121314 text-gray-100 font-mono p-1.5 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={cuentaDesayuno}
                  onChange={(e) => setCuentaDesayuno(e.target.value)}
                  className="w-full bg-th-121314 text-gray-200 p-1.5 rounded border border-gray-700 text-[11px] focus:outline-none"
                >
                  {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 3. Otros */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-th-18191c p-2.5 rounded-lg border border-gray-800">
              <div className="sm:col-span-4 flex items-center gap-1.5 text-blue-400 font-semibold">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Otros ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoOtros}
                  onChange={(e) => setGastoOtros(e.target.value)}
                  className="w-full bg-th-121314 text-gray-100 font-mono p-1.5 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={cuentaOtros}
                  onChange={(e) => setCuentaOtros(e.target.value)}
                  className="w-full bg-th-121314 text-gray-200 p-1.5 rounded border border-gray-700 text-[11px] focus:outline-none"
                >
                  {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 block mb-1 text-[11px]">Nota / Detalle de la Ruta (Opcional)</label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full bg-th-1a1b1e text-gray-200 p-2 rounded border border-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Modo de Reparto Selector */}
          <div className="flex items-center justify-between bg-th-121314 p-2 rounded-xl border border-gray-800">
            <span className="text-[11px] font-bold uppercase text-gray-400 ml-1">
              Método de Prorrateo:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setModoReparto('PROPORCIONAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  modoReparto === 'PROPORCIONAL'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Prorrateo justo según cuántos productos se fueron a retirar para cada pedido"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Por Productos (Proporcional)</span>
              </button>

              <button
                type="button"
                onClick={() => setModoReparto('EQUITATIVO')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  modoReparto === 'EQUITATIVO'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Dividir en partes iguales entre los pedidos seleccionados"
              >
                <span>Partes Iguales</span>
              </button>
            </div>
          </div>

          {/* Selección de Pedidos y Desglose de Productos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-300 font-bold block text-[11px] uppercase tracking-wider">
                Pedidos y Productos a Recolectar ({activeSelectedOrders.length} pedidos • {totalItems} ítems)
              </label>
              {pedidosDisponibles.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-orange-400 hover:text-orange-300 text-[11px] font-semibold"
                >
                  {activeSelectedOrders.length === pedidosDisponibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 bg-th-121314 p-2.5 rounded-xl border border-gray-800">
              {pedidosDisponibles.length > 0 ? (
                pedidosDisponibles.map((ped) => {
                  const isChecked = !!selectedOrders[ped.id];
                  const prods = ped.productos && ped.productos.length > 0 ? ped.productos : [{ nombre: 'General' }];
                  const checkedCount = orderItemCounts[ped.id] || 0;
                  const porcionAsignada = repartoCalculado[ped.id] || 0;

                  return (
                    <div
                      key={ped.id}
                      className={`rounded-xl border transition-colors ${
                        isChecked 
                          ? 'bg-th-1a1b1f border-orange-700/60' 
                          : 'bg-th-151618 border-gray-800/80 opacity-70'
                      }`}
                    >
                      {/* Pedido Header Row */}
                      <div 
                        onClick={() => toggleOrder(ped.id)}
                        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 rounded-t-xl"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-orange-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-600 shrink-0" />
                          )}
                          <span className="font-mono font-bold text-xs text-orange-300">{ped.id}</span>
                          <span className="text-gray-200 font-medium truncate">| {ped.cliente}</span>
                          {isChecked && (
                            <span className="text-[10px] text-gray-400">
                              ({checkedCount} {checkedCount === 1 ? 'producto' : 'productos'})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isChecked && totalGasto > 0 && (
                            <span className="font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60 text-xs">
                              Porción: +{formatMoney(porcionAsignada)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Desglose de Productos del Pedido si está seleccionado */}
                      {isChecked && modoReparto === 'PROPORCIONAL' && (
                        <div className="px-3 pb-2.5 pt-1 border-t border-gray-800/60 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                            Selecciona los productos que sí se fueron a retirar:
                          </span>
                          <div className="space-y-1 pl-2">
                            {prods.map((prod, pIdx) => {
                              const isProdChecked = selectedProducts[ped.id] ? !!selectedProducts[ped.id][pIdx] : true;
                              return (
                                <div
                                  key={pIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProduct(ped.id, pIdx);
                                  }}
                                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-[11px] ${
                                    isProdChecked 
                                      ? 'text-gray-200 bg-black/30' 
                                      : 'text-gray-500 hover:text-gray-400'
                                  }`}
                                >
                                  {isProdChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                  )}
                                  <span className="font-medium truncate">
                                    {prod.cant > 1 ? `${prod.cant}x ` : ''}{prod.nombre}
                                  </span>
                                  {prod.proveedor && (
                                    <span className="text-[10px] text-gray-500">({prod.proveedor})</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4 italic">No hay pedidos activos disponibles.</p>
              )}
            </div>
          </div>

          {/* Resumen del Prorrateo en Vivo */}
          <div className="bg-emerald-950/30 border border-emerald-800/60 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Total Gasto Recolección
              </span>
              <span className="text-base font-bold font-mono text-emerald-300">
                {formatMoney(totalGasto)}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                {modoReparto === 'PROPORCIONAL' 
                  ? `Distribución Proporcional (${totalItems} ítems en ${activeSelectedOrders.length} pedidos)`
                  : `Distribución Equitativa (${activeSelectedOrders.length} pedidos)`}
              </span>
              <span className="text-xs font-mono text-gray-300">
                {modoReparto === 'PROPORCIONAL' && totalItems > 0
                  ? `~${formatMoney(totalGasto / totalItems)} por producto recolectado`
                  : `${formatMoney(activeSelectedOrders.length > 0 ? (totalGasto / activeSelectedOrders.length) : 0)} c/u`}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex justify-end gap-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-200 bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totalGasto <= 0 || activeSelectedOrders.length === 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Registrar y Prorratear'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
