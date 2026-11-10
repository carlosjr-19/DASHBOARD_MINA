import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MessageCircle, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  X,
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
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Total Clientes</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{clientes.length}</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-red-200 transition-all">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Deuda Pendiente Total</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-red-600 truncate">{formatMoney(totalDeuda)}</span>
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-green-200 transition-all col-span-2 sm:col-span-1">
          <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block">Ganancia Histórica</span>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-green-700 truncate">{formatMoney(totalGanancia)}</span>
            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
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
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.length > 0 ? (
          filtered.map((cli, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedClienteHistory(cli)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all shadow-sm cursor-pointer group"
              title="Haz clic para ver el historial de pedidos de este cliente"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center font-black text-base uppercase shadow-inner border border-gray-100 shrink-0 group-hover:bg-blue-50 group-hover:text-[#173865] transition-colors">
                      {cli.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-gray-800 dark:text-gray-100 text-sm truncate group-hover:text-[#173865] transition-colors">
                        {cli.nombre}
                      </h4>
                      {cli.rfc && (
                        <span className="text-[10px] text-gray-400 block truncate font-mono">
                          RFC: {cli.rfc}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp & Deuda dot */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cli.telefono && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsApp(cli.telefono, cli.nombre);
                        }}
                        className="w-7 h-7 rounded-full bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 flex items-center justify-center transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${cli.deuda > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                </div>

                {(cli.telefono || cli.correo) && (
                  <div className="text-[11px] text-gray-400 truncate mb-3">
                    {cli.telefono && cli.correo ? `${cli.telefono} | ${cli.correo}` : (cli.telefono || cli.correo)}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-1 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center text-xs mt-1">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Pedidos</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{cli.pedidos || 0}</span>
                </div>
                <div className="border-x border-gray-200 dark:border-gray-700">
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Deuda</span>
                  <span className={`font-bold text-xs ${cli.deuda > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {formatMoney(cli.deuda)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Ganancia</span>
                  <span className="font-black text-xs text-green-600">{formatMoney(cli.ganancia)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-12 text-center text-gray-400 shadow-sm">
            <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-500">No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* MODAL HISTORIAL DEL CLIENTE */}
      {selectedClienteHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={() => setSelectedClienteHistory(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col cursor-default animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                  {selectedClienteHistory.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Historial del Cliente ({clientOrders.length} {clientOrders.length === 1 ? 'pedido' : 'pedidos'})
                  </span>
                  {selectedClienteHistory.rfc && (
                    <span className="text-[11px] font-mono font-bold text-[#173865] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      RFC: {selectedClienteHistory.rfc}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openModal(selectedClienteHistory)}
                  className="px-3.5 py-2 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#173865] border border-blue-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Editar datos fiscales del cliente"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Datos Fiscales</span>
                </button>

                <button
                  onClick={() => setSelectedClienteHistory(null)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-header Stats */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Cobrado</span>
                <span className="font-black text-gray-900 dark:text-gray-100 text-sm">{formatMoney(totalCobradoCliente)}</span>
              </div>
              <div className="border-x border-gray-200 dark:border-gray-700 px-5">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Ganancia Total</span>
                <span className="font-black text-green-600 text-sm">{formatMoney(totalGananciaClienteOrders)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Deuda Actual</span>
                <span className={`font-black text-sm ${selectedClienteHistory.deuda > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatMoney(selectedClienteHistory.deuda)}
                </span>
              </div>
            </div>

            {/* Scrollable Orders List */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {clientOrders.length > 0 ? (
                clientOrders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const gananciaOrd = order.ganancia ?? order.gananciaReal ?? 0;

                  return (
                    <div 
                      key={order.id} 
                      className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
                    >
                      <div 
                        onClick={() => toggleOrder(order.id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition-colors gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <button type="button" className="p-1 text-gray-400 hover:text-[#173865] rounded-full">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#173865]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          <div>
                            <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-white text-gray-800 border border-gray-200">
                              {order.id}
                            </span>
                            <span className="text-xs text-gray-400 font-medium ml-2 block sm:inline mt-0.5 sm:mt-0">
                              {order.fecha ? new Date(order.fecha).toLocaleDateString('es-MX') : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Cobrado</span>
                            <span className="font-black text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                              {formatMoney(order.total)}
                            </span>
                          </div>

                          <div className="text-center bg-green-100 border border-green-200 px-3 py-1 rounded-xl">
                            <span className="text-[9px] text-green-700 uppercase font-black block">Ganancia</span>
                            <span className="font-black text-green-900 text-xs sm:text-sm">
                              {formatMoney(gananciaOrd)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-gray-400 border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider">
                                  <th className="py-2 px-3">Detalle</th>
                                  <th className="py-2 px-3 text-center">Precio Unit</th>
                                  <th className="py-2 px-2 text-center">Cantidad</th>
                                  <th className="py-2 px-3 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-xs">
                                {order.productos && order.productos.length > 0 ? (
                                  order.productos.map((prod, pIdx) => {
                                    const pu = parseFloat(prod.precioUnitario) || 0;
                                    const cant = parseFloat(prod.cant) || 1;
                                    const totalProd = pu * cant;

                                    return (
                                      <tr key={pIdx} className="hover:bg-gray-50 text-gray-700">
                                        <td className="py-2.5 px-3 font-bold text-gray-800">
                                          {prod.nombre}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-medium text-gray-600">
                                          {formatMoney(pu)}
                                        </td>
                                        <td className="py-2.5 px-2 text-center font-bold text-gray-700">
                                          {cant}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black text-gray-900">
                                          {formatMoney(totalProd)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-2 px-3 text-center text-gray-400 italic">
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
                <div className="p-8 text-center text-gray-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-gray-500">No hay pedidos registrados para este cliente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 cursor-default animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg">
                {editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">Nombre Completo / Empresa *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Correo Electrónico</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase block mb-2 pl-2">Datos CFDI (Opcionales)</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 uppercase font-mono font-bold outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
                  />
                  <input
                    type="text"
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    className="bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-[#173865] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-full font-bold text-white bg-[#173865] hover:bg-blue-900 shadow-md transition-all"
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
