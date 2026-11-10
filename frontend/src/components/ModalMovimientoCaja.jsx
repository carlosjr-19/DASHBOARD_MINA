import React, { useState } from 'react';
import { X, ArrowDown, ArrowUpRight, ChevronDown, Check } from 'lucide-react';
import PillSelect from './PillSelect';

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
        if (!finalDetalle) {
          alert('Por favor especifica el motivo o descripción del ingreso independiente');
          return;
        }
        finalCategoria = 'Otros Ingresos';
        finalPedidoId = null;
      }
    } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-md rounded-3xl shadow-2xl overflow-visible animate-modal-in cursor-default p-6 sm:p-8"
        onClick={(e) => { e.stopPropagation(); if (dropdownOpen) setDropdownOpen(false); }}
      >
        {/* Header con icono circular */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-black flex items-center ${isIngreso ? 'text-green-700' : 'text-red-600'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              isIngreso ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {isIngreso ? <ArrowDown className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <span>{isIngreso ? 'Registrar Ingreso' : 'Registrar Egreso'}</span>
          </h3>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {isIngreso ? (
            <>
              {/* 1. VINCULAR A PEDIDO (OPCIONAL) - Píldora Dropdown ref_site.html */}
              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                  Vincular a Pedido (Opcional)
                </label>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 text-left font-bold text-xs text-gray-800 shadow-sm flex items-center justify-between hover:border-[#173865] transition focus:outline-none focus:ring-2 focus:ring-[#173865]/20"
                >
                  {selectedPedido ? (
                    <span className="truncate pr-2 text-gray-800 font-bold">
                      {selectedPedido.id} - {selectedPedido.cliente || 'Cliente'} (Resta: {formatMoney(Math.max(0, (parseFloat(selectedPedido.total) || 0) - (parseFloat(selectedPedido.pagado) || 0)))})
                    </span>
                  ) : (
                    <span className="text-gray-500 font-semibold">Ingreso Independiente</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? 'rotate-180 text-[#173865]' : ''
                  }`} />
                </button>

                {/* Dropdown Options Menu */}
                {dropdownOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-[26px] shadow-[0_14px_38px_-6px_rgba(23,56,101,0.22)] border border-gray-100 p-1.5 z-50 max-h-56 overflow-y-auto animate-modal-in space-y-0.5"
                  >
                    <div
                      onClick={() => handleSelectOrder(null)}
                      className={`px-4 py-2 rounded-full hover:bg-[#eff4ff] cursor-pointer text-xs font-bold flex justify-between items-center transition-colors ${
                        !selectedPedidoId ? 'bg-[#eff4ff] text-[#173865]' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!selectedPedidoId && <Check className="w-3.5 h-3.5 text-[#173865]" />}
                        <span>Ingreso Independiente</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">Sin vincular</span>
                    </div>

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
                            className={`px-4 py-2 rounded-full hover:bg-[#eff4ff] cursor-pointer text-xs font-bold flex justify-between items-center transition-colors ${
                              isThisSelected ? 'bg-[#eff4ff] text-[#173865]' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isThisSelected && <Check className="w-3.5 h-3.5 text-[#173865] shrink-0" />}
                              <span className="bg-blue-50 text-[#173865] px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                                {p.id}
                              </span>
                              <span className="truncate">{p.cliente || 'Sin nombre'}</span>
                            </div>

                            <span className="text-xs text-gray-500 font-medium ml-2 whitespace-nowrap">
                              Resta: <strong className="text-gray-800 font-bold">{formatMoney(resta)}</strong>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2.5 text-xs text-gray-400 italic text-center">
                        No hay pedidos pendientes de cobro.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedPedidoId ? (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Motivo o Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 font-bold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>
              ) : (
                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#173865] block">Pedido Vinculado</span>
                    <span className="font-bold text-gray-800">{selectedPedido.id} — {selectedPedido.cliente}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Saldo Pendiente</span>
                    <span className="font-black text-red-600">
                      {formatMoney(Math.max(0, (parseFloat(selectedPedido.total) || 0) - (parseFloat(selectedPedido.pagado) || 0)))}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Monto *
                  </label>
                  <div className="flex items-center bg-green-50 rounded-full border border-green-200 px-3.5 py-2 shadow-inner">
                    <span className="text-green-700 font-bold mr-1">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-green-700 font-black text-base outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Cuenta Destino
                  </label>
                  <PillSelect
                    value={cuenta}
                    onChange={setCuenta}
                    options={CUENTAS}
                    className="w-full px-4 py-2.5 text-xs"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                  Motivo / Descripción *
                </label>
                <input
                  type="text"
                  required
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 font-bold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Monto *
                  </label>
                  <div className="flex items-center bg-red-50 rounded-full border border-red-200 px-3.5 py-2 shadow-inner">
                    <span className="text-red-600 font-bold mr-1">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-red-600 font-black text-base outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Cuenta Origen
                  </label>
                  <PillSelect
                    value={cuenta}
                    onChange={setCuenta}
                    options={CUENTAS}
                    className="w-full px-4 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Categoría
                  </label>
                  <PillSelect
                    value={categoria}
                    onChange={setCategoria}
                    options={['Insumos', 'Gasolina', 'Alimentos', 'Otros']}
                    className="w-full px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1 pl-2">
                    Nota Adicional
                  </label>
                  <input
                    type="text"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#173865]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Botones de acción inferiores */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3.5 rounded-full font-bold text-white shadow-md transition-colors ${
                isIngreso
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
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
