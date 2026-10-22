import React, { useState } from 'react';
import { X, ArrowDown, ArrowUpRight, ChevronDown, Check } from 'lucide-react';

const CUENTAS = [
  'NU MINA',
  'NU EMI',
  'MERCADO PAGO',
  'EFECTIVO',
  'NU TDC',
  'PLATA TDC'
];

export default function ModalMovimientoCaja({ tipo = 'INGRESO', pedidos = [], onClose, onSave }) {
  const isIngreso = tipo === 'INGRESO';

  // State
  const [cuenta, setCuenta] = useState('NU MINA');
  const [monto, setMonto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [categoria, setCategoria] = useState(isIngreso ? 'Cobro Pedido' : 'Otros');
  const [nota, setNota] = useState('');
  const [selectedPedidoId, setSelectedPedidoId] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pedidos activos con saldo pendiente (> 0)
  const activeOrdersWithDebt = (pedidos || []).filter((p) => {
    if ((p.tipo || '').toUpperCase() === 'COTIZACION') return false;
    if (p.estatus === 'Cancelado') return false;
    const total = parseFloat(p.total) || 0;
    const pagado = parseFloat(p.pagado) || 0;
    const resta = total - pagado;
    return resta > 0.01;
  });

  const selectedPedido = activeOrdersWithDebt.find((p) => p.id === selectedPedidoId);

  const formatMoney = (val) =>
    `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSelectOrder = (order) => {
    if (!order) {
      // Ingreso Independiente
      setSelectedPedidoId('');
      setDetalle('');
      setDropdownOpen(false);
      return;
    }

    const total = parseFloat(order.total) || 0;
    const pagado = parseFloat(order.pagado) || 0;
    const resta = Math.max(0, total - pagado);

    setSelectedPedidoId(order.id);
    setMonto(resta > 0 ? resta.toFixed(2) : '');
    setDetalle(`Abono pedido ${order.id} | ${order.cliente || 'Cliente'}`);
    setDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (!parsedMonto || parsedMonto <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    let finalDetalle = detalle.trim();
    let finalCategoria = categoria;
    let finalPedidoId = null;

    if (isIngreso) {
      if (selectedPedidoId) {
        finalPedidoId = selectedPedidoId;
        finalCategoria = 'Cobro Pedido';
        if (!finalDetalle) {
          finalDetalle = `Abono a pedido ${selectedPedido?.id || selectedPedidoId} | ${selectedPedido?.cliente || ''}`.trim();
        }
      } else {
        // Ingreso Independiente
        if (!finalDetalle) {
          alert('Por favor especifica el motivo o descripción del ingreso independiente');
          return;
        }
        finalCategoria = 'Otros Ingresos';
        finalPedidoId = null;
      }
    } else {
      // Egreso
      if (!finalDetalle) {
        alert('Por favor especifica el motivo o concepto del egreso');
        return;
      }
    }

    setLoading(true);
    try {
      await onSave({
        tipo,
        cuenta,
        monto: parsedMonto,
        detalle: finalDetalle,
        categoria: finalCategoria,
        nota: nota.trim(),
        pedidoId: finalPedidoId,
        fecha: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-th-18191c border border-gray-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={() => dropdownOpen && setDropdownOpen(false)}
      >
        {/* Header con icono circular e indicativo */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
              isIngreso
                ? 'bg-emerald-950/80 border-emerald-700/70 text-emerald-400'
                : 'bg-rose-950/80 border-rose-700/70 text-rose-400'
            }`}>
              {isIngreso ? (
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-100">
                {isIngreso ? 'Registrar Ingreso' : 'Registrar Egreso / Gasto'}
              </h3>
              <span className="text-[10px] text-gray-400 block -mt-0.5">
                {isIngreso ? 'Abono a pedido o ingreso independiente' : 'Gasto operativo o de insumos'}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Estructura específica para INGRESO */}
          {isIngreso ? (
            <>
              {/* 1. VINCULAR A PEDIDO (OPCIONAL) */}
              <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  VINCULAR A PEDIDO (OPCIONAL)
                </label>

                {/* Dropdown Selector Trigger */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className={`w-full bg-th-121314 text-gray-200 p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    dropdownOpen ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {selectedPedido ? (
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/80 font-mono font-bold text-xs">
                          {selectedPedido.id}
                        </span>
                        <span className="font-semibold text-gray-100 truncate max-w-[170px]">
                          {selectedPedido.cliente || 'Sin nombre'}
                        </span>
                      </div>
                      <span className="text-rose-400 font-mono font-bold text-xs">
                        Resta: {formatMoney(Math.max(0, (parseFloat(selectedPedido.total) || 0) - (parseFloat(selectedPedido.pagado) || 0)))}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-semibold text-gray-200">Ingreso Independiente</span>
                      <span className="text-[11px] text-gray-500">Sin vincular</span>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? 'rotate-180 text-emerald-400' : ''
                  }`} />
                </div>

                {/* Dropdown Options Menu */}
                {dropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-full mt-1.5 bg-th-141518 border border-gray-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-gray-800/80 animate-in fade-in"
                  >
                    {/* Opción 1: Ingreso Independiente */}
                    <div
                      onClick={() => handleSelectOrder(null)}
                      className={`flex items-center justify-between p-3 hover:bg-gray-800/60 cursor-pointer transition-colors ${
                        !selectedPedidoId ? 'bg-emerald-950/20 text-emerald-400' : 'text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!selectedPedidoId && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="font-semibold">Ingreso Independiente</span>
                      </div>
                      <span className="text-[11px] text-gray-500">Sin vincular</span>
                    </div>

                    {/* Opciones de Pedidos Activos con Deuda */}
                    {activeOrdersWithDebt.length > 0 ? (
                      activeOrdersWithDebt.map((p) => {
                        const total = parseFloat(p.total) || 0;
                        const pagado = parseFloat(p.pagado) || 0;
                        const resta = Math.max(0, total - pagado);
                        const isThisSelected = selectedPedidoId === p.id;

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectOrder(p)}
                            className={`flex items-center justify-between p-2.5 hover:bg-gray-800/60 cursor-pointer transition-colors ${
                              isThisSelected ? 'bg-emerald-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isThisSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/80 font-mono font-bold text-xs">
                                {p.id}
                              </span>
                              <span className="font-semibold text-gray-200 truncate max-w-[160px]">
                                {p.cliente || 'Sin nombre'}
                              </span>
                            </div>

                            <div className="text-right font-mono text-xs font-bold text-rose-400">
                              <span className="text-gray-500 text-[10px] font-sans font-normal mr-1">Resta:</span>
                              {formatMoney(resta)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-gray-500 italic text-[11px]">
                        No hay pedidos activos con saldo pendiente
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. MOTIVO O DESCRIPCIÓN (Solo si es Ingreso Independiente) */}
              {!selectedPedidoId ? (
                <div className="animate-in fade-in">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    MOTIVO O DESCRIPCIÓN *
                  </label>
                  <input
                    type="text"
                    required
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="w-full bg-th-121314 text-gray-100 p-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>
              ) : (
                /* Badge informativo cuando está vinculado a un pedido */
                <div className="bg-th-121314 p-3 rounded-xl border border-gray-800 flex items-center justify-between text-xs animate-in fade-in">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Pedido Vinculado</span>
                    <span className="font-bold text-gray-200">{selectedPedido.id} — {selectedPedido.cliente}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Saldo Pendiente</span>
                    <span className="font-mono font-bold text-rose-400">
                      {formatMoney(Math.max(0, (parseFloat(selectedPedido.total) || 0) - (parseFloat(selectedPedido.pagado) || 0)))}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. MONTO y CUENTA DESTINO en 2 Columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    MONTO *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-th-121314 text-emerald-400 pl-7 pr-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    CUENTA DESTINO
                  </label>
                  <select
                    value={cuenta}
                    onChange={(e) => setCuenta(e.target.value)}
                    className="w-full bg-th-121314 text-gray-200 p-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold cursor-pointer"
                  >
                    {CUENTAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Estructura para EGRESO / GASTO */
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  MOTIVO O DESCRIPCIÓN *
                </label>
                <input
                  type="text"
                  required
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full bg-th-121314 text-gray-100 p-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    MONTO *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-rose-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-th-121314 text-rose-400 pl-7 pr-3 py-2 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    CUENTA ORIGEN
                  </label>
                  <select
                    value={cuenta}
                    onChange={(e) => setCuenta(e.target.value)}
                    className="w-full bg-th-121314 text-gray-200 p-2.5 rounded-xl border border-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs font-semibold cursor-pointer"
                  >
                    {CUENTAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    CATEGORÍA
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-th-121314 text-gray-200 p-2 rounded-xl border border-gray-700 text-xs"
                  >
                    <option value="Insumos">Insumos</option>
                    <option value="Gasolina">Gasolina</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    NOTA ADICIONAL
                  </label>
                  <input
                    type="text"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="w-full bg-th-121314 text-gray-200 p-2 rounded-xl border border-gray-700 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* Botones de acción inferiores */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-200 bg-gray-800/80 hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                isIngreso
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
              }`}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
