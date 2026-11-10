import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  CreditCard,
  TrendingUp,
  DollarSign,
  Truck,
  ChevronDown,
  ChevronRight,
  Fuel,
  Coffee,
  Tag,
  FileSpreadsheet,
  Ban,
  X
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
  const [activeTab, setActiveTab] = useState('movimientos'); // 'movimientos' | 'recolecciones' | 'resico'
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
    text = text.replace(/\s*\(\d+\s*conceptos?\)/gi, '');
    
    const insMatch = text.match(/Insumos\s+(?:del\s+pedido\s+)?([A-Z0-9-]+)(?:\s*\(([^)]+)\))?/i);
    if (insMatch) {
      const ped = insMatch[1];
      const cli = insMatch[2];
      return cli ? `Insumos | ${ped} | ${cli}` : `Insumos | ${ped}`;
    }
    
    const recMatch = text.match(/Recolecci[oó]n\s+([A-Z0-9-]+)(?:\s*\(([^)]+)\))?/i);
    if (recMatch) {
      const recId = recMatch[1];
      let cat = recMatch[2] || '';
      if (cat.toLowerCase().includes('gasolina')) cat = 'Gasolina';
      else if (cat.toLowerCase().includes('alimento') || cat.toLowerCase().includes('desayuno')) cat = 'Alimentos';
      else if (cat.toLowerCase().includes('otro') || cat.toLowerCase().includes('caseta')) cat = 'Otros';
      return cat ? `Recolección ${recId} | ${cat}` : `Recolección ${recId}`;
    }

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
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Gasolina':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'Alimentos':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Recolección':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Otros':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAccountIconBg = (c) => {
    if (c === 'NU MINA') return 'bg-purple-600';
    if (c === 'NU EMI') return 'bg-purple-800';
    if (c === 'MERCADO PAGO') return 'bg-blue-500';
    if (c === 'EFECTIVO') return 'bg-green-600';
    if (c === 'NU TDC') return 'bg-purple-950';
    return 'bg-slate-700';
  };

  return (
    <div className="space-y-5">
      {/* Top Highlights: Ingresos, Egresos, Flujo Neto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-green-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block truncate">
              Total Ingresos {isFilteredCuenta && <strong className="text-[#173865] font-black ml-1">({selectedCuenta})</strong>}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-green-700 truncate">{formatMoney(totalIngresos)}</span>
            <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-red-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block truncate">
              Total Egresos {isFilteredCuenta ? <strong className="text-[#173865] font-black ml-1">({selectedCuenta})</strong> : '/ Gastos'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base sm:text-xl font-black text-red-600 truncate">{formatMoney(totalEgresos)}</span>
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider block truncate">
              {isFilteredCuenta ? <span>Flujo Neto <strong className="text-[#173865] font-black">({selectedCuenta})</strong></span> : 'Flujo Neto en Caja'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-base sm:text-xl font-black truncate ${
              flujoNeto >= 0 ? 'text-[#173865] dark:text-blue-400' : 'text-red-600'
            }`}>
              {formatMoney(flujoNeto)}
            </span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Saldos por Cuenta y Método de Pago */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Saldos por Cuenta y Método de Pago
            </span>
            {isFilteredCuenta && (
              <button
                onClick={() => setSelectedCuenta('TODAS')}
                className="text-xs font-bold text-[#173865] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Quitar filtro y ver todas las cuentas"
              >
                <span>{selectedCuenta}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenIngreso}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-green-100 text-green-700 hover:bg-green-50 text-xs font-bold rounded-full shadow-sm transition-colors active:scale-95"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Ingreso</span>
            </button>
            <button
              onClick={onOpenEgreso}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-100 text-red-600 hover:bg-red-50 text-xs font-bold rounded-full shadow-sm transition-colors active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Egreso</span>
            </button>
            {onOpenRecoleccion && (
              <button
                onClick={onOpenRecoleccion}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95"
                title="Registrar gastos de gasolina, comida y ruta prorrateada entre pedidos"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Registrar Recolección</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CUENTAS.map((c) => {
            const saldo = saldos[c] || 0;
            const isNegative = saldo < 0;
            const isSelected = selectedCuenta === c;
            return (
              <div
                key={c}
                onClick={() => setSelectedCuenta(isSelected ? 'TODAS' : c)}
                className={`bg-white dark:bg-gray-900 p-3.5 md:p-4 rounded-3xl shadow-sm border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#173865] ring-2 ring-[#173865]/20 scale-105'
                    : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm text-xs ${getAccountIconBg(c)}`}>
                    {c === 'EFECTIVO' ? <DollarSign className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#173865] animate-pulse" />}
                </div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5 truncate" title={c}>{c}</h3>
                <p className={`text-base xl:text-lg font-black whitespace-nowrap ${
                  isNegative ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatMoney(saldo)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900 p-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800 w-max max-w-full">
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'movimientos'
                ? 'bg-[#173865] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Movimientos de Caja</span>
            <span
              className={`min-w-[18px] h-4 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none ${
                activeTab === 'movimientos'
                  ? 'bg-white text-[#173865]'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filtered.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recolecciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'recolecciones'
                ? 'bg-[#173865] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Historial de Recolecciones</span>
            <span
              className={`min-w-[18px] h-4 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none ${
                activeTab === 'recolecciones'
                  ? 'bg-white text-[#173865]'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {recolecciones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'resico'
                ? 'bg-[#173865] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Declaración & RESICO SAT</span>
            <span
              className={`min-w-[18px] h-4 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                activeTab === 'resico'
                  ? 'bg-white text-[#173865]'
                  : 'bg-blue-50 text-[#173865]'
              }`}
            >
              SAT
            </span>
          </button>
        </div>

        {activeTab === 'recolecciones' && onOpenRecoleccion && (
          <button
            onClick={onOpenRecoleccion}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Recolección</span>
          </button>
        )}
      </div>

      {/* Category Expenses Breakdown & Filters */}
      {activeTab === 'movimientos' && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#173865]" />
              Gastos por Categoría
            </span>
            <span className="text-xs text-gray-400">Filtrar transacciones:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategoria('TODAS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategoria === 'TODAS'
                  ? 'bg-[#173865] text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Todas</span>
              <span
                className={`min-w-[18px] h-4 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none ${
                  selectedCategoria === 'TODAS'
                    ? 'bg-white text-[#173865]'
                    : 'bg-gray-200 text-gray-700'
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#173865] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`min-w-[18px] h-4 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center leading-none ${
                      isSelected
                        ? 'bg-white text-[#173865]'
                        : 'bg-gray-200 text-gray-700'
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

      {/* TAB 1: MOVIMIENTOS DE CAJA */}
      {activeTab === 'movimientos' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Movimientos de Caja {selectedCuenta !== 'TODAS' ? `(${selectedCuenta})` : ''} {selectedCategoria !== 'TODAS' ? `• [${selectedCategoria}]` : ''}
            </h2>
            <span className="text-xs font-semibold text-gray-400">{filtered.length} registrados</span>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 text-xs uppercase font-bold tracking-wider">
                  <th className="py-3 px-2 text-center w-8"></th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Tipo</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Fecha</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Cuenta</th>
                  <th className="py-3 px-3 min-w-[220px]">Motivo / Pedido</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Categoría</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Monto</th>
                  <th className="py-3 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filtered.length > 0 ? (
                  filtered.map((mov) => {
                    const isIng = mov.tipo === 'INGRESO';
                    const isGroup = mov.esGrupoInsumos && mov.insumos && mov.insumos.length > 0;
                    const isExpanded = !!expandedGroups[mov.id];

                    return (
                      <React.Fragment key={mov.id}>
                        <tr 
                          onClick={() => isGroup && toggleGroup(mov.id)}
                          className={`transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'} ${isGroup ? 'cursor-pointer' : ''} ${mov.cancelado ? 'opacity-50 line-through grayscale' : ''}`}
                        >
                          <td className="py-3 px-2 text-center">
                            {isGroup ? (
                              <button 
                                type="button" 
                                className="p-1 hover:text-[#173865] rounded-full text-gray-400 transition-colors"
                                onClick={(e) => { e.stopPropagation(); toggleGroup(mov.id); }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[#173865]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center mx-auto text-gray-300">•</div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                              isIng 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {mov.tipo}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap text-xs text-gray-500 font-medium">
                            {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-MX') : '-'}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-xs border border-gray-200">
                              {mov.cuenta}
                            </span>
                          </td>

                          <td className="py-3 px-3 max-w-[320px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-800 dark:text-gray-100 font-bold text-xs uppercase tracking-wide">{formatDescripcion(mov)}</span>
                              {mov.nota && (
                                <span className="text-xs text-amber-700 italic">({mov.nota})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {mov.categoria ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getCategoriaBadge(mov.categoria)}`}>
                                {normalizeCategoria(mov.categoria)}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-black whitespace-nowrap text-sm">
                            <span className={isIng ? 'text-green-600' : 'text-red-500'}>
                              {isIng ? '+' : '-'}{formatMoney(mov.monto)}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center">
                            {!isGroup && onDeleteMovimiento && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMovimiento(mov.id);
                                }}
                                className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                title="Eliminar movimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Grouped Insumos Sub-Table */}
                        {isGroup && isExpanded && (
                          <tr className="bg-gray-50/70 border-b border-gray-100">
                            <td colSpan={8} className="p-3 pl-8 pr-4">
                              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider">
                                        <th className="py-2.5 px-3">Insumo / Material</th>
                                        <th className="py-2.5 px-3 text-center">Proveedor</th>
                                        <th className="py-2.5 px-2 text-center">Cant.</th>
                                        <th className="py-2.5 px-3 text-center">Costo Real</th>
                                        <th className="py-2.5 px-3 text-center">Costo Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {mov.insumos.map((ins, iIdx) => (
                                        <tr key={iIdx} className="hover:bg-gray-50 text-gray-700 transition-colors">
                                          <td className="py-2.5 px-3 font-bold text-gray-900">
                                            {ins.insumo || ins.nombre}
                                          </td>
                                          <td className="py-2.5 px-3 text-center text-gray-500">
                                            {ins.proveedor || '-'}
                                          </td>
                                          <td className="py-2.5 px-2 text-center font-bold text-gray-800">
                                            {ins.cant}
                                          </td>
                                          <td className="py-2.5 px-3 text-center text-gray-600">
                                            {formatMoney(ins.costoReal)}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-black text-red-600">
                                            {formatMoney(ins.costoTotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-gray-50 border-t border-gray-200 font-bold text-xs">
                                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-gray-500">
                                          Total Insumos Pagados ({mov.cuenta}):
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-black text-red-600">
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
                    <td colSpan={8} className="p-10 text-center text-gray-400 font-bold text-xs">
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
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Historial de Recolecciones
            </h2>
            <span className="text-xs font-semibold text-gray-400">{recolecciones.length} registradas</span>
          </div>

          <div className="overflow-x-auto p-2 sm:p-4">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 text-xs uppercase font-bold tracking-wider">
                  <th className="py-3 px-2 text-center w-8"></th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Folio</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Fecha</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Cuenta</th>
                  <th className="py-3 px-3 min-w-[220px]">Descripción / Conceptos</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">Prorrateo</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Total Gasto</th>
                  <th className="py-3 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
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
                        <tr 
                          onClick={() => toggleRecoleccion(rec.id)}
                          className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'}`}
                        >
                          <td className="py-3 px-2 text-center">
                            <button 
                              type="button" 
                              className="p-1 hover:text-[#173865] rounded-full text-gray-400 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleRecoleccion(rec.id); }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#173865]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-blue-50 text-[#173865] border border-blue-200">
                              {recIdLabel}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap text-xs text-gray-500 font-medium">
                            {rec.fecha ? new Date(rec.fecha).toLocaleDateString('es-MX') : '-'}
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {rec.cuenta}
                            </span>
                          </td>

                          <td className="py-3 px-3 max-w-[280px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-800 font-semibold text-xs truncate">{descText}</span>
                              {rec.nota && (
                                <span className="text-xs text-amber-700 italic">({rec.nota})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-[#173865] font-bold text-xs">
                              {numPeds} peds ({formatMoney(porcion)} c/u)
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-black text-red-600 whitespace-nowrap">
                            -{formatMoney(rec.totalGasto)}
                          </td>

                          <td className="py-3 px-2 text-center">
                            {onDeleteRecoleccion && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteRecoleccion(rec.id);
                                }}
                                className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                title="Eliminar recolección"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-gray-50/70 border-b border-gray-100">
                            <td colSpan={8} className="p-3 pl-8 pr-4">
                              <div className="p-4 bg-white border border-gray-200 rounded-2xl text-xs space-y-3 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Fuel className="w-4 h-4 text-cyan-600" />
                                      <span className="text-gray-700 font-bold text-xs">Gasolina</span>
                                    </div>
                                    <span className="font-black text-cyan-800">{formatMoney(rec.gastoGasolina)}</span>
                                  </div>

                                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Coffee className="w-4 h-4 text-purple-600" />
                                      <span className="text-gray-700 font-bold text-xs">Alimentos</span>
                                    </div>
                                    <span className="font-black text-purple-800">{formatMoney(rec.gastoDesayuno)}</span>
                                  </div>

                                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-700 font-bold text-xs">Otros Gastos</span>
                                    </div>
                                    <span className="font-black text-gray-800">{formatMoney(rec.gastoOtros)}</span>
                                  </div>
                                </div>

                                {rec.nota && (
                                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                    <strong>Nota / Comentario de ruta:</strong> {rec.nota}
                                  </div>
                                )}

                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                                    Pedidos Beneficiados con el Reparto ({formatMoney(rec.totalGasto)} / {numPeds} = {formatMoney(porcion)} por pedido):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {rec.pedidos && rec.pedidos.map((ped, pIdx) => {
                                      const clientName = ped.cliente || (pedidos && pedidos.find(p => p.id === ped.pedidoId)?.cliente) || 'Cliente';

                                      return (
                                        <div key={pIdx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2 truncate">
                                            <span className="font-mono font-bold text-[#173865] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                              {ped.pedidoId}
                                            </span>
                                            <span className="text-gray-800 font-semibold truncate">{clientName}</span>
                                          </div>
                                          <span className="font-black text-[#173865] shrink-0">
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
                    <td colSpan={8} className="p-10 text-center text-gray-400 font-bold text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-backdrop-in cursor-pointer" onClick={() => setCancelModalMov(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col cursor-default animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 sm:p-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Cancelar Movimiento de Caja
                  </h3>
                  <p className="text-xs text-gray-400">
                    Se descontará de los totales y quedará registrado el motivo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalMov(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
              className="p-6 space-y-4 text-xs"
            >
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">Monto del movimiento:</span>
                  <span className={`font-black text-sm ${cancelModalMov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                    {cancelModalMov.tipo === 'INGRESO' ? '+' : '-'}{formatMoney(cancelModalMov.monto)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Cuenta:</span>
                  <span className="text-gray-800 font-bold">{cancelModalMov.cuenta}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Concepto:</span>
                  <span className="text-gray-800 font-medium truncate max-w-[220px]">{formatDescripcion(cancelModalMov)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 pl-1">
                  ¿Quién cancela este movimiento?: *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCancelAutor('Nathy')}
                    className={`h-[38px] px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${
                      cancelAutor === 'Nathy'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-rose-600 border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    Nathy
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelAutor('Emi')}
                    className={`h-[38px] px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center ${
                      cancelAutor === 'Emi'
                        ? 'bg-[#173865] text-white border-[#173865] shadow-md'
                        : 'bg-white text-[#173865] border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Emi
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 pl-1">
                  Motivo obligatorio de cancelación: *
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelMotivo}
                  onChange={(e) => setCancelMotivo(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 rounded-2xl p-3 text-xs font-medium text-gray-800 focus:outline-none shadow-sm"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCancelModalMov(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-bold transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelMotivo.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-md transition-all"
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
