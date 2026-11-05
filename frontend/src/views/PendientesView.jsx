import React, { useState } from 'react';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  CalendarDays, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Send, 
  X, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Check
} from 'lucide-react';

const URGENCIAS = [
  { id: 'Baja', label: 'Baja', color: 'bg-gray-800 text-gray-300 border-gray-700' },
  { id: 'Media', label: 'Media', color: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
  { id: 'Alta', label: 'Alta', color: 'bg-orange-950/60 text-orange-300 border-orange-800/60' },
  { id: 'Urgente', label: 'Urgente', color: 'bg-rose-950/70 text-rose-300 border-rose-800/70 animate-pulse' }
];

const ESTATUS_LIST = [
  { id: 'Pendiente', label: 'Pendiente', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'En Proceso', label: 'En Proceso', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'Atendido', label: 'Atendido', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'Cancelado', label: 'Cancelado', color: 'bg-gray-700/40 text-gray-400 border-gray-700' }
];

export default function PendientesView({
  pendientes = [],
  onSavePendiente,
  onDeletePendiente,
  onUpdateEstatus,
  onAddComentario,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [urgenciaFilter, setUrgenciaFilter] = useState('Todas');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const todayIso = new Date().toISOString().split('T')[0];
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formUrgencia, setFormUrgencia] = useState('Media');
  const [formQuienPide, setFormQuienPide] = useState('');
  const [formParaQuien, setFormParaQuien] = useState('');
  const [formDeQuienDepende, setFormDeQuienDepende] = useState('');
  const [formFechaSolicitud, setFormFechaSolicitud] = useState(todayIso);
  const [formFechaEntrega, setFormFechaEntrega] = useState('');
  const [formEstatus, setFormEstatus] = useState('Pendiente');
  
  // Inline Comment Inputs { [pendienteId]: string }
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [saving, setSaving] = useState(false);

  // Filtered List
  const filtered = pendientes.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.quienPide || '').toLowerCase().includes(term) ||
      (item.paraQuien || '').toLowerCase().includes(term) ||
      (item.deQuienDepende || '').toLowerCase().includes(term);

    const matchStatus = statusFilter === 'Todos' || (item.estatus || 'Pendiente') === statusFilter;
    const matchUrgencia = urgenciaFilter === 'Todas' || (item.urgencia || 'Media') === urgenciaFilter;

    return matchSearch && matchStatus && matchUrgencia;
  });

  // Metrics
  const totalCount = pendientes.length;
  const pendientesCount = pendientes.filter(p => (p.estatus || 'Pendiente') === 'Pendiente').length;
  const enProcesoCount = pendientes.filter(p => p.estatus === 'En Proceso').length;
  const atendidosCount = pendientes.filter(p => p.estatus === 'Atendido').length;
  const urgentesCount = pendientes.filter(p => ['Alta', 'Urgente'].includes(p.urgencia) && p.estatus !== 'Atendido' && p.estatus !== 'Cancelado').length;

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormDescripcion('');
    setFormUrgencia('Media');
    setFormQuienPide(user?.nombre || '');
    setFormParaQuien('');
    setFormDeQuienDepende('');
    setFormFechaSolicitud(todayIso);
    setFormFechaEntrega('');
    setFormEstatus('Pendiente');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormDescripcion(item.descripcion || '');
    setFormUrgencia(item.urgencia || 'Media');
    setFormQuienPide(item.quienPide || '');
    setFormParaQuien(item.paraQuien || '');
    setFormDeQuienDepende(item.deQuienDepende || '');
    setFormFechaSolicitud(item.fechaSolicitud || todayIso);
    setFormFechaEntrega(item.fechaEntrega || '');
    setFormEstatus(item.estatus || 'Pendiente');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formDescripcion.trim()) return;

    try {
      setSaving(true);
      await onSavePendiente({
        id: editingItem ? editingItem.id : undefined,
        descripcion: formDescripcion.trim(),
        urgencia: formUrgencia,
        quien_pide: formQuienPide.trim(),
        para_quien: formParaQuien.trim(),
        de_quien_depende: formDeQuienDepende.trim(),
        fecha_solicitud: formFechaSolicitud || todayIso,
        fecha_entrega: formFechaEntrega || '',
        estatus: formEstatus,
        comentarios: editingItem ? editingItem.comentarios : []
      });
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error al guardar el pendiente');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineCommentSubmit = async (pendienteId) => {
    const text = commentInputs[pendienteId]?.trim();
    if (!text) return;

    try {
      await onAddComentario(pendienteId, {
        texto: text,
        autor: user?.nombre || 'Usuario'
      });
      setCommentInputs(prev => ({ ...prev, [pendienteId]: '' }));
      setExpandedComments(prev => ({ ...prev, [pendienteId]: true }));
    } catch (err) {
      alert(err.message || 'Error al agregar comentario');
    }
  };

  const toggleComments = (id) => {
    setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getUrgenciaBadge = (urgencia) => {
    const found = URGENCIAS.find(u => u.id === urgencia) || URGENCIAS[1];
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${found.color}`}>
        {found.label}
      </span>
    );
  };

  const getEstatusBadge = (estatus) => {
    const found = ESTATUS_LIST.find(e => e.id === estatus) || ESTATUS_LIST[0];
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${found.color}`}>
        {found.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase font-semibold block">Total Solicitudes</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-gray-100">{totalCount}</span>
            <ListTodo className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-amber-400 uppercase font-semibold block">Pendientes</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-amber-400">{pendientesCount + enProcesoCount}</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-rose-400 uppercase font-semibold block">Alta / Urgentes</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-rose-400">{urgentesCount}</span>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
        </div>

        <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-xs text-emerald-400 uppercase font-semibold block">Atendidos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg sm:text-2xl font-bold text-emerald-400">{atendidosCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-th-1c1d1f border border-gray-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-th-151617 text-gray-100 pl-9 pr-3 py-2 rounded-lg border border-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-th-151617 text-gray-200 pl-3 pr-8 py-2 rounded-lg border border-gray-700 text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
            >
              <option value="Todos">Estatus: Todos</option>
              {ESTATUS_LIST.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Urgencia Filter */}
          <div className="relative">
            <select
              value={urgenciaFilter}
              onChange={(e) => setUrgenciaFilter(e.target.value)}
              className="bg-th-151617 text-gray-200 pl-3 pr-8 py-2 rounded-lg border border-gray-700 text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
            >
              <option value="Todas">Urgencia: Todas</option>
              {URGENCIAS.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Agregar Pendiente</span>
          </button>
        </div>
      </div>

      {/* Pendientes Cards List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const isAtendido = (item.estatus || '') === 'Atendido';
            const isCommentsExpanded = Boolean(expandedComments[item.id]);
            const commentsCount = item.comentarios?.length || 0;
            const isOverdue = item.fechaEntrega && item.fechaEntrega < todayIso && !isAtendido;

            return (
              <div 
                key={item.id}
                className={`bg-th-1c1d1f border rounded-xl p-4 transition-all space-y-3 ${
                  isAtendido 
                    ? 'border-gray-800/60 opacity-85' 
                    : isOverdue 
                      ? 'border-rose-800/80 shadow-md shadow-rose-950/20' 
                      : 'border-gray-800 hover:border-gray-700 shadow-sm'
                }`}
              >
                {/* Header row: Status, Urgencia, Actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-gray-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Dropdown selector */}
                    <div className="relative">
                      <select
                        value={item.estatus || 'Pendiente'}
                        onChange={(e) => onUpdateEstatus(item.id, e.target.value)}
                        className={`text-xs font-bold pl-2.5 pr-7 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none transition-colors ${
                          item.estatus === 'Atendido'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50'
                            : item.estatus === 'En Proceso'
                              ? 'bg-blue-950/40 text-blue-300 border-blue-600/50'
                              : item.estatus === 'Cancelado'
                                ? 'bg-gray-800 text-gray-400 border-gray-700'
                                : 'bg-amber-950/40 text-amber-300 border-amber-600/50'
                        }`}
                      >
                        {ESTATUS_LIST.map(e => (
                          <option key={e.id} value={e.id} className="bg-th-1c1d1f text-gray-100 font-medium">
                            {e.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>

                    {/* Urgencia Badge */}
                    {getUrgenciaBadge(item.urgencia || 'Media')}

                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-600 text-white animate-pulse">
                        ¡Fecha Límite Vencida!
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-orange-950/30 transition-colors"
                      title="Editar pendiente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de eliminar este pendiente?')) {
                          onDeletePendiente(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Eliminar pendiente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Content: Description */}
                <div>
                  <p className={`text-sm text-gray-100 font-medium whitespace-pre-wrap leading-relaxed ${
                    isAtendido ? 'line-through text-gray-400' : ''
                  }`}>
                    {item.descripcion}
                  </p>
                </div>

                {/* Details Grid: Quien pide, Para quien, De quien depende, Fechas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800/60 text-xs">
                  {/* Quien pide */}
                  <div className="bg-th-151617 p-2 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Quién lo pide</span>
                    <span className="font-medium text-gray-200 truncate block mt-0.5">
                      {item.quienPide || '-'}
                    </span>
                  </div>

                  {/* Para quien */}
                  <div className="bg-th-151617 p-2 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Para quién</span>
                    <span className="font-medium text-gray-200 truncate block mt-0.5">
                      {item.paraQuien || '-'}
                    </span>
                  </div>

                  {/* De quien depende */}
                  <div className="bg-th-151617 p-2 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">De quién depende</span>
                    <span className="font-medium text-orange-400 truncate block mt-0.5">
                      {item.deQuienDepende || '-'}
                    </span>
                  </div>

                  {/* Fechas: Solicitud y Máxima Entrega */}
                  <div className="bg-th-151617 p-2 rounded-lg border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Entrega Máxima</span>
                    <span className={`font-mono font-bold block mt-0.5 ${
                      isOverdue ? 'text-rose-400' : item.fechaEntrega ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      {item.fechaEntrega || 'Sin fecha'}
                    </span>
                    <span className="text-[9px] text-gray-500 block">
                      Pedido el: {item.fechaSolicitud || '-'}
                    </span>
                  </div>
                </div>

                {/* Comments & Bitacora Section */}
                <div className="pt-2 border-t border-gray-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleComments(item.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-orange-400 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                      <span>Comentarios / Seguimiento ({commentsCount})</span>
                      {isCommentsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isAtendido && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Solicitud Atendida
                      </span>
                    )}
                  </div>

                  {/* Comments Accordion Content */}
                  {isCommentsExpanded && (
                    <div className="bg-th-141517 p-3 rounded-xl border border-gray-800/80 space-y-2.5">
                      {/* Comments History */}
                      {item.comentarios && item.comentarios.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {item.comentarios.map((c, cIdx) => (
                            <div key={c.id || cIdx} className="bg-th-1b1c1e p-2.5 rounded-lg border border-gray-800 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                <span className="font-bold text-orange-400">{c.autor || 'Usuario'}</span>
                                <span className="font-mono">{c.fecha || ''}</span>
                              </div>
                              <p className="text-gray-200 whitespace-pre-wrap">{c.texto}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic py-1">
                          No hay comentarios ni notas de seguimiento aún.
                        </p>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[item.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCommentSubmit(item.id);
                            }
                          }}
                          className="flex-1 bg-th-18191c text-gray-100 px-3 py-1.5 rounded-lg border border-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleInlineCommentSubmit(item.id)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Comentar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-th-1c1d1f border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            <ListTodo className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-semibold">No se encontraron pendientes registrados</p>
            <p className="text-xs text-gray-500 mt-1">
              Agrega una nueva solicitud con el botón "+ Agregar Pendiente".
            </p>
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Pendiente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-th-1c1d1f border border-gray-700 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <ListTodo className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-100 text-base">
                  {editingItem ? 'Editar Pendiente / Solicitud' : 'Nuevo Pendiente / Solicitud'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-100 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              {/* Descripción */}
              <div>
                <label className="text-gray-300 font-semibold block mb-1">
                  Descripción de la Solicitud / Pendiente *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full bg-th-151617 text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              {/* Fila: Urgencia y Estatus */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Urgencia</label>
                  <select
                    value={formUrgencia}
                    onChange={(e) => setFormUrgencia(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {URGENCIAS.map(u => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Estatus</label>
                  <select
                    value={formEstatus}
                    onChange={(e) => setFormEstatus(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {ESTATUS_LIST.map(e => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila: Quién lo pide y Para quién */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Quién lo pide</label>
                  <input
                    type="text"
                    value={formQuienPide}
                    onChange={(e) => setFormQuienPide(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Para quién</label>
                  <input
                    type="text"
                    value={formParaQuien}
                    onChange={(e) => setFormParaQuien(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Fila: De quién depende y Fecha de Solicitud */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 font-semibold block mb-1">De quién depende</label>
                  <input
                    type="text"
                    value={formDeQuienDepende}
                    onChange={(e) => setFormDeQuienDepende(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-orange-400"
                  />
                </div>

                <div>
                  <label className="text-gray-400 font-semibold block mb-1">Fecha de Solicitud</label>
                  <input
                    type="date"
                    value={formFechaSolicitud}
                    onChange={(e) => setFormFechaSolicitud(e.target.value)}
                    className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Fecha Máxima de Entrega */}
              <div>
                <label className="text-gray-400 font-semibold block mb-1">
                  Fecha Máxima de Entrega (Límite)
                </label>
                <input
                  type="date"
                  value={formFechaEntrega}
                  onChange={(e) => setFormFechaEntrega(e.target.value)}
                  className="w-full bg-th-151617 text-gray-100 p-2 rounded-lg border border-gray-700 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-gray-400 hover:text-gray-100 bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow"
                >
                  {saving ? 'Guardando...' : 'Guardar Pendiente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
