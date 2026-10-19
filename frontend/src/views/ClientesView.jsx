import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MessageCircle, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Trash2,
  Building,
  ChevronDown,
  ChevronRight,
  X,
  Clock,
  ShoppingBag
} from 'lucide-react';

export default function ClientesView({ 
  clientes = [], 
  pedidos = [],
  onSaveCliente, 
  onDeleteCliente 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedClienteHistory, setSelectedClienteHistory] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Form state
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [cp, setCp] = useState('');
  const [regimen, setRegimen] = useState('612 Personas Físicas con Actividades Empresariales');
  const [usoCfdi, setUsoCfdi] = useState('G03 Gastos en general');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const filtered = clientes.filter((c) => {
    return (
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rfc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefono || '').includes(searchTerm)
    );
  });

  const totalDeuda = clientes.reduce((acc, c) => acc + (c.deuda || 0), 0);
  const totalGanancia = clientes.reduce((acc, c) => acc + (c.ganancia || 0), 0);

  const openModal = (c = null) => {
    if (c) {
      setEditingCliente(c);
      setNombre(c.nombre);
      setRfc(c.rfc || '');
      setCp(c.cp || '');
      setRegimen(c.regimen || '');
      setUsoCfdi(c.usoCfdi || '');
      setCorreo(c.correo || '');
      setTelefono(c.telefono || '');
    } else {
      setEditingCliente(null);
      setNombre('');
      setRfc('');
      setCp('');
      setRegimen('612 Personas Físicas con Actividades Empresariales');
      setUsoCfdi('G03 Gastos en general');
      setCorreo('');
      setTelefono('');
    }
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    try {
      const updatedData = {
        nombre: nombre.trim(),
        rfc: rfc.trim().toUpperCase(),
        cp: cp.trim(),
        regimen: regimen.trim(),
        usoCfdi: usoCfdi.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        pedidos: editingCliente ? editingCliente.pedidos : 0,
        deuda: editingCliente ? editingCliente.deuda : 0,
        ganancia: editingCliente ? editingCliente.ganancia : 0
      };
      await onSaveCliente(updatedData);
      if (selectedClienteHistory && selectedClienteHistory.nombre.toLowerCase() === updatedData.nombre.toLowerCase()) {
        setSelectedClienteHistory(prev => ({ ...prev, ...updatedData }));
      }
      setShowAddModal(false);
    } catch (err) {
      alert(err.message || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sendWhatsApp = (phone, nom) => {
    const clean = (phone || '').replace(/\D/g, '');
    if (!clean) return;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(`Hola ${nom}, te contactamos de MINA DESIGN.`)}`, '_blank');
  };

  // Solo pedidos reales (no cotizaciones) confirmados / aprobados
  const clientOrders = selectedClienteHistory
    ? (pedidos || []).filter(p => {
        const matchCliente = (p.cliente || '').trim().toLowerCase() === selectedClienteHistory.nombre.trim().toLowerCase();
        const isRealOrder = p.tipo !== 'COTIZACION' && !p.id?.startsWith('CMD-') && (p.estatus || '').toUpperCase() !== 'COTIZACION';
        const isNotCancelado = (p.estatus || '').toLowerCase() !== 'cancelado';
        return matchCliente && isRealOrder && isNotCancelado;
      })
    : [];

  const totalCobradoCliente = clientOrders.reduce((acc, p) => acc + (p.pagado != null ? p.pagado : (p.total || 0)), 0);
  const totalGananciaClienteOrders = clientOrders.reduce((acc, p) => acc + (p.ganancia || p.gananciaReal || 0), 0);

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Total Clientes</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{clientes.length}</span>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Deuda Pendiente Total</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-rose-400 truncate">{formatMoney(totalDeuda)}</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Ganancia Histórica</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm sm:text-xl font-bold font-mono text-emerald-400 truncate">{formatMoney(totalGanancia)}</span>
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2.5 bg-th-18191b p-3 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RFC o teléfono..."
            className="w-full bg-th-121314 text-xs text-gray-100 pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Grid: 4 columns, narrower cards, compact text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.length > 0 ? (
          filtered.map((cli, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedClienteHistory(cli)}
              className="bg-th-1c1d1f border border-gray-800 rounded-xl p-3 flex flex-col justify-between hover:border-orange-500/60 transition-all shadow-sm cursor-pointer group"
              title="Haz clic para ver el historial de pedidos de este cliente"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-100 text-xs sm:text-sm truncate group-hover:text-orange-400 transition-colors">
                      {cli.nombre}
                    </h4>
                    {cli.rfc && (
                      <span className="text-[10px] text-gray-400 block mt-0.5 truncate font-mono">
                        RFC: {cli.rfc}
                      </span>
                    )}
                  </div>

                  {/* WhatsApp button top-right aligned with name */}
                  {cli.telefono && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsApp(cli.telefono, cli.nombre);
                        }}
                        className="p-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 shrink-0"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact snippet line (without 'Clic para consultar historial') */}
                {(cli.telefono || cli.correo) && (
                  <div className="text-[10px] text-gray-500 truncate mt-1.5">
                    {cli.telefono && cli.correo ? `${cli.telefono} | ${cli.correo}` : (cli.telefono || cli.correo)}
                  </div>
                )}
              </div>

              {/* Metrics (compact layout with small text) */}
              <div className="grid grid-cols-3 gap-1 bg-th-151617 p-2 rounded-lg border border-gray-800 text-center text-xs mt-2.5">
                <div>
                  <span className="text-[9px] text-gray-500 block uppercase">Pedidos</span>
                  <span className="font-bold text-gray-200 text-xs">{cli.pedidos || 0}</span>
                </div>
                <div className="border-x border-gray-800">
                  <span className="text-[9px] text-gray-500 block uppercase">Deuda</span>
                  <span className={`font-bold text-xs ${cli.deuda > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                    {formatMoney(cli.deuda)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 block uppercase">Ganancia</span>
                  <span className="font-bold text-xs text-emerald-400">{formatMoney(cli.ganancia)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-th-1c1d1f border border-gray-800 rounded-xl p-12 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-semibold">No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* MODAL HISTORIAL DEL CLIENTE (Imagen 5 de referencia) */}
      {selectedClienteHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-th-1b1c1e border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 border-b border-gray-800 flex items-start justify-between bg-th-151618 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">
                  {selectedClienteHistory.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
                    Historial del Cliente ({clientOrders.length} {clientOrders.length === 1 ? 'pedido' : 'pedidos'})
                  </span>
                  {selectedClienteHistory.rfc && (
                    <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/60">
                      RFC: {selectedClienteHistory.rfc}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Datos Fiscales en la esquina superior derecha junto a Cerrar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openModal(selectedClienteHistory)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border border-orange-500/40 hover:border-orange-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Editar datos fiscales del cliente"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>Datos Fiscales</span>
                </button>

                <button
                  onClick={() => setSelectedClienteHistory(null)}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-header Stats */}
            <div className="p-3 bg-th-131416 border-b border-gray-800/80 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Total Cobrado</span>
                <span className="font-mono font-bold text-gray-100 text-sm">{formatMoney(totalCobradoCliente)}</span>
              </div>
              <div className="border-x border-gray-800 px-4">
                <span className="text-[10px] text-gray-500 uppercase block">Ganancia Total</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{formatMoney(totalGananciaClienteOrders)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Deuda Actual</span>
                <span className={`font-mono font-bold text-sm ${selectedClienteHistory.deuda > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {formatMoney(selectedClienteHistory.deuda)}
                </span>
              </div>
            </div>

            {/* Scrollable Orders List matching Image 5 Structure */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {clientOrders.length > 0 ? (
                clientOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const gananciaOrd = order.ganancia ?? order.gananciaReal ?? 0;

                  return (
                    <div 
                      key={order.id} 
                      className="bg-th-18191c border border-gray-700/80 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Accordion Row */}
                      <div 
                        onClick={() => toggleOrder(order.id)}
                        className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-800/40 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <button type="button" className="p-1 text-gray-400 hover:text-gray-50 rounded">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-orange-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          <div>
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-gray-800 text-gray-200 border border-gray-700">
                              {order.id}
                            </span>
                            <span className="text-xs text-gray-400 font-mono ml-2 block sm:inline mt-0.5 sm:mt-0">
                              {order.fecha ? new Date(order.fecha).toLocaleDateString('es-MX') : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Cobrado</span>
                            <span className="font-mono font-bold text-gray-100 text-xs sm:text-sm">
                              {formatMoney(order.total)}
                            </span>
                          </div>

                          <div className="text-right bg-emerald-950/60 border border-emerald-700/70 px-2.5 py-1 rounded-lg">
                            <span className="text-[9px] text-emerald-400 uppercase font-bold block">Ganancia</span>
                            <span className="font-mono font-bold text-emerald-300 text-xs sm:text-sm">
                              {formatMoney(gananciaOrd)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Products Table matching Image 5 Structure */}
                      {isExpanded && (
                        <div className="p-3 bg-th-131416 border-t border-gray-800 animate-in fade-in">
                          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-th-17181b">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-th-1c1d21 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider">
                                  <th className="py-2 px-3">DETALLE</th>
                                  <th className="py-2 px-3 text-center">PRECIO UNIT</th>
                                  <th className="py-2 px-2 text-center">CANTIDAD</th>
                                  <th className="py-2 px-3 text-right">TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                                {order.productos && order.productos.length > 0 ? (
                                  order.productos.map((prod, pIdx) => {
                                    const pu = parseFloat(prod.precioUnitario) || 0;
                                    const cant = parseFloat(prod.cant) || 1;
                                    const totalProd = pu * cant;

                                    return (
                                      <tr key={pIdx} className="hover:bg-gray-800/30 text-gray-300">
                                        <td className="py-2 px-3 font-sans font-medium text-gray-200">
                                          {prod.nombre}
                                        </td>
                                        <td className="py-2 px-3 text-center text-gray-300">
                                          {formatMoney(pu)}
                                        </td>
                                        <td className="py-2 px-2 text-center font-bold text-gray-100">
                                          {cant}
                                        </td>
                                        <td className="py-2 px-3 text-right font-bold text-gray-100">
                                          {formatMoney(totalProd)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-2 px-3 text-center text-gray-500 italic">
                                      Sin desglose de productos para este pedido
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  <p className="font-semibold text-gray-400">No hay pedidos registrados para este cliente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-th-1e2022 border border-gray-700 w-full max-w-sm rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-gray-100 text-sm">
              {editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSave} className="space-y-2.5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Nombre Completo / Empresa *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-th-151617 text-gray-200 p-2 rounded border border-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-th-151617 text-gray-200 p-2 rounded border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-th-151617 text-gray-200 p-2 rounded border border-gray-700"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Datos CFDI (Opcionales)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="RFC"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="bg-th-151617 text-gray-200 p-2 rounded border border-gray-700 uppercase font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Código Postal"
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    className="bg-th-151617 text-gray-200 p-2 rounded border border-gray-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-gray-400 bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
