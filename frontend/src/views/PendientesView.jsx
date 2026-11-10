import React, { useState } from 'react';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Send, 
  X, 
  Check,
  Tag as TagIcon,
  History,
  Hourglass
} from 'lucide-react';

const ESTATUS_CONFIG = {
  'Pendiente': {
    label: 'Pendiente',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'En espera': {
    label: 'En espera',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'Esperando': {
    label: 'En espera',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'En Proceso': {
    label: 'En espera',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'Atendido': {
    label: 'Atendido',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  'Culminado': {
    label: 'Culminado',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 border-green-200'
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

    return matchSearch && matchStatus;
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
    setComentarioNuevoEstatus(normalizeStatus(item.estatus));
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
    } catch (err) {
      console.error('Error al agregar comentario:', err);
      alert('Error al guardar comentario en bitácora: ' + (err.message || ''));
    } finally {
      setSavingComentario(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Tarjetas de Resumen de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div 
          onClick={() => setStatusFilter('Todos')}
          className={`cursor-pointer bg-white dark:bg-gray-900 border rounded-3xl p-4 transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'Todos' ? 'border-[#173865] ring-2 ring-[#173865]/20 scale-[1.02]' : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Total Pendientes
            </span>
            <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('Pendiente')}
          className={`cursor-pointer bg-white dark:bg-gray-900 border rounded-3xl p-4 transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'Pendiente' ? 'border-amber-400 ring-2 ring-amber-400/25 scale-[1.02]' : 'border-gray-100 hover:border-amber-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Pendientes
            </span>
            <span className="text-2xl font-black text-amber-600">{pendientesCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('En espera')}
          className={`cursor-pointer bg-white dark:bg-gray-900 border rounded-3xl p-4 transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'En espera' ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[1.02]' : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
              En Espera
            </span>
            <span className="text-2xl font-black text-blue-600">{enEsperaCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('Atendido')}
          className={`cursor-pointer bg-white dark:bg-gray-900 border rounded-3xl p-4 transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'Atendido' ? 'border-cyan-500 ring-2 ring-cyan-500/20 scale-[1.02]' : 'border-gray-100 hover:border-cyan-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 block mb-1">
              Atendidos
            </span>
            <span className="text-2xl font-black text-cyan-600">{atendidosCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('Culminado')}
          className={`cursor-pointer bg-white dark:bg-gray-900 border rounded-3xl p-4 transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
            statusFilter === 'Culminado' ? 'border-green-500 ring-2 ring-green-500/20 scale-[1.02]' : 'border-gray-100 hover:border-green-200'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 block mb-1">
              Culminados
            </span>
            <span className="text-2xl font-black text-green-600">{culminadosCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda Compacta y Botón Nuevo Pendiente */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-xs">
        <div className="relative flex items-center w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 focus:border-[#173865] focus:ring-2 focus:ring-[#173865]/20 focus:bg-white rounded-full pl-9 pr-8 py-2 text-gray-800 focus:outline-none transition text-xs font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Pendiente
        </button>
      </div>

      {/* Tabla / Lista de Pendientes */}
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Cabecera */}
        <div className="hidden md:flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div className="w-8 text-center">✓</div>
          <div className="flex-1 min-w-0">Título & Descripción</div>
          <div className="w-52 text-center">Tags</div>
          <div className="w-28 text-center">Fecha Límite</div>
          <div className="w-36 text-center">Status</div>
          <div className="w-24 text-center">Bitácora</div>
          <div className="w-20 text-right pr-2">Acciones</div>
        </div>

        {/* Contenido de filas */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ListTodo className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-500">No hay pendientes que coincidan con la búsqueda.</p>
            <button
              onClick={handleOpenNew}
              className="mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#173865] rounded-full text-xs font-bold transition-all"
            >
              Registrar nuevo pendiente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
                  className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-5 py-3 transition-colors group ${
                    isCulminado 
                      ? 'bg-gray-50/60 opacity-65 hover:opacity-100' 
                      : 'hover:bg-gray-50/70 bg-white'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-between md:justify-center md:w-8">
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(item)}
                      title={isCulminado ? "Desmarcar culminado (pasar a pendiente)" : "Marcar como culminado"}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isCulminado 
                          ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                          : 'border-gray-300 bg-white hover:border-[#173865]'
                      }`}
                    >
                      {isCulminado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="md:hidden">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                        {normStatus}
                      </span>
                    </div>
                  </div>

                  {/* Título & Descripción */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold tracking-tight transition-colors ${
                        isCulminado 
                          ? 'line-through text-gray-400' 
                          : 'text-gray-800 group-hover:text-[#173865]'
                      }`}>
                        {item.titulo || item.descripcion}
                      </span>
                    </div>

                    {item.descripcion && item.descripcion !== item.titulo && (
                      <p className={`text-xs mt-0.5 font-normal break-words whitespace-normal leading-relaxed ${
                        isCulminado ? 'line-through text-gray-400' : 'text-gray-500'
                      }`}>
                        {item.descripcion}
                      </p>
                    )}
                  </div>

                  {/* TAGS */}
                  <div className="md:w-52 text-xs flex items-center justify-center text-center">
                    {itemTags.length > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {visibleTags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 max-w-[100px] truncate"
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                        {extraTagsCount > 0 && (
                          <span 
                            title={itemTags.slice(2).join(', ')}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#173865] border border-blue-200 cursor-help"
                          >
                            +{extraTagsCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>

                  {/* Fecha Límite */}
                  <div className="md:w-28 text-center text-xs">
                    {item.fechaEntrega ? (
                      <div className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                        isOverdue ? 'text-red-600 font-bold' : 'text-gray-500 font-medium'
                      }`}>
                        <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span>{item.fechaEntrega}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-[11px]">—</span>
                    )}
                  </div>

                  {/* Status Dropdown Pastilla */}
                  <div className="hidden md:flex md:w-36 justify-center">
                    <select
                      value={normStatus}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      className={`text-[11px] font-bold rounded-full pl-3 pr-7 py-1.5 border shadow-sm focus:outline-none transition-all cursor-pointer ${cfg.badge}`}
                    >
                      {ESTATUS_OPTIONS.map(st => (
                        <option key={st} value={st} className="bg-white text-gray-800">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón Bitácora */}
                  <div className="md:w-24 flex items-center justify-start md:justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenBitacora(item)}
                      title="Abrir bitácora y agregar comentarios"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        comentariosCount > 0 
                          ? 'bg-blue-50 text-[#173865] border-blue-200 hover:bg-blue-100' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{comentariosCount}</span>
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="md:w-20 flex items-center justify-end gap-1.5 pr-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar pendiente completo"
                      className="w-8 h-8 rounded-full bg-blue-50 text-[#173865] hover:bg-blue-100 flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Eliminar pendiente"
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
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

      {/* MODAL: BITÁCORA Y SEGUIMIENTO */}
      {bitacoraItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setBitacoraItem(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-[#173865] rounded-full flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Bitácora de Seguimiento
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-md font-medium">
                    {bitacoraItem.titulo || bitacoraItem.descripcion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBitacoraItem(null)}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tags e Info Actual */}
            <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate max-w-md">
                <span className="text-gray-400 font-bold uppercase">Tags:</span>
                {(bitacoraItem.tags || []).length > 0 ? (
                  bitacoraItem.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white text-gray-700 rounded-full text-[11px] font-semibold border border-gray-200">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Sin tags</span>
                )}
              </div>
              <span className={`px-3 py-0.5 rounded-full border text-[11px] font-bold ${ESTATUS_CONFIG[normalizeStatus(bitacoraItem.estatus)]?.badge || ''}`}>
                ● {normalizeStatus(bitacoraItem.estatus)}
              </span>
            </div>

            {/* Historial de Comentarios */}
            <div className="p-5 overflow-y-auto space-y-2 h-[195px] max-h-[195px]">
              {(!bitacoraItem.comentarios || bitacoraItem.comentarios.length === 0) ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Aún no hay comentarios en la bitácora. Registra el primer avance abajo.
                </div>
              ) : (
                bitacoraItem.comentarios.map((c, idx) => {
                  const isNathy = (c.autor || '').toLowerCase().includes('nathy');
                  return (
                    <div 
                      key={c.id || idx} 
                      className="flex items-start gap-2.5 px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs hover:border-blue-200 transition-colors"
                    >
                      <span className={`w-14 text-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex-shrink-0 mt-0.5 ${
                        isNathy 
                          ? 'bg-rose-100 text-rose-700 border-rose-200' 
                          : 'bg-blue-100 text-[#173865] border-blue-200'
                      }`}>
                        {c.autor || 'Nathy'}
                      </span>

                      <span className="w-28 text-[11px] font-mono text-gray-400 flex-shrink-0 mt-0.5">
                        {c.fecha || ''}
                      </span>

                      <span className="text-gray-300 font-bold flex-shrink-0 mt-0.5">:</span>

                      <div className="text-gray-800 flex-1 min-w-0 font-medium break-words whitespace-normal leading-relaxed">
                        {c.texto}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario para nuevo comentario */}
            <form onSubmit={handleSaveBitacoraComentario} className="p-5 bg-gray-50 border-t border-gray-100 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 pl-2">
                  Escribir avance o nota de bitácora:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoComentarioTexto}
                  onChange={(e) => setNuevoComentarioTexto(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#173865] rounded-full px-4 py-2 text-xs font-medium text-gray-800 focus:outline-none shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 pl-2">
                    Autor del comentario:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setComentarioAutor('Nathy')}
                      className={`h-[38px] px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${
                        comentarioAutor === 'Nathy'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-white text-rose-600 border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      Nathy
                    </button>
                    <button
                      type="button"
                      onClick={() => setComentarioAutor('Emi')}
                      className={`h-[38px] px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${
                        comentarioAutor === 'Emi'
                          ? 'bg-[#173865] text-white border-[#173865] shadow-md'
                          : 'bg-white text-[#173865] border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      Emi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 pl-2">
                    Cambiar estatus con este comentario:
                  </label>
                  <select
                    value={comentarioNuevoEstatus || normalizeStatus(bitacoraItem.estatus)}
                    onChange={(e) => setComentarioNuevoEstatus(e.target.value)}
                    className="select-pill w-full h-[38px] py-1 text-xs"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En espera">En espera</option>
                    <option value="Atendido">Atendido</option>
                    <option value="Culminado">Culminado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBitacoraItem(null)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-bold transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={savingComentario || !nuevoComentarioTexto.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-md transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setIsFormModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col cursor-default animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-[#173865] rounded-full flex items-center justify-center">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {editingItem ? 'Editar Pendiente' : 'Nuevo Pendiente'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Ingresa el título, etiquetas (TAGS) y detalles del pendiente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 pl-2">
                  Título del Pendiente: *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#173865] rounded-full px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 pl-2">
                  Descripción corta o resumen:
                </label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#173865] rounded-2xl p-3 text-xs font-medium text-gray-800 shadow-sm focus:outline-none"
                />
              </div>

              {/* INPUT DE TAGS INTERACTIVO */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 pl-2 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-[#173865]" />
                  TAGS:
                </label>

                <div className="w-full bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-[#173865] rounded-2xl p-2 flex flex-wrap items-center gap-1.5 min-h-[44px] shadow-sm transition">
                  {formTags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[#173865] border border-blue-200 text-xs font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-400 hover:text-red-600 ml-0.5"
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
                    className="flex-1 min-w-[120px] bg-transparent text-xs font-medium text-gray-800 focus:outline-none px-2 py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 pl-2">
                    Fecha Límite / Entrega:
                  </label>
                  <input
                    type="date"
                    value={formFechaEntrega}
                    onChange={(e) => setFormFechaEntrega(e.target.value)}
                    className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-[#173865] rounded-full px-4 py-2 text-xs font-bold text-gray-800 shadow-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 pl-2">
                    Estatus inicial:
                  </label>
                  <select
                    value={formEstatus}
                    onChange={(e) => setFormEstatus(e.target.value)}
                    className="select-pill w-full text-xs py-2"
                  >
                    {ESTATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#173865] hover:bg-blue-900 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-md transition-all"
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
