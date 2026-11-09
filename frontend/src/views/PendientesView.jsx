import React, { useState } from 'react';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Send, 
  X, 
  ChevronDown, 
  ChevronRight,
  Check
} from 'lucide-react';

const URGENCIAS = [
  { id: 'Baja', label: 'Baja', color: 'bg-gray-800 text-gray-300 border-gray-700' },
  { id: 'Media', label: 'Media', color: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
  { id: 'Alta', label: 'Alta', color: 'bg-orange-950/60 text-orange-300 border-orange-800/60' },
  { id: 'Urgente', label: 'Urgente', color: 'bg-rose-950/70 text-rose-300 border-rose-800/70' }
];

const ESTATUS_LIST = [
  { id: 'Pendiente', label: 'Pendiente', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60' },
  { id: 'En Proceso', label: 'En Proceso', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60' },
  { id: 'Atendido', label: 'Atendido', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' },
  { id: 'Cancelado', label: 'Cancelado', color: 'bg-gray-800 text-gray-400 border-gray-700' }
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
  
  // Expanded rows state { [id]: boolean }
  const [expandedRows, setExpandedRows] = useState({});

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

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const handleOpenEdit = (item, e) => {
    if (e) e.stopPropagation();
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
      setExpandedRows(prev => ({ ...prev, [pendienteId]: true }));
    } catch (err) {
      alert(err.message || 'Error al agregar comentario');
    }
  };

  const getUrgenciaBadge = (urgencia) => {
    const found = URGENCIAS.find(u => u.id === urgencia) || URGENCIAS[1];
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${found.color}`}>
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

      {/* Pendientes Table - Single Line Renglones Delgados (similar a Pedidos) */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-th-161719 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-th-131416 text-[10px] sm:text-[11px] font-bold uppercase text-gray-400 select-none">
              <th className="py-2.5 px-2 w-8 text-center"></th>
              <th className="py-2.5 px-3 min-w-[75px]">ID</th>
              <th className="py-2.5 px-3 min-w-[130px] text-center">ESTATUS</th>
              <th className="py-2.5 px-3 min-w-[90px] text-center">URGENCIA</th>
              <th className="py-2.5 px-3 min-w-[240px]">DESCRIPCIÓN</th>
              <th className="py-2.5 px-3 min-w-[120px]">QUIÉN PIDE</th>
              <th className="py-2.5 px-3 min-w-[120px]">PARA QUIÉN</th>
              <th className="py-2.5 px-3 min-w-[130px]">DE QUIÉN DEPENDE</th>
              <th className="py-2.5 px-3 min-w-[110px] text-center">F. SOLICITUD</th>
              <th className="py-2.5 px-3 min-w-[120px] text-center">F. MÁXIMA</th>
              <th className="py-2.5 px-3 min-w-[95px] text-center">SEGUIMIENTO</th>
              <th className="py-2.5 px-3 min-w-[80px] text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isAtendido = (item.estatus || '') === 'Atendido';
                const isExpanded = Boolean(expandedRows[item.id]);
                const commentsCount = item.comentarios?.length || 0;
                const isOverdue = item.fechaEntrega && item.fechaEntrega < todayIso && !isAtendido;

                return (
                  <React.Fragment key={item.id}>
                    {/* Main 1-Line Thin Row */}
                    <tr
                      onClick={() => toggleRow(item.id)}
                      className={`hover:bg-gray-800/40 cursor-pointer transition-colors border-b border-gray-800/80 text-xs ${
                        isAtendido 
                          ? 'opacity-60 bg-th-121314/60' 
                          : isOverdue 
                            ? 'bg-rose-950/10' 
                            : ''
                      }`}
                    >
                      {/* 1. Chevron */}
                      <td className="py-2.5 px-2 text-center text-gray-400 w-8">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(item.id);
                          }}
                          className="p-1 hover:text-gray-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-orange-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* 2. ID */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded border border-gray-700/80 bg-gray-800/80 font-mono font-bold text-[11px] text-gray-300 shadow-sm">
                          #{String(item.id).padStart(3, '0')}
                        </span>
                      </td>

                      {/* 3. ESTATUS */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={item.estatus || 'Pendiente'}
                            onChange={(e) => onUpdateEstatus(item.id, e.target.value)}
                            className={`text-[11px] font-bold pl-2 pr-6 py-1 rounded-md border appearance-none cursor-pointer focus:outline-none transition-colors ${
                              item.estatus === 'Atendido'
                                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/50'
                                : item.estatus === 'En Proceso'
                                  ? 'bg-blue-950/50 text-blue-300 border-blue-600/50'
                                  : item.estatus === 'Cancelado'
                                    ? 'bg-gray-800 text-gray-400 border-gray-700'
                                    : 'bg-amber-950/50 text-amber-300 border-amber-600/50'
                            }`}
                          >
                            {ESTATUS_LIST.map(e => (
                              <option key={e.id} value={e.id} className="bg-th-1c1d1f text-gray-100 font-medium">
                                {e.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-2 pointer-events-none" />
                        </div>
                      </td>

                      {/* 4. URGENCIA */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getUrgenciaBadge(item.urgencia || 'Media')}
                      </td>

                      {/* 5. DESCRIPCIÓN (delgada y truncada a 1 línea con tooltip) */}
                      <td className="py-2.5 px-3 max-w-[260px] truncate" title={item.descripcion}>
                        <span className={`font-medium ${isAtendido ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                          {item.descripcion}
                        </span>
                      </td>

                      {/* 6. QUIÉN PIDE */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-300 font-medium">
                        {item.quienPide || '-'}
                      </td>

                      {/* 7. PARA QUIÉN */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-300">
                        {item.paraQuien || '-'}
                      </td>

                      {/* 8. DE QUIÉN DEPENDE */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-orange-400">
                        {item.deQuienDepende || '-'}
                      </td>

                      {/* 9. FECHA SOLICITUD */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {item.fechaSolicitud || '-'}
                      </td>

                      {/* 10. FECHA MÁXIMA ENTREGA */}
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap text-[11px]">
                        {isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800/80 text-rose-300 font-bold" title="¡Fecha límite vencida!">
                            {item.fechaEntrega} ⚠️
                          </span>
                        ) : (
                          <span className={item.fechaEntrega ? 'text-gray-200' : 'text-gray-500'}>
                            {item.fechaEntrega || '-'}
                          </span>
                        )}
                      </td>

                      {/* 11. SEGUIMIENTO / COMENTARIOS */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleRow(item.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                            commentsCount > 0
                              ? 'bg-orange-950/40 text-orange-300 border-orange-700/50 hover:bg-orange-900/40'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200'
                          }`}
                          title="Ver o agregar notas y comentarios"
                        >
                          <MessageSquare className="w-3 h-3 text-orange-400" />
                          <span>{commentsCount}</span>
                        </button>
                      </td>

                      {/* 12. ACCIONES */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(item, e)}
                            className="p-1 rounded text-gray-400 hover:text-orange-400 hover:bg-orange-950/30 transition-colors"
                            title="Editar pendiente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('¿Estás seguro de eliminar este pendiente?')) {
                                onDeletePendiente(item.id);
                              }
                            }}
                            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Eliminar pendiente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail and Comments Row */}
                    {isExpanded && (
                      <tr className="bg-th-141517/80 border-b border-gray-800/80">
                        <td colSpan={12} className="p-3 sm:p-4 space-y-3">
                          {/* Full Description & Status info */}
                          <div className="bg-th-1c1d1f p-3 rounded-xl border border-gray-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold border-b border-gray-800/80 pb-1.5">
                              <span>Descripción Completa</span>
                              <div className="flex items-center gap-3">
                                <span>Solicitado por: <strong className="text-gray-200">{item.quienPide || 'N/A'}</strong></span>
                                <span>Para: <strong className="text-gray-200">{item.paraQuien || 'N/A'}</strong></span>
                                <span>Depende de: <strong className="text-orange-400">{item.deQuienDepende || 'N/A'}</strong></span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-100 whitespace-pre-wrap leading-relaxed pt-1">
                              {item.descripcion}
                            </p>
                          </div>

                          {/* Comments & Bitacora */}
                          <div className="bg-th-1c1d1f p-3 rounded-xl border border-gray-800 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                                <span>Notas de Seguimiento y Atención ({commentsCount})</span>
                              </div>
                              {isAtendido && (
                                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Solicitud Atendida
                                </span>
                              )}
                            </div>

                            {/* Existing Comments */}
                            {item.comentarios && item.comentarios.length > 0 ? (
                              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                {item.comentarios.map((c, cIdx) => (
                                  <div key={c.id || cIdx} className="bg-th-151617 p-2.5 rounded-lg border border-gray-800/80 text-xs">
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
                                No hay comentarios ni notas registradas aún.
                              </p>
                            )}

                            {/* Quick Add Comment Input */}
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
                                className="flex-1 bg-th-151617 text-gray-100 px-3 py-1.5 rounded-lg border border-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineCommentSubmit(item.id)}
                                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Comentar</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-500">
                  <ListTodo className="w-9 h-9 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm font-semibold">No se encontraron pendientes</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Agrega una nueva solicitud con el botón superior "+ Agregar Pendiente".
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
