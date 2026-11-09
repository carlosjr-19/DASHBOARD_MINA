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
  Check,
  MapPin,
  Filter,
  History,
  AlertTriangle
} from 'lucide-react';

const URGENCIAS = [
  { id: 'Baja', label: 'Baja', badge: 'bg-gray-800 text-gray-300 border-gray-700' },
  { id: 'Media', label: 'Media', badge: 'bg-blue-950/60 text-blue-300 border-blue-800/60' },
  { id: 'Alta', label: 'Alta', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60' },
  { id: 'Urgente', label: 'Urgente', badge: 'bg-rose-950/70 text-rose-300 border-rose-800/70' }
];

const ESTATUS_CONFIG = {
  'Pendiente': {
    label: 'Pendiente',
    dot: 'bg-amber-400',
    badge: 'bg-amber-950/60 text-amber-300 border-amber-700/50'
  },
  'En Proceso': {
    label: 'En Proceso',
    dot: 'bg-blue-400',
    badge: 'bg-blue-950/60 text-blue-300 border-blue-700/50'
  },
  'Esperando': {
    label: 'Esperando',
    dot: 'bg-purple-400',
    badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50'
  },
  'Atendido': {
    label: 'Atendido',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
  },
  'Cancelado': {
    label: 'Cancelado',
    dot: 'bg-gray-500',
    badge: 'bg-gray-800 text-gray-400 border-gray-700'
  }
};

const ESTATUS_OPTIONS = ['Pendiente', 'En Proceso', 'Esperando', 'Atendido', 'Cancelado'];

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
  
  // Modal Crear / Editar
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const todayIso = new Date().toISOString().split('T')[0];
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formUrgencia, setFormUrgencia] = useState('Media');
  const [formDeQuienDepende, setFormDeQuienDepende] = useState('');
  const [formFechaSolicitud, setFormFechaSolicitud] = useState(todayIso);
  const [formFechaEntrega, setFormFechaEntrega] = useState('');
  const [formEstatus, setFormEstatus] = useState('Pendiente');
  const [saving, setSaving] = useState(false);

  // Modal Bitácora / Seguimiento
  const [bitacoraItem, setBitacoraItem] = useState(null);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [comentarioNuevoEstatus, setComentarioNuevoEstatus] = useState('');
  const [comentarioAutor, setComentarioAutor] = useState(user?.nombre || 'Usuario');
  const [savingComentario, setSavingComentario] = useState(false);

  // Filtered List
  const filtered = pendientes.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      (item.titulo || '').toLowerCase().includes(term) ||
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.deQuienDepende || '').toLowerCase().includes(term);

    const matchStatus = statusFilter === 'Todos' || (item.estatus || 'Pendiente') === statusFilter;
    const matchUrgencia = urgenciaFilter === 'Todas' || (item.urgencia || 'Media') === urgenciaFilter;

    return matchSearch && matchStatus && matchUrgencia;
  });

  // Metrics
  const totalCount = pendientes.length;
  const pendientesCount = pendientes.filter(p => (p.estatus || 'Pendiente') === 'Pendiente').length;
  const enProcesoCount = pendientes.filter(p => p.estatus === 'En Proceso').length;
  const esperandoCount = pendientes.filter(p => p.estatus === 'Esperando').length;
  const atendidosCount = pendientes.filter(p => p.estatus === 'Atendido').length;

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormTitulo('');
    setFormDescripcion('');
    setFormUrgencia('Media');
    setFormDeQuienDepende('');
    setFormFechaSolicitud(todayIso);
    setFormFechaEntrega('');
    setFormEstatus('Pendiente');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitulo(item.titulo || '');
    setFormDescripcion(item.descripcion || '');
    setFormUrgencia(item.urgencia || 'Media');
    setFormDeQuienDepende(item.deQuienDepende || '');
    setFormFechaSolicitud(item.fechaSolicitud || todayIso);
    setFormFechaEntrega(item.fechaEntrega || '');
    setFormEstatus(item.estatus || 'Pendiente');
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formTitulo.trim() && !formDescripcion.trim()) return;

    try {
      setSaving(true);
      await onSavePendiente({
        id: editingItem ? editingItem.id : undefined,
        titulo: formTitulo.trim() || formDescripcion.trim().slice(0, 40),
        descripcion: formDescripcion.trim(),
        urgencia: formUrgencia,
        de_quien_depende: formDeQuienDepende.trim(),
        fecha_solicitud: formFechaSolicitud || todayIso,
        fecha_entrega: formFechaEntrega || '',
        estatus: formEstatus,
        comentarios: editingItem ? editingItem.comentarios : []
      });
      setIsFormModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error al guardar pendiente:', err);
      alert('Error al guardar pendiente: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCheck = async (item) => {
    const isAtendido = item.estatus === 'Atendido';
    const nuevo = isAtendido ? 'Pendiente' : 'Atendido';
    try {
      await onUpdateEstatus(item.id, nuevo);
    } catch (err) {
      console.error('Error al actualizar estatus:', err);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await onUpdateEstatus(item.id, newStatus);
    } catch (err) {
      console.error('Error al cambiar estatus:', err);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`¿Seguro que deseas eliminar el pendiente "${item.titulo || item.descripcion}"?`)) {
      try {
        await onDeletePendiente(item.id);
        if (bitacoraItem && bitacoraItem.id === item.id) {
          setBitacoraItem(null);
        }
      } catch (err) {
        console.error('Error al eliminar pendiente:', err);
      }
    }
  };

  // Bitácora Handlers
  const handleOpenBitacora = (item) => {
    setBitacoraItem(item);
    setNuevoComentarioTexto('');
    setComentarioNuevoEstatus('');
    setComentarioAutor(user?.nombre || 'Usuario');
  };

  const handleSaveBitacoraComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentarioTexto.trim() || !bitacoraItem) return;

    try {
      setSavingComentario(true);
      await onAddComentario(bitacoraItem.id, {
        texto: nuevoComentarioTexto.trim(),
        autor: comentarioAutor || 'Usuario',
        nuevoEstatus: comentarioNuevoEstatus || undefined
      });

      // Actualizar localmente bitacoraItem comentarios
      const nuevo = {
        id: `com-${Date.now()}`,
        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
        autor: comentarioAutor || 'Usuario',
        texto: nuevoComentarioTexto.trim()
      };
      setBitacoraItem(prev => prev ? {
        ...prev,
        estatus: comentarioNuevoEstatus || prev.estatus,
        comentarios: [...(prev.comentarios || []), nuevo]
      } : null);

      setNuevoComentarioTexto('');
      setComentarioNuevoEstatus('');
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      alert('Error al guardar comentario en bitácora: ' + (err.message || ''));
    } finally {
      setSavingComentario(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header y Resumen Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/80 p-4 rounded-xl border border-gray-800 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                Pendientes & Bitácora
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {filtered.length} de {totalCount}
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Control de tareas, requisiciones, proveedores y seguimiento en bitácora
              </p>
            </div>
          </div>
        </div>

        {/* Métricas Rápidas en Barra */}
        <div className="flex flex-wrap items-center gap-2">
          <div 
            onClick={() => setStatusFilter('Todos')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              statusFilter === 'Todos' ? 'bg-gray-800 text-white border-gray-600 shadow-sm' : 'bg-gray-900/50 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}
          >
            Todos: <span className="font-bold text-gray-200">{totalCount}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('Pendiente')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'Pendiente' ? 'bg-amber-950/70 text-amber-200 border-amber-600 shadow-sm' : 'bg-gray-900/50 text-amber-400/80 border-gray-800 hover:border-amber-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Pendientes: <span className="font-bold">{pendientesCount}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('En Proceso')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'En Proceso' ? 'bg-blue-950/70 text-blue-200 border-blue-600 shadow-sm' : 'bg-gray-900/50 text-blue-400/80 border-gray-800 hover:border-blue-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            En Proceso: <span className="font-bold">{enProcesoCount}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('Esperando')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'Esperando' ? 'bg-purple-950/70 text-purple-200 border-purple-600 shadow-sm' : 'bg-gray-900/50 text-purple-400/80 border-gray-800 hover:border-purple-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Esperando: <span className="font-bold">{esperandoCount}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('Atendido')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'Atendido' ? 'bg-emerald-950/70 text-emerald-200 border-emerald-600 shadow-sm' : 'bg-gray-900/50 text-emerald-400/80 border-gray-800 hover:border-emerald-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Atendidos: <span className="font-bold">{atendidosCount}</span>
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 ml-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pendiente
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-xs">
        <div className="relative flex-1 w-full">
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Buscar por título, detalle o dónde se hace:</label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-lg pl-9 pr-8 py-2 text-gray-200 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full sm:w-44">
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Estatus:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none"
          >
            <option value="Todos">Todos los estatus</option>
            {ESTATUS_OPTIONS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Urgencia:</label>
          <select
            value={urgenciaFilter}
            onChange={(e) => setUrgenciaFilter(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none"
          >
            <option value="Todas">Todas las urgencias</option>
            {URGENCIAS.map(u => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla / Lista de Pendientes (Diseño compacto sin scroll horizontal) */}
      <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Cabecera */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-950 border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="w-8 text-center">✓</div>
          <div className="flex-1 min-w-0">Título & Descripción</div>
          <div className="w-48">¿Dónde / Qué se necesita?</div>
          <div className="w-28 text-center">Fecha Límite</div>
          <div className="w-32 text-center">Status</div>
          <div className="w-24 text-center">Bitácora</div>
          <div className="w-20 text-right pr-2">Acciones</div>
        </div>

        {/* Contenido de filas */}
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <ListTodo className="w-10 h-10 mx-auto mb-2 text-gray-600 opacity-60" />
            <p className="text-sm font-medium text-gray-400">No hay pendientes que coincidan con la búsqueda.</p>
            <button
              onClick={handleOpenNew}
              className="mt-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition-all"
            >
              Registrar nuevo pendiente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/80">
            {filtered.map((item) => {
              const isAtendido = item.estatus === 'Atendido';
              const cfg = ESTATUS_CONFIG[item.estatus] || ESTATUS_CONFIG['Pendiente'];
              const comentariosCount = (item.comentarios || []).length;
              const isOverdue = item.fechaEntrega && item.fechaEntrega < todayIso && !isAtendido;

              return (
                <div 
                  key={item.id}
                  className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-4 py-2.5 transition-colors group ${
                    isAtendido 
                      ? 'bg-gray-950/40 opacity-70 hover:opacity-100' 
                      : 'hover:bg-gray-800/40 bg-gray-900/60'
                  }`}
                >
                  {/* Checkbox para tachar al instante */}
                  <div className="flex items-center justify-between md:justify-center md:w-8">
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(item)}
                      title={isAtendido ? "Desmarcar como atendido" : "Marcar como atendido"}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isAtendido 
                          ? 'bg-emerald-500 border-emerald-400 text-gray-950 shadow-sm shadow-emerald-950' 
                          : 'border-gray-600 bg-gray-950 hover:border-emerald-500'
                      }`}
                    >
                      {isAtendido && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* En móvil mostrar el estatus aquí */}
                    <div className="md:hidden">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                        {item.estatus || 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Título & Descripción */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold transition-all ${
                        isAtendido 
                          ? 'line-through text-gray-400' 
                          : 'text-gray-100 group-hover:text-emerald-300'
                      }`}>
                        {item.titulo || item.descripcion}
                      </span>

                      {/* Tag de Urgencia sutil */}
                      {item.urgencia === 'Urgente' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Urgente
                        </span>
                      )}
                      {item.urgencia === 'Alta' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                          Alta
                        </span>
                      )}
                    </div>

                    {/* Descripción resumida abajo */}
                    {item.descripcion && item.descripcion !== item.titulo && (
                      <p className={`text-xs mt-0.5 truncate max-w-xl ${
                        isAtendido ? 'line-through text-gray-400' : 'text-gray-400'
                      }`}>
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Dónde se hace / Qué se necesita */}
                  <div className="md:w-48 text-xs flex items-center">
                    {item.deQuienDepende ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 text-gray-300 border border-gray-700/70 truncate max-w-full">
                        <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{item.deQuienDepende}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">No especificado</span>
                    )}
                  </div>

                  {/* Fecha Límite */}
                  <div className="md:w-28 text-center text-xs">
                    {item.fechaEntrega ? (
                      <div className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                        isOverdue ? 'text-rose-400 font-bold' : 'text-gray-300'
                      }`}>
                        <Calendar className="w-3 h-3 flex-shrink-0 text-gray-500" />
                        <span>{item.fechaEntrega}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px]">—</span>
                    )}
                  </div>

                  {/* Status Dropdown / Pill */}
                  <div className="hidden md:flex md:w-32 justify-center">
                    <select
                      value={item.estatus || 'Pendiente'}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-1 border focus:outline-none transition-all cursor-pointer ${cfg.badge} bg-gray-950`}
                    >
                      {ESTATUS_OPTIONS.map(st => (
                        <option key={st} value={st} className="bg-gray-900 text-gray-200">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón Bitácora / Lápiz con contador */}
                  <div className="md:w-24 flex items-center justify-start md:justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenBitacora(item)}
                      title="Abrir bitácora y agregar comentarios"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                        comentariosCount > 0 
                          ? 'bg-blue-950/60 text-blue-300 border-blue-800 hover:bg-blue-900/60' 
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{comentariosCount}</span>
                    </button>
                  </div>

                  {/* Acciones: Editar y Borrar */}
                  <div className="md:w-20 flex items-center justify-end gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar pendiente completo"
                      className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Eliminar pendiente"
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: BITÁCORA Y SEGUIMIENTO (Lápiz / Comentarios) */}
      {bitacoraItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                    Bitácora de Seguimiento
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-md">
                    {bitacoraItem.titulo || bitacoraItem.descripcion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBitacoraItem(null)}
                className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estado actual & Dónde se hace */}
            <div className="px-4 py-2 bg-gray-950/50 border-b border-gray-800/80 flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                Lugar / Necesidad: <strong className="text-gray-200">{bitacoraItem.deQuienDepende || 'General'}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${ESTATUS_CONFIG[bitacoraItem.estatus]?.badge || ''}`}>
                ● {bitacoraItem.estatus}
              </span>
            </div>

            {/* Historial de Comentarios */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 min-h-[160px] max-h-[300px]">
              {(!bitacoraItem.comentarios || bitacoraItem.comentarios.length === 0) ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  Aún no hay comentarios en la bitácora. Registra el primer avance o nota abajo.
                </div>
              ) : (
                bitacoraItem.comentarios.map((c, idx) => (
                  <div key={c.id || idx} className="bg-gray-950 border border-gray-800/80 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 border-b border-gray-800/50 pb-1">
                      <span className="font-semibold text-emerald-400">{c.autor || 'Usuario'}</span>
                      <span className="font-mono text-gray-400">{c.fecha || ''}</span>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed mt-1">
                      {c.texto}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para nuevo comentario / actualización de estatus */}
            <form onSubmit={handleSaveBitacoraComentario} className="p-4 bg-gray-950 border-t border-gray-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Escribir nuevo comentario / avance:
                </label>
                <textarea
                  rows={2}
                  required
                  value={nuevoComentarioTexto}
                  onChange={(e) => setNuevoComentarioTexto(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Cambiar estatus con este comentario:
                  </label>
                  <select
                    value={comentarioNuevoEstatus}
                    onChange={(e) => setComentarioNuevoEstatus(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="">Mantener estatus actual ({bitacoraItem.estatus})</option>
                    <option value="Esperando">Esperando (en espera de algo)</option>
                    <option value="Atendido">Atendido (ya se hizo y envió)</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Autor del comentario:
                  </label>
                  <input
                    type="text"
                    value={comentarioAutor}
                    onChange={(e) => setComentarioAutor(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-200 focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBitacoraItem(null)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={savingComentario || !nuevoComentarioTexto.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {savingComentario ? 'Guardando...' : 'Agregar a Bitácora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR PENDIENTE */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    {editingItem ? 'Editar Pendiente' : 'Nuevo Pendiente'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Ingresa los detalles para la requisición o tarea
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Título del Pendiente: *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Descripción corta o resumen:
                </label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  ¿A quién se pide, qué se necesita o dónde se hace?:
                </label>
                <input
                  type="text"
                  value={formDeQuienDepende}
                  onChange={(e) => setFormDeQuienDepende(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Fecha Límite / Entrega:
                  </label>
                  <input
                    type="date"
                    value={formFechaEntrega}
                    onChange={(e) => setFormFechaEntrega(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2 text-xs text-gray-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Urgencia:
                  </label>
                  <select
                    value={formUrgencia}
                    onChange={(e) => setFormUrgencia(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2 text-xs text-gray-100 focus:outline-none"
                  >
                    {URGENCIAS.map(u => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Estatus inicial:
                </label>
                <select
                  value={formEstatus}
                  onChange={(e) => setFormEstatus(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 focus:border-emerald-500 rounded-lg p-2 text-xs text-gray-100 focus:outline-none"
                >
                  {ESTATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  {saving ? 'Guardando...' : (editingItem ? 'Guardar Cambios' : 'Crear Pendiente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
