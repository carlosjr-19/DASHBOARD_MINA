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
  Check,
  Tag as TagIcon,
  Filter,
  History,
  AlertTriangle,
  Hourglass
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
  'En espera': {
    label: 'En espera',
    dot: 'bg-purple-400',
    badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50'
  },
  'Esperando': { // compatibilidad
    label: 'En espera',
    dot: 'bg-purple-400',
    badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50'
  },
  'En Proceso': { // compatibilidad
    label: 'En espera',
    dot: 'bg-purple-400',
    badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50'
  },
  'Atendido': {
    label: 'Atendido',
    dot: 'bg-cyan-400',
    badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50'
  },
  'Culminado': {
    label: 'Culminado',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
  }
};

const ESTATUS_OPTIONS = ['Pendiente', 'En espera', 'Atendido', 'Culminado'];

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
  const [formTags, setFormTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [formUrgencia, setFormUrgencia] = useState('Media');
  const [formFechaSolicitud, setFormFechaSolicitud] = useState(todayIso);
  const [formFechaEntrega, setFormFechaEntrega] = useState('');
  const [formEstatus, setFormEstatus] = useState('Pendiente');
  const [saving, setSaving] = useState(false);

  // Modal Bitácora / Seguimiento
  const [bitacoraItem, setBitacoraItem] = useState(null);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [comentarioNuevoEstatus, setComentarioNuevoEstatus] = useState('');
  const [comentarioAutor, setComentarioAutor] = useState('Nathy');
  const [savingComentario, setSavingComentario] = useState(false);

  // Normalizar estatus para filtros
  const normalizeStatus = (st) => {
    if (!st) return 'Pendiente';
    if (st === 'Esperando' || st === 'En Proceso') return 'En espera';
    return st;
  };

  // Filtered List
  const filtered = pendientes.filter((item) => {
    const term = searchTerm.toLowerCase();
    const itemTagsStr = (item.tags || []).join(' ').toLowerCase();
    const matchSearch = 
      (item.titulo || '').toLowerCase().includes(term) ||
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.deQuienDepende || '').toLowerCase().includes(term) ||
      itemTagsStr.includes(term);

    const normItemSt = normalizeStatus(item.estatus);
    const matchStatus = statusFilter === 'Todos' || normItemSt === statusFilter;
    const matchUrgencia = urgenciaFilter === 'Todas' || (item.urgencia || 'Media') === urgenciaFilter;

    return matchSearch && matchStatus && matchUrgencia;
  });

  // Metrics
  const totalCount = pendientes.length;
  const pendientesCount = pendientes.filter(p => normalizeStatus(p.estatus) === 'Pendiente').length;
  const enEsperaCount = pendientes.filter(p => normalizeStatus(p.estatus) === 'En espera').length;
  const atendidosCount = pendientes.filter(p => normalizeStatus(p.estatus) === 'Atendido').length;
  const culminadosCount = pendientes.filter(p => normalizeStatus(p.estatus) === 'Culminado').length;

  const handleOpenNew = () => {
    setEditingItem(null);
    setFormTitulo('');
    setFormDescripcion('');
    setFormTags([]);
    setTagInput('');
    setFormUrgencia('Media');
    setFormFechaSolicitud(todayIso);
    setFormFechaEntrega('');
    setFormEstatus('Pendiente');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitulo(item.titulo || '');
    setFormDescripcion(item.descripcion || '');
    setFormTags(Array.isArray(item.tags) ? [...item.tags] : (item.deQuienDepende ? item.deQuienDepende.split(',').map(s => s.trim()).filter(Boolean) : []));
    setTagInput('');
    setFormUrgencia(item.urgencia || 'Media');
    setFormFechaSolicitud(item.fechaSolicitud || todayIso);
    setFormFechaEntrega(item.fechaEntrega || '');
    setFormEstatus(normalizeStatus(item.estatus));
    setIsFormModalOpen(true);
  };

  // Tag Handlers en Modal
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    } else if (e.key === 'Backspace' && !tagInput && formTags.length > 0) {
      setFormTags(prev => prev.slice(0, -1));
    }
  };

  const addTagFromInput = () => {
    const clean = tagInput.trim().replace(/^,|,$/g, '');
    if (clean && !formTags.includes(clean)) {
      setFormTags(prev => [...prev, clean]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setFormTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formTitulo.trim() && !formDescripcion.trim()) return;

    // Si quedó algo en tagInput al presionar guardar, agregarlo
    let currentTags = [...formTags];
    const pendingTag = tagInput.trim().replace(/^,|,$/g, '');
    if (pendingTag && !currentTags.includes(pendingTag)) {
      currentTags.push(pendingTag);
    }

    try {
      setSaving(true);
      await onSavePendiente({
        id: editingItem ? editingItem.id : undefined,
        titulo: formTitulo.trim() || formDescripcion.trim().slice(0, 40),
        descripcion: formDescripcion.trim(),
        tags: currentTags,
        de_quien_depende: currentTags.join(', '),
        urgencia: formUrgencia,
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

  // Checkbox: toggle Culminado
  const handleToggleCheck = async (item) => {
    const isCulminado = normalizeStatus(item.estatus) === 'Culminado';
    const nuevo = isCulminado ? 'Pendiente' : 'Culminado';
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
    setComentarioAutor('Nathy');
  };

  const handleSaveBitacoraComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentarioTexto.trim() || !bitacoraItem) return;

    try {
      setSavingComentario(true);
      await onAddComentario(bitacoraItem.id, {
        texto: nuevoComentarioTexto.trim(),
        autor: comentarioAutor,
        nuevoEstatus: comentarioNuevoEstatus || undefined
      });

      const nuevo = {
        id: `com-${Date.now()}`,
        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
        autor: comentarioAutor,
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
      {/* 1. Header Superior: Título a la izquierda, SOLO botón "+ Nuevo Pendiente" a la derecha */}
      <div className="flex items-center justify-between gap-4 bg-gray-900/80 p-4 rounded-xl border border-gray-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              Pendientes & Bitácora
            </h1>
            <p className="text-xs text-gray-400">
              Control de tareas, requisiciones con tags y seguimiento de bitácora
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Pendiente
        </button>
      </div>

      {/* 2. Tarjetas de Resumen de Métricas (Diseño idéntico a las tarjetas del ERP) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('Todos')}
          className={`cursor-pointer bg-gray-900/90 border rounded-xl p-3.5 transition-all flex items-center justify-between ${
            statusFilter === 'Todos' ? 'border-gray-500 shadow-lg ring-1 ring-gray-500' : 'border-gray-800 hover:border-gray-700'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              TOTAL PENDIENTES
            </span>
            <span className="text-2xl font-black text-gray-100">{totalCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-800 text-gray-300">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        {/* Pendientes Activos */}
        <div 
          onClick={() => setStatusFilter('Pendiente')}
          className={`cursor-pointer bg-gray-900/90 border rounded-xl p-3.5 transition-all flex items-center justify-between ${
            statusFilter === 'Pendiente' ? 'border-amber-500 shadow-lg ring-1 ring-amber-500' : 'border-gray-800 hover:border-amber-900/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-1">
              PENDIENTES
            </span>
            <span className="text-2xl font-black text-amber-400">{pendientesCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/50">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* En espera */}
        <div 
          onClick={() => setStatusFilter('En espera')}
          className={`cursor-pointer bg-gray-900/90 border rounded-xl p-3.5 transition-all flex items-center justify-between ${
            statusFilter === 'En espera' ? 'border-purple-500 shadow-lg ring-1 ring-purple-500' : 'border-gray-800 hover:border-purple-900/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/90 block mb-1">
              EN ESPERA
            </span>
            <span className="text-2xl font-black text-purple-400">{enEsperaCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/50">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Atendidos */}
        <div 
          onClick={() => setStatusFilter('Atendido')}
          className={`cursor-pointer bg-gray-900/90 border rounded-xl p-3.5 transition-all flex items-center justify-between ${
            statusFilter === 'Atendido' ? 'border-cyan-500 shadow-lg ring-1 ring-cyan-500' : 'border-gray-800 hover:border-cyan-900/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 block mb-1">
              ATENDIDOS
            </span>
            <span className="text-2xl font-black text-cyan-400">{atendidosCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Culminados */}
        <div 
          onClick={() => setStatusFilter('Culminado')}
          className={`cursor-pointer bg-gray-900/90 border rounded-xl p-3.5 transition-all flex items-center justify-between ${
            statusFilter === 'Culminado' ? 'border-emerald-500 shadow-lg ring-1 ring-emerald-500' : 'border-gray-800 hover:border-emerald-900/40'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block mb-1">
              CULMINADOS
            </span>
            <span className="text-2xl font-black text-emerald-400">{culminadosCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-xs">
        <div className="relative flex-1 w-full">
          <label className="text-[11px] font-semibold text-gray-400 block mb-1">Buscar por título, detalle o tags:</label>
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

      {/* 4. Tabla / Lista de Pendientes (100% primera plana, sin scroll horizontal) */}
      <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {/* Cabecera */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-950 border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="w-8 text-center">✓</div>
          <div className="flex-1 min-w-0">Título & Descripción</div>
          <div className="w-52 text-center">TAGS</div>
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
              const normStatus = normalizeStatus(item.estatus);
              const isCulminado = normStatus === 'Culminado';
              const cfg = ESTATUS_CONFIG[normStatus] || ESTATUS_CONFIG['Pendiente'];
              const comentariosCount = (item.comentarios || []).length;
              const isOverdue = item.fechaEntrega && item.fechaEntrega < todayIso && !isCulminado;

              const itemTags = Array.isArray(item.tags) 
                ? item.tags 
                : (item.deQuienDepende ? item.deQuienDepende.split(',').map(s => s.trim()).filter(Boolean) : []);

              const visibleTags = itemTags.slice(0, 2);
              const extraTagsCount = itemTags.length - 2;

              return (
                <div 
                  key={item.id}
                  className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-4 py-2.5 transition-colors group ${
                    isCulminado 
                      ? 'bg-gray-950/40 opacity-70 hover:opacity-100' 
                      : 'hover:bg-gray-800/40 bg-gray-900/60'
                  }`}
                >
                  {/* Checkbox: marca como Culminado y tacha */}
                  <div className="flex items-center justify-between md:justify-center md:w-8">
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(item)}
                      title={isCulminado ? "Desmarcar culminado (pasar a pendiente)" : "Marcar como culminado"}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isCulminado 
                          ? 'bg-emerald-500 border-emerald-400 text-gray-950 shadow-sm shadow-emerald-950' 
                          : 'border-gray-600 bg-gray-950 hover:border-emerald-500'
                      }`}
                    >
                      {isCulminado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* En móvil mostrar el estatus aquí */}
                    <div className="md:hidden">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                        {normStatus}
                      </span>
                    </div>
                  </div>

                  {/* Título (Más Negrito) & Descripción */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-extrabold tracking-tight transition-all ${
                        isCulminado 
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
                      <p className={`text-xs mt-0.5 truncate max-w-xl font-normal ${
                        isCulminado ? 'line-through text-gray-400' : 'text-gray-400'
                      }`}>
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  {/* TAGS: Centrado, Máximo 2 visibles y luego +N */}
                  <div className="md:w-52 text-xs flex items-center justify-center text-center">
                    {itemTags.length > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {visibleTags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-800/90 text-gray-200 border border-gray-700 max-w-[100px] truncate"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                        {extraTagsCount > 0 && (
                          <span 
                            title={itemTags.slice(2).join(', ')}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-emerald-400 border border-emerald-700/60 cursor-help"
                          >
                            +{extraTagsCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">—</span>
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

                  {/* Status Dropdown (Sin tanto texto: Pendiente, En espera, Atendido, Culminado) */}
                  <div className="hidden md:flex md:w-32 justify-center">
                    <select
                      value={normStatus}
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

      {/* MODAL: BITÁCORA Y SEGUIMIENTO (Comentarios en 1 sola línea, Autor Nathy o Emi) */}
      {bitacoraItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Bitácora de Seguimiento
                  </h3>
                  <p className="text-xs text-gray-400 truncate max-w-md font-medium">
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

            {/* Tags e Info Actual */}
            <div className="px-4 py-2 bg-gray-950/50 border-b border-gray-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate max-w-md">
                <span className="text-gray-400">TAGS:</span>
                {(bitacoraItem.tags || []).length > 0 ? (
                  bitacoraItem.tags.map((t, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded text-[10px] border border-gray-700">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Sin tags</span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${ESTATUS_CONFIG[normalizeStatus(bitacoraItem.estatus)]?.badge || ''}`}>
                ● {normalizeStatus(bitacoraItem.estatus)}
              </span>
            </div>

            {/* Historial de Comentarios en UNA SOLA LÍNEA */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 min-h-[160px] max-h-[300px]">
              {(!bitacoraItem.comentarios || bitacoraItem.comentarios.length === 0) ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  Aún no hay comentarios en la bitácora. Registra el primer avance abajo.
                </div>
              ) : (
                bitacoraItem.comentarios.map((c, idx) => {
                  const isNathy = (c.autor || '').toLowerCase().includes('nathy');
                  return (
                    <div 
                      key={c.id || idx} 
                      className="flex items-center gap-2.5 px-3 py-2 bg-gray-950 border border-gray-800/90 rounded-lg text-xs hover:border-gray-700 transition-colors"
                    >
                      {/* Badge de Autor: Nathy (Rosa) o Emi (Cyan) */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border flex-shrink-0 ${
                        isNathy 
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/70' 
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/70'
                      }`}>
                        {c.autor || 'Nathy'}
                      </span>

                      {/* Fecha y Hora */}
                      <span className="text-[11px] font-mono text-gray-400 flex-shrink-0">
                        {c.fecha || ''}
                      </span>

                      {/* Separador */}
                      <span className="text-gray-400 font-bold flex-shrink-0">:</span>

                      {/* Texto del comentario en la misma línea */}
                      <span className="text-gray-200 truncate flex-1 min-w-0 font-medium" title={c.texto}>
                        {c.texto}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario para nuevo comentario / actualización de estatus */}
            <form onSubmit={handleSaveBitacoraComentario} className="p-4 bg-gray-950 border-t border-gray-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Escribir avance o nota de bitácora:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoComentarioTexto}
                  onChange={(e) => setNuevoComentarioTexto(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Selector de Autor con 2 botones de colores: Nathy o Emi */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Autor del comentario:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setComentarioAutor('Nathy')}
                      className={`h-[36px] px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                        comentarioAutor === 'Nathy'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950 ring-1 ring-rose-400'
                          : 'bg-gray-900 text-rose-300 border-gray-700 hover:border-rose-700/50'
                      }`}
                    >
                      Nathy
                    </button>
                    <button
                      type="button"
                      onClick={() => setComentarioAutor('Emi')}
                      className={`h-[36px] px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                        comentarioAutor === 'Emi'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                          : 'bg-gray-900 text-cyan-300 border-gray-700 hover:border-cyan-700/50'
                      }`}
                    >
                      Emi
                    </button>
                  </div>
                </div>

                {/* Actualizar estatus con el mismo grosor y altura */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    Cambiar estatus con este comentario:
                  </label>
                  <select
                    value={comentarioNuevoEstatus}
                    onChange={(e) => setComentarioNuevoEstatus(e.target.value)}
                    className="w-full h-[36px] bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500 text-xs font-semibold cursor-pointer"
                  >
                    <option value="">Mantener actual ({normalizeStatus(bitacoraItem.estatus)})</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En espera">En espera</option>
                    <option value="Atendido">Atendido</option>
                    <option value="Culminado">Culminado</option>
                  </select>
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

      {/* MODAL: CREAR / EDITAR PENDIENTE (Con N tags interactivos estilo correos) */}
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
                    Ingresa el título, etiquetas (TAGS) y detalles del pendiente
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

              {/* INPUT DE TAGS INTERACTIVO (Enter o coma separa etiquetas) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-emerald-400" />
                    TAGS (A quién se pide, qué se necesita o dónde):
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Presiona Enter o Coma para agregar</span>
                </div>

                <div className="w-full bg-gray-950 border border-gray-700 focus-within:border-emerald-500 rounded-lg p-2 flex flex-wrap items-center gap-1.5 min-h-[42px] transition-colors">
                  {formTags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-400 hover:text-rose-400 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTagFromInput}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-100 focus:outline-none py-1"
                  />
                </div>
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
