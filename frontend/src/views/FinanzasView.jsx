import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Filter, 
  Trash2, 
  CreditCard,
  Building,
  TrendingUp,
  DollarSign,
  Truck,
  ChevronDown,
  ChevronRight,
  Fuel,
  Coffee,
  Tag,
  Calendar,
  Layers,
  FileSpreadsheet,
  Ban,
  X,
  AlertCircle
} from 'lucide-react';
import ResicoDeclaracionView from '../components/ResicoDeclaracionView';

const CUENTAS = [
  'NU MINA',
  'NU EMI',
  'MERCADO PAGO',
  'EFECTIVO',
  'NU TDC',
  'PLATA TDC'
];

const CATEGORIAS = [
  'Insumos',
  'Gasolina',
  'Alimentos',
  'Recolección',
  'Otros'
];

export default function FinanzasView({ 
  movimientos = [], 
  saldos = {}, 
  recolecciones = [],
  pedidos = [],
  onOpenIngreso, 
  onOpenEgreso, 
  onOpenRecoleccion,
  onDeleteMovimiento,
  onCancelMovimiento,
  onDeleteRecoleccion
}) {
  const [selectedCuenta, setSelectedCuenta] = useState('TODAS');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [activeTab, setActiveTab] = useState('movimientos'); // 'movimientos' | 'recolecciones'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedRecolecciones, setExpandedRecolecciones] = useState({});
  const [cancelModalMov, setCancelModalMov] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelAutor, setCancelAutor] = useState('Nathy');
  const [cancelling, setCancelling] = useState(false);

  const normalizeCategoria = (cat) => {
    if (!cat) return 'Otros';
    if (cat.startsWith('Alimentos')) return 'Alimentos';
    if (cat.startsWith('Otros')) return 'Otros';
    return cat;
  };

  const formatDescripcion = (mov) => {
    let text = mov.detalle || mov.motivo || '';
    // Quitar (X conceptos)
    text = text.replace(/\s*\(\d+\s*conceptos?\)/gi, '');
    
    // Insumos del pedido PMD-xxx (Cliente) -> Insumos | PMD-xxx | Cliente
    const insMatch = text.match(/Insumos\s+(?:del\s+pedido\s+)?([A-Z0-9-]+)(?:\s*\(([^)]+)\))?/i);
    if (insMatch) {
      const ped = insMatch[1];
      const cli = insMatch[2];
      return cli ? `Insumos | ${ped} | ${cli}` : `Insumos | ${ped}`;
    }
    
    // Recolección REC-xxx (Categoria) -> Recolección REC-xxx | Categoria
    const recMatch = text.match(/Recolecci[oó]n\s+([A-Z0-9-]+)(?:\s*\(([^)]+)\))?/i);
    if (recMatch) {
      const recId = recMatch[1];
      let cat = recMatch[2] || '';
      if (cat.toLowerCase().includes('gasolina')) cat = 'Gasolina';
      else if (cat.toLowerCase().includes('alimento') || cat.toLowerCase().includes('desayuno')) cat = 'Alimentos';
      else if (cat.toLowerCase().includes('otro') || cat.toLowerCase().includes('caseta')) cat = 'Otros';
      return cat ? `Recolección ${recId} | ${cat}` : `Recolección ${recId}`;
    }

    // Reemplazar paréntesis por pleca separadora
    text = text.replace(/\s*\(([^)]+)\)/g, ' | $1');
    return text.trim();
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleRecoleccion = (id) => {
    setExpandedRecolecciones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter movements
  const filtered = movimientos.filter((m) => {
    const matchesCuenta = selectedCuenta === 'TODAS' || m.cuenta === selectedCuenta;
    const catNorm = normalizeCategoria(m.categoria);
    const matchesCategoria = selectedCategoria === 'TODAS' || catNorm === selectedCategoria;
    return matchesCuenta && matchesCategoria;
  });

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Dinámica: Si hay cuenta seleccionada, calcular métricas de esa cuenta; si no, de todo
  const isFilteredCuenta = selectedCuenta !== 'TODAS';
  const relevantMovimientos = isFilteredCuenta
    ? movimientos.filter(m => m.cuenta === selectedCuenta)
    : movimientos;

  const totalIngresos = relevantMovimientos
    .filter(m => m.tipo === 'INGRESO' && !m.cancelado)
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  const totalEgresos = relevantMovimientos
    .filter(m => m.tipo === 'EGRESO' && !m.cancelado)
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  const flujoNeto = totalIngresos - totalEgresos;

  // Category spending breakdown (egresos only para la cuenta seleccionada o global)
  const categoryTotals = CATEGORIAS.reduce((acc, cat) => {
    acc[cat] = relevantMovimientos
      .filter(m => m.tipo === 'EGRESO' && !m.cancelado && normalizeCategoria(m.categoria) === cat)
      .reduce((sum, m) => sum + (m.monto || 0), 0);
    return acc;
  }, {});

  const getCategoriaBadge = (cat) => {
    const c = normalizeCategoria(cat);
    switch (c) {
      case 'Insumos':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Gasolina':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Alimentos':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'Recolección':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700/60';
      case 'Otros':
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Highlights: Ingresos, Egresos, Flujo Neto dinámicos (Estilo Jobie) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-gradient-to-br from-[#00C988] to-[#059669] text-white p-5 rounded-3xl shadow-lg shadow-emerald-900/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-100 uppercase font-bold tracking-wider block truncate mb-1">
              Total Ingresos {isFilteredCuenta && <strong className="text-white font-extrabold ml-1">({selectedCuenta})</strong>}
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">{formatMoney(totalIngresos)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#FF4D6D] to-[#E63956] text-white p-5 rounded-3xl shadow-lg shadow-rose-900/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-rose-100 uppercase font-bold tracking-wider block truncate mb-1">
              Total Egresos {isFilteredCuenta ? <strong className="text-white font-extrabold ml-1">({selectedCuenta})</strong> : '/ Gastos'}
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">{formatMoney(totalEgresos)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#3511A3] to-[#4F26E2] text-white p-5 rounded-3xl shadow-lg shadow-indigo-900/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-purple-200 uppercase font-bold tracking-wider block truncate mb-1">
              {isFilteredCuenta ? <span>Flujo Neto <strong className="text-white font-extrabold">({selectedCuenta})</strong></span> : 'Flujo Neto en Caja'}
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">{formatMoney(flujoNeto)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Saldos por Cuenta{/* Saldos por Cuenta y Método de Pago */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Saldos por Cuenta y Método de Pago
            </span>
            {isFilteredCuenta && (
              <button
                onClick={() => setSelectedCuenta('TODAS')}
                className="text-[10px] font-bold text-orange-400 hover:text-orange-300 bg-orange-950/60 border border-orange-700/60 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                title="Quitar filtro y ver todas las cuentas"
              >
                <span>Filtro: {selectedCuenta}</span>
                <span className="text-gray-400 hover:text-white ml-0.5">✕</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenIngreso}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00C988] hover:bg-[#00B377] text-white text-xs font-bold rounded-full shadow-md shadow-emerald-900/15 transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
              <span>Ingreso</span>
            </button>
            <button
              onClick={onOpenEgreso}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF4D6D] hover:bg-[#E63956] text-white text-xs font-bold rounded-full shadow-md shadow-rose-900/15 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              <span>Egreso</span>
            </button>
            {onOpenRecoleccion && (
              <button
                onClick={onOpenRecoleccion}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#3511A3] hover:bg-[#2B0E85] text-white text-xs font-bold rounded-full shadow-md shadow-indigo-900/15 transition-all active:scale-95"
                title="Registrar gastos de gasolina, comida y ruta prorrateada entre pedidos"
              >
                <Truck className="w-3.5 h-3.5 text-white" />
                <span>Registrar Recolección</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CUENTAS.map((c) => {
            const saldo = saldos[c] || 0;
            const isNegative = saldo < 0;
            const isSelected = selectedCuenta === c;
            return (
              <div
                key={c}
                onClick={() => setSelectedCuenta(isSelected ? 'TODAS' : c)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${
                  isSelected
                    ? 'bg-orange-600/20 border-orange-500 ring-1 ring-orange-500'
                    : 'bg-th-1c1d1f border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{c}</span>
                  <CreditCard className="w-3 h-3 text-gray-500 shrink-0" />
                </div>
                <div className={`mt-1 font-mono font-bold text-sm truncate ${
                  isNegative ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatMoney(saldo)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Switcher: [ Movimientos de Caja ] vs [ Historial de Recolecciones ] vs [ Declaración & RESICO SAT ] */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'movimientos'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-th-1c1d1f text-gray-400 hover:text-gray-200 border border-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Movimientos de Caja</span>
            <span
              className={`min-w-[18px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center leading-none ${
                activeTab === 'movimientos'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'bg-gray-800 text-gray-200 border border-gray-700/60'
              }`}
            >
              {filtered.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recolecciones')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recolecciones'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-th-1c1d1f text-gray-400 hover:text-gray-200 border border-gray-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Historial de Recolecciones</span>
            <span
              className={`min-w-[18px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center leading-none ${
                activeTab === 'recolecciones'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'bg-gray-800 text-gray-200 border border-gray-700/60'
              }`}
            >
              {recolecciones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resico')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'resico'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-th-1c1d1f text-gray-400 hover:text-gray-200 border border-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Declaración & RESICO SAT</span>
            <span
              className={`min-w-[18px] h-4 px-1.5 rounded-full text-xs font-bold flex items-center justify-center leading-none ${
                activeTab === 'resico'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
              }`}
            >
              SAT
            </span>
          </button>
        </div>

        {activeTab === 'recolecciones' && onOpenRecoleccion && (
          <button
            onClick={onOpenRecoleccion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Nueva Recolección</span>
          </button>
        )}
      </div>

      {/* Category Expenses Breakdown & Filters (Shown for Movimientos de Caja) */}
      {activeTab === 'movimientos' && (
        <div className="bg-th-18191b p-3 rounded-xl border border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-400" />
              Gastos por Categoría
            </span>
            <span className="text-[11px] text-gray-500">Filtrar transacciones:</span>
          </div>

          {/* Category Pills with Total Spent */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategoria('TODAS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategoria === 'TODAS'
                  ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                  : 'bg-th-151617 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
              }`}
            >
              <span>Todas</span>
              <span
                className={`min-w-[18px] h-4 px-1 rounded-full text-xs font-bold font-mono flex items-center justify-center leading-none tracking-tight ${
                  selectedCategoria === 'TODAS'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'bg-gray-800 text-gray-200 border border-gray-700/60'
                }`}
              >
                {relevantMovimientos.length}
              </span>
            </button>

            {CATEGORIAS.map((cat) => {
              const spent = categoryTotals[cat] || 0;
              const isSelected = selectedCategoria === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(isSelected ? 'TODAS' : cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                      : 'bg-th-151617 text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`min-w-[18px] h-4 px-1 rounded-full text-xs font-bold font-mono flex items-center justify-center leading-none tracking-tight ${
                      isSelected
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'bg-gray-800 text-gray-200 border border-gray-700/60'
                    }`}
                  >
                    {formatMoney(spent)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: MOVIMIENTOS DE CAJA (Horizontal Single-Row Table) */}
      {activeTab === 'movimientos' && (
        <div className="bg-th-18191b rounded-xl border border-gray-800 overflow-hidden shadow-lg">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">
              Historial de Movimientos {selectedCuenta !== 'TODAS' ? `(${selectedCuenta})` : ''} {selectedCategoria !== 'TODAS' ? `• [${selectedCategoria}]` : ''}
            </span>
            <span className="text-xs text-gray-500">{filtered.length} registrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-th-141517 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-2 text-center w-8"></th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">TIPO</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">FECHA</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">MÉTODO PAGO</th>
                  <th className="py-2.5 px-3 min-w-[220px]">DESCRIPCIÓN</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">CATEGORÍA</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">MONTO</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.length > 0 ? (
                  filtered.map((mov) => {
                    const isIng = mov.tipo === 'INGRESO';
                    const isGroup = mov.esGrupoInsumos && mov.insumos && mov.insumos.length > 0;
                    const isExpanded = !!expandedGroups[mov.id];

                    return (
                      <React.Fragment key={mov.id}>
                        {/* Horizontal Single-Line Movement Row */}
                        <tr 
                          onClick={() => isGroup && toggleGroup(mov.id)}
                          className={`hover:bg-th-1f2022 transition-colors ${isGroup ? 'cursor-pointer' : ''}`}
                        >
                          {/* Col 0: Chevron / Expand */}
                          <td className="py-2.5 px-2 text-center">
                            {isGroup ? (
                              <button 
                                type="button" 
                                className="p-1 hover:text-gray-50 rounded text-gray-400 transition-colors"
                                onClick={(e) => { e.stopPropagation(); toggleGroup(mov.id); }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-orange-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center mx-auto text-gray-600">•</div>
                            )}
                          </td>

                          {/* Col 1: Tipo */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isIng 
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60' 
                                : 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                            }`}>
                              {mov.tipo}
                            </span>
                          </td>

                          {/* Col 2: Fecha */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-gray-400">
                            {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-MX') : '-'}
                          </td>

                          {/* Col 3: Método de Pago */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800/80 border border-gray-700/80 text-gray-300">
                              {mov.cuenta}
                            </span>
                          </td>

                          {/* Col 4: Descripción */}
                          <td className="py-2.5 px-3 max-w-[320px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-200 font-medium">{formatDescripcion(mov)}</span>
                              {mov.nota && (
                                <span className="text-[11px] text-amber-400/90 italic">({mov.nota})</span>
                              )}
                            </div>
                          </td>

                          {/* Col 5: Categoría */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {mov.categoria ? (
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${getCategoriaBadge(mov.categoria)}`}>
                                {normalizeCategoria(mov.categoria)}
                              </span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>

                          {/* Col 6: Monto */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isIng ? 'text-emerald-400' : 'text-rose-400'}>
                              {isIng ? '+' : '-'}{formatMoney(mov.monto)}
                            </span>
                          </td>

                          {/* Col 7: Acciones */}
                          <td className="py-2.5 px-2 text-center">
                            {!isGroup && onDeleteMovimiento && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMovimiento(mov.id);
                                }}
                                className="p-1 text-gray-600 hover:text-rose-400 transition-colors"
                                title="Eliminar movimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Grouped Insumos Sub-Table without redundant header */}
                        {isGroup && isExpanded && (
                          <tr className="bg-th-121315">
                            <td colSpan={8} className="p-3 pl-8 pr-4">
                              <div className="rounded-lg border border-gray-700/80 overflow-hidden bg-th-18191c">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-th-141517 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider">
                                        <th className="py-2.5 px-3">INSUMO / MATERIAL</th>
                                        <th className="py-2.5 px-3 text-center">PROVEEDOR</th>
                                        <th className="py-2.5 px-2 text-center">CANT.</th>
                                        <th className="py-2.5 px-3 text-center">COSTO REAL</th>
                                        <th className="py-2.5 px-3 text-center">COSTO TOTAL</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                                      {mov.insumos.map((ins, iIdx) => (
                                        <tr key={iIdx} className="hover:bg-gray-800/40 text-gray-300 transition-colors">
                                          <td className="py-2 px-3 font-sans font-medium text-gray-200">
                                            {ins.insumo || ins.nombre}
                                          </td>
                                          <td className="py-2 px-3 font-sans text-center text-gray-400">
                                            {ins.proveedor || '-'}
                                          </td>
                                          <td className="py-2 px-2 text-center font-bold text-gray-200">
                                            {ins.cant}
                                          </td>
                                          <td className="py-2 px-3 text-center text-gray-300">
                                            {formatMoney(ins.costoReal)}
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-rose-300">
                                            {formatMoney(ins.costoTotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-th-141517 border-t border-gray-700 font-bold text-xs">
                                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-gray-400 font-sans">
                                          Total Insumos Pagados ({mov.cuenta}):
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-mono text-rose-400">
                                          -{formatMoney(mov.monto)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
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
                    <td colSpan={8} className="p-8 text-center text-gray-500 text-xs">
                      No hay movimientos registrados que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE RECOLECCIONES */}
      {activeTab === 'recolecciones' && (
        <div className="bg-th-18191b rounded-xl border border-gray-800 overflow-hidden shadow-lg">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">
              Historial de Recolecciones
            </span>
            <span className="text-xs text-gray-500">{recolecciones.length} registradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-th-141517 text-gray-400 border-b border-gray-800 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-2 text-center w-8"></th>
                  <th className="py-2.5 px-3 text-center min-w-[90px]">FOLIO</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">FECHA</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">MÉTODO PAGO</th>
                  <th className="py-2.5 px-3 min-w-[220px]">DESCRIPCIÓN / CONCEPTOS</th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">PRORRATEO</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">TOTAL GASTO</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recolecciones && recolecciones.length > 0 ? (
                  recolecciones.map((rec) => {
                    const isExpanded = !!expandedRecolecciones[rec.id];
                    const recIdLabel = `REC-${String(rec.id).replace('REC-', '').padStart(3, '0')}`;
                    const numPeds = rec.pedidos ? rec.pedidos.length : 0;
                    const porcion = numPeds > 0 ? (rec.totalGasto / numPeds) : 0;

                    const conceptos = [];
                    if (rec.gastoGasolina > 0) conceptos.push(`Gasolina: ${formatMoney(rec.gastoGasolina)}`);
                    if (rec.gastoDesayuno > 0) conceptos.push(`Alimentos: ${formatMoney(rec.gastoDesayuno)}`);
                    if (rec.gastoOtros > 0) conceptos.push(`Otros: ${formatMoney(rec.gastoOtros)}`);
                    const descText = conceptos.length > 0 ? conceptos.join(' | ') : 'Gasto general de ruta';

                    return (
                      <React.Fragment key={rec.id}>
                        {/* Single Horizontal Row */}
                        <tr 
                          onClick={() => toggleRecoleccion(rec.id)}
                          className="hover:bg-th-1f2022 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-2 text-center">
                            <button 
                              type="button" 
                              className="p-1 hover:text-gray-50 rounded text-gray-400 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleRecoleccion(rec.id); }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-orange-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-orange-950 text-orange-300 border border-orange-700/70">
                              {recIdLabel}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-gray-400">
                            {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX') : '-'}
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                              {rec.cuenta}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 max-w-[280px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-200 font-medium truncate">{descText}</span>
                              {rec.nota && (
                                <span className="text-[11px] text-amber-400/90 italic">({rec.nota})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="text-amber-400 font-mono font-semibold text-[11px]">
                              {numPeds} peds ({formatMoney(porcion)} c/u)
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                            -{formatMoney(rec.totalGasto)}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            {onDeleteRecoleccion && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRecoleccion(rec.id);
                                }}
                                className="p-1 text-gray-600 hover:text-rose-400 transition-colors"
                                title="Eliminar recolección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <tr className="bg-th-121315">
                            <td colSpan={8} className="p-3 pl-8 pr-4">
                              <div className="p-3.5 bg-th-161719 border border-gray-800 rounded-xl text-xs space-y-3 animate-in fade-in">
                                {/* Expense Breakdown Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Fuel className="w-4 h-4 text-cyan-400" />
                                      <span className="text-gray-300 text-[11px]">Gasolina</span>
                                    </div>
                                    <span className="font-mono font-bold text-cyan-300">{formatMoney(rec.gastoGasolina)}</span>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Coffee className="w-4 h-4 text-purple-400" />
                                      <span className="text-gray-300 text-[11px]">Alimentos</span>
                                    </div>
                                    <span className="font-mono font-bold text-purple-300">{formatMoney(rec.gastoDesayuno)}</span>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-300 text-[11px]">Otros Gastos</span>
                                    </div>
                                    <span className="font-mono font-bold text-gray-200">{formatMoney(rec.gastoOtros)}</span>
                                  </div>
                                </div>

                                {/* Note if any */}
                                {rec.nota && (
                                  <div className="p-2 rounded-lg bg-black/30 border border-gray-800 text-gray-300 text-[11px]">
                                    <strong className="text-amber-400">Nota / Comentario de ruta:</strong> {rec.nota}
                                  </div>
                                )}

                                {/* List of orders included with real Client Name */}
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                                    Pedidos Beneficiados con el Reparto ({formatMoney(rec.totalGasto)} / {numPeds} = {formatMoney(porcion)} por pedido):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {rec.pedidos && rec.pedidos.map((ped, pIdx) => {
                                      const clientName = ped.cliente || (pedidos && pedidos.find(p => p.id === ped.pedidoId)?.cliente) || 'Cliente';

                                      return (
                                        <div key={pIdx} className="p-2 rounded-lg bg-th-1a1b1e border border-gray-800 flex items-center justify-between text-[11px]">
                                          <div className="flex items-center gap-2 truncate">
                                            <span className="font-mono font-bold text-orange-400 bg-orange-950/80 px-1.5 py-0.2 rounded border border-orange-800">
                                              {ped.pedidoId}
                                            </span>
                                            <span className="text-gray-200 font-medium truncate">{clientName}</span>
                                          </div>
                                          <span className="font-mono font-bold text-amber-300 shrink-0">
                                            +{formatMoney(ped.porcion)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
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
                    <td colSpan={8} className="p-8 text-center text-gray-500 text-xs">
                      No hay recolecciones registradas aún. Haz clic en "Nueva Recolección" para registrar gastos de ruta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DECLARACION Y RESICO SAT */}
      {activeTab === 'resico' && (
        <ResicoDeclaracionView />
      )}
      {/* MODAL: CANCELAR MOVIMIENTO DE CAJA */}
      {cancelModalMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer" onClick={() => setCancelModalMov(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100">
                    Cancelar Movimiento de Caja
                  </h3>
                  <p className="text-xs text-gray-400">
                    Se descontará de los totales y quedará registrado el motivo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalMov(null)}
                className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido / Info del movimiento */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!cancelMotivo.trim()) return;
                try {
                  setCancelling(true);
                  await onCancelMovimiento(cancelModalMov.id, {
                    motivo: cancelMotivo.trim(),
                    canceladoPor: cancelAutor
                  });
                  setCancelModalMov(null);
                } catch (err) {
                  console.error('Error al cancelar movimiento:', err);
                  alert('Error al cancelar movimiento: ' + (err.message || ''));
                } finally {
                  setCancelling(false);
                }
              }}
              className="p-4 space-y-3.5 text-xs"
            >
              {/* Resumen del movimiento a cancelar */}
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Monto del movimiento:</span>
                  <span className={`font-mono font-bold text-sm ${cancelModalMov.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {cancelModalMov.tipo === 'INGRESO' ? '+' : '-'}{formatMoney(cancelModalMov.monto)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Cuenta:</span>
                  <span className="text-gray-200 font-semibold">{cancelModalMov.cuenta}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Concepto:</span>
                  <span className="text-gray-200 truncate max-w-[220px]">{formatDescripcion(cancelModalMov)}</span>
                </div>
              </div>

              {/* Selector de Quién lo cancela: Nathy o Emi */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  ¿Quién cancela este movimiento?: *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelAutor('Nathy')}
                    className={`h-[36px] px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                      cancelAutor === 'Nathy'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950 ring-1 ring-rose-400'
                        : 'bg-gray-950 text-rose-300 border-gray-700 hover:border-rose-700/50'
                    }`}
                  >
                    Nathy
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelAutor('Emi')}
                    className={`h-[36px] px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                      cancelAutor === 'Emi'
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                        : 'bg-gray-950 text-cyan-300 border-gray-700 hover:border-cyan-700/50'
                    }`}
                  >
                    Emi
                  </button>
                </div>
              </div>

              {/* Motivo de cancelación obligatorio */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Motivo obligatorio de cancelación: *
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 focus:border-rose-500 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setCancelModalMov(null)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelMotivo.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950 transition-all"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
