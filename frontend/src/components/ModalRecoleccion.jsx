import React, { useState, useMemo } from 'react';
import { 
  X, 
  Truck, 
  Fuel, 
  Coffee, 
  DollarSign, 
  CheckSquare, 
  Square, 
  Scale, 
  CreditCard
} from 'lucide-react';
import PillSelect from './PillSelect';
import PillDatePicker from './PillDatePicker';

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
  
  const [gastoGasolina, setGastoGasolina] = useState('');
  const [cuentaGasolina, setCuentaGasolina] = useState('NU TDC');

  const [gastoDesayuno, setGastoDesayuno] = useState('');
  const [cuentaDesayuno, setCuentaDesayuno] = useState('EFECTIVO');

  const [gastoOtros, setGastoOtros] = useState('');
  const [cuentaOtros, setCuentaOtros] = useState('NU EMI');

  const [nota, setNota] = useState('');
  const [modoReparto, setModoReparto] = useState('PROPORCIONAL');

  const pedidosDisponibles = useMemo(() => {
    return pedidos.filter(p => p.tipo !== 'COTIZACION' && p.estatus !== 'Cancelado');
  }, [pedidos]);

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

  const toggleOrder = (orderId) => {
    const willBeChecked = !selectedOrders[orderId];
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: willBeChecked
    }));

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

  const toggleProduct = (orderId, prodIdx) => {
    setSelectedProducts(prev => {
      const current = prev[orderId] ? { ...prev[orderId] } : {};
      current[prodIdx] = !current[prodIdx];
      
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

  const gas = parseFloat(gastoGasolina) || 0;
  const des = parseFloat(gastoDesayuno) || 0;
  const otr = parseFloat(gastoOtros) || 0;
  const totalGasto = gas + des + otr;

  const activeSelectedOrders = useMemo(() => {
    return pedidosDisponibles.filter(p => selectedOrders[p.id]);
  }, [pedidosDisponibles, selectedOrders]);

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

      if (checkedInOrder === 0) checkedInOrder = 1;

      counts[order.id] = checkedInOrder;
      total += checkedInOrder;
    });

    return { orderItemCounts: counts, totalItems: total };
  }, [activeSelectedOrders, selectedProducts]);

  const repartoCalculado = useMemo(() => {
    if (activeSelectedOrders.length === 0 || totalGasto <= 0) return {};

    const res = {};
    if (modoReparto === 'PROPORCIONAL' && totalItems > 0) {
      const costPerItem = totalGasto / totalItems;
      let sumDistributed = 0;

      activeSelectedOrders.forEach((p, idx) => {
        const items = orderItemCounts[p.id] || 1;
        if (idx === activeSelectedOrders.length - 1) {
          res[p.id] = Math.max(0, Math.round((totalGasto - sumDistributed) * 100) / 100);
        } else {
          const portion = Math.round((items * costPerItem) * 100) / 100;
          res[p.id] = portion;
          sumDistributed += portion;
        }
      });
    } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base sm:text-lg">Registrar Gasto de Recolección</h3>
              <p className="text-xs text-gray-400">Prorrateo proporcional con método de pago individual</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          <div>
            <label className="text-gray-500 font-bold block mb-1 uppercase tracking-wide text-[11px] pl-2">
              Fecha de Recolección
            </label>
            <PillDatePicker
              required
              value={fecha}
              onChange={setFecha}
              className="bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm text-xs"
            />
          </div>

          {/* Desglose de Gastos */}
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
            <span className="text-xs uppercase font-bold text-gray-600 block tracking-wider flex items-center gap-1.5 pl-1">
              <CreditCard className="w-4 h-4 text-[#173865]" />
              Gastos del Viaje y Métodos de Pago
            </span>

            {/* 1. Gasolina */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="sm:col-span-4 flex items-center gap-2 text-cyan-700 font-bold">
                <Fuel className="w-4 h-4 shrink-0" />
                <span>Gasolina ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoGasolina}
                  onChange={(e) => setGastoGasolina(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 font-bold px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white text-center"
                />
              </div>
              <div className="sm:col-span-4">
                <PillSelect
                  value={cuentaGasolina}
                  onChange={setCuentaGasolina}
                  options={CUENTAS}
                  className="w-full px-3.5 py-1.5 text-[11px]"
                />
              </div>
            </div>

            {/* 2. Desayuno / Comida */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="sm:col-span-4 flex items-center gap-2 text-purple-700 font-bold">
                <Coffee className="w-4 h-4 shrink-0" />
                <span>Alimentos ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoDesayuno}
                  onChange={(e) => setGastoDesayuno(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 font-bold px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white text-center"
                />
              </div>
              <div className="sm:col-span-4">
                <PillSelect
                  value={cuentaDesayuno}
                  onChange={setCuentaDesayuno}
                  options={CUENTAS}
                  className="w-full px-3.5 py-1.5 text-[11px]"
                />
              </div>
            </div>

            {/* 3. Otros */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div className="sm:col-span-4 flex items-center gap-2 text-[#173865] font-bold">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>Otros ($)</span>
              </div>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="any"
                  value={gastoOtros}
                  onChange={(e) => setGastoOtros(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 font-bold px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white text-center"
                />
              </div>
              <div className="sm:col-span-4">
                <PillSelect
                  value={cuentaOtros}
                  onChange={setCuentaOtros}
                  options={CUENTAS}
                  className="w-full px-3.5 py-1.5 text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-500 font-bold block mb-1 text-[11px] pl-2">Nota / Detalle de la Ruta (Opcional)</label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173865]"
              />
            </div>
          </div>

          {/* Modo de Reparto */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-full border border-gray-100">
            <span className="text-[11px] font-bold uppercase text-gray-500 pl-3">
              Método de Prorrateo:
            </span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
              <button
                type="button"
                onClick={() => setModoReparto('PROPORCIONAL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  modoReparto === 'PROPORCIONAL'
                    ? 'bg-[#173865] text-white shadow'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Proporcional</span>
              </button>

              <button
                type="button"
                onClick={() => setModoReparto('EQUITATIVO')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  modoReparto === 'EQUITATIVO'
                    ? 'bg-[#173865] text-white shadow'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Partes Iguales</span>
              </button>
            </div>
          </div>

          {/* Selección de Pedidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-gray-600 font-bold block text-[11px] uppercase tracking-wider">
                Pedidos ({activeSelectedOrders.length} pedidos • {totalItems} ítems)
              </label>
              {pedidosDisponibles.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[#173865] hover:underline text-xs font-bold"
                >
                  {activeSelectedOrders.length === pedidosDisponibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              {pedidosDisponibles.length > 0 ? (
                pedidosDisponibles.map((ped) => {
                  const isChecked = !!selectedOrders[ped.id];
                  const prods = ped.productos && ped.productos.length > 0 ? ped.productos : [{ nombre: 'General' }];
                  const checkedCount = orderItemCounts[ped.id] || 0;
                  const porcionAsignada = repartoCalculado[ped.id] || 0;

                  return (
                    <div
                      key={ped.id}
                      className={`rounded-2xl border transition-all bg-white ${
                        isChecked 
                          ? 'border-blue-200 shadow-sm' 
                          : 'border-gray-100 opacity-60'
                      }`}
                    >
                      <div 
                        onClick={() => toggleOrder(ped.id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-2xl"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#173865] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className="font-mono font-bold text-xs text-[#173865] bg-blue-50 px-2 py-0.5 rounded">{ped.id}</span>
                          <span className="text-gray-800 font-bold truncate">{ped.cliente}</span>
                          {isChecked && (
                            <span className="text-[11px] text-gray-400 font-medium">
                              ({checkedCount} {checkedCount === 1 ? 'prod.' : 'prods.'})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isChecked && totalGasto > 0 && (
                            <span className="font-black text-[#173865] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 text-xs">
                              +{formatMoney(porcionAsignada)}
                            </span>
                          )}
                        </div>
                      </div>

                      {isChecked && modoReparto === 'PROPORCIONAL' && (
                        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                            Productos retirados:
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
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-xs ${
                                    isProdChecked 
                                      ? 'text-gray-800 bg-blue-50/50 font-semibold' 
                                      : 'text-gray-400 hover:bg-gray-50'
                                  }`}
                                >
                                  {isProdChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-[#173865] shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {prod.cant > 1 ? `${prod.cant}x ` : ''}{prod.nombre}
                                  </span>
                                  {prod.proveedor && (
                                    <span className="text-[10px] text-gray-400">({prod.proveedor})</span>
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
                <p className="text-gray-400 text-center py-4 italic">No hay pedidos activos disponibles.</p>
              )}
            </div>
          </div>

          {/* Resumen del Prorrateo */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#173865] block">
                Total Gasto Recolección
              </span>
              <span className="text-lg font-black text-[#173865]">
                {formatMoney(totalGasto)}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-[#173865] block">
                {modoReparto === 'PROPORCIONAL' 
                  ? `Proporcional (${totalItems} ítems • ${activeSelectedOrders.length} peds)`
                  : `Equitativa (${activeSelectedOrders.length} pedidos)`}
              </span>
              <span className="text-xs font-bold text-gray-700">
                {modoReparto === 'PROPORCIONAL' && totalItems > 0
                  ? `~${formatMoney(totalGasto / totalItems)} por producto`
                  : `${formatMoney(activeSelectedOrders.length > 0 ? (totalGasto / activeSelectedOrders.length) : 0)} c/u`}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totalGasto <= 0 || activeSelectedOrders.length === 0}
              className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
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
