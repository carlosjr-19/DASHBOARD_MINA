import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Percent, 
  Building2, 
  Utensils, 
  Fuel, 
  Boxes,
  X,
  FileCheck
} from 'lucide-react';

export default function ResicoDeclaracionView() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [resicoData, setResicoData] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [filterTipo, setFilterTipo] = useState('TODAS'); // 'TODAS' | 'EMITIDA' | 'RECIBIDA'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [xmlUploadTipo, setXmlUploadTipo] = useState('AUTO'); // 'AUTO' | 'EMITIDA' | 'RECIBIDA'

  // Formulario manual
  const [manualForm, setManualForm] = useState({
    tipo: 'RECIBIDA',
    folio: '',
    fecha: new Date().toISOString().split('T')[0],
    rfcEmisor: '',
    nombreEmisor: '',
    rfcReceptor: '',
    nombreReceptor: '',
    subtotal: '',
    ivaTrasladado: '',
    isrRetenido: '0',
    total: '',
    categoria: 'Insumos',
    descripcion: '',
    formaPago: '03' // 03 Transferencia
  });

  const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const loadResicoData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finanzas/resico/resumen?year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setResicoData(data);
      }
    } catch (err) {
      console.error('Error al cargar datos RESICO:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFacturas = async () => {
    try {
      const res = await fetch(`/api/finanzas/facturas?year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setFacturas(data);
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err);
    }
  };

  useEffect(() => {
    loadResicoData();
    loadFacturas();
  }, [selectedYear, selectedMonth]);

  // Manejador para subir archivos XML
  const handleXmlFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadStatus({ count: files.length, success: 0, errors: [], lastFactura: null, year: null, month: null });

    let latestYear = null;
    let latestMonth = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.xml')) {
        continue;
      }

      try {
        const text = await file.text();
        const res = await fetch('/api/finanzas/facturas/upload-xml', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xmlContent: text,
            archivoNombre: file.name,
            tipo: xmlUploadTipo
          })
        });

        if (res.ok) {
          const data = await res.json();
          latestYear = data.year;
          latestMonth = data.month;
          setUploadStatus(prev => ({ 
            ...prev, 
            success: prev.success + 1,
            lastFactura: data.factura,
            year: data.year,
            month: data.month
          }));
        } else {
          const err = await res.json();
          setUploadStatus(prev => ({ ...prev, errors: [...prev.errors, `${file.name}: ${err.detail || 'Error'}`] }));
        }
      } catch (e) {
        setUploadStatus(prev => ({ ...prev, errors: [...prev.errors, `${file.name}: ${e.message}`] }));
      }
    }

    if (latestYear) setSelectedYear(latestYear);
    if (latestMonth) setSelectedMonth(latestMonth);

    setUploading(false);
    loadResicoData();
    loadFacturas();
  };

  // Guardar factura manual
  const handleSaveManual = async (e) => {
    e.preventDefault();
    try {
      const sub = parseFloat(manualForm.subtotal) || 0;
      const iva = parseFloat(manualForm.ivaTrasladado) || (sub * 0.16);
      const isr = parseFloat(manualForm.isrRetenido) || 0;
      const tot = parseFloat(manualForm.total) || (sub + iva - isr);

      const res = await fetch('/api/finanzas/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: manualForm.tipo,
          folio: manualForm.folio,
          fecha: manualForm.fecha,
          rfcEmisor: manualForm.rfcEmisor,
          nombreEmisor: manualForm.nombreEmisor,
          rfcReceptor: manualForm.rfcReceptor,
          nombreReceptor: manualForm.nombreReceptor,
          subtotal: sub,
          ivaTrasladado: iva,
          isrRetenido: isr,
          total: tot,
          categoria: manualForm.categoria,
          descripcion: manualForm.descripcion,
          formaPago: manualForm.formaPago
        })
      });

      if (res.ok) {
        setShowManualModal(false);
        setManualForm({
          tipo: 'RECIBIDA',
          folio: '',
          fecha: new Date().toISOString().split('T')[0],
          rfcEmisor: '',
          nombreEmisor: '',
          rfcReceptor: '',
          nombreReceptor: '',
          subtotal: '',
          ivaTrasladado: '',
          isrRetenido: '0',
          total: '',
          categoria: 'Insumos',
          descripcion: '',
          formaPago: '03'
        });
        loadResicoData();
        loadFacturas();
      } else {
        alert('Error al guardar la factura');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteFactura = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta factura?')) return;
    try {
      const res = await fetch(`/api/finanzas/facturas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadResicoData();
        loadFacturas();
      }
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const filteredFacturas = facturas.filter(f => {
    if (filterTipo === 'TODAS') return true;
    return f.tipo === filterTipo;
  });

  // Cálculo de alturas para la gráfica de barras
  const comparativa = resicoData?.comparativaAnual || [];
  const maxMonto = Math.max(
    ...comparativa.map(m => Math.max(m.ventas, m.gastos, Math.abs(m.gananciaNeta))),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Banner Informativo: Contabilidad Fiscal Estricta (Solo Facturas CFDI) */}
      <div className="bg-th-141517 border border-orange-500/30 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 font-extrabold text-sm">
            SAT
          </div>
          <div>
            <h4 className="font-bold text-gray-100 flex items-center gap-2">
              <span>Cálculo Fiscal Estricto (Solo Facturas Emitidas vs Recibidas)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold">
                100% CFDI
              </span>
            </h4>
            <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
              Este módulo contempla <strong className="text-gray-200">únicamente las facturas que generas y las que te generan tus proveedores</strong>. Tus ingresos o egresos no facturados permanecen en tu flujo de caja diario pero no se consideran aquí para proteger la exactitud de tu declaración oficial del SAT.
            </p>
          </div>
        </div>
      </div>

      {/* Barra superior de control y acciones */}
      <div className="bg-th-161719 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-400">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-th-121315 text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-400">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-th-121315 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {[
                { id: 1, name: 'Enero' },
                { id: 2, name: 'Febrero' },
                { id: 3, name: 'Marzo' },
                { id: 4, name: 'Abril' },
                { id: 5, name: 'Mayo' },
                { id: 6, name: 'Junio' },
                { id: 7, name: 'Julio' },
                { id: 8, name: 'Agosto' },
                { id: 9, name: 'Septiembre' },
                { id: 10, name: 'Octubre' },
                { id: 11, name: 'Noviembre' },
                { id: 12, name: 'Diciembre' }
              ].map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Régimen: RESICO Personas Físicas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Factura XML (CFDI)</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Registro Manual</span>
          </button>
        </div>
      </div>

      {/* GRÁFICA COMPARATIVA MENSUAL (Ventas vs Gastos vs Ganancia Neta) */}
      <div className="bg-th-161719 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Comparativa Mensual: Ventas, Gastos y Ganancia Neta ({selectedYear})
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Haz clic en cualquier mes para inspeccionar y calcular su declaración RESICO detallada.
            </p>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-gray-300 font-medium">Ventas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-gray-300 font-medium">Gastos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-300 font-medium">Ganancia Neta</span>
            </div>
          </div>
        </div>

        {/* Gráfica de Barras Interactiva */}
        <div className="pt-4 overflow-x-auto">
          <div className="min-w-[680px] h-64 flex items-end gap-3 pb-6 pt-2 border-b border-gray-800">
            {comparativa.map((m) => {
              const isSelected = m.mes === selectedMonth;
              const hVentas = Math.max(4, Math.round((m.ventas / maxMonto) * 190));
              const hGastos = Math.max(4, Math.round((m.gastos / maxMonto) * 190));
              const hGanancia = Math.max(4, Math.round((Math.max(0, m.gananciaNeta) / maxMonto) * 190));

              return (
                <div
                  key={m.mes}
                  onClick={() => setSelectedMonth(m.mes)}
                  className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer transition-all p-1 rounded-xl ${
                    isSelected ? 'bg-orange-500/10 border border-orange-500/40' : 'hover:bg-gray-800/40'
                  }`}
                  title={`${m.mesCompleto}: Ventas ${formatMoney(m.ventas)} | Gastos ${formatMoney(m.gastos)} | Ganancia ${formatMoney(m.gananciaNeta)}`}
                >
                  {/* Barras verticales agrupadas */}
                  <div className="w-full flex items-end justify-center gap-1 h-[190px]">
                    {/* Barra Ventas */}
                    <div
                      style={{ height: `${hVentas}px` }}
                      className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t transition-all hover:brightness-110"
                    />
                    {/* Barra Gastos */}
                    <div
                      style={{ height: `${hGastos}px` }}
                      className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t transition-all hover:brightness-110"
                    />
                    {/* Barra Ganancia Neta */}
                    <div
                      style={{ height: `${hGanancia}px` }}
                      className="w-2.5 sm:w-3.5 bg-orange-500 rounded-t transition-all hover:brightness-110"
                    />
                  </div>

                  {/* Etiqueta del Mes */}
                  <span className={`text-[11px] font-bold mt-2 ${
                    isSelected ? 'text-orange-400 font-extrabold' : 'text-gray-400'
                  }`}>
                    {m.mesNombre}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPIS DEL MES SELECCIONADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Ventas del Mes</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-50 mt-1">
            {formatMoney(resicoData?.kpis?.ventasFacturadas || 0)}
          </div>
          <span className="text-[10px] text-gray-500 block mt-1">
            {resicoData?.mesNombre} {selectedYear}
          </span>
        </div>

        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Gastos del Mes</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-50 mt-1">
            {formatMoney(resicoData?.kpis?.gastosFacturados || 0)}
          </div>
          <span className="text-[10px] text-gray-500 block mt-1">
            Compras & Insumos comprobados
          </span>
        </div>

        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Ganancia Neta</span>
            <DollarSign className="w-4 h-4 text-orange-400" />
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold mt-1 ${
            (resicoData?.kpis?.gananciaNeta || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatMoney(resicoData?.kpis?.gananciaNeta || 0)}
          </div>
          <span className="text-[10px] text-gray-500 block mt-1">
            Margen: {resicoData?.kpis?.margenPorcentaje || 0}%
          </span>
        </div>

        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-th-161719 to-orange-950/20">
          <div className="flex items-center justify-between text-orange-300 text-xs font-semibold">
            <span>Total Impuestos Estimados SAT</span>
            <ShieldCheck className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-50 mt-1">
            {formatMoney(resicoData?.kpis?.totalImpuestosEstimados || 0)}
          </div>
          <span className="text-[10px] text-orange-300/70 block mt-1">
            ISR (${resicoData?.isrResico?.isrNetoPagar || 0}) + IVA (${resicoData?.ivaResico?.ivaNetoPagar || 0})
          </span>
        </div>
      </div>

      {/* DESGLOSE FISCAL RESICO: ISR E IVA LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* TARJETA 1: PAGO PROVISIONAL DE ISR RESICO */}
        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-xs">
                ISR
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-100">
                  Pago Provisional de ISR (RESICO)
                </h4>
                <p className="text-[11px] text-gray-400">
                  Ley del ISR Art. 113-E (Personas Físicas)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-orange-400 border border-gray-700">
              Tasa: {resicoData?.isrResico?.tasaPorcentaje || 1.0}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Ingresos Cobrados del Mes (Base Gravable):</span>
              <span className="font-bold text-gray-200">
                {formatMoney(resicoData?.isrResico?.baseGravable || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Tasa de Impuesto Aplicable:</span>
              <span className="font-bold text-orange-400">
                {resicoData?.isrResico?.tasaPorcentaje || 1.0}%
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">ISR Determinado del Período:</span>
              <span className="font-bold text-gray-100">
                {formatMoney(resicoData?.isrResico?.isrDeterminado || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Menos: Retenciones de ISR por Personas Morales (1.25%):</span>
              <span className="font-bold text-emerald-400">
                - {formatMoney(resicoData?.isrResico?.retencionIsr || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 pt-3 bg-th-121315 px-3 rounded-xl border border-gray-800">
              <span className="font-bold text-gray-200 text-xs">
                = ISR Neto a Pagar al SAT:
              </span>
              <span className="font-extrabold text-orange-400 text-sm">
                {formatMoney(resicoData?.isrResico?.isrNetoPagar || 0)}
              </span>
            </div>

            {resicoData?.isrResico?.isrSaldoFavor > 0 && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 p-2 rounded-lg">
                ✨ Tienes saldo a favor de ISR por retenciones de {formatMoney(resicoData?.isrResico?.isrSaldoFavor)}.
              </div>
            )}
          </div>

          {/* Consejo del Contador */}
          <div className="bg-th-121315 border border-orange-900/30 p-3 rounded-xl text-[11px] text-gray-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-400">
              <Info className="w-3.5 h-3.5" />
              <span>Criterio Contable RESICO ISR:</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              En RESICO Personas Físicas, <strong className="text-gray-200">los gastos NO disminuyen la base del ISR</strong>. La ley ya te beneficia con una tasa preferencial minúscula (1.0% a 2.5%) calculada directo sobre tus cobros brutos.
            </p>
          </div>
        </div>

        {/* TARJETA 2: PAGO DEFINITIVO DE IVA */}
        <div className="bg-th-161719 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                IVA
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-100">
                  Pago Definitivo de IVA Mensual
                </h4>
                <p className="text-[11px] text-gray-400">
                  Ley del IVA (Acreditamiento de Gastos 16%)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-blue-400 border border-gray-700">
              Tasa General: 16%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">IVA Trasladado (16% Cobrado a Clientes):</span>
              <span className="font-bold text-rose-400">
                + {formatMoney(resicoData?.ivaResico?.ivaTrasladado || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Menos: IVA Acreditable (Compras e Insumos indispensables con CFDI):</span>
              <span className="font-bold text-emerald-400">
                - {formatMoney(resicoData?.ivaResico?.ivaAcreditable || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Menos: Retenciones de IVA aplicadas por Clientes:</span>
              <span className="font-bold text-blue-400">
                - {formatMoney(resicoData?.ivaResico?.retencionIva || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 pt-3 bg-th-121315 px-3 rounded-xl border border-gray-800">
              <span className="font-bold text-gray-200 text-xs">
                = IVA Neto a Pagar al SAT:
              </span>
              <span className={`font-extrabold text-sm ${
                (resicoData?.ivaResico?.ivaNetoPagar || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {formatMoney(resicoData?.ivaResico?.ivaNetoPagar || 0)}
              </span>
            </div>

            {(resicoData?.ivaResico?.ivaSaldoFavor || 0) > 0 && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 p-2 rounded-lg">
                🎉 Tienes <strong className="text-gray-50">{formatMoney(resicoData?.ivaResico?.ivaSaldoFavor)}</strong> de Saldo a Favor de IVA acumulado para acreditar el próximo mes.
              </div>
            )}
          </div>

          {/* Consejo del Contador */}
          <div className="bg-th-121315 border border-blue-900/30 p-3 rounded-xl text-[11px] text-gray-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Criterio Contable de Acreditamiento de IVA:</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Para el IVA, <strong className="text-gray-200">todas tus facturas de insumos y servicios son indispensables</strong>. Cada peso de IVA pagado se resta 1:1 contra el IVA cobrado, ahorrándote desembolso en efectivo ante el SAT.
            </p>
          </div>
        </div>
      </div>

      {/* GUÍA DEL CONTADOR: REGLAS DE ORO DE DEDUCIBILIDAD Y ACREDITAMIENTO */}
      <div className="bg-th-161719 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
          <h4 className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-400" />
            Criterios y Tips del Contador Experto en RESICO
          </h4>
          <span className="text-[10px] text-gray-500 font-mono">SAT MÉXICO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Alimentos */}
          <div className="bg-th-121315 border border-gray-800/80 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
              <Utensils className="w-4 h-4" />
              <span>Alimentos / Restaurante</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-gray-200">Máximo 8.5% acreditable</strong> si es dentro de 50 km (LISR Art. 28 Fracc. XX). Obligatorio pagar con tarjeta o transferencia. Solo califica al 100% como viático si viajas fuera de 50 km con comprobante de hospedaje.
            </p>
          </div>

          {/* Gasolina */}
          <div className="bg-th-121315 border border-gray-800/80 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <Fuel className="w-4 h-4" />
              <span>Gasolina & Combustible</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-rose-300">¡Cero efectivo!</strong> Si pagas gasolina en efectivo es 0% acreditable. Debe ser siempre con tarjeta de crédito, débito o monedero a tu nombre para acreditar el 100% del IVA (Art. 27 Fracc. III).
            </p>
          </div>

          {/* Insumos Taller */}
          <div className="bg-th-121315 border border-gray-800/80 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Boxes className="w-4 h-4" />
              <span>Insumos y Materiales</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-emerald-300">100% Acreditable</strong>. Vinil, lona, DTF, playeras, tazas y tintas son materia prima estrictamente indispensable para tu actividad comercial y reducen tu IVA directamente.
            </p>
          </div>

          {/* Retenciones PM */}
          <div className="bg-th-121315 border border-gray-800/80 p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Building2 className="w-4 h-4" />
              <span>Facturación a Empresas</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Si le vendes a una <strong className="text-gray-200">Persona Moral</strong> (empresa), te retendrán el <strong className="text-blue-300">1.25% de ISR</strong>. Ese dinero ya lo pagaron por ti al SAT, por lo que lo restas 100% en tu declaración mensual.
            </p>
          </div>
        </div>
      </div>

      {/* LISTADO DE FACTURAS EMITIDAS Y RECIBIDAS */}
      <div className="bg-th-161719 border border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-bold text-gray-100">
              Facturas del Período ({resicoData?.mesNombre} {selectedYear})
            </h4>
            <span className="min-w-[18px] h-4 px-1 rounded-full text-xs font-bold bg-gray-800 text-gray-200 border border-gray-700/60 flex items-center justify-center">
              {filteredFacturas.length}
            </span>
          </div>

          {/* Filtros Tipo */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'TODAS', label: 'Todas' },
              { id: 'EMITIDA', label: 'Emitidas (Ventas)' },
              { id: 'RECIBIDA', label: 'Recibidas (Gastos)' }
            ].map(tab => {
              const isSelected = filterTipo === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTipo(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm border border-orange-500'
                      : 'bg-th-121315 text-gray-400 hover:text-gray-200 border border-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de Facturas */}
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-th-121315">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/40 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase">
                <th className="py-2.5 px-3">TIPO</th>
                <th className="py-2.5 px-3">FECHA</th>
                <th className="py-2.5 px-3">FOLIO / UUID</th>
                <th className="py-2.5 px-3">EMISOR / RECEPTOR</th>
                <th className="py-2.5 px-3 text-center">CATEGORÍA</th>
                <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                <th className="py-2.5 px-3 text-right">IVA</th>
                <th className="py-2.5 px-3 text-right">RET. ISR</th>
                <th className="py-2.5 px-3 text-right">TOTAL</th>
                <th className="py-2.5 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map(f => {
                  const isEmitida = f.tipo === 'EMITIDA';
                  return (
                    <tr key={f.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isEmitida
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50'
                            : 'bg-rose-950/30 text-rose-400 border-rose-800/50'
                        }`}>
                          {isEmitida ? 'EMITIDA' : 'RECIBIDA'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-300 font-mono text-[11px]">
                        {f.fecha}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-200">
                          {f.folio || 'S/F'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[130px]" title={f.uuid}>
                          {f.uuid || f.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-200">
                          {isEmitida ? (f.nombreReceptor || f.rfcReceptor || 'Cliente') : (f.nombreEmisor || f.rfcEmisor || 'Proveedor')}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {isEmitida ? f.rfcReceptor : f.rfcEmisor}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-th-18191b px-2 py-0.5 rounded text-[10px] border border-gray-800 text-gray-300 font-medium">
                          {f.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-200">
                        {formatMoney(f.subtotal)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-300">
                        {formatMoney(f.ivaTrasladado)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-orange-400">
                        {f.isrRetenido > 0 ? `-${formatMoney(f.isrRetenido)}` : '$0.00'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-50">
                        {formatMoney(f.total)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDeleteFactura(f.id)}
                          className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500 text-xs">
                    No hay facturas registradas en este período. Puedes subir tus archivos XML o agregarlas manualmente arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SUBIR ARCHIVOS XML (CFDI 4.0 / 3.3) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-th-18191b border border-gray-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative my-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm sm:text-base font-bold text-gray-100">
                  Subir Factura XML (CFDI 4.0 / 3.3)
                </h3>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="text-gray-400 hover:text-gray-50 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <p className="text-xs text-gray-400 leading-relaxed">
                Selecciona si la factura es una <strong className="text-gray-200">venta emitida por ti</strong> o un <strong className="text-gray-200">gasto de proveedor</strong>. Al subir el XML se guarda y analiza automáticamente en tu declaración.
              </p>

              {/* Selector de Tipo de Factura antes de subir */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-300 block">
                  Tipo de Comprobante:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-th-121315 p-1 rounded-xl border border-gray-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('AUTO')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                      xmlUploadTipo === 'AUTO'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Auto por RFC
                  </button>
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('EMITIDA')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                      xmlUploadTipo === 'EMITIDA'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Factura Emitida (Venta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('RECIBIDA')}
                    className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-all ${
                      xmlUploadTipo === 'RECIBIDA'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Factura Recibida (Gasto)
                  </button>
                </div>
              </div>

              {/* Dropzone */}
              <label className="border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-th-121315 hover:bg-gray-800/30 transition-all text-center">
                <Upload className="w-8 h-8 text-orange-500 mb-2" />
                <span className="text-xs font-bold text-gray-200">
                  Seleccionar o arrastrar archivo XML
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
                  Formatos compatibles: CFDI 3.3 y CFDI 4.0 del SAT
                </span>
                <input
                  type="file"
                  accept=".xml"
                  multiple
                  onChange={(e) => handleXmlFiles(e.target.files)}
                  className="hidden"
                />
              </label>

              {uploading && (
                <div className="text-center py-2 text-xs text-orange-400 font-semibold animate-pulse">
                  Extrayendo datos fiscales y guardando en tu declaración...
                </div>
              )}

              {/* Tarjeta de Confirmación Visual Post-Carga */}
              {uploadStatus && uploadStatus.success > 0 && (
                <div className="p-3.5 bg-emerald-950/20 rounded-xl border border-emerald-800/40 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✓ ¡Factura guardada y analizada correctamente en tu declaración!</span>
                  </div>

                  {uploadStatus.lastFactura && (
                    <div className="bg-th-121315 p-3 rounded-lg border border-gray-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          uploadStatus.lastFactura.tipo === 'EMITIDA'
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950/50 text-rose-400 border-rose-800'
                        }`}>
                          {uploadStatus.lastFactura.tipo === 'EMITIDA' ? 'FACTURA EMITIDA (Venta generada)' : 'FACTURA RECIBIDA (Gasto de proveedor)'}
                        </span>
                        <span className="text-gray-400 font-mono">{uploadStatus.lastFactura.fecha}</span>
                      </div>

                      <div className="text-gray-200 font-semibold truncate pt-1">
                        {uploadStatus.lastFactura.tipo === 'EMITIDA' 
                          ? `Cliente: ${uploadStatus.lastFactura.nombreReceptor || uploadStatus.lastFactura.rfcReceptor}` 
                          : `Proveedor: ${uploadStatus.lastFactura.nombreEmisor || uploadStatus.lastFactura.rfcEmisor}`}
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-800/60 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-gray-400 block">Subtotal</span>
                          <span className="font-bold text-gray-200">{formatMoney(uploadStatus.lastFactura.subtotal)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">IVA</span>
                          <span className="font-bold text-gray-200">{formatMoney(uploadStatus.lastFactura.ivaTrasladado)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">Total</span>
                          <span className="font-bold text-gray-50">{formatMoney(uploadStatus.lastFactura.total)}</span>
                        </div>
                      </div>

                      {uploadStatus.lastFactura.isrRetenido > 0 && (
                        <div className="text-orange-400 font-medium text-[10px] pt-1">
                          • Retención de ISR 1.25%: -{formatMoney(uploadStatus.lastFactura.isrRetenido)} aplicada a tu favor.
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (uploadStatus.year) setSelectedYear(uploadStatus.year);
                      if (uploadStatus.month) setSelectedMonth(uploadStatus.month);
                      setShowUploadModal(false);
                      setUploadStatus(null);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95"
                  >
                    <span>Ver Análisis del Período ({uploadStatus.month}/{uploadStatus.year || selectedYear})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadStatus && uploadStatus.errors.length > 0 && (
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 text-rose-400 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Errores al procesar archivo(s):</span>
                  </div>
                  {uploadStatus.errors.map((e, idx) => (
                    <div key={idx} className="text-[11px]">• {e}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO MANUAL DE FACTURA */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-th-18191b border border-gray-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative my-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm sm:text-base font-bold text-gray-100">
                  Registrar Factura Manual
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-gray-50 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Tipo de Factura</label>
                  <select
                    value={manualForm.tipo}
                    onChange={(e) => setManualForm({ ...manualForm, tipo: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2.5 rounded-xl border border-gray-700 font-bold"
                  >
                    <option value="RECIBIDA">Recibida (Gasto / Proveedor)</option>
                    <option value="EMITIDA">Emitida (Venta / Cliente)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={manualForm.fecha}
                    onChange={(e) => setManualForm({ ...manualForm, fecha: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Folio o Referencia</label>
                  <input
                    type="text"
                    value={manualForm.folio}
                    onChange={(e) => setManualForm({ ...manualForm, folio: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Categoría</label>
                  <select
                    value={manualForm.categoria}
                    onChange={(e) => setManualForm({ ...manualForm, categoria: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700 font-semibold"
                  >
                    <option value="Insumos">Insumos (DTF, Vinil, etc.)</option>
                    <option value="Gasolina">Gasolina & Combustibles</option>
                    <option value="Alimentos">Alimentos / Consumo</option>
                    <option value="Servicios">Servicios (Luz, Internet)</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">RFC Emisor / Proveedor</label>
                  <input
                    type="text"
                    value={manualForm.rfcEmisor}
                    onChange={(e) => setManualForm({ ...manualForm, rfcEmisor: e.target.value.toUpperCase() })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Nombre / Razón Social</label>
                  <input
                    type="text"
                    value={manualForm.nombreEmisor}
                    onChange={(e) => setManualForm({ ...manualForm, nombreEmisor: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Subtotal ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.subtotal}
                    onChange={(e) => {
                      const s = parseFloat(e.target.value) || 0;
                      setManualForm({
                        ...manualForm,
                        subtotal: e.target.value,
                        ivaTrasladado: (s * 0.16).toFixed(2),
                        total: (s * 1.16).toFixed(2)
                      });
                    }}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">IVA 16% ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.ivaTrasladado}
                    onChange={(e) => setManualForm({ ...manualForm, ivaTrasladado: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Ret. ISR 1.25%</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.isrRetenido}
                    onChange={(e) => setManualForm({ ...manualForm, isrRetenido: e.target.value })}
                    className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  value={manualForm.descripcion}
                  onChange={(e) => setManualForm({ ...manualForm, descripcion: e.target.value })}
                  className="w-full bg-th-121315 text-gray-100 p-2 rounded-xl border border-gray-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
